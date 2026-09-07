# Testing

## Run the dev build
```
cd spore-wars
python3 -m http.server 8000
# open http://localhost:8000/index.html
```
Do **not** open `index.html` by double-clicking: `file://` blocks the music fetch (images still load). The same applies to `dist/index.html`, whose illustrations and music are separate files: serve `dist/` over http (`node tools/serve.js` then `http://localhost:8000/dist/index.html`).

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
2b. Esc: Workshop to title; Fleet Lost to title (touch: tap the 'main menu' line). In play, Esc pauses (bombs blocked, scene frozen); Esc/P/Space or Resume resumes; Up/Down selects Resume or Main menu; Enter activates the selection. Main menu opens exit confirmation with Keep playing selected. Esc from confirmation resumes. Only selecting Return to main menu and confirming ends the run and banks cores exactly once. Held keys and double taps must not accidentally exit.
2c. Title: hover highlights the matching button; clicking its visible rectangle activates it. Clicking the hangar or gaps does not launch. Hide menu_hangar.webp to verify the procedural title and buttons still work.
2e. HUD: verify score/best, ships, wave/boss, chain meter, all five gun levels, shields and bomb counts. Check SOUND and BOMB by keyboard and touch; labels must fit their panels.
2d. Movement hint stays at the bottom edge; incoming boss notice stays at the top. Pause/game-over panels leave the scene visible. Clicking BOMB while paused spends nothing; it works after resuming.
3. Play: arrows/WASD move, auto-fire on, ship banks when moving sideways, no console errors.
4. First kill drops a `W`; pickup shows flash + slow-mo + banner.
4b. Check PULSE/TWIN/TRIPLE/SPREAD/STORM: each has a distinct white/cyan bolt shape and 1/2/3/5/6 visible mounts. Enemy fire stays visually separate. Upgrades show the level; a W at STORM gives +100 score and says GUN MAX. Losing a ship reduces the visible gun level as before.
4c. Use ?god=1&wave=5 to inspect lurkers: shaded carapace, moving tendrils and a firing organ brightening during the 25 ticks before firing. Pause freezes animation. Block lurker_body.webp to verify the original procedural fallback. With god mode off, check the visible tips match their dangerous reach.
4d. Use ?god=1&wave=8 for crawlers: head faces travel direction, hooked legs animate and amber organ brightens during a lunge. Block crawler_body.webp to verify its procedural fallback. Collision and lunge behaviour should feel unchanged.
4e. World scenery: normal start = Orbital Foundry; ?god=1&wave=5 = Infected Salvage; ?god=1&wave=10 = Spore Heart. Clear bosses 5 and 10: the next wave blends into its environment over 2.5 s and briefly names the stage at the upper edge. Pause during the blend: scenery and fade freeze. Continue retains the world; a fresh normal run returns to Foundry. Waves after 15 remain organic. Block each world_*.webp to inspect its procedural fallback. Watch a full scrolling repeat for gaps or seams; scenery is decorative and must not change collisions or obscure enemy fire.
4f. At gun level four, side pods unfold and alternate small homing rockets about every two seconds. Verify occasional scout kills, boss-part hits, expired/dead targets, no-target idle, at most three active, pause freezing and cleanup after ship loss/Continue/new run/menu. Lower gun levels do not launch.
5. `X` fires megabomb (screen flash, ring, bullets cleared). BOMB panel tap works on touch. New runs start at 1 / 6; pickups fill to 6 / 6, never seven, and say BOMB FULL at capacity. Firing spends one; pause blocks spending. Ordinary random bomb drops are 2%, with core/shield probabilities unchanged.
6. `?wave=4`: warning banner + siren, Battleship enters, health bar, turrets die individually (+150), phase 2 at 50%, death sequence, drops W/S/B + cores, a Level complete screen follows the reward sweep; Up/Down selects Workshop or Next level; Enter activates the highlighted option. Q/tap opens Workshop, Q/Esc or selecting Back returns to completion. Reopening the shop must not bank cores again; spending followed by Continue/death must add only new earnings. Starting gun/shield purchases remain for future runs; engine applies immediately.
6b. Battleship art: three gun mounts aim towards the player and brighten before firing; destroyed mounts become scorched sockets. Below half health, the central reactor heats up. Check gun positions against incoming player shots and emitted plasma. Block battleship_hull.webp for the original sprite, then boss_battleship.png for the procedural hull.
6c. Use ?god=1&wave=9 for the infected Mech. Its legs walk during movement and brace during the aim lock; the two muzzle cues align with the existing yellow aim lines and shot origins. Check recoil when it fires, phase-two heat and pause freezing the pose. Block mech_body.webp to restore the original normal/fire sprites, then block both boss_mech.png and boss_mech_fire.png to check the procedural fallback. Legs are decorative; collision behaviour is unchanged.
6d. Use ?god=1&wave=14 for the organic Mothership. Warning/health bar say BROOD MOTHER; instructions say DESTROY SPORE SACS then SPORE SACS RUPTURED; victory says BROOD MOTHER DEFEATED. Check that shots can reach both spore chambers, each opens before launching a scout, and each becomes a split shell when destroyed. Both destroyed bays must stop escort launches. Spine charge must accompany the existing 45-tick volley warning and two-lane safe gap. Pause freezes the animation. Block mothership_body.webp for the original sprite, then boss_mothership.png for its procedural fallback.
7. Game over → Enter restarts in under 2 s; `[C]` continue works once. Core pickups say +1 CORE; HUD identifies run cores for upgrades. Game over shows the saved run total and available balance; Workshop explains permanent upgrades and when cores are saved. Confirm Continue adds only newly collected cores to the balance on another death.
8. Mute toggles and persists across reload. Music starts on Launch, stops on pause/game over/menu, and restarts on resume/retry/Continue. Hide the tab: audio stops; return to active play: music resumes. Refresh during music: boot/menu stay silent. Test with the music fetch delayed or blocked: pausing before decode completes must not restart music; synth fallback must also stop.
8b. Open two updated game tabs at the same origin. Starting/focusing the second must silence the first, which must remain silent on later frames. Refocus or click the first to transfer audio back. Blur, hide, refresh and close must stop all audio from that copy. Repeat with BroadcastChannel unavailable to check storage events. Saved mute preference must remain unchanged.
9. Resize the window: canvas stays 16:9. Below 2× it scales fractionally to fill the window (a 1080p window is 1.5×, no black island); from 2× up it snaps to integer steps.
10. Branding: the boot screen prints the `C:\>640K GAMES_` banner before the (c) line, the title shows the same wordmark top-left, and the HUD bottom-right shows the square icon. Block assets/logo_prompt.png and logo_icon.png: all three fall back to text and the game still boots.

