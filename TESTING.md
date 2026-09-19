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
Mute state persists in `localStorage['640k.mute']`; save data in `localStorage['640k.sporewars.v3']`. Clear via browser devtools → Application → Local Storage to reset upgrades/cores. Existing v3 records without `rockets` migrate to Mk I pods; a fresh save starts without them.

## Rewarded ads

Run `node tools/ads-smoke.js`. It covers the SDK-free itch/dev stub, CrazyGames v3 initialization, the two allowed reward kinds, finished versus failed ads, SDK `muteAudio` changes, ad-time mute restoration and deduplicated gameplay start/stop calls.

On an ordinary hosted build (SDK environment `disabled` or script blocked), lose the fleet and use both Enter on `CONTINUE [C] / WATCH AD` and the C shortcut; Continue must happen immediately and only once. Complete a sector with cores, select `DOUBLE CORES / WATCH AD` by keyboard and touch, and verify exactly the displayed checkpoint amount is added once, persists after refresh and cannot be claimed again on that results screen. Zero-core checkpoints must show a disabled explanation.

In the CrazyGames preview, verify the game freezes and all audio mutes only after `adStarted`. A completed video grants the selected reward; `unfilled`, adblock, cooldown and Basic Launch errors show `AD UNAVAILABLE` and grant nothing. Audio and input recover after both finish and error. SDK-requested `muteAudio` must override the in-game sound/music switches. Confirm gameplay start on Launch, Continue, resume and next-sector arrival; gameplay stop on user pause, results, game over and menus; focus changes must not emit extra gameplay events.

## Local high scores

Run `node tools/highscore-smoke.js`. It covers migration from `save.best`, sanitization, top-10 ordering/capping, direct letter entry, same-run updates after Continue, persistence and the keyboard/touch/title/game-over wiring.

With an existing v3 save and no `640k.sporewars.scores.v1`, refresh and confirm the old best appears once as `---` while `save.best` is unchanged. Beat that score and lose the fleet: menu controls must be blocked by the initials modal. Type three letters or use arrow keys, then Enter; repeat with touch arrows and SAVE. The new row must lead both title and Fleet Lost tables after refresh. Continue that run, exceed the submitted score and lose again: the same initials row must update rather than duplicate or prompt again. Fill more than ten qualifying runs and confirm only the best ten remain. Also verify a campaign victory and an explicit mid-run Main Menu preserve a qualifying score through the same modal.

