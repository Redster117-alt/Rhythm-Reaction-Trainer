// src/audioKeyPress.js
// Dedicated key press beat audio for the rhythm game.

export function playKeyPressBeat(audioCtx, time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.value = 660;

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1600, time);
  filter.Q.setValueAtTime(8, time);

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.14);
}
