// ── ui.js ────────────────────────────────────────────────────────────────
// All UI rendering, panel management, drag/drop, and audio controls.
// Depends on: state.js, i18n.js, game.js (cardYear, isInterval, etc.)
// ─────────────────────────────────────────────────────────────────────────

// ── ERA COLORS ────────────────────────────────────────────────────────────


function selectMode(m){
  gameMode=m;
  document.getElementById('mc-classic').classList.toggle('selected',m==='classic');
  document.getElementById('mc-empires').classList.toggle('selected',m==='empires');
  document.getElementById('mc-characters').classList.toggle('selected',m==='characters');
  // Era filter only relevant for classic & empires & characters modes
  const showEra=(m==='classic'||m==='empires'||m==='characters');
  document.getElementById('era-section').style.display=showEra?'':'none';
}
function selectLives(on){
  livesMode=on;
  document.getElementById('lo-lives').classList.toggle('active',on);
  document.getElementById('lo-free').classList.toggle('active',!on);
}
function selectEra(era,btn){
  eraFilter=era;
  document.querySelectorAll('.era-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
}
function startGame(){ _isDailyChallenge=false;
  var _hBtnR=document.getElementById('hint-btn');
  var _sBtnR=document.getElementById('skip-btn');
  if(_hBtnR) _hBtnR.style.display='';
  if(_sBtnR) _sBtnR.style.display='';
  document.getElementById('intro').classList.remove('show');
  const cs=document.getElementById('cultures-screen');
  if(cs) cs.classList.remove('show');
  initGame();
}
function updateIntroHistBtn(){
  // Always show hub buttons — they work even without history
  const ib=document.getElementById('intro-btns');if(ib)ib.style.display='flex';
}
let _fromGameover=false;
var _currentFactCard=null; // tracks which card the fact panel is showing
function showIntro(){
  const cs = document.getElementById('cultures-screen');
  if(cs) cs.classList.remove('show');
  document.getElementById('gameover').classList.remove('show');
  document.getElementById('intro').classList.add('show');
  updateIntroHistBtn();
}
function restartGame(){
  _voluntaryEnd=false; _pendingGameRecord=null;
  currentCard=null; reviewMode=false;
  // Hide gameover and close any open panels immediately
  document.getElementById('gameover').classList.remove('show');
  var _fp2=document.getElementById('fact-panel');
  if(_fp2){_fp2.classList.remove('open');_fp2.classList.remove('review-mode');}
  // If last game was a culture mode, go back to cultures hub
  if(gameMode==='abrahamic'||gameMode==='roman'||gameMode==='eastern'){
    selectCultureMode(gameMode);
    cultureLivesMode=livesMode;
    document.getElementById('clo-lives').classList.toggle('active', cultureLivesMode);
    document.getElementById('clo-free').classList.toggle('active', !cultureLivesMode);
    openCultures();
  } else {
    showIntro();
  }
}

// ── CONFIRM END ───────────────────────────────────────────────────────────
function confirmEnd(){
  if(!gameActive)return;
  document.getElementById('cd-title').textContent=t('end_title');
  document.getElementById('cd-body').textContent=t('end_body');
  document.getElementById('cd-cancel').textContent=t('keep_playing');
  document.getElementById('cd-end').textContent=t('end_run');
  document.getElementById('confirm-dialog').classList.add('show');
}
function closeConfirm(){document.getElementById('confirm-dialog').classList.remove('show');}
function doEndRun(){closeConfirm();_voluntaryEnd=true;endGame(false);}

// ── GAME INIT ─────────────────────────────────────────────────────────────
function drawCard(){
  if(!deck.length){endGame(true);return;}
  currentCard=deck.pop();
  cardCluesUsed=0;
  const c=currentCard;
  const iv=isInterval(c);
  document.getElementById('hc-name').textContent=cName(c);
  document.getElementById('hc-cat').textContent=iv?cCulture(c):cCat(c);
  document.getElementById('hc-era').textContent='';
  document.getElementById('hc-hint').textContent=cHint(c);
  document.getElementById('hc-bar').style.background='rgba(201,168,76,0.25)';
  document.getElementById('hand-card').className=gameMode==='empires'?'empires-border':(!livesMode?'free-border':'');
  // Interval-specific fields
  const spanEl=document.getElementById('hc-span');
  const regionEl=document.getElementById('hc-region');
  const cultureEl=document.getElementById('hc-culture');
  spanEl.style.display=iv?'block':'none';
  regionEl.style.display=iv?'block':'none';
  cultureEl.style.display=iv?'inline-block':'none';
  if(iv){
    spanEl.textContent='?? – ?? · place to reveal dates';
    regionEl.textContent=cRegion(c)||'';
    cultureEl.textContent=cCulture(c)||'';
  }
  document.getElementById('g-name').textContent=cName(c);
  document.getElementById('g-cat').textContent=iv?(cCulture(c)||''):cCat(c);
  document.getElementById('score-val').textContent=score;
  document.getElementById('streak-val').textContent=streak;
  // Reset clue display
  const clueEl=document.getElementById('hc-clue');
  clueEl.textContent='';clueEl.classList.remove('show');
  renderSideBtns();
}
function renderLives(){
  const v=document.getElementById('lives-val');
  if(v)v.textContent=lives;
}
function renderTimeline(){
  const el=document.getElementById('timeline');el.innerHTML='';
  el.appendChild(makeDZ(0));
  timeline.forEach((card,idx)=>{el.appendChild(makeTCard(card,idx));el.appendChild(makeDZ(idx+1));});
  // Show empty state hint when timeline is empty
  if(timeline.length===0){
    const hint=document.createElement('div');
    hint.style.cssText='text-align:center;color:rgba(201,168,76,.3);font-family:Inter,sans-serif;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:60px 20px;pointer-events:none;user-select:none';
    hint.textContent='↑ Drop your first card here';
    el.appendChild(hint);
  }
}
function makeTCard(card,idx){
  const d=document.createElement('div');
  const iv=isInterval(card);
  const color=ERA_COLORS[card.era]||'#9a6abf';
  if(iv){
    const dur=card.endYear-card.startYear;
    const durStr=dur>0?`${dur} yrs`:'';
    const cultureBadge=cCulture(card)?`<span class="tc-culture-badge">${cCulture(card)}</span>`:'';
    d.className='timeline-card interval-card';
    d.innerHTML=`<div class="tc-dot" style="background:${color}"></div><div class="tc-info"><div class="tcard-name">${cName(card)}${cultureBadge}</div><div class="tc-meta tc-region">${cRegion(card)||card.era}</div></div><div class="tc-span">${formatYear(card.startYear)} – ${formatYear(card.endYear)}</div><div class="tc-peek">ℹ</div>`;
  } else {
    d.className='timeline-card';
    d.innerHTML=`<div class="tc-dot" style="background:${color}"></div><div class="tc-info"><div class="tcard-name">${cName(card)}</div><div class="tc-meta">${card.era} · ${cCat(card)}</div></div><div class="tc-year">${formatYear(card.year)}</div><div class="tc-peek">ℹ</div>`;
  }
  d.addEventListener('click',()=>reviewCard(card));
  return d;
}
function makeDZ(idx){
  const d=document.createElement('div');d.className='drop-zone';d.dataset.index=idx;
  d.setAttribute('data-label',t('drop_here'));
  const line=document.createElement('div');line.className='dz-line';d.appendChild(line);
  d.addEventListener('click',()=>{if(!isDragging&&currentCard){SFX.play('drop');attemptPlacement(idx);}});
  return d;
}

// ── HINTS & SKIP ─────────────────────────────────────────────────────────
function renderSideBtns(){
  const visible=timeline.length>0; // only show after first card placed
  // Hint button — disabled if no hints left in pool OR card already showed 3
  const hBtn=document.getElementById('hint-btn');
  hBtn.classList.toggle('visible',visible);
  hBtn.disabled=(!currentCard||!gameActive||hints<=0||cardCluesUsed>=3);
  document.getElementById('hint-count').textContent=hints;
  // Dots show hints remaining in pool (up to 3 dots max for visual)
  for(let i=0;i<3;i++){
    const dot=document.getElementById('hd'+i);
    if(dot)dot.classList.toggle('used',i<hints);
  }
  // Skip button — only 1 per run
  const sBtn=document.getElementById('skip-btn');
  sBtn.classList.toggle('visible',visible);
  sBtn.disabled=(!currentCard||!gameActive||skip<=0);
  document.getElementById('skip-count').textContent=skip;
  const hl=document.getElementById('hint-lbl');if(hl)hl.textContent=lang==='pt'?'Pista':'Hint';
  const sl=document.getElementById('skip-lbl');if(sl)sl.textContent=lang==='pt'?'Pular':'Skip';
}
let _toastTimer=null;
function showStreakToast(){
  const el=document.getElementById('streak-toast');
  el.textContent=t('skip_earned');
  el.classList.add('show');
  if(_toastTimer)clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}

// ── DRAG ──────────────────────────────────────────────────────────────────
var ghost; // assigned in DOMContentLoaded below
function startDrag(e){
  if(!currentCard||!gameActive)return;
  e.preventDefault();isDragging=true;
  SFX.play('pickup');
  ghost.classList.add('visible');
  document.getElementById('hand-card').classList.add('lifting');
  moveGhost(e.clientX,e.clientY);
  document.addEventListener('pointermove',onDrag);
  document.addEventListener('pointerup',endDrag);
}
function onDrag(e){
  if(!isDragging)return;
  moveGhost(e.clientX,e.clientY);
  const area=document.getElementById('timeline-area'),ar=area.getBoundingClientRect();
  if(e.clientY<ar.top+60)area.scrollTop-=8;
  else if(e.clientY>ar.bottom-60)area.scrollTop+=8;
  const dz=dzAt(e.clientX,e.clientY);
  if(currentDropZone&&currentDropZone!==dz)currentDropZone.classList.remove('active');
  if(dz){dz.classList.add('active');currentDropZone=dz;}else currentDropZone=null;
}
function endDrag(e){
  document.removeEventListener('pointermove',onDrag);
  document.removeEventListener('pointerup',endDrag);
  ghost.classList.remove('visible');
  document.getElementById('hand-card').classList.remove('lifting');
  isDragging=false;
  if(currentDropZone){
    SFX.play('drop');
    currentDropZone.classList.remove('active');
    const idx=parseInt(currentDropZone.dataset.index);
    currentDropZone=null;attemptPlacement(idx);
  }
}
function moveGhost(x,y){ghost.style.left=(x-ghost.offsetWidth/2)+'px';ghost.style.top=(y-ghost.offsetHeight/2-20)+'px';}
function dzAt(x,y){
  for(const dz of document.querySelectorAll('.drop-zone')){
    const r=dz.getBoundingClientRect();
    if(x>=r.left-30&&x<=r.right+30&&y>=r.top-30&&y<=r.bottom+30)return dz;
  }
  return null;
}

var _feedbackTimer=null;
function showFeedback(ok,hint){
  const el=document.getElementById('feedback');el.className='';
  if(ok){el.textContent=t('correct');}
  else{
    if(hint==='earlier')el.textContent=t('wrong_earlier');
    else if(hint==='later')el.textContent=t('wrong_later');
    else el.textContent=t('wrong');
  }
  void el.offsetWidth;
  el.className=ok?'correct':'incorrect';
  clearTimeout(_feedbackTimer);
  _feedbackTimer=setTimeout(()=>el.className='',2400);
}

// ── FACT PANEL ────────────────────────────────────────────────────────────
function showFact(card,isReview){
  reviewMode=!!isReview;
  _currentFactCard=card;
  const fp=document.getElementById('fact-panel');
  const iv=isInterval(card);
  document.getElementById('fp-tag').textContent=isReview?t('review_tag'):t('fact_tag');
  document.getElementById('fp-name').textContent=cName(card);
  if(iv){
    const cul=cCulture(card);const reg=cRegion(card);
    document.getElementById('fp-year').textContent=formatYear(card.startYear)+' – '+formatYear(card.endYear)+(reg?' · '+reg:'');
    // Use description if available, fall back to first fact, then hint
    const desc=(lang==='pt'?(card.description_pt||card.description):(card.description||card.description_pt))
      ||(lang==='pt'?(card.facts_pt&&card.facts_pt[0]):(card.facts&&card.facts[0]))
      ||(lang==='pt'?(card.hint_pt||card.hint):(card.hint||''));
    const prefix=cul?cul+' · ':'';
    document.getElementById('fp-text').textContent=prefix+desc;
  } else {
    document.getElementById('fp-year').textContent=formatYear(card.year)+' · '+card.era;
    document.getElementById('fp-text').textContent=cFact(card);
  }
  document.getElementById('fp-btn').textContent=isReview?t('fp_close'):t('fp_continue');
  fp.classList.toggle('review-mode',isReview);
  fp.classList.add('open');
}
function reviewCard(card){
  // Tap on a placed card in the timeline → show its fact in review mode
  // If a post-placement fact panel is already open (pendingDraw), preserve that flag
  showFact(card,true);
}
function closeFact(){
  document.getElementById('fact-panel').classList.remove('open');
  document.getElementById('fact-panel').classList.remove('review-mode');
  _currentFactCard=null;
  const wasReview=reviewMode;
  reviewMode=false;
  // Draw next card if: (a) this was a post-placement panel (not review), OR
  // (b) this was a review that interrupted a pending post-placement panel
  if(gameActive&&(!wasReview||_pendingDraw)){_pendingDraw=false;drawCard();}
}

function openHistory(){
  if(gameActive)return;
  _fromGameover=false;
  document.getElementById('gameover').classList.remove('show');
  renderHistoryPanel();
  document.getElementById('history-panel').classList.add('open');
}
function openHistoryFromGameover(){
  _fromGameover=true;
  document.getElementById('gameover').classList.remove('show');
  renderHistoryPanel();
  document.getElementById('history-panel').classList.add('open');
}
function closeHistory(){
  document.getElementById('history-panel').classList.remove('open');
  if(gameActive)return;
  document.getElementById('gameover').classList.remove('show');
  _fromGameover=false;
  if(_fromCultures){ _fromCultures=false; openCultures(); } else { showIntro(); }
}
function renderHistoryPanel(){
  switchHpTab('timelines');
  document.getElementById('hp-title').textContent=t('history_title');
  document.getElementById('hp-close').textContent=t('hp_close');
  const list=document.getElementById('history-list');list.innerHTML='';
  if(!gameHistory.length){list.innerHTML=`<div class="hp-empty">${t('no_history').replace('\n','<br>')}</div>`;return;}
  gameHistory.forEach((entry,i)=>{
    const d=new Date(entry.date);
    const loc=entry.lang==='pt'?'pt-BR':'en-US';
    const dateStr=d.toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'});
    const modeLbl=modeBadgeLabel(entry.mode,entry.livesMode);
    const div=document.createElement('div');div.className='history-entry';
    div.innerHTML=`
      <div class="he-header" onclick="toggleEntry(${i})">
        <div><div class="he-date">${dateStr}</div><div class="he-stats">${entry.score} pts · ${entry.placed} ${t('cards_placed')}</div></div>
        <div class="he-right">
          <span class="he-era-tag">${eraTagLabel(entry.eraFilter)}</span>
          <span class="he-mode ${entry.mode}">${modeLbl}</span>
          <button class="he-del" title="Delete" onclick="event.stopPropagation();askDeleteEntry(${i})">🗑</button>
          <span class="he-chevron" id="chev-${i}">▼</span>
        </div>
      </div>
      <div class="he-tl" id="ht-${i}">
        <div class="ht-label">${t('tl_lbl')}</div>
        ${entry.timeline.map(c=>`<div class="ht-card"><div class="ht-dot" style="background:${ERA_COLORS[c.era]||'#888'}"></div><div class="ht-name">${c.name}</div><div class="ht-year">${c.span||formatYear(c.year)}</div></div>`).join('')}
      </div>`;
    list.appendChild(div);
  });
}
function toggleEntry(i){
  const ht=document.getElementById(`ht-${i}`),chev=document.getElementById(`chev-${i}`);
  const open=ht.classList.toggle('open');chev.classList.toggle('open',open);
}


// ── HISTORY TABS ──────────────────────────────────────────────────────────
var _hpTab = 'timelines';
function switchHpTab(tab){
  _hpTab = tab;
  document.getElementById('hp-tab-timelines').classList.toggle('active', tab==='timelines');
  document.getElementById('hp-tab-timelines').textContent=t('tab_timelines');
  document.getElementById('hp-tab-streak').classList.toggle('active', tab==='streak');
  document.getElementById('hp-tab-streak').textContent=t('tab_streak');
  document.getElementById('history-list').style.display = tab==='timelines' ? '' : 'none';
  document.getElementById('hp-streak').style.display = tab==='streak' ? 'flex' : 'none';
  if(tab==='streak'){ _calViewYear=new Date().getFullYear(); _calViewMonth=new Date().getMonth(); renderStreakTab(); }
}

// ── RENDER STREAK TAB ─────────────────────────────────────────────────────
function renderStreakTab(){
  var panel=document.getElementById('hp-streak');
  panel.innerHTML='';
  var st=_calcStreak();

  // ── Streak stats ──────────────────────────────────────────────────────
  var stats=document.createElement('div'); stats.className='streak-stats';
  stats.innerHTML='<div class="streak-stat"><div class="streak-stat-val">'+st.cur+'</div><div class="streak-stat-lbl">🔥 '+t('daily_current_streak')+'</div></div><div class="streak-divider"></div><div class="streak-stat"><div class="streak-stat-val">'+st.longest+'</div><div class="streak-stat-lbl">⭐ '+t('daily_longest_streak')+'</div></div>';
  panel.appendChild(stats);

  // ── This week grid ────────────────────────────────────────────────────
  var today=new Date(); today.setHours(0,0,0,0);
  var dow=today.getDay();
  var mondayOffset=dow===0?-6:1-dow;
  var monday=new Date(today); monday.setDate(today.getDate()+mondayOffset);
  var dayNames=lang==='pt'?['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var week=document.createElement('div'); week.className='streak-week';
  for(var i=0;i<7;i++){
    var day=new Date(monday); day.setDate(monday.getDate()+i);
    var done=_isDailyDone(day);
    var isToday=day.getTime()===today.getTime();
    var dc=document.createElement('div'); dc.className='streak-day';
    var dotCls='streak-dot'+(done?' done':'')+(isToday?' today':'');
    dc.innerHTML='<div class="streak-day-lbl">'+dayNames[i]+'</div><div class="'+dotCls+'"></div>';
    week.appendChild(dc);
  }
  panel.appendChild(week);

  // ── Play button ───────────────────────────────────────────────────────
  var doneToday=_todayDone();
  var btn=document.createElement('button');
  btn.className='streak-play-btn';
  btn.textContent=doneToday?t('daily_done'):t('daily_play');
  btn.disabled=doneToday;
  if(!doneToday) btn.onclick=function(){ closeHistory(); startDailyChallenge(); };
  panel.appendChild(btn);
  if(doneToday){
    var msg=document.createElement('div'); msg.className='streak-done-msg';
    msg.textContent=t('daily_comeback');
    panel.appendChild(msg);
  }

  // ── Monthly calendar with prev/next navigation ───────────────────────
  var calTitle=document.createElement('div'); calTitle.className='dc-section-title';
  calTitle.textContent=lang==='pt'?'📅 Calendário de Desafios':'📅 Challenge Calendar';
  panel.appendChild(calTitle);

  var calWrap=document.createElement('div'); calWrap.className='dc-cal-wrap';
  calWrap.id='dc-cal-wrap';
  panel.appendChild(calWrap);
  _renderCalMonth(_calViewYear, _calViewMonth);
}

// ── Calendar navigation state ─────────────────────────────────────────────
var _CAL_MIN_YEAR=2026; var _CAL_MIN_MONTH=2; // March 2026 (0-indexed)
var _calViewYear  = new Date().getFullYear();
var _calViewMonth = new Date().getMonth(); // 0-indexed

function _calNav(dir){
  _calViewMonth += dir;
  if(_calViewMonth > 11){ _calViewMonth=0; _calViewYear++; }
  if(_calViewMonth < 0) { _calViewMonth=11; _calViewYear--; }
  // Clamp to min
  if(_calViewYear<_CAL_MIN_YEAR||(_calViewYear===_CAL_MIN_YEAR&&_calViewMonth<_CAL_MIN_MONTH)){
    _calViewYear=_CAL_MIN_YEAR; _calViewMonth=_CAL_MIN_MONTH;
  }
  _renderCalMonth(_calViewYear, _calViewMonth);
}

function _renderCalMonth(yr, mo){
  var wrap=document.getElementById('dc-cal-wrap');
  if(!wrap) return;
  wrap.innerHTML='';

  var today=new Date(); today.setHours(0,0,0,0);
  var nowYr=today.getFullYear(); var nowMo=today.getMonth();
  var isFuture=(yr>nowYr)||(yr===nowYr&&mo>nowMo);

  var monthDate=new Date(yr,mo,1);
  var monthName=monthDate.toLocaleDateString(lang==='pt'?'pt-BR':'en-US',{month:'long',year:'numeric'});

  var mBlock=document.createElement('div'); mBlock.className='dc-month-block';

  // ── Nav header ──────────────────────────────────────────────────────────
  var nav=document.createElement('div'); nav.className='dc-month-nav';
  var isAtMin=(yr===_CAL_MIN_YEAR&&mo===_CAL_MIN_MONTH);
  var prevBtn=document.createElement('button'); prevBtn.className='dc-nav-btn'; prevBtn.textContent='‹';
  prevBtn.disabled=isAtMin;
  prevBtn.onclick=function(){ _calNav(-1); };
  var mTitle=document.createElement('div'); mTitle.className='dc-month-title dc-month-title-btn';
  mTitle.textContent=monthName.charAt(0).toUpperCase()+monthName.slice(1);
  mTitle.title=lang==='pt'?'Ir para mês/ano':'Jump to month/year';
  mTitle.onclick=function(){ _toggleCalPicker(yr, mo, mBlock); };
  var nextBtn=document.createElement('button'); nextBtn.className='dc-nav-btn'; nextBtn.textContent='›';
  nextBtn.disabled=isFuture;
  nextBtn.onclick=function(){ if(!isFuture) _calNav(1); };
  nav.appendChild(prevBtn); nav.appendChild(mTitle); nav.appendChild(nextBtn);
  mBlock.appendChild(nav);

  // ── Day-of-week header ──────────────────────────────────────────────────
  var hdr=document.createElement('div'); hdr.className='dc-cal-grid';
  var hdNames=lang==='pt'?['S','T','Q','Q','S','S','D']:['M','T','W','T','F','S','S'];
  hdNames.forEach(function(n){
    var h=document.createElement('div'); h.className='dc-cal-hdr'; h.textContent=n;
    hdr.appendChild(h);
  });
  mBlock.appendChild(hdr);

  // ── Calendar grid ────────────────────────────────────────────────────────
  var grid=document.createElement('div'); grid.className='dc-cal-grid';
  var firstDow=monthDate.getDay();
  var offset=firstDow===0?6:firstDow-1;
  for(var e=0;e<offset;e++){
    var empty=document.createElement('div'); empty.className='dc-cal-cell empty';
    grid.appendChild(empty);
  }
  var daysInMonth=new Date(yr,mo+1,0).getDate();
  for(var d=1;d<=daysInMonth;d++){
    var rec=_getDailyRecord(new Date(yr,mo,d));
    var cell=document.createElement('div');
    var dayDate=new Date(yr,mo,d); dayDate.setHours(0,0,0,0);
    var isFutureDay=dayDate.getTime()>today.getTime();
    cell.className='dc-cal-cell'+(rec?' done':'')+(isFutureDay?' future':'');
    if(dayDate.getTime()===today.getTime()) cell.classList.add('today');
    cell.textContent=d;
    if(rec){
      (function(r,cellEl,dayNum){
        cellEl.onclick=function(){ toggleDailyEntry(cellEl,r,dayNum,yr,mo); };
      })(rec,cell,d);
    }
    grid.appendChild(cell);
  }
  mBlock.appendChild(grid);
  wrap.appendChild(mBlock);
}


function _toggleCalPicker(curYr, curMo, mBlock){
  var existing=mBlock.querySelector('.dc-picker');
  if(existing){ existing.remove(); return; }

  var today=new Date(); var nowYr=today.getFullYear(); var nowMo=today.getMonth();
  var selYr=curYr; var selMo=curMo;

  var monthNames=lang==='pt'
    ?['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    :['January','February','March','April','May','June','July','August','September','October','November','December'];

  var picker=document.createElement('div'); picker.className='dc-picker';
  var cols=document.createElement('div'); cols.className='dc-picker-cols';

  // ── Build a drum-roll column: 3 visible items, center = selected ─────
  function makeCol(items, selectedIdx, onSelect){
    var col=document.createElement('div'); col.className='dc-picker-col';
    // highlight bar (position:absolute, sits at top:40px = second row)
    var hl=document.createElement('div'); hl.className='dc-picker-highlight'; col.appendChild(hl);
    // top spacer = 1 item height so first item can center
    var padTop=document.createElement('div'); padTop.style.cssText='height:40px;flex-shrink:0;scroll-snap-align:none'; col.appendChild(padTop);
    items.forEach(function(item, i){
      var el=document.createElement('div');
      el.className='dc-picker-item'+(i===selectedIdx?' active':'')+(item.disabled?' disabled':'');
      el.textContent=item.label;
      el.dataset.idx=i;
      el.onclick=function(){
        col.querySelectorAll('.dc-picker-item').forEach(function(e){ e.classList.remove('active'); });
        el.classList.add('active');
        onSelect(i, item.value);
        col.scrollTo({top: i*40, behavior:'smooth'});
      };
      col.appendChild(el);
    });
    // bottom spacer = 1 item height so last item can center
    var padBot=document.createElement('div'); padBot.style.cssText='height:40px;flex-shrink:0;scroll-snap-align:none'; col.appendChild(padBot);
    // Initial scroll — selected item in center row (row 2 = offset selectedIdx*40)
    setTimeout(function(){ col.scrollTop=selectedIdx*40; },0);
    return col;
  }

  // ── Month column ─────────────────────────────────────────────────────
  var moItems=monthNames.map(function(name,i){
    var tooEarly=(selYr===_CAL_MIN_YEAR&&i<_CAL_MIN_MONTH);
    var tooLate=(selYr===nowYr&&i>nowMo);
    return {label:name, value:i, disabled:tooEarly||tooLate};
  });
  var moCol=makeCol(moItems, selMo, function(i, val){
    selMo=val;
  });

  // ── Year column ──────────────────────────────────────────────────────
  var yrItems=[];
  for(var y=_CAL_MIN_YEAR;y<=nowYr;y++) yrItems.push({label:String(y),value:y,disabled:false});
  var yrSelIdx=yrItems.findIndex(function(it){return it.value===selYr;});
  var yrCol=makeCol(yrItems, yrSelIdx, function(i, val){
    selYr=val;
    // Re-evaluate disabled months
    moCol.querySelectorAll('.dc-picker-item').forEach(function(el,mi){
      var tooEarly=(selYr===_CAL_MIN_YEAR&&mi<_CAL_MIN_MONTH);
      var tooLate=(selYr===nowYr&&mi>nowMo);
      el.classList.toggle('disabled', tooEarly||tooLate);
      // If currently selected month is now disabled, clamp
      if(el.classList.contains('active')&&(tooEarly||tooLate)){
        el.classList.remove('active');
        var clamp=selYr===_CAL_MIN_YEAR?_CAL_MIN_MONTH:nowMo;
        selMo=clamp;
        moCol.querySelectorAll('.dc-picker-item')[clamp].classList.add('active');
        moCol.scrollTo({top:clamp*40,behavior:'smooth'});
      }
    });
  });

  cols.appendChild(moCol);
  cols.appendChild(yrCol);
  picker.appendChild(cols);

  // ── Confirm button ────────────────────────────────────────────────────
  var confirm=document.createElement('button'); confirm.className='dc-picker-confirm';
  confirm.textContent=lang==='pt'?'Confirmar':'Confirm';
  confirm.onclick=function(){
    _calViewYear=selYr; _calViewMonth=selMo;
    _renderCalMonth(selYr, selMo);
  };
  picker.appendChild(confirm);

  var hdr=mBlock.querySelector('.dc-cal-grid');
  mBlock.insertBefore(picker, hdr);
}
function toggleDailyEntry(cellEl, rec, day, yr, mo){
  // Remove any open expanded panel in this grid
  var existing=cellEl.closest('.dc-month-block').querySelector('.dc-entry-panel');
  if(existing){
    var wasCell=existing.dataset.cell===(yr+'-'+mo+'-'+day);
    existing.remove();
    if(wasCell) return; // tap same cell = collapse
  }
  var panel=document.createElement('div'); panel.className='dc-entry-panel';
  panel.dataset.cell=yr+'-'+mo+'-'+day;
  var d=new Date(yr,mo,day);
  var dateStr=d.toLocaleDateString(lang==='pt'?'pt-BR':'en-US',{day:'numeric',month:'short',year:'numeric'});
  var html='<div class="dc-entry-header"><span class="dc-entry-date">📅 '+dateStr+'</span><span class="dc-entry-score">'+rec.score+' pts · '+rec.placed+' '+(lang==='pt'?'cartas':'cards')+'</span></div>';
  if(rec.timeline&&rec.timeline.length){
    html+='<div class="dc-entry-tl">';
    rec.timeline.forEach(function(c){
      html+='<div class="ht-card"><div class="ht-dot" style="background:'+(ERA_COLORS[c.era]||'#888')+'"></div><div class="ht-name">'+c.name+'</div><div class="ht-year">'+(c.span||formatYear(c.year))+'</div></div>';
    });
    html+='</div>';
  }
  panel.innerHTML=html;
  // Insert after the grid row containing the cell
  cellEl.closest('.dc-month-block').appendChild(panel);
}

// ── DAILY CHALLENGE ───────────────────────────────────────────────────────
// ── DELETE HISTORY ENTRIES ────────────────────────────────────────────────
let _delIdx=null;
function askDeleteEntry(i){
  _delIdx=i;
  document.getElementById('del-msg').textContent=t('del_one');
  document.getElementById('del-backdrop').classList.add('show');
}

function cancelDel(){document.getElementById('del-backdrop').classList.remove('show');_delIdx=null;}
function confirmDel(){
  if(_delIdx!==null) gameHistory.splice(_delIdx,1);
  try{localStorage.setItem('chronos_history',JSON.stringify(gameHistory));}catch(e){}
  document.getElementById('del-backdrop').classList.remove('show');
  _delIdx=null;
  renderHistoryPanel();
}

// ── COMPENDIUM ────────────────────────────────────────────────────────────
var cpFilt = 'all';
var cpEra = 'all';
var cpFiltVisible = false;

function openCompendium() {
  var el = document.getElementById('cp-q');
  if (el) el.value = '';
  cpFilt = 'all';
  cpEra = 'all';
  cpFiltVisible = false;
  document.querySelectorAll('.cp-chip').forEach(function(b){
    b.classList.toggle('on', b.dataset.f === 'all');
  });
  document.querySelectorAll('.cp-era-chip').forEach(function(b){
    b.classList.toggle('on', b.dataset.e === 'all');
  });
  // Reset filter panel collapsed
  var _cf = document.getElementById('cp-filt');
  var _ctb = document.getElementById('cp-filt-toggle');
  if (_cf) _cf.style.display = 'none';
  if (_ctb) _ctb.classList.remove('active');
  renderCP();
  document.getElementById('cp').classList.add('open');
}

function closeCompendium() {
  document.getElementById('cp').classList.remove('open');
  if (!gameActive) {
    document.getElementById('gameover').classList.remove('show');
    _fromGameover = false;
    if(_fromCultures){ _fromCultures=false; openCultures(); } else { showIntro(); }
  }
}

function setCpFilt(btn) {
  cpFilt = btn.dataset.f;
  document.querySelectorAll('.cp-chip').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  renderCP();
}

function setCpEra(btn) {
  cpEra = btn.dataset.e;
  document.querySelectorAll('.cp-era-chip').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  renderCP();
}

function toggleCpFilt() {
  cpFiltVisible = !cpFiltVisible;
  var filt = document.getElementById('cp-filt');
  var btn = document.getElementById('cp-filt-toggle');
  if (filt) filt.style.display = cpFiltVisible ? '' : 'none';
  if (btn) btn.classList.toggle('active', cpFiltVisible);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCP() {
  // Clear list immediately — prevents stale content on Android WebView
  var list = document.getElementById('cp-list');
  if (list) list.innerHTML = '';

  var q = ((document.getElementById('cp-q') || {}).value || '').toLowerCase().trim();

  var all = [];
  CARDS.forEach(function(c){ if(c && typeof c.name === 'string') all.push(c); });
  INTERVALS.forEach(function(c){ if(c && typeof c.name === 'string') all.push(c); });
  all.sort(function(a, b) {
    var ya = a.startYear !== undefined ? a.startYear : (a.year || 0);
    var yb = b.startYear !== undefined ? b.startYear : (b.year || 0);
    return ya - yb;
  });

  // Update era chip labels for language
  var eraChipLabels = lang==='pt'
    ? {all:'Todas', ancient:'Antiguidade', medieval:'Medieval', modern:'Moderno'}
    : {all:'All', ancient:'Ancient', medieval:'Medieval', modern:'Modern'};
  document.querySelectorAll('.cp-era-chip').forEach(function(b){
    if(eraChipLabels[b.dataset.e]) b.textContent = eraChipLabels[b.dataset.e];
  });

  // Update type chip labels for language
  var typeChipLabels = lang==='pt'
    ? {all:'Todos', people:'Pessoas', events:'Eventos', empires:'Impérios', biblical:'Bíblico'}
    : {all:'All', people:'People', events:'Events', empires:'Empires', biblical:'Biblical'};
  document.querySelectorAll('.cp-chip').forEach(function(b){
    if(typeChipLabels[b.dataset.f]) b.textContent = typeChipLabels[b.dataset.f];
  });

  // Update filter section labels
  var flTypeLbl = document.getElementById('cfl-type');
  var flEraLbl = document.getElementById('cfl-era');
  if(flTypeLbl) flTypeLbl.textContent = lang==='pt' ? 'TIPO' : 'TYPE';
  if(flEraLbl) flEraLbl.textContent = lang==='pt' ? 'ERA' : 'ERA';

  var CP_ERA_MAP = {
    ancient:  ['Ancient','Classical'],
    medieval: ['Medieval','Renaissance'],
    modern:   ['Early Modern','Modern','Contemporary']
  };
  var cpEraList = (typeof cpEra !== 'undefined' && cpEra !== 'all') ? CP_ERA_MAP[cpEra] : null;

  var filtered = all.filter(function(c) {
    var iv = c.startYear !== undefined;
    if (cpFilt === 'people'   && c.cat !== 'People') return false;
    if (cpFilt === 'events'   && c.cat !== 'Events') return false;
    if (cpFilt === 'empires'  && !iv) return false;
    if (cpEraList && cpEraList.indexOf(c.era) === -1) return false;
    if (q) {
      var nm = (lang === 'pt' ? (c.name_pt || c.name) : c.name).toLowerCase();
      if (nm.indexOf(q) === -1) return false;
    }
    return true;
  });

  // Update discovered count to reflect active filters
  var discoveredInFilter = 0;
  filtered.forEach(function(c){ if(discoveredCards.has(c.name)) discoveredInFilter++; });
  var allDiscovered = 0;
  all.forEach(function(c){ if(discoveredCards.has(c.name)) allDiscovered++; });
  var cntEl = document.getElementById('cp-cnt');
  if(cntEl) {
    var isFiltered = (cpFilt !== 'all' || (typeof cpEra !== 'undefined' && cpEra !== 'all') || q);
    if(isFiltered) {
      // Show filtered count + total discovered in parentheses
      cntEl.textContent = discoveredInFilter + ' / ' + filtered.length
        + (lang==='pt' ? ' neste filtro' : ' in view')
        + '  ·  ' + allDiscovered + ' / ' + all.length
        + (lang==='pt' ? ' no total' : ' total');
    } else {
      cntEl.textContent = allDiscovered + ' / ' + all.length
        + (lang==='pt' ? ' descobertos' : ' discovered');
    }
  }

  if (!list) return;

  if (!filtered.length) {
    list.innerHTML = '<p style="text-align:center;color:#9a9080;padding:40px 20px;font-family:Inter,sans-serif;font-size:.9rem">'+(lang==='pt'?'Nenhuma carta encontrada.':'No cards match.')+'</p>';
    return;
  }

  var rows = [];  filtered.forEach(function(card) {
    var iv   = card.startYear !== undefined;
    var disc = discoveredCards.has(card.name);
    var sid  = 'ck_' + card.name.replace(/[^a-z0-9]/gi, '_');
    var col  = ERA_COLORS[card.era] || '#888';

    var nm = disc
      ? esc(lang === 'pt' ? (card.name_pt || card.name) : card.name)
      : '?????';

    var yr = disc
      ? (iv
          ? (Math.abs(card.startYear) + (card.startYear < 0 ? ' BCE' : ' CE') + ' \u2013 ' + Math.abs(card.endYear) + (card.endYear < 0 ? ' BCE' : ' CE'))
          : (Math.abs(card.year) + (card.year < 0 ? ' BCE' : ' CE')))
      : '????';

    var meta = esc(disc
      ? (card.era + ' \u00b7 ' + (iv ? 'Empire/Era' : (lang === 'pt' ? (card.cat_pt || card.cat) : card.cat)))
      : card.era);

    var h = '';
    h += '<div class="ck">';
    h += '<div class="ck-h" onclick="toggleCK(&#39;' + sid + '&#39;)">';
    h += '<div class="ck-dot" style="background:' + col + ';opacity:' + (disc ? '1' : '0.4') + '"></div>';
    h += '<div class="ck-mid">';
    h += '<div class="ck-n' + (disc ? '' : ' lk') + '">' + nm + '</div>';
    h += '<div class="ck-m">' + meta + '</div>';
    h += '</div>';
    h += '<div class="ck-r">';
    h += '<div class="ck-y">' + yr + '</div>';
    h += '<div class="ck-a" id="ka_' + sid + '">\u203a</div>';
    h += '</div>';
    h += '</div>'; /* end ck-h */

    h += '<div class="ck-b" id="' + sid + '"><div class="ck-i">';
    if (disc) {
      var hint  = lang === 'pt' ? (card.hint_pt  || card.hint  || '') : (card.hint  || '');
      var facts = lang === 'pt' ? (card.facts_pt || card.facts || []) : (card.facts || []);
      var clues = lang === 'pt' ? (card.clues_pt || card.clues || []) : (card.clues || []);
      if (hint) h += '<div class="ck-tl">' + esc(hint) + '</div>';
      facts.forEach(function(f) { h += '<p class="ck-f">' + esc(f) + '</p>'; });
      if (clues.length) {
        h += '<div class="ck-cs"><div class="ck-cl">' + (lang === 'pt' ? 'Pistas' : 'Clues') + '</div>';
        clues.forEach(function(c) { h += '<div class="ck-c">' + esc(c) + '</div>'; });
        h += '</div>';
      }
    } else {
      h += '<div class="ck-lk">Play this card to unlock its story.</div>';
    }
    h += '</div></div></div>';
    rows.push(String(h));
  });

  list.innerHTML = rows.join('');
}

function toggleCK(sid) {
  var body = document.getElementById(sid);
  var arr  = document.getElementById('ka_' + sid);
  if (!body) return;
  var wasOpen = body.classList.contains('op');
  document.querySelectorAll('.ck-b.op').forEach(function(b){ b.classList.remove('op'); });
  document.querySelectorAll('.ck-a.op').forEach(function(a){ a.classList.remove('op'); });
  if (!wasOpen) {
    body.classList.add('op');
    if (arr) arr.classList.add('op');
    setTimeout(function(){ body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
  }
}


// ── THEME ─────────────────────────────────────────────────────────────────
let lightMode=false;
try{lightMode=localStorage.getItem('chronos_theme')==='light';}catch(e){}
function applyTheme(){
  document.body.classList.toggle('light',lightMode);
}
function toggleTheme(){
  lightMode=!lightMode;
  try{localStorage.setItem('chronos_theme',lightMode?'light':'dark');}catch(e){}
  applyTheme();
  if(typeof updateSettingsUI==='function')updateSettingsUI();
}
// ── TROPHY SYSTEM ─────────────────────────────────────────────────────────

function _showTrophyToastQueue(list, idx){
  if(idx >= list.length) return;
  var def = list[idx];
  var toast = document.getElementById('tp-toast');
  document.getElementById('tp-toast-icon').textContent = def.icon;
  var nm = lang === 'pt' ? def.name_pt : def.name;
  document.getElementById('tp-toast-txt').textContent = (lang==='pt' ? 'Troféu: ' : 'Trophy: ') + nm + ' 🏆';
  toast.classList.add('show');
  setTimeout(function(){
    toast.classList.remove('show');
    setTimeout(function(){ _showTrophyToastQueue(list, idx+1); }, 500);
  }, 3200);
}

function openTrophies(){
  renderTrophies();
  document.getElementById('tp').classList.add('open');
}
function closeTrophies(){
  document.getElementById('tp').classList.remove('open');
  if(!gameActive){
    if(_fromCultures){ _fromCultures=false; openCultures(); } else { showIntro(); }
  }
}

function renderTrophies(){
  var earnedCount = Object.keys(earnedTrophies).length;
  var cntEl = document.getElementById('tp-cnt');
  if(cntEl) cntEl.textContent = earnedCount + ' / ' + TROPHY_DEFS.length + ' earned';

  var html = '';
  TROPHY_DEFS.forEach(function(def, i){
    var isEarned = !!earnedTrophies[def.id];
    var nm = lang==='pt' ? def.name_pt : def.name;
    var desc = lang==='pt' ? def.desc_pt : def.desc;
    var dateStr = '';
    if(isEarned){
      try{
        var d = new Date(earnedTrophies[def.id]);
        dateStr = d.toLocaleDateString(lang==='pt'?'pt-BR':'en-US',{day:'numeric',month:'short',year:'numeric'});
      }catch(e){}
    }
    html += '<div class="tc'+(isEarned?' earned':'')+'" onclick="openTrophyModal('+i+')">';
    html += '<div class="tcard-icon">'+def.icon+'</div>';
    html += '<div class="tcard-name">'+nm+'</div>';
    html += '<div class="tcard-desc">'+(isEarned ? (lang==='pt'?'✦ Toque para ver detalhes':'✦ Tap to view') : (lang==='pt'?'Toque para ver os requisitos':'Tap to see requirements'))+'</div>';
    if(isEarned && dateStr) html += '<div class="tcard-date">'+dateStr+'</div>';
    if(!isEarned) html += '<div class="tcard-lock">🔒</div>';
    html += '</div>';
  });
  document.getElementById('tp-list').innerHTML = html;
}

function openTrophyModal(idx){
  var def = TROPHY_DEFS[idx];
  var isEarned = !!earnedTrophies[def.id];
  var modal = document.getElementById('tp-modal');
  var bg = document.getElementById('tp-modal-bg');

  // Icon
  document.getElementById('tp-modal-icon').textContent = def.icon;

  // Badge
  var badge = document.getElementById('tp-modal-badge');
  if(isEarned){
    badge.textContent = lang==='pt' ? '✦ Desbloqueado' : '✦ Unlocked';
    badge.className = 'earned-badge';
  } else {
    badge.textContent = lang==='pt' ? '🔒 Bloqueado' : '🔒 Locked';
    badge.className = 'locked-badge';
  }

  // Name
  document.getElementById('tp-modal-name').textContent = lang==='pt' ? def.name_pt : def.name;

  // Date
  var dateEl = document.getElementById('tp-modal-date');
  if(isEarned){
    try{
      var d = new Date(earnedTrophies[def.id]);
      var ds = d.toLocaleDateString(lang==='pt'?'pt-BR':'en-US',{day:'numeric',month:'long',year:'numeric'});
      dateEl.textContent = (lang==='pt'?'Conquistado em ':'Earned on ') + ds;
    }catch(e){ dateEl.textContent = ''; }
  } else {
    dateEl.textContent = '';
  }

  // Section label and body
  var lbl = document.getElementById('tp-modal-section-lbl');
  var body = document.getElementById('tp-modal-body');
  var divider = document.getElementById('tp-modal-divider');
  var reqLbl = document.getElementById('tp-modal-req-lbl');
  var reqBody = document.getElementById('tp-modal-req-body');

  if(isEarned){
    // Primary: trivia
    lbl.textContent = lang==='pt' ? '✦ Curiosidade histórica' : '✦ Historical Trivia';
    body.textContent = lang==='pt' ? (def.trivia_pt || def.trivia || '') : (def.trivia || '');
    // Secondary: show requirements
    divider.style.display = 'block';
    reqLbl.style.display = 'block';
    reqBody.style.display = 'block';
    reqLbl.style.color = 'rgba(201,168,76,.35)';
    reqBody.style.color = 'rgba(201,168,76,.55)';
    reqLbl.textContent = lang==='pt' ? '— Como foi desbloqueado' : '— How it was unlocked';
    reqBody.textContent = lang==='pt' ? (def.hint_pt || def.hint || '') : (def.hint || '');
    // Light mode colors
    if(document.body.classList.contains('light')){
      reqLbl.style.color = '#64748b';
      reqBody.style.color = '#334155';
    }
  } else {
    lbl.textContent = lang==='pt' ? '— Como desbloquear' : '— How to unlock';
    body.textContent = lang==='pt' ? (def.hint_pt || def.hint || '') : (def.hint || '');
    divider.style.display = 'none';
    reqLbl.style.display = 'none';
    reqBody.style.display = 'none';
  }

  // Close button text
  document.getElementById('tp-modal-close').textContent = lang==='pt' ? 'Fechar' : 'Close';

  // Earned class
  modal.classList.toggle('earned-modal', isEarned);

  // Open
  bg.classList.add('open');
  modal.classList.add('open');
}

function closeTrophyModal(){
  document.getElementById('tp-modal').classList.remove('open');
  document.getElementById('tp-modal-bg').classList.remove('open');
}


// ── SETTINGS PANEL ───────────────────────────────────────────────────────

function openSettings() {
  updateSettingsUI();
  document.getElementById('settings-panel').classList.add('open');
}

function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
}

function updateSettingsUI() {
  document.getElementById('sopt-dark').classList.toggle('on', !lightMode);
  document.getElementById('sopt-light').classList.toggle('on', lightMode);
  document.getElementById('sopt-en').classList.toggle('on', lang === 'en');
  document.getElementById('sopt-pt').classList.toggle('on', lang === 'pt');
  document.getElementById('sett-theme-lbl').textContent = lang === 'pt' ? 'Tema' : 'Theme';
  document.getElementById('sett-lang-lbl').textContent = lang === 'pt' ? 'Idioma' : 'Language';
  document.getElementById('settings-title').textContent = lang === 'pt' ? '⚙ Configurações' : '⚙ Settings';
  document.getElementById('settings-close').textContent = lang === 'pt' ? 'Fechar' : 'Close';
  // settings btn is icon-only ⚙
}

function setTheme(mode) {
  lightMode = (mode === 'light');
  try { localStorage.setItem('chronos_theme', mode); } catch(e) {}
  applyTheme();
  updateSettingsUI();
}


// ── CULTURES HUB ─────────────────────────────────────────────────────────
let cultureMode='abrahamic', cultureLivesMode=true, _fromCultures=false;

function openCultures(){
  document.getElementById('intro').classList.remove('show');
  document.getElementById('cultures-screen').classList.add('show');
  cultureLivesMode = livesMode;
  document.getElementById('clo-lives').classList.toggle('active', cultureLivesMode);
  document.getElementById('clo-free').classList.toggle('active', !cultureLivesMode);
}

function closeCultures(){
  document.getElementById('cultures-screen').classList.remove('show');
  showIntro();
}

function selectCultureMode(m){
  cultureMode = m;
  document.getElementById('mc-biblical').classList.toggle('selected', m==='abrahamic');
  document.getElementById('mc-roman').classList.toggle('selected', m==='roman');
  document.getElementById('mc-eastern').classList.toggle('selected', m==='eastern');
}

function selectCultureLives(on){
  cultureLivesMode = on;
  document.getElementById('clo-lives').classList.toggle('active', on);
  document.getElementById('clo-free').classList.toggle('active', !on);
}

function startCultureGame(){
  gameMode = cultureMode;
  livesMode = cultureLivesMode;
  eraFilter = 'all';
  document.getElementById('lo-lives').classList.toggle('active', livesMode);
  document.getElementById('lo-free').classList.toggle('active', !livesMode);
  document.getElementById('cultures-screen').classList.remove('show');
  document.getElementById('intro').classList.remove('show');
  initGame();
}


// ══════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ══════════════════════════════════════════════════════════════════════════

// ── State (persisted to localStorage) ────────────────────────────────────
var _musicVol  = 40;   // 0–100
var _sfxVol    = 80;   // 0–100
var _musicMute = false;
var _sfxMute   = false;

(function _loadAudioPrefs() {
  try {
    var mv = localStorage.getItem('chronos_music_vol');
    var sv = localStorage.getItem('chronos_sfx_vol');
    var mm = localStorage.getItem('chronos_music_mute');
    var sm = localStorage.getItem('chronos_sfx_mute');
    if (mv !== null) _musicVol  = parseInt(mv);
    if (sv !== null) _sfxVol    = parseInt(sv);
    if (mm !== null) _musicMute = mm === 'true';
    if (sm !== null) _sfxMute   = sm === 'true';
  } catch(e) {}
})();

// ── Background music ──────────────────────────────────────────────────────
var _bgm = null;
var _bgmReady = false;
var _bgmFadeTimer = null;

function _initBGM() {
  if (_bgm) return;
  _bgm = new Audio(BGM_BASE64);
  _bgm.loop = true;
  _bgm.volume = _musicMute ? 0 : _musicVol / 100;
  _bgm.preload = 'auto';
  _bgm.currentTime = 3;
  _bgm.addEventListener('timeupdate', function() {
    if (_bgm.currentTime < 3) _bgm.currentTime = 3;
  });
  _bgmReady = true;
}

function playMusic() {
  _initBGM();
  if (!_bgm) return;
  _bgm.volume = _musicMute ? 0 : _musicVol / 100;
  if (_bgm.paused) {
    // _bgm.currentTime = _bgm.currentTime || 0;
    _bgm.play().catch(function() {});
  }
}

function stopMusic(fade) {
  if (!_bgm || _bgm.paused) return;
  if (!fade) { _bgm.pause(); return; }
  // Fade out over 800ms
  clearInterval(_bgmFadeTimer);
  var startVol = _bgm.volume;
  var steps = 16;
  var i = 0;
  _bgmFadeTimer = setInterval(function() {
    i++;
    _bgm.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) { clearInterval(_bgmFadeTimer); _bgm.pause(); _bgm.volume = _musicMute ? 0 : _musicVol / 100; }
  }, 50);
}

function fadeInMusic() {
  _initBGM();
  if (!_bgm) return;
  clearInterval(_bgmFadeTimer);
  _bgm.volume = 0;
  if (_bgm.paused) _bgm.play().catch(function() {});
  var target = _musicMute ? 0 : _musicVol / 100;
  var steps = 20;
  var i = 0;
  _bgmFadeTimer = setInterval(function() {
    i++;
    _bgm.volume = Math.min(target, target * (i / steps));
    if (i >= steps) clearInterval(_bgmFadeTimer);
  }, 50);
}

// ── Volume / mute controls ────────────────────────────────────────────────
function setMusicVolume(val) {
  _musicVol = parseInt(val);
  try { localStorage.setItem('chronos_music_vol', _musicVol); } catch(e) {}
  if (_bgm && !_musicMute) _bgm.volume = _musicVol / 100;
  _updateAudioUI();
}

function setSfxVolume(val) {
  _sfxVol = parseInt(val);
  try { localStorage.setItem('chronos_sfx_vol', _sfxVol); } catch(e) {}
  _updateAudioUI();
}

function toggleMusicMute() {
  _musicMute = !_musicMute;
  try { localStorage.setItem('chronos_music_mute', _musicMute); } catch(e) {}
  if (_bgm) _bgm.volume = _musicMute ? 0 : _musicVol / 100;
  _updateAudioUI();
}

function toggleSfxMute() {
  _sfxMute = !_sfxMute;
  try { localStorage.setItem('chronos_sfx_mute', _sfxMute); } catch(e) {}
  _updateAudioUI();
}

function _updateAudioUI() {
  var ms = document.getElementById('music-vol-slider');
  var ss = document.getElementById('sfx-vol-slider');
  var mb = document.getElementById('music-mute-btn');
  var sb = document.getElementById('sfx-mute-btn');
  if (ms) ms.value = _musicVol;
  if (ss) ss.value = _sfxVol;
  if (mb) { mb.textContent = _musicMute ? 'OFF' : 'ON'; mb.classList.toggle('muted', _musicMute); }
  if (sb) { sb.textContent = _sfxMute  ? 'OFF' : 'ON'; sb.classList.toggle('muted', _sfxMute);  }
}

// ── Page visibility: pause music when app backgrounds ─────────────────────
document.addEventListener('visibilitychange', function() {
  if (!_bgm) return;
  if (document.hidden) { _bgm.pause(); }
  else { _bgm.play().catch(function(){}); }
});

// ── Consolidated init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  // Theme
  applyTheme();
  // Bind ghost drag element and hand-card pointer handler
  ghost = document.getElementById('ghost');
  document.getElementById('hand-card').addEventListener('pointerdown', startDrag);
  // Keyboard shortcuts
  document.addEventListener('keydown', e => { if(e.key==='Escape'){closeFact();closeConfirm();cancelDel();} });
  document.addEventListener('touchmove', e => { if(isDragging)e.preventDefault(); }, {passive:false});
  // Set initial mode UI state
  selectMode('classic');
  updateIntroHistBtn();
});

window.addEventListener('load', function() {
  _updateAudioUI();
  // Patch updateSettingsUI to also refresh audio controls
  if (typeof updateSettingsUI === 'function') {
    var _origUpdateSettingsUI = updateSettingsUI;
    updateSettingsUI = function() {
      _origUpdateSettingsUI();
      var ml = document.getElementById('sett-music-lbl');
      var sl = document.getElementById('sett-sfx-lbl');
      var al = document.getElementById('sett-audio-lbl');
      if (ml) ml.textContent = (typeof lang !== 'undefined' && lang === 'pt') ? 'Música'  : 'Music';
      if (sl) sl.textContent = (typeof lang !== 'undefined' && lang === 'pt') ? 'Efeitos' : 'Effects';
      if (al) al.textContent = (typeof lang !== 'undefined' && lang === 'pt') ? 'Áudio'   : 'Audio';
      _updateAudioUI();
    };
  }
  // Start music on first user interaction anywhere
  function _startMusicOnce() {
    playMusic();
    SFX.init();
    document.removeEventListener('pointerdown', _startMusicOnce);
    document.removeEventListener('keydown',     _startMusicOnce);
  }
  document.addEventListener('pointerdown', _startMusicOnce);
  document.addEventListener('keydown',     _startMusicOnce);
});