## Manual smoke test (do this before every commit that touches gameplay)
1. Boot screen shows DOS text, then "Press any key" (not stuck on "Loading graphics…").
2. Title: LAUNCH / WORKSHOP / SOUND buttons work by keyboard (Enter, Q, M) and by click/tap. Up/down moves the highlight; Enter on SOUND toggles mute and stays on the menu. Footer text stays inside the playfield.
2b. Esc: Workshop to title; Fleet Lost to title (touch: tap the 'main menu' line). In play, Esc pauses (bombs blocked, scene frozen); Esc/P/Space or Resume resumes; Up/Down selects Resume or Main menu; Enter activates the selection. Main menu opens exit confirmation with Keep playing selected. Esc from confirmation resumes. Only selecting Return to main menu and confirming ends the run and banks cores exactly once. Held keys and double taps must not accidentally exit.
2c. Title: hover highlights the matching button; clicking its visible rectangle activates it. Clicking the hangar or gaps does not launch. Hide menu_hangar.webp to verify the procedural title and buttons still work.
2e. HUD: verify score/best, ships, wave/boss, KILL STREAK / SCORE multiplier with next-tier kill count, all gun levels, shields and bomb counts. Check SOUND and BOMB by keyboard and touch; labels must fit their panels.
2d. Movement hint stays at the bottom edge; incoming boss notice stays at the top. Pause/game-over panels leave the scene visible. Clicking BOMB while paused spends nothing; it works after resuming.
3. Play: arrows/WASD move, auto-fire on, ship banks when moving sideways, no console errors.
4. First kill drops a `W`; pickup shows flash + slow-mo + banner.
4b. Check PULSE/TWIN/TRIPLE/SPREAD/STORM: each has a distinct white/cyan bolt shape and 1/2/3/5/6 visible mounts. Enemy fire stays visually separate. Upgrades show the level; a W at STORM gives +100 score and says GUN MAX. Losing a ship reduces the visible gun level as before.
4c. Use ?god=1&wave=5 to inspect lurkers: shaded carapace, moving tendrils and a firing organ brightening during the 25 ticks before firing. Pause freezes animation. Block lurker_body.webp to verify the original procedural fallback. With god mode off, check the visible tips match their dangerous reach.
4d. Use ?god=1&wave=8 for crawlers: head faces travel direction, hooked legs animate and amber organ brightens during a lunge. Block crawler_body.webp to verify its procedural fallback. Collision and lunge behaviour should feel unchanged.
4e. World scenery: normal start = Orbital Foundry; ?god=1&wave=5 = Infected Salvage; ?god=1&wave=10 = Spore Heart. Clear bosses 5 and 10: the next wave blends into its environment over 2.5 s and briefly names the stage at the upper edge. Pause during the blend: scenery and fade freeze. Continue retains the world; a fresh normal run returns to Foundry. Waves after 15 remain organic. Block each world_*.webp to inspect its procedural fallback. Watch a full scrolling repeat for gaps or seams; scenery is decorative and must not change collisions or obscure enemy fire.
4f. With Rocket Pods fitted, the side pods unfold and alternate small homing rockets every three seconds. Verify each pod rocket destroys the air enemy, ground fixture, boss part/hull or open Lattice node it hits; also verify expired/dead targets, no-target idle, at most two active, pause freezing and cleanup after ship loss/Continue/new run/menu. Primary gun tier does not control the pods; Seeker Orb missiles remain one-damage support fire.
5. `X` fires megabomb (screen flash, ring, bullets cleared). BOMB panel tap works on touch. New runs start at 1 / 6; pickups fill to 6 / 6, never seven, and say BOMB FULL at capacity. Firing spends one; pause blocks spending. Ordinary eligible kills have a 4% bomb chance and the 22nd eligible roll without one must force a bomb; guaranteed weapon drops do not count toward the drought. Core/shield/repair/Orb probabilities remain unchanged.
6. `?wave=4`: warning banner + siren, Battleship enters, health bar, turrets die individually (+150), phase 2 at 50%, death sequence, drops W/S/B + cores, a Level complete screen follows the reward sweep; Up/Down selects Workshop or Next level; Enter activates the highlighted option. Q/tap opens Workshop, Q/Esc or selecting Back returns to completion. Reopening the shop must not bank cores again; spending followed by Continue/death must add only new earnings. Starting gun/shield purchases remain for future runs; engine applies immediately.
6b. Battleship art: three gun mounts aim towards the player and brighten before firing; destroyed mounts become scorched sockets. Below half health, the central reactor heats up. Check gun positions against incoming player shots and emitted plasma. Block battleship_hull.webp for the original sprite, then boss_battleship.png for the procedural hull.
6c. Use ?god=1&wave=9 for the infected Mech. Its legs walk during movement and brace during the aim lock; the two muzzle cues align with the existing yellow aim lines and shot origins. Check recoil when it fires, phase-two heat and pause freezing the pose. Block mech_body.webp to restore the original normal/fire sprites, then block both boss_mech.png and boss_mech_fire.png to check the procedural fallback. Legs are decorative; collision behaviour is unchanged.
6d. Use ?god=1&wave=14 for the organic Mothership. Warning/health bar say BROOD MOTHER; instructions say DESTROY SPORE SACS then SPORE SACS RUPTURED; victory says BROOD MOTHER DEFEATED. Check that shots can reach both spore chambers, each opens before launching a scout, and each becomes a split shell when destroyed. Both destroyed bays must stop escort launches. Spine charge must accompany the existing 45-tick volley warning and two-lane safe gap. Pause freezes the animation. Block mothership_body.webp for the original sprite, then boss_mothership.png for its procedural fallback.
7. Game over → Enter restarts in under 2 s; `[C]` continue works once. Core pickups say `+1 CORE`, `+2 CORES`, `+5 CORES` or `+10 CORES` at the visible collection point; HUD adds the full value. Game over shows the saved run total and available balance; Workshop explains permanent upgrades and when cores are saved. Confirm Continue adds only newly collected cores to the balance on another death.
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

