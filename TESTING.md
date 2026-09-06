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
2. Title: LAUNCH / WORKSHOP / SOUND buttons work by keyboard (Enter, Q, M) and by click/tap. Up/down moves the highlight; Enter on SOUND toggles mute and stays on the menu. Footer text stays inside the playfield.
2b. Esc: Workshop to title; Fleet Lost to title (touch: tap the 'main menu' line). In play, Esc pauses (bombs blocked, scene frozen); Enter/P/click resumes; Esc again returns to title and the run's cores appear in the Workshop total exactly once.
2c. Title: hover highlights the matching button; clicking its visible rectangle activates it. Clicking the hangar or gaps does not launch. Hide menu_hangar.webp to verify the procedural title and buttons still work.
2d. Movement hint stays at the bottom edge; incoming boss notice stays at the top. Pause/game-over panels leave the scene visible. Clicking BOMB while paused spends nothing; it works after resuming.
3. Play: arrows/WASD move, auto-fire on, ship banks when moving sideways, no console errors.
4. First kill drops a `W`; pickup shows flash + slow-mo + banner.
4b. Check PULSE/TWIN/TRIPLE/SPREAD/STORM: each has a distinct white/cyan bolt shape and 1/2/3/5/6 visible mounts. Enemy fire stays visually separate. Upgrades show the level; a W at STORM gives +100 score and says GUN MAX. Losing a ship reduces the visible gun level as before.
4c. Use ?god=1&wave=5 to inspect lurkers: shaded carapace, moving tendrils and a firing organ brightening during the 25 ticks before firing. Pause freezes animation. Block lurker_body.webp to verify the original procedural fallback. With god mode off, check the visible tips match their dangerous reach.
4d. Use ?god=1&wave=8 for crawlers: head faces travel direction, hooked legs animate and amber organ brightens during a lunge. Block crawler_body.webp to verify its procedural fallback. Collision and lunge behaviour should feel unchanged.
4e. World scenery: normal start = Orbital Foundry; ?god=1&wave=5 = Infected Salvage; ?god=1&wave=10 = Spore Heart. Clear bosses 5 and 10: the next wave blends into its environment over 2.5 s and briefly names the stage at the upper edge. Pause during the blend: scenery and fade freeze. Continue retains the world; a fresh normal run returns to Foundry. Waves after 15 remain organic. Block each world_*.webp to inspect its procedural fallback. Watch a full scrolling repeat for gaps or seams; scenery is decorative and must not change collisions or obscure enemy fire.
5. `X` fires megabomb (screen flash, ring, bullets cleared). BOMB panel tap works on touch.
6. `?wave=4`: warning banner + siren, Battleship enters, health bar, turrets die individually (+150), phase 2 at 50%, death sequence, drops W/S/B + cores, waves resume.
6b. Battleship art: three gun mounts aim towards the player and brighten before firing; destroyed mounts become scorched sockets. Below half health, the central reactor heats up. Check gun positions against incoming player shots and emitted plasma. Block battleship_hull.webp for the original sprite, then boss_battleship.png for the procedural hull.
6c. Use ?god=1&wave=9 for the infected Mech. Its legs walk during movement and brace during the aim lock; the two muzzle cues align with the existing yellow aim lines and shot origins. Check recoil when it fires, phase-two heat and pause freezing the pose. Block mech_body.webp to restore the original normal/fire sprites, then block both boss_mech.png and boss_mech_fire.png to check the procedural fallback. Legs are decorative; collision behaviour is unchanged. Wave 15 retains its current Mothership artwork and cues.
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
1. `python3 tools/build.py` (or `node tools/build.js` — same bytes) → `dist/spore-wars.html`; check size (target < 8 MB for Poki; currently ~4.8 MB).
2. Open dist by double-click: assets and music load, no errors.
3. CREDITS.txt reflects every asset in `assets/`.
4. Commit with a version tag.
