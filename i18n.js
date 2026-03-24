// ── i18n.js ──────────────────────────────────────────────────────────────
// Translations, language helpers, and all language-switching logic.
// Depends on: state.js (for lang), game.js (MODE_LABEL, MODE_DRAG_LABEL),
//             ui.js (renderTimeline, renderSideBtns, renderHistoryPanel,
//                    renderCP, renderTrophies, showFact, drawCard)
// ─────────────────────────────────────────────────────────────────────────

const ERA_COLORS={Ancient:'#c17f3a',Classical:'#3a7ab8',Medieval:'#8a4ab8',Renaissance:'#b87a3a','Early Modern':'#3ab87a',Modern:'#b83a3a',Contemporary:'#5a8ab8','Biblical':'#b8943a','Jewish History':'#d4a853'};

// ── TRANSLATIONS ──────────────────────────────────────────────────────────
const S={
en:{subtitle:'Timeline',drag_label:'Drag to place · tap placed cards to review',drop_here:'+ drop here',streak:'Streak',placed_lbl:'Placed',score:'Score',correct:'✓ Correct',wrong_earlier_close:'✗ So close! Just a little earlier',wrong_earlier_off:'✗ Not quite — a few centuries too late',wrong_earlier_far:'✗ Wrong era — place it MUCH earlier',wrong_later_close:'✗ So close! Just a little later',wrong_later_off:'✗ Not quite — a few centuries too early',wrong_later_far:'✗ Wrong era — place it MUCH later',fact_tag:'Historical Insight',review_tag:'Card Review',fp_continue:'Continue →',fp_close:'✕ Close',go_won:'Well Played',go_lost:'Time Ends',sub_won:'All cards placed!',sub_ended:'Run ended',sub_lost:'All lives lost',sub_free:'Game complete!',final_placed_lbl:'Colocadas',score:'Final Score',play_again:'Play Again',view_history:'◷ History',history_title:'Game History',hp_close:'✕ Close',no_history:'No games played yet.\nFinish a game to see it here.',cards_placed:'cards placed',tl_lbl:'Timeline built:',classic_lbl:'Classic',free_lbl:'Free',i_sub:'History Timeline Game',i_desc:'Place historical figures, events and empires in chronological order — without seeing the dates.',mc_classic_title:'Classic',mc_classic_desc:'Place people, events and discoveries in order.',lo_lives:'Lives',lo_free:'Free',mc_free_title:'Free',mc_free_desc:'No lives. Learn without pressure.',begin:'Begin',free_mode_lbl:'Free',end_title:'End this run?',end_body:'This run will count as a loss. You can save your timeline on the end screen.',keep_playing:'Keep playing',end_run:'End run',
    hp_clear_all:'✕ Clear all',
    del_one:'Delete this game from history?',
    del_all:'Delete all saved games? This cannot be undone.',
    del_cancel:'Cancel',
    del_confirm:'Delete',
    del_confirm_all:'Delete all',
    rules_label:'Rules',era_label:'Era',
    era_all:'All Ages',era_ancient:'Ancient',era_medieval:'Medieval',era_modern:'Modern',hint_lbl:'Hint',skip_earned:'💡 +1 Hint — streak bonus!',
    mc_empires_title:'Empires',mc_empires_desc:'Place empires and eras by their rise and fall.',
    empires_lbl:'Empires',drag_label_empires:'Drag to place · tap cards to review',
    span_label:'Duration',region_label:'Region',culture_label:'Culture',
    tut_title:'Empires in Parallel',tut_sub:'How to play',
    tut_s1:'Each card shows an empire, dynasty or era with its start and end dates hidden. Place it in the correct position on the timeline.',
    tut_s2:"You're sorting by start year. Place the card where it fits chronologically among what's already placed.",
    tut_s3:"After placing, you'll see the full date span — how long the empire lasted. Some overlap with others!",
    tut_s4:'Use hints (💡) to reveal contextual clues about when an empire rose or fell.',
    tut_btn:"Let's go →",
    sub_empires_won:'All empires placed!',sub_empires_lost:'The ages crumble...',
    biblical_lbl:'Biblical',mc_biblical_title:'Biblical',mc_biblical_desc:'Prophets, kings and sacred history.',mc_roman_desc:'Ancient Greece, Rome and Byzantium.',mc_eastern_desc:'Persia, China, India and Islam.',mc_back_desc:'Back to the main menu.',cultures_title:'Cultures',cultures_i_sub:'History Timeline Game',cultures_i_desc:'Explore history through the lens of specific civilizations and traditions.',mc_roman_title:'Greco-Roman',mc_eastern_title:'Eastern',mc_back_title:'Main Menu',mc_cultures_title:'Cultures',mc_cultures_desc:'Biblical, Greco-Roman &amp; Eastern modes.',
    characters_lbl:'People',mc_characters_title:'Characters',mc_characters_desc:'Order the greatest figures in history.',
    drag_label_characters:'Drag to place · tap cards to review',
    sub_characters_won:'Every great figure placed!',sub_characters_lost:'History fades from memory...',
    drag_label_biblical:'Drag to place · tap cards to review',
    drag_label_roman:'Place Greco-Roman events and figures in order — without seeing the dates',
    drag_label_eastern:'Place Eastern civilizations and figures in order — without seeing the dates',
    sub_biblical_won:'Sacred history complete!',sub_biblical_lost:'The scroll is sealed...',
    wrong_earlier_empires:'✗ Too recent — place it earlier',wrong_later_empires:'✗ Too old — place it later',tab_timelines:'📜 Timelines',tab_streak:'🔥 Streak',daily_play:'📅 Play Today\'s Challenge',daily_done:'✓ Completed Today',daily_comeback:'Come back tomorrow for a new challenge!',daily_current_streak:'Current Streak',daily_longest_streak:'Longest Streak',daily_title:'Daily Challenge'},
pt:{subtitle:'Linha do Tempo',drag_label:'Arraste para colocar · toque nas cartas colocadas para rever',drop_here:'+ soltar aqui',streak:'Sequência',score:'Pontos',correct:'✓ Correto',wrong_earlier_close:'✗ Quase! Só um pouquinho antes',wrong_earlier_off:'✗ Não foi — alguns séculos adiantado',wrong_earlier_far:'✗ Era errada — coloque BEM antes',wrong_later_close:'✗ Quase! Só um pouquinho depois',wrong_later_off:'✗ Não foi — alguns séculos atrasado',wrong_later_far:'✗ Era errada — coloque BEM depois',fact_tag:'Curiosidade Histórica',review_tag:'Rever Carta',fp_continue:'Continuar →',fp_close:'✕ Fechar',go_won:'Muito Bem',go_lost:'O Tempo Acabou',sub_won:'Todas as cartas colocadas!',sub_ended:'Partida encerrada',sub_lost:'Todas as vidas perdidas',sub_free:'Jogo completo!',final_score:'Pontuação Final',play_again:'Jogar Novamente',view_history:'◷ Histórico',history_title:'Histórico de Jogos',hp_close:'✕ Fechar',no_history:'Nenhum jogo ainda.\nTermine um jogo para vê-lo aqui.',cards_placed:'cartas colocadas',tl_lbl:'Linha do tempo:',classic_lbl:'Clássico',free_lbl:'Livre',i_sub:'Jogo de Linha do Tempo Histórica',i_desc:'Coloque figuras históricas, eventos e impérios em ordem cronológica — sem ver as datas.',mc_classic_title:'Clássico',mc_classic_desc:'Coloque pessoas, eventos e descobertas em ordem.',lo_lives:'Vidas',lo_free:'Livre',mc_free_title:'Livre',mc_free_desc:'Sem vidas. Aprenda sem pressão.',begin:'Começar',free_mode_lbl:'Livre',end_title:'Encerrar esta partida?',end_body:'Esta rodada contará como derrota. Você pode salvar sua timeline na tela final.',keep_playing:'Continuar jogando',end_run:'Encerrar partida',
    hp_clear_all:'✕ Limpar tudo',
    del_one:'Excluir este jogo do histórico?',
    del_all:'Excluir todos os jogos salvos? Isso não pode ser desfeito.',
    del_cancel:'Cancelar',
    del_confirm:'Excluir',
    del_confirm_all:'Excluir tudo',
    rules_label:'Regras',era_label:'Era',
    era_all:'Todas as Eras',era_ancient:'Antiga',era_medieval:'Medieval',era_modern:'Moderna',hint_lbl:'Dica',skip_earned:'💡 +1 Dica — bônus de sequência!',
    mc_empires_title:'Impérios',mc_empires_desc:'Posicione impérios e eras pelo seu surgimento e queda.',
    empires_lbl:'Impérios',drag_label_empires:'Arraste para colocar · toque nas cartas para rever',
    span_label:'Duração',region_label:'Região',culture_label:'Cultura',
    tut_title:'Impérios em Paralelo',tut_sub:'Como jogar',
    tut_s1:'Cada carta mostra um império, dinastia ou era com suas datas de início e fim ocultas. Coloque-a na posição correta na linha do tempo.',
    tut_s2:'Você está ordenando pelo ano de início. Coloque a carta onde ela se encaixa cronologicamente entre as já colocadas.',
    tut_s3:'Após colocar, você verá o intervalo completo — quanto tempo o império durou. Alguns se sobrepõem!',
    tut_s4:'Use dicas (💡) para revelar pistas contextuais sobre quando um império surgiu ou caiu.',
    tut_btn:'Vamos lá →',
    sub_empires_won:'Todos os impérios colocados!',sub_empires_lost:'As eras desmoronam...',
    biblical_lbl:'Bíblico',mc_biblical_title:'Bíblico',mc_biblical_desc:'Profetas, reis e história sagrada.',mc_roman_desc:'Grécia Antiga, Roma e Bizâncio.',mc_eastern_desc:'Pérsia, China, Índia e Islã.',mc_back_desc:'Voltar ao menu principal.',cultures_title:'Culturas',cultures_i_sub:'Jogo de Linha do Tempo Histórica',cultures_i_desc:'Explore a história através de civilizações e tradições específicas.',mc_roman_title:'Greco-Romano',mc_eastern_title:'Oriental',mc_back_title:'Menu Principal',mc_cultures_title:'Culturas',mc_cultures_desc:'Modos Bíblico, Greco-Romano e Oriental.',
    characters_lbl:'Pessoas',mc_characters_title:'Personagens',mc_characters_desc:'Ordene as maiores figuras da história.',
    drag_label_characters:'Arraste para colocar · toque nas cartas para rever',
    sub_characters_won:'Todas as grandes figuras colocadas!',sub_characters_lost:'A história se apaga da memória...',
    drag_label_biblical:'Arraste para colocar · toque nas cartas para rever',
    drag_label_roman:'Coloque eventos e figuras greco-romanas em ordem — sem ver as datas',
    drag_label_eastern:'Coloque civilizações e figuras orientais em ordem — sem ver as datas',
    sub_biblical_won:'História sagrada completa!',sub_biblical_lost:'O pergaminho é selado...',
    wrong_earlier_empires:'✗ Muito recente — coloque antes',wrong_later_empires:'✗ Muito antigo — coloque depois',tab_timelines:'📜 Partidas',tab_streak:'🔥 Sequência',daily_play:'📅 Jogar Desafio de Hoje',daily_done:'✓ Concluído Hoje',daily_comeback:'Volte amanhã para um novo desafio!',daily_current_streak:'Sequência Atual',daily_longest_streak:'Maior Sequência',daily_title:'Desafio Diário'}
};
const t=k=>S[lang][k]||k;
const cName=c=>lang==='pt'?c.name_pt:c.name;
const cCat=c=>lang==='pt'?c.cat_pt:c.cat;
const cHint=c=>lang==='pt'?c.hint_pt:c.hint;
const cFact=c=>{const pool=lang==='pt'?c.facts_pt:c.facts;return pool[Math.floor(Math.random()*pool.length)];};
const cClues=c=>lang==='pt'?c.clues_pt:c.clues;
const formatYear=y=>y<0?`${Math.abs(y)} ${lang==='pt'?'a.C.':'BCE'}`:`${y} ${lang==='pt'?'d.C.':'CE'}`;