The browser suites use native WebSocket CDP by default. If Playwright is already discoverable through `NODE_PATH`, `tools/cdp-socket.js` automatically uses its pipe transport instead; this avoids a known Node/Chrome combination that opens CDP but never answers commands, without adding a project dependency.

## Release checklist
1. `node tools/build.js` (or `python3 tools/build.py` — same output) → `dist/index.html`, `dist/assets/` and `dist/CREDITS.txt`.
2. `node tools/release-audit.js` enforces the 8 MB initial-download target, exact credit coverage for every file in `assets/`, the complete runtime AI-asset disclosure, packaged credits and deferred-asset parity.
3. Serve the repository over HTTP, set `URL=http://127.0.0.1:8000/dist/index.html`, then run `node tools/smoke.js`, `node tools/campaign-smoke.js`, `node tools/world-smoke.js`, `node tools/ecosystem-smoke.js`, and `node tools/ship-smoke.js`. Also run the browser-independent `node tools/ads-smoke.js` and `node tools/highscore-smoke.js`.
4. Inspect the fresh screenshots in `tools/smoke-out/`, especially title, Fleet Lost, victory, Workshop, narrow layouts and the new high-score modal/table. Zip the contents of `dist/` with `index.html` at the archive root.
5. Commit with a version tag.

## Menu navigation consistency
Check Up/Down and W/S wrapping plus Enter selection on title, pause, exit confirmation, level complete, Workshop (including Back), and game over. Game over defaults to Retry and omits Continue once used. Confirm menu arrows do not move the ship after resuming; touch activates the corresponding visible rows.

## Salvage Exchange
Check the illustrated merchant and seven square equipment tiles at zero funds, affordable funds and maximum tiers. The grid is four columns: Primary/Shield/Engine/Rocket Pods on row one and Seeker Orb/Side Laser/Spare Ship on row two. Each tile must show enlarged product art, its next price or sale value and a focused plus Fitted/Not fitted/Max/Locked state without colour alone. Unfitted art is visibly shaded; there is no Need label. Arrow movement is spatial; Down moves into row two when present and otherwise to Back/Menu, and Up restores the last tile. Pointer/touch must use the visible tile bounds; gaps and the merchant do nothing. Block `trader_shop.webp` to verify the procedural fallback.

The seventh tile is Spare Ship. It is checkpoint-only, shows the number of spare lives, sells one for 75 cores and refuses to sell the final ship. Every purchased equipment tier can be sold down independently for half the price paid for that tier; level-zero starter hardware cannot be sold. Enter/Buy and X/Sell plus both touch buttons must change exactly one tier or life, credit/debit the shown amount, persist equipment changes and hold a visible Installed/Sold confirmation until selection changes. Selling Orb, Rocket Pods or Side Laser removes its live system safely; primary/shield sales affect the next launch. Watch the salesman for obvious breathing, periodic blinks, earring swing and claw taps in both painted and fallback views.

The lower panel must show a larger whole ship with only the candidate slot overridden. It reads Your ship from the title and Next launch from a checkpoint, since primary/shield purchases do not alter the active run. Check primary, shield, engine, rocket, side-laser and Orb candidates while other saved modules remain visible. After purchase, the panel and button must hold on Installed at the tier just bought until selection changes; a second Enter must not buy an unseen next tier. Preview rendering must not change save/current weapon/shields/rocket or laser timers/pod side. Verify affordability, purchase, duplicate/max handling and persistence plus Back/Menu, `player_hull.png` fallback, 640×360 readability and a smaller landscape viewport.

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

