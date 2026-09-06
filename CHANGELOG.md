# Changelog

## 2026-09-06 — Review fixes: collisions, audio, render loop, Battleship scaling
- A shot now hits one enemy per tick and spent shots skip the enemy loop; before, a spent shot (y=-99) could kill a scout still queued above the screen at y=-104, and a live shot hit every overlapping enemy at once.
- Lurker tentacle tips no longer explode (and play the boom) every tick while the ship is invulnerable.
- Music is ducked, not stopped, when leaving active play: pause, menus and focus changes resume the track at the same position. A late track decode starts silent if music is off. Losing window focus now pauses a live run.
- Drawing moved out of `stepLogic()` into `render()`, once per animation frame: catch-up steps on a slow device no longer triple the draw cost. `shake`/`flash` decay per logic step; the boot beep fires from `bootBeep()`.
- Balance: the Battleship's health scales with its own appearance count (waves 5/20/35), not with every boss fought. First fight unchanged at 198; second fight 364 instead of 532, which had been tougher than the second Brood Mother (480).
- Add `tools/smoke.js`, a headless Chrome regression run with no npm dependencies (see TESTING.md).

## 2026-09-06 — Match Workshop previews to fitted equipment

- Workshop tiles now show the actual ship fitted with the next tier: twin/triple gun mounts, one/two shield layers and one/two/three engine cooling bands. Preview and live equipment share renderers; prices, effects and purchase timing are unchanged.

## 2026-09-06 — Refined trader merchandise layout
- Replace text-heavy rows with compact square merchandise tiles, fitted-ship previews, smaller regular-weight type and a separate detail/purchase area. Cards select; Buy confirms a purchase. Left/Right browse products; Down selects Back from any product, Up restores the previous product.
- Give the trader backdrop a very subtle breathing-like drift, with interface elements fixed. No price or effect changes.

## 2026-09-06 — Alien salvage trader presentation
- Add an original illustrated alien salesman and salvage booth, encoded as quality-86 WebP (180,930 bytes). Retain a procedural merchant/counter fallback.
- Present existing upgrades as product cards with icons, permanent levels, exact next benefits, price and core shortfall. Match pointer regions to cards and Back; preserve keyboard navigation and all purchase rules.

## 2026-09-06 — Consistent menu keyboard navigation
- Up/Down (or W/S) moves selection and Enter activates it across title, pause, exit confirmation, level completion, Workshop and game over. Workshop Back is selectable; unavailable Continue is omitted.
- Pause now defaults to Resume; select Main menu to open the safe exit confirmation. Preserve Esc/P resume and direct shortcuts. Menu arrows no longer set ship movement keys.

## 2026-09-06 — Boss-sector completion and Workshop breaks
- End each five-wave boss sector with a safe reward sweep, then a frozen Level complete screen. Bank only newly earned cores; show the amount and spendable balance.
- Offer Workshop or Next level, with no automatic advance. Checkpoint Workshop returns to the completion screen and preserves the active run; purchases retain existing effects, explained on screen.
- Stop next-wave spawning during reward collection; clear escort/projectile hazards after boss death. Retain idempotent banking after spending, Continue and later deaths.

## 2026-09-06 — Deployable homing support rockets
- Gun level four deploys two side launchers over 24 logic ticks. Alternate one 1-damage homing rocket every 120 ticks, with at most three active, limited turning and a 180-tick lifetime. Prefer unassigned forward enemies; target an active boss when no regular enemy qualifies.
- Reuse existing shot collisions, rewards and boss part handling. Reset rockets on ship loss, Continue, menu exit and new runs; freeze updates with normal pause logic.
- First playable art is original procedural metal pods and a cached white/cyan missile; no external assets added. Main-gun balance is unchanged.

## 2026-09-06 — Controlled upper-tier weapon output
- Narrow Spread/Storm lateral projectile speeds and fire both every 14 logic ticks. Storm projectiles deal 2 damage instead of 3. Theoretical combined output becomes approximately 43/51 damage per second, versus Triple at 36.
- Preserve tiers 1–3, projectile origins/counts/forward speeds, enemy and boss stats, drops and upgrade visuals. Balance requires player validation; homing support remains a separate next step.

## 2026-09-06 — Distinct upgraded gun hardware
- Differentiate gun tiers with progressively larger metal housings, twin rails, long lance barrels, cooling fins and upper-tier cyan charge strips. Muzzles remain at existing shot origins.
- Presentation only: damage, rate, spread, pickups and enemy fire are unchanged. Rocket pods remain a separate planned addition.

