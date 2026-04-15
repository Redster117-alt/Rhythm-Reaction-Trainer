import { AudioScheduler } from './audio.js';
import { startBeatClick } from './modes/beatclick.js';

const canvas = document.getElementById('game-canvas');
const startBtn = document.getElementById('start-btn');
const usernameInput = document.getElementById('username');

let audioScheduler = null;
let gameInstance = null;

startBtn.addEventListener('click', async () => {
  if (!usernameInput.value) usernameInput.value = 'Player';
  // create AudioContext on user gesture
  audioScheduler = new AudioScheduler();
  await audioScheduler.init();
  // start Beat-Click mode
  gameInstance = startBeatClick(audioScheduler, canvas, {
    onUpdateHUD: updateHUD
  });
  gameInstance.start();
});

function updateHUD({ score, combo, lastJudgement }) {
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('combo').textContent = `Combo: ${combo}`;
  document.getElementById('last-judgement').textContent = `Last: ${lastJudgement}`;
}