## Repairs and continuous hull meter
Check full green (100%), damaged amber (67%) and critical red (33%), plus an empty bar at final death. Damage/repair animates the fill; pause freezes it. Green + / REPAIR pickups heal exactly one point; full hull never overfills or adds lives. Verify core, bomb and shield drop thresholds and guaranteed weapon drops are unchanged; repair drops occur only while damaged. Existing repair drops collected at full health show HULL FULL. Confirm repair collection during boss salvage sweep, reset on new ship/new run/Continue, and unchanged saved cores.

## Sector break and travel
Clear bosses 5/10/15: results fill most of the playfield and wait indefinitely. The first default is Upgrade / Workshop. Up/Down + Enter or touch selects Upgrade / Workshop or Proceed. Workshop Menu returns to the same completed tally with Proceed selected and never re-banks cores. Proceed launches the ship, fades to the next scenery and introduces its name before arrival; no enemies, firing, damage or bomb spending during the 180-tick sequence. Test Esc/P, Enter Resume, blur, touch pause controls and mute during travel. Verify hull, shields, weapon, bombs, lives and banked cores survive; wave 6/11/16 starts after arrival with the correct world and procedural art fallback. No held menu/touch input should move the arriving ship.

## Workshop, sector identity, enemy and audio follow-up
Check title Workshop BACK versus checkpoint MENU (returns to results, never banks again). Level 2 must reveal violet scenery immediately, remain violet throughout waves 6–10, and use the same colour treatment if world_salvage is blocked; ship/projectile colours stay unchanged. Its left/right sentries and centre bunkers add asymmetrical rooted supports, sacs and integrated organic emitters without changing gameplay. Inspect Lurker body, smooth tentacles and identical tip hit positions with and without its WebP. Wave 11 introduces the Spore Ray alongside lurkers/crawlers; check its wide membrane, banking and three warm barbs after a 36-tick locked-direction tell. Verify 4HP, base score 70, projectile/rocket/beam/bomb hits, ship collision, offscreen removal, drops, pause and painted-core fallback. Compare Brood Mother warning and spawned escort sounds: no FM notes, no clipping or stuck sound, cached replay, mute/blur still silence output.

## High-tier weapons and damage verification
Inject actual enemy shots through update: two shield charges must be spent before hull falls 3→2→1, then one life is lost and a replacement starts full. A second shot during invulnerability must do no damage. Read SHIELD DOWN / HULL DAMAGED 67% / HULL CRITICAL 33% on desktop and phone. Every successful player bullet or rocket must show a brief `-1`, `-2` or `-3` at its actual impact point on normal enemies, ground units, boss hulls/turrets and open Lattice nodes; misses and beams must not flood damage text. Verify 720 fixed ticks emit 60/132/216/225/240 main projectiles for PULSE/TWIN/TRIPLE/SPREAD/STORM respectively; five/six mounts remain visible and outer spread is narrower. Pause, pickups and support rockets remain functional.

## Terrain sentries
Verify mechanical (waves 2–4), infected (6–9), biological (11+) appearances. Sentries track background displacement exactly, alternate edges and never exceed two; wave 1 and boss encounters remain free of them. Check visible charge, fixed aim during charge, single slow shots four seconds apart, no point-blank fire or shots from the bottom edge. Body flyover is safe, projectiles consume shields/hull normally. Guns, rockets and bombs destroy units once for 40 base points without new powerups; surviving sentries must not block the next aerial wave. Pause freezes scrolling/firing; Continue/new run/quit/checkpoint reset; test mobile and the procedural fallback.

## Compact adaptive music
Verify AAC decode/loop, a single looping source across worlds, and audible clear/darker/deeper mixes on waves 1/6/11. New run returns to the opening mix; Continue retains current world. Pause/menu/Workshop mute both dry and echo paths; mute persists; blur/hidden/other-tab ownership silence all output. Refresh must return to silent boot/menu. Delayed decode while paused must not make music audible. Listen across the 130.286-second boundary for a gap/click and compare compressed quality on phone speakers/headphones. Block the new file to verify existing procedural fallback. No fly.m4a request or old recording in the release folder.