// Show intro history link if there are saved games
window.addEventListener('DOMContentLoaded',()=>{
  // intro-btns visibility depends on saved data
  const btns=document.getElementById('intro-btns');if(btns&&(gameHistory.length||discoveredCards.size))btns.style.display='flex';
});

// ── INTRO ─────────────────────────────────────────────────────────────────
function setLang(l,btn){
  lang=l;
  try{localStorage.setItem('chronos_lang',l);}catch(e){}
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  _applyAllTranslations();
}

function setLangSetting(l) {
  setLang(l);
  updateSettingsUI();
}

function _applyAllTranslations() {
  // Re-run the body of setLang without needing a button element
  var transIds = [
    ['i-sub','i_sub'],['i-desc','i_desc'],
    ['mc-classic-title','mc_classic_title'],['mc-classic-desc','mc_classic_desc'],
    ['mc-empires-title','mc_empires_title'],['mc-empires-desc','mc_empires_desc'],
    ['mc-characters-title','mc_characters_title'],['mc-characters-desc','mc_characters_desc'],
    ['mc-biblical-title','mc_biblical_title'],['mc-biblical-desc','mc_biblical_desc'],['mc-roman-desc','mc_roman_desc'],['mc-eastern-desc','mc_eastern_desc'],['mc-back-desc','mc_back_desc'],['cultures-title','cultures_title'],['cultures-i-sub','cultures_i_sub'],['cultures-i-desc','cultures_i_desc'],['mc-roman-title','mc_roman_title'],['mc-eastern-title','mc_eastern_title'],['mc-back-title','mc_back_title'],['mc-cultures-title','mc_cultures_title'],['mc-cultures-desc','mc_cultures_desc'],
    ['era-label','era_label'],
    ['ec-all','era_all'],['ec-ancient','era_ancient'],
    ['ec-medieval','era_medieval'],['ec-modern','era_modern'],
    ['rules-label','game_mode_lbl'],
  ];
  transIds.forEach(function(p) {
    var el = document.getElementById(p[0]);
    if (el && t(p[1]) !== p[1]) el.textContent = t(p[1]);
  });
  // Intro sub-buttons
  var hb = document.getElementById('intro-hist-btn');
  if (hb) hb.textContent = lang === 'pt' ? '📜 Histórico' : '📜 History';
  var cb = document.getElementById('intro-comp-btn');
  if (cb) cb.textContent = lang === 'pt' ? '📚 Compêndio' : '📚 Compendium';
  var tb = document.getElementById('intro-trophy-btn');
  if (tb) tb.textContent = lang === 'pt' ? '🏆 Troféus' : '🏆 Trophies';
  var bb = document.getElementById('start-btn');
  if (bb) bb.textContent = t('begin');
  // Main hub lives/free
  var lb = document.getElementById('lo-lives-lbl');
  if (lb) lb.textContent = t('lo_lives');
  var fb = document.getElementById('lo-free-lbl');
  if (fb) fb.textContent = t('lo_free');
  // Cultures hub elements
  var cll = document.getElementById('clo-lives-lbl');
  if (cll) cll.textContent = t('lo_lives');
  var cfl = document.getElementById('clo-free-lbl');
  if (cfl) cfl.textContent = t('lo_free');
  var csb = document.getElementById('cultures-start-btn');
  if (csb) csb.textContent = t('begin');
  var chh = document.getElementById('cult-hist-btn');
  if (chh) chh.textContent = lang === 'pt' ? '📜 Histórico' : '📜 History';
  var chc = document.getElementById('cult-comp-btn');
  if (chc) chc.textContent = lang === 'pt' ? '📚 Compêndio' : '📚 Compendium';
  var cht = document.getElementById('cult-trophy-btn');
  if (cht) cht.textContent = lang === 'pt' ? '🏆 Troféus' : '🏆 Trophies';
  // Streak tab re-render if open
  if (document.getElementById('history-panel').classList.contains('open') && _hpTab === 'streak') {
    renderStreakTab();
  }
  // Tab labels
  var _tl = document.getElementById('hp-tab-timelines');
  var _ts = document.getElementById('hp-tab-streak');
  if (_tl) _tl.textContent = t('tab_timelines');
  if (_ts) _ts.textContent = t('tab_streak');
  // ── Refresh active game UI immediately on language change ────────────
  if(gameActive){
    // In-game stat labels
    var _hdrm=document.getElementById('hdr-mode');
    if(_hdrm)_hdrm.textContent=_isDailyChallenge?t('daily_title'):t(MODE_LABEL[gameMode]||'subtitle');
    var _stlbl=document.getElementById('streak-lbl');if(_stlbl)_stlbl.textContent=t('streak');
    var _sclbl=document.getElementById('score-lbl');if(_sclbl)_sclbl.textContent=t('score');
    var _pllbl=document.getElementById('placed-lbl');if(_pllbl)_pllbl.textContent=t('placed_lbl');
    var _btlbl=document.getElementById('bottom-label');
    if(_btlbl)_btlbl.textContent=t(MODE_DRAG_LABEL[gameMode]||'drag_label');
    // Hand card
    if(currentCard){
      var _iv=currentCard.startYear!==undefined;
      var _hcn=document.getElementById('hc-name');if(_hcn)_hcn.textContent=cName(currentCard);
      var _hcc=document.getElementById('hc-cat');if(_hcc)_hcc.textContent=_iv?cCulture(currentCard):cCat(currentCard);
      var _hch=document.getElementById('hc-hint');if(_hch)_hch.textContent=cHint(currentCard);
      var _gn=document.getElementById('g-name');if(_gn)_gn.textContent=cName(currentCard);
      var _gc=document.getElementById('g-cat');if(_gc)_gc.textContent=_iv?(cCulture(currentCard)||''):cCat(currentCard);
      // Refresh active clue if one is showing
      var _clueEl=document.getElementById('hc-clue');
      if(_clueEl&&_clueEl.classList.contains('show')&&cardCluesUsed>0){
        var _cluePool=lang==='pt'?currentCard.clues_pt:currentCard.clues;
        if(_cluePool&&_cluePool[cardCluesUsed-1])_clueEl.textContent='💡 '+_cluePool[cardCluesUsed-1];
      }
    }
    // Timeline placed cards
    renderTimeline();
    // Hint/skip button labels
    renderSideBtns();
  }
  // Gameover screen if showing
  if(document.getElementById('gameover').classList.contains('show')){
    // Re-translate won/lost title by checking which key currently applies
    var _goTitleEl=document.getElementById('go-title');
    if(_goTitleEl){
      var _curTitle=_goTitleEl.textContent;
      var _wonEn=S.en.go_won;var _wonPt=S.pt.go_won;
      var _wasWon=(_curTitle===_wonEn||_curTitle===_wonPt);
      _goTitleEl.textContent=_wasWon?t('go_won'):t('go_lost');
    }
    var _goscl=document.getElementById('go-score-lbl');if(_goscl)_goscl.textContent=t('final_score');
    var _goag=document.getElementById('go-again-btn');if(_goag)_goag.textContent=t('play_again');
    var _gosv=document.getElementById('go-save-btn');
    if(_gosv&&!_gosv.disabled)_gosv.textContent=lang==='pt'?'💾 Salvar Timeline':'💾 Save Timeline';
  }
  // Re-render open panels so dynamic content updates with new language
  if(document.getElementById('fact-panel').classList.contains('open')&&_currentFactCard){
    showFact(_currentFactCard,reviewMode);
  }
  if(document.getElementById('history-panel').classList.contains('open')){
    renderHistoryPanel();
  }
  if(document.getElementById('cp').classList.contains('open')){
    var _cpt=document.getElementById('cp-title');
    if(_cpt)_cpt.textContent=lang==='pt'?'📚 Compêndio':'📚 Compendium';
    var _cpc=document.getElementById('cp-close');
    if(_cpc)_cpc.textContent=lang==='pt'?'✕ Fechar':'✕ Close';
    renderCP();
  }
  if(document.getElementById('tp').classList.contains('open')){
    var _tpt=document.getElementById('tp-title-txt');
    if(_tpt)_tpt.textContent=lang==='pt'?'🏆 Troféus':'🏆 Trophies';
    var _tpc=document.getElementById('tp-close');
    if(_tpc)_tpc.textContent=lang==='pt'?'✕ Fechar':'✕ Close';
    renderTrophies();
  }
}

