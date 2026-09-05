# Changelog

## 2026-09-05 — Handover build (Battleship baseline)
- Docs split: README (overview/roadmap), ARCHITECTURE, DECISIONS, TESTING, CHANGELOG, CREDITS.
- Split single-file build into index.html + assets/ + tools/build.py (dist/ is the release artefact).
- ChatGPT patch adopted: fixed 60 Hz timestep (no forced step per rAF); megabomb turret kills now award +150 and explode.
- Battleship boss every 5th wave: warning, turrets, bow fan, phase-2 sweep, death sequence, guaranteed drops.
- Six-layer parallax background (LuminousDragonGames), 256-colour master palette, Skorpio ship/alien art, Tyrian bolts/icons, chabull explosions.
- Music: "Fly" (Alexandr Zhelanov) streamed via Web Audio with tight loop. Boss track removed by request.
- Debug: ?god=1 and ?wave=N URL parameters.

## 2026-09-05 — Faster death-to-retry flow
- Accept a fresh retry press or tap immediately after game over instead of discarding input during the first half-second.

## 2026-09-05 — Opening wave progression
- Centre the first scout group and introduce diving bombers on wave 3, then aimed-fire frigates on wave 4 before the unchanged wave-5 Battleship. Enemy counts, stats, pickup rules, and wave timing are unchanged.