## Browser/device matrix
- Desktop: Chrome, Safari, Firefox (music is AAC; Firefox uses OS decoder — verify).
- iPhone (owner has an iPhone 13, Safari): touch drag, panel taps, audio starts only after first tap (iOS rule).
- High-refresh display (120/144 Hz): game speed must match a 60 Hz display (fixed timestep). Quick check: time 10 waves on each.

## Automated smoke test
```
node tools/smoke.js
```
Needs Node 22+ and a Chrome/Edge install (no npm packages), with the dev build served on port 8000. It drives headless Chrome over the DevTools protocol through boot → title → menu arrows → mute → play → pause → resume → quit via the confirmation → Workshop → Esc, then dies at `?wave=4` and returns to the title. Screenshots land in `tools/smoke-out/` (gitignored); exit code 1 on any page error, rAF starvation, or if the ship never dies. `URL=http://localhost:8000/dist/index.html node tools/smoke.js` tests the release build. Run it before every gameplay commit; look at the screenshots, not just the exit code.

## Release checklist
1. `node tools/build.js` (or `python3 tools/build.py` — same bytes) → `dist/index.html` + `dist/assets/`. The build prints the initial-download size (target < 8 MB for Poki; ~2.5 MB) and the deferred size.
2. Serve `dist/` over http and run `URL=http://localhost:8000/dist/index.html node tools/smoke.js`: illustrations, music, no errors. Zip the dist/ folder with index.html at the root.
3. CREDITS.txt reflects every asset in `assets/`.
4. Commit with a version tag.

