// src/modes/keypress.js
import { getJudgement } from '../utils.js';

export default function startKeyPress({ canvas, audioScheduler, onUpdateHUD, difficulty = {}, keybinds = {}, pattern = null, debug = false } = {}) {
  const ctx = canvas.getContext('2d');
  let rafId = null;
  let cues = []; // { beatTime, spawnTime, hit, label, code }
  let score = 0;
  let combo = 0;
  let lastJudgement = '—';
  let totalJudgements = 0;
  let perfectCount = 0;
  let goodCount = 0;
  let totalOffset = 0;

  const leadTime = typeof difficulty.leadTime === 'number' ? difficulty.leadTime : 0.6;
  const beatCount = typeof difficulty.patternBeats === 'number' ? difficulty.patternBeats : 8;
  const availableLabels = Object.keys(keybinds).length ? Object.keys(keybinds) : ['A', 'S', 'D', 'F'];

  let keyHandler = null;
  let pointerHandler = null;

  function safeNow() {
    return audioScheduler && typeof audioScheduler.getCurrentTime === 'function' ? audioScheduler.getCurrentTime() : 0;
  }

  function generatePattern(startTime, count = beatCount) {
    const spb = audioScheduler && audioScheduler.secondsPerBeat ? audioScheduler.secondsPerBeat : 0.5;
    const patternData = [];
    for (let i = 0; i < count; i++) {
      const label = availableLabels[i % availableLabels.length];
      const code = keybinds[label] || `Key${label}`;
      const beatTime = startTime + i * spb;
      patternData.push({ beatTime, label, code, spawnTime: beatTime - leadTime, hit: false });
    }
    return patternData;
  }

  function spawnPattern(patternData) {
    cues = patternData.map(c => ({ ...c }));
  }

  function updateStats(diff) {
    const judgement = getJudgement(diff);
    totalJudgements += 1;
    totalOffset += Math.abs(diff);
    if (judgement.label === 'Perfect') perfectCount += 1;
    if (judgement.label === 'Good') goodCount += 1;
    if (judgement.label === 'Miss') combo = 0;
    return judgement;
  }

  function handleInput(eventTime, keyCode) {
    let nearest = null;
    let bestDiff = Infinity;

    for (const cue of cues) {
      if (cue.hit) continue;
      // allow matching by explicit code or by fallback label -> KeyX
      const expectedCodes = [cue.code, `Key${cue.label}`];
      if (!expectedCodes.includes(keyCode)) continue;
      const diff = Math.abs(eventTime - cue.beatTime);
      if (diff < bestDiff && diff <= 0.2) {
        bestDiff = diff;
        nearest = cue;
      }
    }

    if (!nearest) {
      combo = 0;
      lastJudgement = 'Miss';
      onUpdateHUD({
        score,
        combo,
        lastJudgement,
        accuracy: totalJudgements ? Math.round(((perfectCount + goodCount) / totalJudgements) * 100) : 0,
        precision: totalJudgements ? Math.round((totalOffset / totalJudgements) * 1000) : 0
      });
      return;
    }

    const diffSigned = eventTime - nearest.beatTime;
    const judgement = updateStats(diffSigned);
    nearest.hit = true;
    lastJudgement = judgement.label;

    if (judgement.points > 0) {
      score += judgement.points;
      combo += 1;
    } else {
      combo = 0;
    }

    onUpdateHUD({
      score,
      combo,
      lastJudgement,
      accuracy: totalJudgements ? Math.round(((perfectCount + goodCount) / totalJudgements) * 100) : 0,
      precision: totalJudgements ? Math.round((totalOffset / totalJudgements) * 1000) : 0
    });
  }

  function start() {
    const now = safeNow();
    const startAt = now + 0.5;
    const patternData = pattern
      ? pattern.map((offset, index) => {
          const label = availableLabels[index % availableLabels.length];
          return { beatTime: startAt + offset, label, code: keybinds[label] || `Key${label}`, spawnTime: startAt + offset - leadTime, hit: false };
        })
      : generatePattern(startAt, beatCount);

    spawnPattern(patternData);

    // attach key handler
    keyHandler = (e) => {
      if (['Space', 'Enter', 'Backspace'].includes(e.code)) return;
      const nowKey = safeNow();
      // if custom keybinds provided, only accept those codes; otherwise accept letter keys
      const allowedCodes = Object.values(keybinds).length ? Object.values(keybinds) : null;
      if (allowedCodes && !allowedCodes.includes(e.code) && !availableLabels.includes(e.key.toUpperCase())) return;
      e.preventDefault();
      handleInput(nowKey, e.code);
    };
    window.addEventListener('keydown', keyHandler);

    // attach pointer handler
    pointerHandler = (e) => {
      const nowPtr = safeNow();
      // choose nearest cue regardless of label for pointer input
      let nearest = null;
      let bestDiff = Infinity;
      for (const cue of cues) {
        if (cue.hit) continue;
        const diff = Math.abs(nowPtr - cue.beatTime);
        if (diff < bestDiff && diff <= 0.2) {
          bestDiff = diff;
          nearest = cue;
        }
      }
      if (!nearest) {
        combo = 0;
        lastJudgement = 'Miss';
        onUpdateHUD({
          score,
          combo,
          lastJudgement,
          accuracy: totalJudgements ? Math.round(((perfectCount + goodCount) / totalJudgements) * 100) : 0,
          precision: totalJudgements ? Math.round((totalOffset / totalJudgements) * 1000) : 0
        });
        return;
      }
      handleInput(nowPtr, nearest.code);
    };
    canvas.addEventListener('pointerdown', pointerHandler);

    rafId = requestAnimationFrame(render);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    if (pointerHandler) {
      canvas.removeEventListener('pointerdown', pointerHandler);
      pointerHandler = null;
    }
  }

  function render() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const now = safeNow();

    ctx.fillStyle = '#e6eef6';
    ctx.font = '18px system-ui';
    ctx.fillText('Key-Press Rhythm Trainer', 12, 24);
    ctx.font = '14px system-ui';
    ctx.fillText('Press the key shown inside the circle at the beat.', 12, 46);

    for (let i = cues.length - 1; i >= 0; i--) {
      const cue = cues[i];
      const denom = (cue.beatTime - cue.spawnTime) || 1;
      const t = (now - cue.spawnTime) / denom;

      if (now > cue.beatTime + 0.4) {
        if (!cue.hit) {
          combo = 0;
          lastJudgement = 'Miss';
          totalJudgements += 1;
          totalOffset += Math.abs(now - cue.beatTime);
          onUpdateHUD({
            score,
            combo,
            lastJudgement,
            accuracy: totalJudgements ? Math.round(((perfectCount + goodCount) / totalJudgements) * 100) : 0,
            precision: totalJudgements ? Math.round((totalOffset / totalJudgements) * 1000) : 0
          });
        }
        cues.splice(i, 1);
        continue;
      }

      const progress = Math.min(Math.max(t, 0), 1);
      const x = w * 0.1 + (1 - progress) * (w * 0.8);
      const y = h / 2;

      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fillStyle = cue.hit ? 'rgba(126,252,106,0.9)' : 'rgba(34,193,195,0.9)';
      ctx.fill();
      ctx.strokeStyle = cue.hit ? '#8de6a3' : '#72d4ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#071226';
      ctx.font = '18px system-ui';
      ctx.fillText(cue.label, x - 7, y + 7);
    }

    rafId = requestAnimationFrame(render);
  }

  return {
    start,
    stop,
    getState: () => ({
      score,
      combo,
      lastJudgement,
      cues: cues.slice(),
      totals: { totalJudgements, perfectCount, goodCount, totalOffset }
    }),
    setDebug: (v) => { debug = !!v; }
  };
}
