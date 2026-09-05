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

## 2026-09-05 — Battleship readability and opening balance
- Add a bow charge ring before fan volleys and a marker for the next phase-2 sweep shot.
- Reduce the first Battleship hull health by 20%, slow its aimed turret shots from 2.6 to 2.2, and increase turret shot intervals from 110/70 to 150/100 ticks. Later Battleships, fan volleys, sweep shots, and rewards are unchanged.

## 2026-09-05 — Score kill chain
- Enemy and turret kills refresh a 240-tick chain; every third kill raises the score multiplier, capped at x4. Bomb kills count, retaining their existing base scores.
- Expiry, ship loss, Continue, and a new run reset the chain; shields preserve it. Add a HUD multiplier and countdown bar. Cores, pickups, and boss-completion bonuses remain unmultiplied.

## 2026-09-05 — Combat pressure playtest
- Add one enemy to standard waves up to the existing cap of eight, and one scout escort to lurker/crawler waves. Reduce wave minimum intervals from 150/110 to 120/90 ticks.
- Restore first-Battleship hull health to 198 at wave 5 and turret intervals to 130/85 ticks, retaining slower aimed shots and attack cues. Multiplier rules and later boss stats are unchanged.
- Keep regular weapon drops at nine kills through wave 5, then space them fifteen kills apart. Boss weapon drops restart that counter to avoid an immediate follow-up upgrade.

## 2026-09-05 — Assault Mech boss
- Add the Mech at waves 10, 25, 40, and onward in that slot of the planned three-boss rotation. Other boss waves retain the Battleship until the Mothership is added.
- The Mech moves, locks a visible aim point for 45 ticks, then fires a six-shot twin-cannon spread. Below half health it moves and attacks faster. Reuse the existing walk/fire sprites with a procedural fallback.
- Retain common bomb damage, death sequence, rewards, Continue, and wave progression; use smaller Mech collision bounds matching its sprite.
