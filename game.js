// ── game.js ──────────────────────────────────────────────────────────────
// Core game logic: pool building, game lifecycle, placement, scoring,
// daily challenge, streak calculation, and trophy checking.
// Depends on: state.js, i18n.js (t, cName, cardYear, etc.), cards.js,
//             trophies.js (TROPHY_DEFS), ui.js (render functions)
// ─────────────────────────────────────────────────────────────────────────
// Which game eras map to each filter
const ERA_FILTER_MAP={
  all:null, // null = no filter = all cards
  ancient:['Ancient','Classical'],
  medieval:['Medieval','Renaissance'],
  modern:['Early Modern','Modern','Contemporary']
};

// ── MODE MAPS ─────────────────────────────────────────────────────────────
const MODE_LABEL={
  empires:   'empires_lbl',
  abrahamic: 'biblical_lbl',
  roman:     'mc_roman_title',
  eastern:   'mc_eastern_title',
  characters:'characters_lbl'
};
const MODE_DRAG_LABEL={
  empires:   'drag_label_empires',
  abrahamic: 'drag_label_biblical',
  roman:     'drag_label_roman',
  eastern:   'drag_label_eastern',
  characters:'drag_label_characters'
};
const MODE_WON={
  empires:   'sub_empires_won',
  abrahamic: 'sub_biblical_won',
  characters:'sub_characters_won'
};
const MODE_LOST={
  empires:   'sub_empires_lost',
  abrahamic: 'sub_biblical_lost',
  characters:'sub_characters_lost'
};

var _pendingGameRecord = null;
var _voluntaryEnd = false;

var _isDailyChallenge = false;

