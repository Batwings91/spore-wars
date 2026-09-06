# Changelog

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
