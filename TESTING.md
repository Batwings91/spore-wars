# Testing

## Run the dev build
```
cd spore-wars
python3 -m http.server 8000
# open http://localhost:8000/index.html
```
Do **not** open `index.html` by double-clicking: `file://` blocks the music fetch (images still load). `dist/spore-wars.html` can be double-clicked because everything is inlined.

## Query-string shortcuts (dev and dist)
| Param | Effect |
|---|---|
| `?god=1` | player never takes damage |
| `?wave=N` | start at wave N (level counter = N). Bosses trigger when `(level+1)%5===0`, so `?wave=4`, `?wave=9`, `?wave=14` give an immediate boss |
| `?god=1&wave=4` | both — the standard boss-testing URL |
Mute state persists in `localStorage['640k.mute']`; save data in `localStorage['640k.sporewars.v3']`. Clear via browser devtools → Application → Local Storage to reset upgrades/cores.

## Manual smoke test (do this before every commit that touches gameplay)
1. Boot screen shows DOS text, then "Press any key" (not stuck on "Loading graphics…").
2. Title: LAUNCH / WORKSHOP / SOUND buttons work by keyboard (Enter, Q, M) and by click/tap.
3. Play: arrows/WASD move, auto-fire on, ship banks when moving sideways, no console errors.
4. First kill drops a `W`; pickup shows flash + slow-mo + banner.
5. `X` fires megabomb (screen flash, ring, bullets cleared). BOMB panel tap works on touch.
6. `?wave=4`: warning banner + siren, Battleship enters, health bar, turrets die individually (+150), phase 2 at 50%, death sequence, drops W/S/B + cores, waves resume.
7. Game over → Enter restarts in under 2 s; `[C]` continue works once.
8. Mute toggles and persists across reload.
9. Resize the window: canvas stays 16:9, integer-scaled where possible.

## Browser/device matrix
- Desktop: Chrome, Safari, Firefox (music is AAC; Firefox uses OS decoder — verify).
- iPhone (owner has an iPhone 13, Safari): touch drag, panel taps, audio starts only after first tap (iOS rule).
- High-refresh display (120/144 Hz): game speed must match a 60 Hz display (fixed timestep). Quick check: time 10 waves on each.

## Automated check used by Claude
Headless Chromium via Playwright: load page, press Enter twice, run ~40 s with `?god=1&wave=4`, capture screenshots, assert no `pageerror`/console errors. Re-create with any headless browser if needed.

## Release checklist
1. `python3 tools/build.py` → `dist/spore-wars.html`; check size (target < 8 MB for Poki; currently ~4.8 MB).
2. Open dist by double-click: assets and music load, no errors.
3. CREDITS.txt reflects every asset in `assets/`.
4. Commit with a version tag.