## Separate music/effects and ground variety
Test all four sound/music combinations, refresh persistence, legacy muted-save migration, title Up/Down wrapping through four choices, Enter, M/N, and HUD touch rows during play/pause/travel. Effects off must retain the recorded melody and fallback drums; music off must retain explosions and silence all fallback voices. Recheck blur/tab ownership and delayed decode while music is off.
Ground units arrive every six seconds after a four-second initial delay, cap at three and alternate sides. Check single/twin emitters in each world, paired barrels/sacs with fallback art, one/two shots, 240/300-tick firing cadence, 45-tick aim warning, point-blank suppression, boss clearing and lifecycle resets. Prior two-unit/nine-second expectations are superseded.

## Foundry extension, centre bunkers and volume preview
Verify five groups in waves 1–4 /38 air enemies before Battleship, 300-tick intervals; waves 6+ unchanged. Test debug boss skip, Continue group position and pause. Ground now starts wave 1, every 210 ticks cap 5; every third spawn centred, distinct recessed appearance in all three worlds. Verify world anchoring, charge/aim, safe body flyover, gun/rocket/bomb destruction, fallback art and boss suppression.
Title audio: test percentages 0/50/100, mute separately, Left/Right/Enter/V, tap minus/level/plus/TEST, all four mute combinations and persisted volumes on refresh. Preview stops after five seconds, on Workshop/Launch, blur/hidden/ownership loss; reload stays silent. Delay music decode beyond preview expiry and block samples for fallback. Confirm actual hit and burst WAV buffers play through effects gain, and changing music volume leaves them unchanged. Listen to new samples on phone and headphones at busy combat levels.

## Salvage, wrecks and rocket presentation
Verify 45% core rolls on ordinary eligible air kills; 4% bombs with a 22-roll drought ceiling, 6%/2% shields and 4% conditional repairs; guaranteed W still takes precedence. Ground gun/rocket/bomb kills each leave exactly one wreck and roll one 50% core, including simultaneous hits. Collect/bank new cores at death/checkpoint/quit; Continue never re-banks old earnings. Check wrecks scroll at scenery speed, remain harmless, persist during boss entrance, cap 20 and clear on lifecycle resets. Ground hit marks cap at 40 and share those anchoring/pause/reset rules. Ground density builds through each stage at 210/180/150/120 ticks with 5/5/5/6 caps and no boss spawns.
At gun level 4, inspect pod opening, ready strip, alternating recoil/flash/backblast and rocket exhaust. First launch still tick 143 with a target; damage 1,120-tick reload,max 3 live rockets unchanged. Pause freezes all cues; reset removes them. Ship silhouette redesign is owned by another chat and is out of scope.

## Five-level campaign
Check all 25 waves, five world names, HUD LEVEL x/5 and wave/boss indicator. Waves15/20 introduce Seed Matriarch/Tendril Warden; final Brood Mother is25. Debug starts4/9/14/19/24 enter each boss. Check all enemy kinds, projectile finite coordinates, targetable new bosses, phase2, bombs and support rockets. New scenery is procedural staging art; existing painted/fallback art must still work.
Defeat each boss: salvage, once-only bank, then Workshop/Proceed for levels1–4. Final boss leads to persistent campaign victory with score, banked cores, Harder replay/Main menu. Arrows/Enter and both touch rectangles work; early input only finishes tally. Victory cannot auto-start wave 26. Harder replay resets run/world/cores marker and starts atwave 1 with increased HP; normal Launch resets difficulty; Continue preserves replay difficulty. Preview fromwave24 must also replay fromwave1. Verify music across five worlds/travel, silent victory and pause safety.

Automated campaign regression: `node tools/campaign-smoke.js` (server on port 8000). Exercises all 25 roster slots, world mapping, bosses/projectiles, checkpoints, final banking, replay/menu and debug finale.