## Menu navigation consistency
Check Up/Down and W/S wrapping plus Enter selection on title, pause, exit confirmation, level complete, Workshop (including Back), and game over. Game over defaults to Retry and omits Continue once used. Confirm menu arrows do not move the ship after resuming; touch activates the corresponding visible rows.

## Salvage Exchange
Check illustrated merchant and all three cards at zero funds, affordable funds and maximum upgrade levels. Select tiles with arrows or touch; Enter/Buy purchases. Clicks on the merchant or tile gaps do nothing. Check all icons, small text and steady UI during the subtle backdrop motion. Back returns to the correct menu/checkpoint. Block trader_shop.webp to verify the procedural fallback. Prices/effects must match the existing SHOP and buy logic.

Shop directional navigation: Left/Right cycle the three product tiles. Down from any tile selects Back; repeated Down stays there. Up restores the last product without changing its details. Enter activates the selection.

Equipment previews: buy each tier and confirm NEXT advances, then OWNED stays on the maximum tier. Gun previews match Twin/Triple mounts on a new run; shield previews match one/two active layers (a hit removes a layer); engines show one/two/three cooling bands per housing and update in the current run. Verify player.png fallback, insufficient funds and maximum-tier purchases.

## HUD clarity
Check LIVES and shield protection at zero, one and two charges. The taller bomb panel has six slots in two rows: only available bombs are lit, including zero and full capacity. Tap its lower row to fire; paused taps must spend nothing. Pause defaults to Resume; Enter resumes, Down selects Main menu, Enter opens confirmation, and Esc resumes without exiting. Title illustration credit stays small and third-party attribution remains visible.

## Hull health
Check three hull segments on launch. A shield hit spends only a shield. Unshielded hits reduce hull 3 → 2 → 1; another loses one life and restores hull for the replacement ship. Only ship loss drops weapon level/resets rockets. Repeated collisions during 40-tick protection and god mode do not damage hull. Final death shows empty hull; Continue/new run restores it. Checkpoints and Workshop visits preserve damage. Confirm core banking remains once per earned core.

## Bitmap text and overlays
Inspect boot, title, HUD, floating scores, boss labels, pause/confirmation, game over, sector complete and Workshop. Check uppercase/lowercase, punctuation, score alignment, long instructions and quiet credits; no system font should be used. Verify selected rows match arrows/Enter/touch and all prior click rectangles. Check desktop and landscape phone readability, full and empty hull/shields, maximum score width and illustration fallbacks.

## Victory presentation
Defeat each boss: LEVEL COMPLETE appears during the existing 200-tick salvage sweep. Pause freezes the announcement; completion fades in over 30 ticks and the banked-core display counts up over 60. Early Enter/tap/Q finishes the tally only, then a second deliberate input can choose Workshop/Next level. Returning from Workshop shows the completed tally without banking again. Check zero/new cores, keyboard and touch, and no automatic next-level launch.

Smoke driver: waits for the actual boot asset gate and checks play/pause/resume states. Set SMOKE_PORT to a free debugging port when running an isolated second test.

## Opening formations
Play a normal run: three groups per opening wave, alternate lanes, dives in wave 3 and frigates in wave 4; no early wave advance or boss warning. Track a full clear of 23 enemies; do not expect a fixed real-player completion time. Check pause freezes group timing, Continue clears existing enemies without replaying completed groups, new run resets, and ?wave=4 still gives the immediate boss. Wave 6 begins the authored infected formations. Seeded ideal tracking benchmark: warning around 40.5 seconds; this is a timing check, not a human difficulty assessment.

## Later-sector pacing
Play through from the first boss or use ?god=1&wave=5 / ?god=1&wave=10 to inspect formations (debug starts use the saved starting gun, not a carried run loadout). Verify four groups per non-boss wave, single lurker introductions, crawlers in wave 9, and biological enemies throughout waves 11–14. No more than two lurkers should coexist. Pause freezes group timers; Continue retains completed-group tracking; Workshop/checkpoint return waits for Next level. ?wave=9 and ?wave=14 still enter their boss warning immediately. Check that waves 1–4 and 16+ retain their previous formations and enemy stats.