## 2026-09-06 — Bomb capacity, supply and organic boss wording
- Carry up to six bombs; show the numeric inventory out of six and report BOMB FULL when a pickup cannot add stock. Still start with one.
- Halve ordinary random bomb drops from 4% to 2%; retain core/shield probabilities, guaranteed weapon timing and boss rewards.
- Rename the organic boss on screen to Brood Mother; replace launch-bay instructions with spore-sac wording. Encounter behaviour and internal identifiers are unchanged.

## 2026-09-06 — Prevent accidental exits from paused runs
- Esc/P toggle pause and resume. Enter while paused opens a confirmation with Keep playing selected; exiting requires choosing Return to main menu. Escape cancels confirmation and resumes.
- Add explicit touch buttons, ignore held confirmation keys and briefly guard touch confirmation against double taps. Clear held movement/drag input on pause changes; preserve core banking.

## 2026-09-06 — Studio branding from the master logo
- Use the 640K Games prompt wordmark (2 logic px per cell, 4 on screen) as the boot-screen banner and the title-screen studio line, and the square icon (2x) as the HUD badge. Both are transparent PNG exports of the Logo repo SVGs, added to the asset pack; the previous text renders when they are missing.
- Title footer credit reads "Illustrations: AI-assisted" now that several illustrations are AI-assisted, not just the menu. CREDITS.txt records the logo as © 640K Games, outside the CC licences.
- No gameplay, input, audio, save, balance or dist/ changes; a stale render-size comment corrected.

## 2026-09-06 — Coordinate audio between game tabs
- Opening/focusing a game copy silences other updated copies on the same origin using BroadcastChannel and a storage-event fallback. Silenced copies cannot restart audio on their next frame.
- Mute the entire audio output and suspend its context on blur/hide; close on page exit. Explicit focus or input restores ownership without changing the saved mute preference.

## 2026-09-06 — Stop music outside active play
- Start music only during active gameplay; stop it on pause, game over and menus. Stop/disconnect the recorded loop immediately and silence the synth music bus.
- Stop music and suspend audio when hidden; close the audio context on page exit/refresh. Late track decoding cannot restart a stopped loop.

## 2026-09-06 — Earlier first Workshop upgrade
- Lower the first Engine tune from 50 to 20 cores, targeting roughly two well-collected first-boss runs. Later engine tiers remain 120/190 cores; weapon/shield prices, drop rates and upgrade effects are unchanged.

## 2026-09-06 — Core currency explanation
- Identify core pickups and the run total; explain saved cores and permanent Workshop upgrades on the game-over and Workshop screens. Currency values, banking, prices and upgrade effects are unchanged.

## 2026-09-06 — Gameplay HUD presentation
- Replace heavy grey gameplay bevels with dark instrument panels, fine separators, smaller regular-weight labels and a quieter studio signature. Keep every gameplay value and existing bomb/sound touch area.
- Scope code changes to drawPanels(); no balance, input, save or timing changes.

## 2026-09-06 — Smaller illustrated assets
- Re-encoded the menu hangar, lurker and crawler as quality-90 WebP, keeping original dimensions and exact alpha. Combined artwork shrinks from 3,510,036 to 722,142 bytes (79.4% smaller).
- Compared original/compressed artwork side by side; verified transparency byte-for-byte and validated an in-memory release build. No game code or dist files changed.

## 2026-09-06 — Organic Mothership visual identity
- Add an original living carrier with a narrow armoured spine, ribbed wings and two spore chambers. Render the chambers separately from the same image at the existing launch-bay coordinates.
- Open chambers before scout launches, split their shells when destroyed, and brighten the spine before the existing volley. Preserve the safe-gap warning, hitboxes, attacks, health, escort cap and rewards.
- Retain original sprite/procedural fallbacks. Encode art as quality-86 WebP with preserved alpha; exclude the separate dist/ change.

## 2026-09-06 — Infected Mech visual identity
- Add an original pale-armoured industrial chassis invaded by alien tissue, with four articulated mechanical legs, twin aiming cannons and phase-two reactor heat.
- Brace the legs during the existing aiming pause; align charge and recoil with the existing lock and firing timers. Retain the original normal/fire sprites and procedural fallback.
- Preserve movement, attacks, hitboxes, damage, health and rewards. Encode the new body as quality-86 WebP with preserved alpha; leave dist/ unchanged.

## 2026-09-06 — Battleship visual identity
- Add an original painted industrial dreadnought hull with steel/ochre armour and a recessed reactor that heats in phase two. Encode as quality-86 WebP with preserved alpha.
- Draw aiming gun emplacements, charge cues and scorched destroyed sockets at the existing turret coordinates. Retain the original sprite and procedural fallbacks; preserve all attacks, collision bounds, health, rewards and timing.
- Leave other bosses and dist/ unchanged.