## Longer levels and ground wrecks
Each non-boss wave now has two additional formations, preserving spawn intervals and enemy introductions. Foundry wrecks show torn metal, wiring, collapsed weapons and smoke; Infected Salvage combines metal with tissue and toxic leaks; later stages leave biological splats, bubbles and differently coloured ooze. Ground rendering shares the scenery pixel snap. Verify no drift or jump on hit/destruction, pause freezes every effect, and wreck/mark limits, rewards and lifecycle resets remain unchanged.

## Modular ship presentation
Run `node tools/ship-smoke.js` alongside `node tools/smoke.js`. It checks the equipment catalogue, gun mount/origin derivation, full-loadout candidate overrides, side-laser purchase/equip/save and v3 migration, beam rhythm/footprint/damage, rocket purchasing/cadence/origins, grid keyboard/touch navigation and representative screenshots. Inspect all six gun tiers, attached engines, shield emitters, purchased rocket magazines, Twin Ion Lances and Orb. Block `player_hull.png` for fallback. Check transparent hull edges, live/shop consistency, shields hit/depleted, pause and smaller-viewport sizing.

## Twin side lasers
With `sideLaser=0`, no emitter or beam may appear. Buy the 240-core side-weapon once and verify the saved title loadout and live checkpoint fit both show two modules at `SHIP_MOUNTS.sideWeapon`; duplicate and unaffordable buys spend nothing. An older v3 record without `sideLaser` must migrate to 0 without changing its other fields. In play, verify 150 recharge ticks, 48 ticks of visible aperture wind-up, 36 active ticks and a new active window every 234 ticks thereafter. During the active window the opaque 14-unit cores must align with the two apertures and damage every six ticks; translucent spill must not imply a wider collision area. Check aligned and just-outside air targets, ground sentries, boss parts/hull, piercing, kill rewards, hit flashes/sparks and pause/life/checkpoint resets. At both desktop and narrow landscape sizes, the beams must remain readable without hiding enemy silhouettes or clipping installed emitters at playfield edges.
The focused smoke capture names are `side-laser-windup`, `side-laser-active` and `side-laser-active-small`.

## Living-world encounters and first split route

Run `node tools/world-smoke.js` with the dev build served on port 8000. It asserts the four-cell painted wall-fauna sheet and fallback, cached decoration, the three-fauna cap, spore-organ tell/aim/fire cadence, snap-bloom tell/active damage, pause freezing, life/Continue/menu cleanup, terrain contact, route telegraph, mature-ship clearance, lane relocation and clean rejoin. Inspect `phase3-salvage-fauna`, `phase3-salvage-fauna-fallback`, `phase3-wilds-fauna`, `phase3-labyrinth-split`, `phase3-labyrinth-split-small` and `phase3-brood-fauna` in `tools/smoke-out/`.

Play Infected Salvage and worlds 3–5 long enough to see a dense fauna pocket, a sparse edge and a quiet/open stretch. Decorative stems/sacs must remain embedded below projectiles. Active edge enemies must use the authored violet Spitter and toothed Snap Bloom art, mirror cleanly at both walls, breathe subtly and switch to their recognisable open state before danger. Spore organs lock aim at 48 ticks and eject one slow warm globule from the visible mouth; snap blooms open for 26 ticks before their 28-tick reach. Block `wall_fauna.png` to check the procedural fallback. Check no active fauna appears in Foundry or attacks during boss/checkpoint suppression.

In Living Labyrinth wave 18, wait four seconds for the paired `SPLIT` chevrons before the central island. With the widest saved fit (side lasers installed), traverse both lanes without touching the solid stepped boundary: each lane is 168 units against the 136-unit ship-plus-margin requirement. Contact should push the ship outside the matching visible rectangle and apply one normal protected hit. Snap blooms must remain folded while the island is active. Ground fixtures and drops inside the structure must move to the nearest lane; airborne enemies, bullets, primary shots, rockets and beams overfly it and remain reachable without purchased equipment. Follow the whole structure through its fully open rejoin. Pause during tells and during the split, then verify world position, organisms and timers are unchanged. Lose a life, Continue, finish a sector and return to menu to verify organisms, seeds and terrain are cleared.

