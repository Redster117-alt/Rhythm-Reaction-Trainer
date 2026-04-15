# Rhythm-Reaction-Trainer

## Sprint 1 goal
Deliver a playable Beat‑Click prototype with a Web Audio timing engine, judgement logic, HUD, and a minimalist UI.

## How to run (local)
1. Clone the repo.
2. Open `index.html` in a modern desktop browser (Chrome/Edge/Firefox).
3. Click the page to start audio (required to resume AudioContext).

## Acceptance criteria
- Beat‑Click spawns cues in sync with audio using `AudioContext.currentTime`.
- Judgements: Perfect ±30ms (+300), Good ±60ms (+100), Miss otherwise (0).
- HUD shows score, combo, and last judgement.
- Mode selection UI loads and switches to Beat‑Click.

## Notes
- iOS is out of scope for the prototype due to audio autoplay restrictions.
- Use `feature/beat-click` branch for development and merge to `dev` then `main`.