## 2026-09-05 — World progression presentation
- Add painted Orbital Foundry, Infected Salvage and Spore Heart scenery for waves 1–5, 6–10 and 11 onward. Three original AI-assisted backgrounds total approximately 675 KB using quality-82 WebP encoding.
- Fade between environments over 150 logic ticks when the existing next stage begins, with a small temporary stage heading. Reflect alternate background repeats to join edges; retain cached procedural scenery if an image fails.
- Pause freezes scenery and fades; new runs reset the presentation and debug starts select the matching world. No encounter, balance, collision, weapon or timing changes. Leave dist/ untouched.

## 2026-09-05 — Crawler artwork
- Add original segmented bronze/olive carapace art, six articulated hooked legs and an amber organ that brightens during the existing lunge.
- Mirror the drawing with its travel direction; retain the procedural fallback. Movement, lunge timing, damage and collision logic are unchanged. Encode artwork as lossless WebP.

## 2026-09-05 — Wave-six lurker artwork
- Encode the hangar and lurker as lossless WebP and support PNG/WebP in both builders. Visible pixels and alpha match the source PNGs; projected build is 8.20 MB raw / 6.10 MB gzip.
- Add an original AI-assisted armoured body with breathing motion, shaded articulated tendrils and a visible firing-organ charge.
- Align rendered tendril tips with the existing collision coordinates; retain the original procedural drawing if the image is unavailable. Health, attacks, movement and collision logic are unchanged.

## 2026-09-05 — Player weapon readability
- Give all five gun levels exclusive white/cyan bolt shapes and matching visible gun mounts and muzzle flashes. Cache procedural bolt artwork once; retain separate enemy plasma visuals.
- Show the new gun level on pickup and label maximum-level pickups as a +100 score reward. Damage, cadence, shot trajectories and pickup timing are unchanged.

## 2026-09-05 — Menu and overlay presentation
- Playtest polish: smaller regular-weight footer credits and lighter translucent panels (55% opacity).
- Add an original AI-assisted hangar illustration, live menu buttons, pointer hover and a procedural title fallback. Remove the gameplay HUD from the title screen.
- Replace central movement hints and boss warnings with compact edge notices; use translucent pause/game-over panels and a slimmer boss health display.
- Keep combat balance, the playfield, fixed timestep and saved progression unchanged.

## 2026-09-05 — Pause and touch menu review fixes
- Block megabombs while paused for pointer input as well as keyboard input.
- Clear the previous run's scene when tapping main menu after game over, matching the keyboard path.

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

## 2026-09-05 — Mothership boss
- Complete the three-boss rotation with the Mothership at waves 15, 30, 45, and onward. Reuse the existing sprite with a procedural fallback.
- Two destructible bays launch scouts with a six-escort cap. Slow volleys leave a two-lane gap marked 45 ticks before firing; phase 2 increases launch and volley frequency. Disable generic boss reinforcements for this encounter.
- Retain shared bomb damage, scoring, death rewards, Continue, and wave progression; size hull collision bounds for the larger carrier.

## 2026-09-05 — Node build script
- Add tools/build.js, a Node port of build.py with byte-identical output (verified against the committed dist/ of a9a621f). Python is not installed on the Windows dev machine, so this is the only way to regenerate dist/ there. Docs updated; debug.log (a Dropbox crash log) gitignored.

## 2026-09-05 — Title and game-over UI fixes
- Title: up/down (W/S) move the selection between LAUNCH / WORKSHOP / SOUND; Enter/Space activates it. Q and M still work as direct hotkeys.
- Esc returns to the title from the Workshop and the Fleet Lost screen (touch: a 'main menu' tap line on Fleet Lost). In play, Esc or P pauses; Enter/Space/P/click resumes; Esc again quits to the title through quitRun(), which banks cores exactly as death does. Bombs are blocked while paused.
- Returning to the title from a run now clears leftover enemies, boss, explosions and floats (clearScene()). drawField() draws the world and the title uses it as a backdrop, so they bled through; this was already reachable via Fleet Lost -> Workshop -> title and Esc made it common.
- Fleet Lost: removed the developer '(ad slot)' label from the continue line; the rewarded-ad hook is now a code comment.
- HUD: the SHIPS box no longer overflows at three lives (spacing 30 to 22); the GUN level meter is five equal pips inside its box instead of an ascending 'signal bars' staircase that poked above it.
- Title footer text is clipped to the playfield so it no longer runs over the side panels; removed credits for assets not in the game (Juhani Junkala's boss track was cut, Kenney packs are unused).