## Phase 4 creature ecosystem and Brood Lattice

Run `node tools/ecosystem-smoke.js` with Playwright available on `NODE_PATH` and the dev build served on port 8000. It asserts the six-family tables and first introductions, Ray/Rammer/Hunter movement and attacks, hunter visible/harmful tip parity, hit radii, the irregular lattice layout, 180-tick schedule, travelling pulse, tell/open windows, background-node immunity, main/rocket/side-laser/bomb damage, exactly-once score/core rewards, pause/lifecycle cleanup and the mature route-clearance regression.

Inspect `phase4-six-family-lineup`, `phase4-refined-split`, `phase4-lattice-foreshadow`, `phase4-lattice-tell`, `phase4-lattice-open`, `phase4-lattice-salvage` and the `-small` salvage capture in `tools/smoke-out/`. At roughly 40 logic pixels, the Rammer must read broad, the Hunter core-small/limb-long, the Ray wide, the Seeder bulbous, the Needle thin and the Colony clustered. Enemy shots stay warm rather than player cyan. The Lattice must look like one irregular connected organism rather than a bead grid; only the pushed-forward ivory/amber-rimmed node is targetable. Verify three core pickups appear after the third split shell and ordinary flight lanes remain open throughout. The silhouette study and exact generation prompt are documented in `docs/phase4-creature-design.md`.

## Siege upgrade and Seeker Orb
Run `node tools/ship-smoke.js` for six tier tables, Siege firing, Orb pickup versus purchased ownership, affordability/duplicate buy, reload, 180-tick launch delay, live missile cap, missing/recovered targets, life loss/Continue and pause. Test natural Orb drops from wave 6 with no Orb; an old save still defaults missing Orb ownership to 0. Confirm existing gun states and core/bomb/repair/shield probabilities stay unchanged. Check large Siege housings and the Orb at screen edges; player collision stays central.

## Earlier side support and ground aftermath
Gun-linked missile expectations here are superseded. With `rockets=0`, no gun tier may reveal pods or launch a rocket. With Mk I equipped, even Pulse must open both pods, alternate launches from `SHIP_MOUNTS.ordnance`, fire every 180 ticks, destroy the target on impact and cap at two live rockets. Verify exact remaining-health damage text, target loss/reacquisition, air/ground/boss/Lattice targets, one-damage Seeker Orb missiles, pause and lifecycle reset. Ground intervals remain 150/130/110/90 ticks with caps 6/7/8/9; wreck visuals and behavior are unchanged.

## Campaign artwork

Run node tools/campaign-smoke.js and node tools/smoke.js. Before and after drawing changes, run WAVES=6,11 node tools/perf-probe.js (PowerShell: $env:WAVES='6,11'; node tools/perf-probe.js). The probe covers painted and blocked-WebP modes; desktop timings do not establish phone performance.

- Worlds: check immediate stage identity, projectile and final-boss contrast, seams around one and two image heights, ground/wreck anchoring, paused scrolling and mobile readability. Delete the selected IMG.world_* entry and render to verify cached art cannot hide a missing-image fallback.
- Creatures: inspect Seeder, Needle and Colony at actual size, charging and during hit flashes. Check Seeder ct=44/22/0 and offscreen/bottom firing suppression. Block each body WebP to exercise its procedural branch; rendering must not mutate entities or leak canvas state.
- Bosses: use wave=14 for Matriarch and wave=19 for Warden. Inspect approach, breathing, charge, phase 2, hits and death; preserve safe-lane text exactly once. No legacy mech hit overlay or rectangular phase tint may appear. Block each body image for fallback.
- Impacts: check alpha boundaries, no tint leaking into scenery/player/UI, rapid fire, pause and performance. Mechanical hits use sparks; biological hits use puffs. Check guns, rockets and bombs, unchanged damage/rewards, and boss-to-level transitions.

See [ARCHITECTURE.md](ARCHITECTURE.md#campaign-artwork) for asset mappings and rendering contracts.