// Seeded PRNG (mulberry32) — same seed = same sequence every time
function _seededRNG(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function _dailySeed(){
  var d = new Date(); 
  // seed = YYYYMMDD as integer
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}
function _seededShuffle(arr, rng){
  var a = arr.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(rng() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function startDailyChallenge(){
  if(_todayDone()) return;
  gameMode = 'classic';
  eraFilter = 'all';
  livesMode = true;
  _isDailyChallenge = true;
  // Close all overlays cleanly, same as startGame()
  document.getElementById('history-panel').classList.remove('open');
  document.getElementById('intro').classList.remove('show');
  var _cs=document.getElementById('cultures-screen');
  if(_cs) _cs.classList.remove('show');
  document.getElementById('gameover').classList.remove('show');
  // Restore hint/skip visibility (will be re-hidden inside initGame daily block)
  var _hBtnR=document.getElementById('hint-btn');
  var _sBtnR=document.getElementById('skip-btn');
  if(_hBtnR) _hBtnR.style.display='';
  if(_sBtnR) _sBtnR.style.display='';
  initGame();
}

function _markDailyDone(){
  var today = new Date(); today.setHours(0,0,0,0);
  var record = {
    score: score,
    placed: timeline.length,
    timeline: timeline.map(function(c){
      return {
        name: cName(c),
        year: cardYear(c),
        span: isInterval(c) ? formatYear(c.startYear)+' – '+formatYear(c.endYear) : null,
        era: c.era
      };
    })
  };
  try{ localStorage.setItem(_dailyKey(today), JSON.stringify(record)); }catch(e){}
}


var earnedTrophies = {};
try { var _et=localStorage.getItem('chronos_trophies'); if(_et) earnedTrophies=JSON.parse(_et); } catch(e) {}

function saveTrophies(){
  try { localStorage.setItem('chronos_trophies', JSON.stringify(earnedTrophies)); } catch(e) {}
}

function checkTrophies(){
  var placed = timeline.map(function(c){ return c.name; });
  var intervals_placed = timeline.filter(function(c){ return c.startYear !== undefined; }).length;
  var newlyEarned = [];

  TROPHY_DEFS.forEach(function(def){
    if(earnedTrophies[def.id]) return;
    var earned = false;
    if(def.special === 'compendium_complete'){
      earned = discoveredCards.size >= (CARDS.length + INTERVALS.length);
    } else if(def.special === 'hundred_cards'){
      earned = placed.length >= 100;
    } else if(def.special === 'warlord'){
      var wars = ['World War I','World War II','Korean War','Vietnam War','Hundred Years War',
                  "Thirty Years' War",'Persian Wars','First Punic War','Second Punic War',
                  'Third Punic War','American Civil War','American Revolution','French Revolution',
                  'Trojan War','Cold War'];
      var warCount = wars.filter(function(w){ return placed.indexOf(w) >= 0; }).length;
      earned = warCount >= 8;
    } else if(def.special === 'ten_intervals'){
      earned = intervals_placed >= 10;
    } else if(def.special === 'full_deck'){
      earned = deck.length === 0 && gameActive === false && placed.length > 0;
    } else if(def.special === 'score_500'){
      earned = score >= 500;
    } else if(def.special === 'streak_50'){
      earned = streak >= 50;
    } else if(def.special === 'daily_streak_7'){
      earned = _calcStreak().longest >= 7;
    } else if(def.special === 'daily_streak_40'){
      earned = _calcStreak().longest >= 40;
    } else if(def.needed){
      earned = def.needed.every(function(n){ return placed.indexOf(n) >= 0; });
    }
    if(earned){
      earnedTrophies[def.id] = new Date().toISOString();
      newlyEarned.push(def);
    }
  });

  if(newlyEarned.length > 0){
    saveTrophies();
    _showTrophyToastQueue(newlyEarned, 0);
  }
}

// Also check streak trophy mid-game when streak hits 10
function checkStreakTrophy(){
  if(streak >= 50 && !earnedTrophies['on_fire']){
    earnedTrophies['on_fire'] = new Date().toISOString();
    saveTrophies();
    _showTrophyToastQueue([TROPHY_DEFS.find(function(d){ return d.id==='on_fire'; })], 0);
  }
}


// ── BUILD POOL ────────────────────────────────────────────────────────────
function buildPool(mode, eraFilter){
  let pool;
  if(mode==='empires'){
    const allowedEras=ERA_FILTER_MAP[eraFilter];
    pool=allowedEras?INTERVALS.filter(c=>allowedEras.includes(c.era)):INTERVALS;
    if(pool.length<4) pool=[...INTERVALS];
  } else if(mode==='abrahamic'){
    const biblIntervals=INTERVALS.filter(c=>Array.isArray(c.tags)&&c.tags.includes('abrahamic'));
    pool=[...CARDS.filter(c=>Array.isArray(c.tags)&&c.tags.includes('abrahamic')),...biblIntervals];
  } else if(mode==='roman'){
    pool=[...CARDS,...INTERVALS].filter(c=>Array.isArray(c.tags)&&c.tags.includes('roman'));
    if(pool.length<4) pool=[...CARDS.filter(c=>c.era==='Classical')];
  } else if(mode==='eastern'){
    pool=[...CARDS,...INTERVALS].filter(c=>Array.isArray(c.tags)&&c.tags.includes('eastern'));
    if(pool.length<4) pool=[...CARDS,...INTERVALS].filter(c=>Array.isArray(c.tags)&&c.tags.includes('eastern'));
  } else if(mode==='characters'){
    const allowedEras=ERA_FILTER_MAP[eraFilter];
    const charPool=CARDS.filter(c=>c.cat==='People'||c.cat_pt==='Pessoas');
    pool=allowedEras?charPool.filter(c=>allowedEras.includes(c.era)):charPool;
    if(pool.length<4) pool=[...charPool];
  } else {
    // Classic: mixed CARDS + INTERVALS, apply era filter
    const allowedEras=ERA_FILTER_MAP[eraFilter];
    const allCards=[...CARDS,...INTERVALS];
    pool=allowedEras?allCards.filter(c=>allowedEras.includes(c.era)):allCards;
    if(pool.length<4) pool=[...allCards];
  }
  return pool;
}

function initGame(){
  _pendingGameRecord = null;
  _voluntaryEnd = false;
  currentCard = null;
  reviewMode = false;

  // ── FULL DOM RESET — wipe every trace of the previous run ────────────
  // Hide gameover overlay immediately
  document.getElementById('gameover').classList.remove('show');

  // Reset score, streak & placed display
  var _sv = document.getElementById('score-val');
  var _stv = document.getElementById('streak-val');
  var _pv = document.getElementById('placed-val');
  if(_sv) _sv.textContent = '0';
  if(_stv) _stv.textContent = '0';
  if(_pv) _pv.textContent = '0';

  // Reset hand card to blank state
  var _hcName = document.getElementById('hc-name');
  var _hcCat  = document.getElementById('hc-cat');
  var _hcEra  = document.getElementById('hc-era');
  var _hcHint = document.getElementById('hc-hint');
  var _hcClue = document.getElementById('hc-clue');
  var _hcBar  = document.getElementById('hc-bar');
  var _hcSpan = document.getElementById('hc-span');
  var _hcReg  = document.getElementById('hc-region');
  var _hcCult = document.getElementById('hc-culture');
  if(_hcName) _hcName.textContent = '—';
  if(_hcCat)  _hcCat.textContent  = '—';
  if(_hcEra)  _hcEra.textContent  = '—';
  if(_hcHint) _hcHint.textContent = '';
  if(_hcClue) _hcClue.textContent = '';
  if(_hcBar)  _hcBar.style.background = '';
  if(_hcSpan) { _hcSpan.textContent = ''; _hcSpan.style.display = 'none'; }
  if(_hcReg)  { _hcReg.textContent  = ''; _hcReg.style.display  = 'none'; }
  if(_hcCult) { _hcCult.textContent = ''; _hcCult.style.display = 'none'; }

  // Close confirm dialog if lingering
  var _cd = document.getElementById('confirm-dialog');
  if(_cd) _cd.classList.remove('show');

  // Close fact panel and clear review state
  var _fp = document.getElementById('fact-panel');
  if(_fp) {
    _fp.classList.remove('open');
    _fp.classList.remove('review-mode');
  }

  // Clear timeline DOM immediately
  var _tl = document.getElementById('timeline');
  if(_tl) _tl.innerHTML = '';

  // Clear pending feedback timer and reset element
  clearTimeout(_feedbackTimer);
  var _fb = document.getElementById('feedback');
  if(_fb) { _fb.className = ''; _fb.textContent = ''; }

  // Reset hint/skip counts to starting values
  var _hc = document.getElementById('hint-count');
  var _sc = document.getElementById('skip-count');
  if(_hc) _hc.textContent = '3';
  if(_sc) _sc.textContent = '1';
  // Reset hint dots visual state
  for(var _di=0; _di<3; _di++){
    var _dot=document.getElementById('hd'+_di);
    if(_dot) _dot.classList.remove('used');
  }
  // Reset _fromGameover flag
  _fromGameover = false;
  // ─────────────────────────────────────────────────────────────────────

  deck=shuffle([...buildPool(gameMode,eraFilter)]);timeline=[];score=0;streak=0;lives=3;hints=3;skip=1;cardCluesUsed=0;gameActive=true;_pendingDraw=false;
  // Daily challenge overrides
  if(_isDailyChallenge){
    var _dcPool=[...CARDS,...INTERVALS];
    var _rng=_seededRNG(_dailySeed());
    deck=_seededShuffle(_dcPool,_rng).slice(0,18);
    hints=0; skip=0;
    var _hcEl=document.getElementById('hint-count');
    if(_hcEl) _hcEl.textContent='0';
    for(var _dhi=0;_dhi<3;_dhi++){
      var _dhd=document.getElementById('hd'+_dhi);
      if(_dhd) _dhd.classList.add('used');
    }
    // Hide hint and skip buttons entirely
    var _hBtn=document.getElementById('hint-btn');
    var _sBtn=document.getElementById('skip-btn');
    if(_hBtn) _hBtn.style.display='none';
    if(_sBtn) _sBtn.style.display='none';
  }
    // Hide history access during play
  document.getElementById('hist-btn').style.visibility='hidden';
  document.getElementById('hdr-mode').textContent=_isDailyChallenge?t('daily_title'):t(MODE_LABEL[gameMode]||'subtitle');
  document.getElementById('streak-lbl').textContent=t('streak');
  document.getElementById('score-lbl').textContent=t('score');
  var _plbl=document.getElementById('placed-lbl');if(_plbl)_plbl.textContent=t('placed_lbl');
  document.getElementById('bottom-label').textContent=t(MODE_DRAG_LABEL[gameMode]||'drag_label');
  // Pills permanently hidden — no mode label in header
  document.getElementById('free-pill').style.display='none';
  document.getElementById('empires-pill').style.display='none';
  document.getElementById('biblical-pill').style.display='none';
  document.getElementById('characters-pill').style.display='none';
  document.getElementById('lives-stat').style.display=livesMode?'flex':'none';
  renderLives();renderSideBtns();renderTimeline();
  // Show tutorial first time in empires mode
  if(gameMode==='empires'&&!empiresShownTutorial){
    empiresShownTutorial=true;
    document.getElementById('tutorial').classList.add('show');
  } else {
    drawCard();
  }
}
function closeTutorial(){
  document.getElementById('tutorial').classList.remove('show');
  drawCard();
}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

// ── RENDER ────────────────────────────────────────────────────────────────

const isInterval=c=>c.startYear!==undefined;
const cardYear=c=>isInterval(c)?c.startYear:c.year;
const formatSpan=c=>isInterval(c)?formatYear(c.startYear)+' – '+formatYear(c.endYear):formatYear(c.year);
const cRegion=c=>lang==='pt'?(c.region_pt||c.region):c.region;
const cCulture=c=>lang==='pt'?(c.culture_pt||c.culture):c.culture;

function useHint(){
  if(!currentCard||!gameActive||hints<=0||cardCluesUsed>=3)return;
  const pool=lang==='pt'?currentCard.clues_pt:currentCard.clues;
  if(!pool||!pool[cardCluesUsed])return;
  hints--;
  const clueEl=document.getElementById('hc-clue');
  clueEl.textContent='💡 '+pool[cardCluesUsed];
  clueEl.classList.add('show');
  cardCluesUsed++;
  renderSideBtns();
}
function useSkip(){
  if(!currentCard||!gameActive||skip<=0)return;
  skip--;
  // Put current card back at a random position in remaining deck (not at top)
  const card=currentCard;currentCard=null;
  const insertAt=Math.max(0,Math.floor(Math.random()*(deck.length-1)));
  deck.splice(insertAt,0,card);
  renderSideBtns();
  drawCard();
}

// ── GAME LOGIC ────────────────────────────────────────────────────────────
function attemptPlacement(idx){
  if(!currentCard||!gameActive)return;
  const card=currentCard;
  const cy=cardYear(card);
  const prev=timeline[idx-1],next=timeline[idx];
  const valid=(!prev||cy>=cardYear(prev))&&(!next||cy<=cardYear(next));
  if(valid){
    // Interval scoring: bonus for duration (longer empires = harder to place precisely)
    SFX.play('correct');
    const basePoints=isInterval(card)?Math.min(30,10+Math.floor((card.endYear-card.startYear)/100)):10;
    timeline.splice(idx,0,card);score+=basePoints+streak*2;streak++;currentCard=null;
    if(streak>0&&streak%20===0){hints++;renderSideBtns();showStreakToast();}
    checkStreakTrophy();
    renderTimeline();
    document.getElementById('score-val').textContent=score;
    document.getElementById('streak-val').textContent=streak;
    var _pv=document.getElementById('placed-val');if(_pv)_pv.textContent=timeline.length;
    setTimeout(()=>{const cards=document.querySelectorAll('.timeline-card');if(cards[idx])cards[idx].scrollIntoView({behavior:'smooth',block:'center'});},100);
    _pendingDraw=true;showFeedback(true,null);showFact(card,false);
  } else {
    SFX.play('wrong');
    streak=0;document.getElementById('streak-val').textContent=streak;
    let hint='none';
    if(timeline.length>0){
      const firstNewerIdx=timeline.findIndex(c=>cy<cardYear(c));
      let correctSlot=firstNewerIdx===-1?timeline.length:firstNewerIdx;
      hint=correctSlot<idx?'earlier':'later';
    }
    showFeedback(false,hint);
    if(livesMode){
      lives--;renderLives();
      if(lives<=0)setTimeout(()=>endGame(false),700);
    }
  }
}

// ── GAME OVER ─────────────────────────────────────────────────────────────
function endGame(won){
  gameActive=false;
  // Zero cards placed: skip gameover, return to intro
  if(timeline.length===0){
    document.getElementById('hist-btn').style.visibility='';
    _pendingGameRecord=null; _voluntaryEnd=false;
    _isDailyChallenge=false;
    showIntro(); return;
  }
  // Mark daily challenge complete
  if(_isDailyChallenge){ _markDailyDone(); _isDailyChallenge=false; }
  _pendingGameRecord = buildGameRecord(won);
  _eagerSaveDiscovered();
  checkTrophies();
  // Restore history button
  document.getElementById('hist-btn').style.visibility='';
  document.getElementById('go-title').textContent=won?t('go_won'):t('go_lost');
  const goSub=won
    ?t(MODE_WON[gameMode]||'sub_won')
    :(_voluntaryEnd?t('sub_ended')
      :(livesMode?t(MODE_LOST[gameMode]||'sub_lost'):t('sub_free')));
  _voluntaryEnd=false;
  document.getElementById('go-sub').textContent=goSub;
  document.getElementById('go-score').textContent=score;
  document.getElementById('go-score-lbl').textContent=t('final_score');
  var _saveBtn=document.getElementById('go-save-btn');
  if(_saveBtn){_saveBtn.textContent=lang==='pt'?'💾 Salvar Timeline':'💾 Save Timeline';_saveBtn.disabled=false;_saveBtn.style.opacity='';}
  document.getElementById('go-again-btn').textContent=t('play_again');
  // stopMusic(true);
  document.getElementById('gameover').classList.add('show');
}

// ── HISTORY ───────────────────────────────────────────────────────────────
function buildGameRecord(won) {
  return {
    date: new Date().toISOString(),
    mode: gameMode, livesMode: livesMode, eraFilter: eraFilter,
    lang: lang, score: score, placed: timeline.length, won: won,
    timeline: timeline.map(function(c) {
      return {
        name: cName(c), year: cardYear(c),
        span: isInterval(c) ? formatYear(c.startYear)+' – '+formatYear(c.endYear) : null,
        era: c.era, cat: isInterval(c) ? cCulture(c) : cCat(c)
      };
    })
  };
}

function _eagerSaveDiscovered() {
  timeline.forEach(function(c){ var k=c.name||c.name_en; if(k) discoveredCards.add(k); });
  saveDiscovered();
}

function saveAndOpenHistory() {
  if (_pendingGameRecord) {
    gameHistory.unshift(_pendingGameRecord);
    if (gameHistory.length > 30) gameHistory = gameHistory.slice(0, 30);
    try { localStorage.setItem('chronos_history', JSON.stringify(gameHistory)); } catch(e) {}
    _pendingGameRecord = null;
    var btn = document.getElementById('go-save-btn');
    if (btn) { btn.textContent = '✓ '+(lang==='pt'?'Salvo!':'Saved!'); btn.disabled = true; btn.style.opacity = '0.6'; }
  }
  setTimeout(function(){ openHistoryFromGameover(); }, 300);
}


// ── STREAK HELPERS ────────────────────────────────────────────────────────
function _dailyKey(date){
  var y=date.getFullYear();
  var m=String(date.getMonth()+1).padStart(2,'0');
  var d=String(date.getDate()).padStart(2,'0');
  return 'chronos_daily_'+y+'-'+m+'-'+d;
}
function _isDailyDone(date){
  try{ return !!localStorage.getItem(_dailyKey(date)); }catch(e){ return false; }
}
function _getDailyRecord(date){
  try{
    var raw=localStorage.getItem(_dailyKey(date));
    if(!raw) return null;
    if(raw==='1') return {score:0,placed:0,timeline:[]};
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function _calcStreak(){
  var today=new Date(); today.setHours(0,0,0,0);
  var cur=0,longest=0,run=0;
  // If today isn't done yet, count back from yesterday so the streak
  // reflects completed days rather than showing 0 all day until you play
  var checking=new Date(today);
  if(!_isDailyDone(checking)) checking.setDate(checking.getDate()-1);
  while(_isDailyDone(checking)){
    cur++;
    checking.setDate(checking.getDate()-1);
  }
  var keys=[];
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.startsWith('chronos_daily_')) keys.push(k);
    }
  }catch(e){}
  keys.sort();
  run=0;
  for(var j=0;j<keys.length;j++){
    if(j===0){ run=1; }
    else{
      var prev=new Date(keys[j-1].replace('chronos_daily_',''));
      var curr=new Date(keys[j].replace('chronos_daily_',''));
      var diff=(curr-prev)/(1000*60*60*24);
      run=diff===1?run+1:1;
    }
    if(run>longest) longest=run;
  }
  return {cur:cur,longest:longest};
}
function _todayDone(){
  var t=new Date(); t.setHours(0,0,0,0);
  return _isDailyDone(t);
}


// ── ERA TAG HELPER ───────────────────────────────────────────────────────
function eraTagLabel(ef){
  if(!ef||ef==='all')return t('era_all');
  if(ef==='ancient')return t('era_ancient');
  if(ef==='medieval')return t('era_medieval');
  if(ef==='modern')return t('era_modern');
  return t('era_all');
}
// history badge for mode
function modeBadgeLabel(mode,lm){
  const lives=(lm===false)?(' · '+t('free_lbl')):'';
  if(mode==='empires')return t('empires_lbl')+lives;
  if(mode==='abrahamic')return t('biblical_lbl')+lives;
  if(mode==='roman')return t('mc_roman_title')+lives;
  if(mode==='eastern')return t('mc_eastern_title')+lives;
  if(mode==='characters')return t('characters_lbl')+lives;
  return t('classic_lbl')+lives;
}

