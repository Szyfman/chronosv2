// state.js
var lang = 'en'; // move this from i18n.js if you already put it there

var gameMode = 'classic';
var livesMode = true;
var eraFilter = 'all';
var empiresShownTutorial = false;

var deck = [];
var timeline = [];
var currentCard = null;

var score = 0;
var streak = 0;
var lives = 3;
var hints = 3;
var skip = 1;
var gameActive = false;
var cardCluesUsed = 0;

var isDragging = false;
var currentDropZone = null;

var reviewMode = false;

var gameHistory = [];
try { gameHistory = JSON.parse(localStorage.getItem('chronos_history') || '[]'); } catch(e) {}

var discoveredCards = new Set();
try {
  var _dc = JSON.parse(localStorage.getItem('chronos_discovered') || '[]');
  _dc.forEach(function(n){ discoveredCards.add(n); });
} catch(e) {}

function saveDiscovered() {
  try { localStorage.setItem('chronos_discovered', JSON.stringify([...discoveredCards])); } catch(e) {}
}
