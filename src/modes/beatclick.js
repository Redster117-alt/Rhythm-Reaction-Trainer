export function startBeatClick(scheduler, canvas, { onUpdateHUD }) {
  const ctx = canvas.getContext('2d');
  const cues = [];
  let score = 0;
  let combo = 0;
  let lastJudgement = '—';
  const timingWindows = { perfect: 0.03, good: 0.06 }; // seconds

  // spawn visual cue slightly before beat so it arrives on beat
  const leadTime = 0.6; // seconds before beat to show cue
  const cueRadius = 28;

  function scheduleCue(beatTime) {
    const spawnTime = beatTime - leadTime;
    cues.push({ beatTime, spawnTime, hit: false });
  }

  scheduler.onBeat((beatTime) => {
    scheduleCue(beatTime);
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = scheduler.getCurrentTime();
    // draw cues
    cues.forEach((c, i) => {
      const t = (now - c.spawnTime) / leadTime; // 0..1
      if (t < 0) return;
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      const radius = cueRadius * (1 + 0.6 * (1 - t));
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // remove old cues
      if (now - c.beatTime > 1.0 && !c.hit) {
        // missed
        c.hit = true;
        lastJudgement = 'Miss';
        combo = 0;
        onUpdateHUD({ score, combo, lastJudgement });
      }
    });
    requestAnimationFrame(render);
  }

  function handleInput() {
    canvas.addEventListener('mousedown', (e) => {
      const now = scheduler.getCurrentTime();
      // find nearest unhit cue
      let nearest = null;
      let bestDiff = Infinity;
      for (const c of cues) {
        if (c.hit) continue;
        const diff = Math.abs(now - c.beatTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          nearest = c;
        }
      }
      if (!nearest) return;
      nearest.hit = true;
      if (bestDiff <= timingWindows.perfect) {
        score += 300;
        combo += 1;
        lastJudgement = 'Perfect';
      } else if (bestDiff <= timingWindows.good) {
        score += 100;
        combo += 1;
        lastJudgement = 'Good';
      } else {
        lastJudgement = 'Miss';
        combo = 0;
      }
      onUpdateHUD({ score, combo, lastJudgement });
    });
  }

  function start() {
    render();
    handleInput();
  }

  return { start };
}
