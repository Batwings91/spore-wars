# Architecture

No framework, no bundler. The game code is plain classic scripts in `src/`, loaded by `index.html` in this fixed order (each file is a contiguous slice of the old single IIFE, so top-level initialisers only depend on earlier files; top-level `let`/`const` are shared across the scripts just as they were inside the IIFE):

| File | Contents |
|---|---|
| `src/core.js` | Canvas, scaling, asset loading, debug params, palette and the pixel-sprite helpers. |
| `src/sprites.js` | Procedural fallback sprites: player ship, flames, the three basic enemies, explosion frames. |
| `src/weapons.js` | Player bolts, gun mounts, and the gun-level-four homing rockets. |
| `src/scene.js` | Enemy plasma, pickups, shield ring, core icon, background tile, stars, the three worlds, and the bevel/keycap/txt primitives. |
| `src/audio.js` | SFX: synthesised 8-bit effects, OPL-style fallback music, streamed main track, mute, tab audio ownership. |
| `src/input.js` | Save data, keyboard, pointer/touch handlers, pause-on-blur. |
| `src/game.js` | Run state, kill chain, newRun, guns, wave spawning. |
| `src/bosses.js` | Battleship, Mech and Brood Mother: update, bombs, illustrated and fallback drawing, health bar. |
| `src/play.js` | Gameplay update(): collisions, drops, pickups, bombs; enemy/ship drawing and drawField(). |
| `src/screens.js` | HUD panels, play scene, boot, title, pause, game over, sector complete and Workshop screens. |
| `src/main.js` | Run transitions (clearScene/quitRun/continueRun), the fixed-step loop, stepLogic() and render(). |

Dev needs no build step. `tools/build.js` inlines the files into `dist/index.html` for release. Add new code to the file whose topic fits; add a new file only by appending a `<script src>` tag after the files it depends on.

## Systems
- **Resolution:** logic runs in a 640×360 space (`LW,LH`), rendered at 1280×720 (`K=2`, `X(v)` converts). Playfield is `PX..PX+PW` (100..540 logic) with bevelled HUD panels either side. 16:9 is mandatory for Poki/CrazyGames. Portrait/phone-upright layout is a wanted future feature.
- **Loop:** fixed 60 Hz `stepLogic()` via accumulator (max 3 catch-ups per rAF). `stepLogic()` is logic and input only; `render()` draws once per animation frame (and only when at least one step ran), so catch-up steps never multiply draw cost. Per-step effect decay (`shake`, `flash`) lives in stepLogic, and the boot beep fires from `bootBeep()`, never from a draw call.
- **Sector checkpoints:** Boss defeat sets `sectorPending`, clears combat hazards and gathers remaining drops during the existing 200-tick recovery. `completeSector()` banks `cores - bankedCores`, updates the gross-earnings marker, and enters `sector`. Workshop uses `shopFromSector` to return without clearing the run; only explicit Next level resumes. Existing starting upgrades apply on future runs; engine speed updates immediately.
- **Modes:** `boot` (DOS-style boot screen; waits for assets) → `title` → `play` ↔ `dead`, `shop` (Workshop, spends banked cores). `paused` is a flag inside `play` (Esc/P, or the window losing focus): `update()` is skipped, `pauseScreen()` overlays the frozen scene; `quitRun()` exits to title and banks cores like death does. Esc/P resume paused play; Up/Down and Enter select Resume or Main menu. Main menu opens an exit confirmation defaulting to Keep playing, with explicit keyboard/touch selection required to exit.
- **Assets:** Core PNG sprites gate the boot screen; the large WebP illustrations (the `ASSET_EXT` set) load in the background and every draw site falls back until they arrive. In `dist/` the sprites are inlined and the illustrations plus music are separate files under `dist/assets/`. `IMG[name]` single images, `STRIP[name]={img,n,w,h}` animation strips; helpers `img(name,x,y,scale,alpha)` and `strip(name,frame,x,y,scale)`. Every asset has a procedural fallback (the old hand-drawn sprites) so the game never breaks on a missing image.
- `ASSET_EXT` selects WebP for new illustrated sprites; other images use PNG. Both release builders inline either format using its correct MIME type. Hangar, lurker and crawler use quality-90 WebP at original dimensions with exact alpha preservation; colour encoding is lossy.
- **Entities:** `enemies[]` with `k`: 0 scout (drift), 1 bomber (dive), 2 frigate (aimed plasma), 3 lurker (procedural tentacles, from wave 6), 4 crawler (procedural hooks, from wave 9). `R[k]` = collision radii. `shots[]` (player, carries `g` gun level and `dmg`), `eshots[]` (`blue:true` = lurker/boss bow), `drops[]` (`k`: core/w/s/b), `booms[]` (strip explosions or spark particles), `floats[]`, `rings[]`.
- **Lurker art:** `drawLurkerArt()` uses `IMG.lurker_body`, subtle breathing, shaded tendrils and a charge cue driven by `e.ct`. Tendril endpoints match the existing tip collision expression. Missing art uses the original `drawLurker()` with its original scaling.
- **Crawler art:** `drawCrawlerArt()` uses `IMG.crawler_body`, procedural legs, and an amber lunge cue driven by `e.lunge`. The local drawing mirrors with `e.dir`. Missing art uses the original `drawCrawler()` and scale. Legs are cosmetic; existing body collision remains authoritative.
- **World presentation:** Foundry (waves 1–5), Infected Salvage (6–10), Spore Heart (11 onward). `updateWorld()` follows the existing level counter and fades scenery over 150 logic ticks; it does not alter encounters. `resetWorld()` handles new runs and debug starts; Continue retains the current presentation. Painted `world_*` WebP backgrounds reflect alternate vertical repeats to join their edges. Three cached procedural tiles provide per-world fallbacks without consuming gameplay RNG. Scenery scroll and transitions freeze on pause. Stage names briefly appear at the upper edge, suppressed during boss notices.
- **Guns:** `GUN[0..4]` PULSE/TWIN/TRIPLE/SPREAD/STORM with dmg 1/1/2/2/2. Spread/Storm fire every 14 logic ticks with narrowed fans. New gun on first kill, then every ~9 kills (`dropFor`). Dying drops one gun level.
- **Weapon visuals:** `BOLT[0..4]` caches original white/cyan procedural projectiles at startup. `GUN_PORTS` and `drawGunMounts()` draw 1/2/3/5/6 mounts matching existing shot origins. Enemy plasma uses its separate sprites/fallbacks. Legacy bolt PNGs remain packaged but are no longer drawn.
- **Support rockets:** At gun level 4+, `updateRockets()` deploys side pods and adds marked entries to `shots`, reusing ordinary hit detection. 120-tick launch cadence, damage 1, maximum 3 active, 180-tick lifetime and capped steering. Targets are live forward enemies or an entered boss; one reacquisition is allowed. `resetRockets()` clears support state at run/ship-loss/Continue/menu boundaries. Art is procedural and cached.
- **Megabomb:** `fireBomb()` — X/B/Shift or tap the BOMB panel. 6 dmg to all enemies, clears bullets, 25 to boss hull + 8 to turrets. Max 6, start with 1. Gold `B` capsule adds one (BOMB FULL at capacity). Ordinary random bomb drops are 2%; core/shield probabilities and boss rewards are unchanged.
- **Boss:** `boss` object; `startBossWarning()` → `spawnBoss()` → `updateBoss()`/`drawBoss()`. The rotation is Battleship (5, 20...), Mech (10, 25...), Brood Mother / Mothership (15, 30...). Mothership uses updateMothership(): destructible launch bays, at most six scouts, and volleys with a marked two-lane gap. Mech uses updateMech() for movement, 45-tick aim lock, and twin-cannon spreads. Phase 2 below 50% HP. Death sequence `bossDying` countdown. Bosses every 5th wave, HP scales with `bossCount`/`level`.
- **Battleship art:** `drawBattleshipHull()` renders `battleship_hull.webp` at 160×120 logic units around the existing hull bounds. `drawBattleshipTurret()` places rotating gun mounts and destroyed sockets at the unchanged turret coordinates. Charge follows `tu.ct`; reactor heat follows phase two. Original Battleship PNG and procedural hull remain fallbacks.
- **Mech art:** `drawMechArt()` renders an infected chassis with four cosmetic articulated legs. The gait eases into a braced pose during the existing 45-tick aim lock. Cannon emitters remain at `b.x +/- 40, b.y + 18`; their aim uses the existing locked target, and recoil follows `fireFlash`. No presentation state changes the encounter. Missing `mech_body.webp` retains the original normal/fire sprites and procedural fallback.
- **Mothership art:** `drawMothershipArt()` and `drawMothershipBay()` render a biological carrier from regions of `mothership_body.webp`. `MOTHER_ART` contains source pixel coordinates for its 1060×1484 image; update them if resampling the asset. The spine retains the existing tall hull footprint; separate chamber drawings stay at the original bay positions. Chamber opening follows `ct`, spine charge follows `volT`, and destroyed shells split. All encounter logic and the existing safe-gap cue are unchanged; the original sprite and procedural fallback remain available.
- **Audio (`SFX`):** all effects synthesised (rendered to 8-bit 11 kHz buffers = "Sound Blaster digitised" feel; explosions are layered filtered noise, deliberately no tonal component). Music: `TR.main` streamed from `MAIN_TRACK` via Web Audio BufferSource with trailing-silence trim + loop; an OPL-style synth loop is the fallback. `music(false)` ducks the recorded loop's gain instead of stopping it, so pause, menus and focus changes resume at the same position; `play()` starts silent when music is off (late decode). Music is enabled only for visible, unpaused play in the current audio-owning tab. BroadcastChannel plus storage events coordinate updated copies on the same origin; blur silences all output until focus/input reacquires ownership. Hiding the page stops music and suspends audio; pagehide closes the context. `bossTheme()` exists but is a no-op (boss track removed by owner: "didn't mix"). `M` / SOUND panel toggles mute (persisted).
- **Save:** `localStorage['640k.sporewars.v3']` = {cores,best,weapon,shield,engine}.
- **Input:** arrows/WASD, auto-fire (Space also fires); touch = drag anywhere to move, tap panels. `TOUCH` hides keycap hints. Keyboard hints render as keycaps via `keycap()`.

## Art rules (owner is particular about these)
- Look: **mid-90s VGA** (smooth 256-colour shading, light dither), not 8-bit chunky. A 256-colour master palette (`docs/palette256.json`) was built from the art; UI colours pinned. Nebula uses its own 64-colour range; green bolt / blue plasma got their own small ranges (the master palette is red/grey heavy).
- Pipeline for new sprites: crop → resize LANCZOS to target width × 4/3 → quantize to palette, no dither → 1px dark outline (`#0c0e1a`). Explosions: alpha → ordered dither to 1-bit, fire palette.
- Sizes at 1280 render: player 123 px wide; scout 67, bomber 77, frigate 88, cruiser 101, destroyer 112, heavycruiser 128; battleship 253, mech 227, mothership 400.
- UI: bevelled steel panels (`bevel()`), Xenon-2 style. Owner wants the menu "super slick"; a real bitmap font and hand-drawn logo are the obvious next upgrades.
- Title presentation: `menu_hangar` illustration with a procedural fallback, live text and buttons. `TITLE_BUTTONS` supplies both draw bounds and pointer hit areas. `glassPanel()` provides translucent overlays; combat notices stay near the field edges. Gameplay HUD panels use dark flat surfaces, fine separators and regular-weight labels; bomb and sound hit areas retain their original coordinates.

## Where things live (search these identifiers in index.html)
| System | Identifiers |
|---|---|
| Asset loading | `ASSET_DATA`, `IMG`, `STRIP`, `img()`, `strip()`, `assetsReady` |
| Main loop | `frame()`, `stepLogic()`, `render()`, `bootBeep()` |
| Player | `ship`, `spd()`, `hitShip()`, `drawShip()`, `GUN`, `MAXW`, `fireT` |
| Enemies | `spawnWave()`, `enemies`, `R`, `drawLurker()`, `drawCrawler()` |
| Boss | `startBossWarning()`, `spawnBoss()`, `updateBoss()`, `drawBoss()`, `bombBoss()`, `updateMech()`, `updateMothership()`, `drawMechFallback()`, `drawMothershipFallback()`, `bossWarn`, `bossDying`, `bossCount` |
| Projectiles | `shots`, `eshots`, `BOLT`, `PLASMA` |
| Pickups/economy | `drops`, `dropFor()`, `pickupEvent()`, `save`, `persist()`, `SHOP`, `buy()` |
| Megabomb | `fireBomb()`, `bombs`, `bombFx` |
| Effects | `booms`, `boom()`, `floats`, `addFloat()`, `rings`, `shake`, `flash`, `slow` |
| Background | `WORLDS`, `WORLD_TILES`, `drawWorld()`, `updateWorld()`, `resetWorld()`, `drawWorldNotice()`; original px_* / `BG` retained as fallback |
| HUD/UI | `drawPanels()`, `bevel()`, `keycap()`, `txt()`, `titleScreen()`, `deadScreen()`, `shopScreen()`, `bootScreen()` |
| Audio | `SFX` (IIFE): `pcm()`, `opl()`, `explosion()`, `TR`, `loadTrack()`, `select()`, `music()`, `bossTheme()`, `toggleMute()` |
| Input | `keys`, `KEYMAP`, `ptr`, `tapped`, `tapSrc`, `TOUCH`, `titleSel`, `paused` |
| Debug | `DBG`, `GOD`, `STARTWAVE` |

## Trader presentation
shopScreen draws trader_shop.webp with a procedural merchant fallback. The three existing upgrades use square tiles (x292 + 110 per item, y82..198, width102). Tiles select; Buy (x292..500, y298..330) purchases and Back (x510..614, same y) returns. drawEquipmentPreview uses the actual player sprite/fallback and shared drawGunMounts, drawShieldLayers and drawEngines renderers. Tiles show the next purchasable tier, or the owned maximum. Engine housings/exhaust are cosmetic and follow save.engine. The backdrop subtly scales around the merchant while UI remains fixed. Keyboard ordering and purchase logic are unchanged. Product copy shows permanent ownership, next effect and shortfall.

## Player hull
ship.hull starts at MAX_HULL (3). hitShip consumes shields before hull, grants 40 logic ticks of protection after nonfatal hull damage, and uses the existing ship-loss path only at zero hull. Remaining lives spawn with full hull; final death retains zero. New runs and Continue restore hull; sector/Workshop transitions preserve it. Hull is run state and is not persisted in the upgrade save.

## Bitmap text
UI_GLYPHS in scene.js extends the studio Logo 5x7 font to printable ASCII. txt caches up to 128 coloured text strips, scales them without smoothing and handles left/centre/right alignment. Screen labels and merchandise copy use this renderer too. menuChoice draws existing option rectangles without changing input bounds.

## Victory presentation
drawVictorySweep uses 200-waveT during sectorPending. sectorScreen uses its mode timer for a 30-tick reveal and 60-tick cosmetic core tally; real banking still happens once in completeSector. Early Enter/tap/Q completes the reveal without activating an option. Workshop return starts at t=60 to avoid replaying the tally.

## Opening pacing
AUTHORED_WAVES in game.js authors three groups for each of waves 1–4. spawnFormationGroup sets a 240-tick interval (120 after the last); another group waits for at most two remaining enemies. Opening wave advancement waits for all groups and a clear field. formationGroup resets on normal newRun; debug starts initialise it to the skipped wave’s group count so ?wave=4 still enters the boss warning immediately. Waves 16+ retain the original 90-tick pacing.

## Later authored sectors
AUTHORED_WAVES also defines four groups per wave for 6–9 and 11–14. Groups are 270 ticks apart (150 after the last), wait for at most two remaining enemies, and cannot spawn more than two active lurkers. Wave 9 introduces crawlers; 11–14 use biological enemies throughout. Boss entries are null. Formation state survives Continue, resets per new wave/run, and debug starts bypass the specified wave’s groups. Waves 16+ retain procedural spawning and 90-tick pacing.

## Hull repairs and meter
Repair drops use k=h and the procedural green CAP_H with a plus and REPAIR label. They occupy a 4% slice of otherwise empty random drops only while hull is damaged; guaranteed weapon drops still take priority. Collection adds one hull, capped at MAX_HULL, with HULL FULL feedback when already repaired. ship.hullDisplay eases towards actual hull by at most 0.08 per fixed step when unpaused; lifecycle resets snap it to actual hull. Only the display interpolates: damage remains three hits.

## Sector departure and arrival
The enlarged sector results screen waits indefinitely for Workshop or Proceed. Proceed enters travel for 180 fixed ticks: ship departure, a world swap under a full fade at tick 60, then arrival and the next sector name. Combat update is never called during travel; hull, loadout, lives, core markers and formation progress are retained. The first new wave spawns only after arrival. Escape/P, pause controls and blur pause travel; mute remains available. Travel input is cleared before combat resumes.

## Sector identity and arrivals
Inter-level Workshop exit reads CONTINUE and returns to the checkpoint; title Workshop keeps BACK. Infected Salvage applies a constant violet colour blend to scenery only, from the travel reveal through all its waves, including procedural fallback. Lurkers use the new compact illustrated body plus smooth tapered tentacles; fallback uses the same tentacle path/endpoints. Spore Skimmer (k=5, radius20, HP4, score60) enters in waves11–14 in one former crawler group per wave, retaining group counts/HP/score, then in procedural waves16+ when wave%5==1. It weaves during a 1.6-unit downward descent, with no bullets. Other enemy types remain. Arrival effects are cached 22.05kHz/16-bit filtered noise with local seeded randomness: a biological boss texture when level%15==0 and a brief regular spawn rush. Other PCM effects retain their existing rate/quantization.

## High-tier weapon tuning
SPREAD fires five damage-2 shots every 16 ticks; STORM fires six every 18. Their outer horizontal velocities are now 1.0/1.05 (previously 1.4/1.5), inner 0.55/0.5. PULSE/TWIN/TRIPLE and rockets are unchanged. Shield impacts show remaining protection or SHIELD DOWN; unshielded hits show 67% or critical 33%, using existing floating text without altering damage, invulnerability or pickup rates.

## Terrain sentries
ground[] is separate from aerial enemies, so surviving sentries never hold up waves. From wave2, a 360-tick initial delay then 540-tick spacing alternates edges, capped at two live units. Each is anchored to worldScroll in rendered pixels: y=(worldScroll-anchor)/K. Stage-specific art uses a three-cell ground_sentries WebP with procedural fallback. HP4, 40 base kill points, no pickup drops; bullets and homing rockets can hit them, bombs kill them. Their bodies do not collide with the flying ship. A 45-tick locked-direction charge precedes one 1.7-speed shot, with 240 ticks between shots; no firing within 90 units of the ship or below LH-90. Bosses/recovery suppress and clear them; new run, Continue, quit and sector completion reset their state.

## Compact adaptive soundtrack
MAIN_TRACK points to space-adventure.m4a (MintoDog, CC0), 937083 bytes, replacing the 1622290-byte Fly recording. One decoded loop serves every world. Its measured 140-BPM duration corresponds to 76 bars; loopEnd is capped to that musical boundary instead of silence-trimming. music(on,worldStage) updates low-pass/bass/echo only on stage changes: 14kHz/0dB/dry, 9.5kHz/+1.5dB/10% echo, 6.5kHz/+3dB/18% echo. Delay is a dotted eighth at 140 BPM with 22% feedback. Dry and wet paths join before the existing music gain, so pause and ownership controls silence both. No new music files, player library or timers per stage. The existing procedural music remains the failure fallback.

## Independent audio controls and sentry variants
SOUND / M controls the PCM effects bus; MUSIC / N controls recorded and fallback music, including fallback drums. Music preference uses 640k.musicMute, initialised once from the legacy 640k.mute setting; both persist independently. Master gain remains reserved for focus/tab ownership. Title has four keyboard/touch options; HUD audio rows are y268..292 and y296..320, available while paused.
Ground sentries now arrive after 240 ticks, then every 360, capped at three. Alternating edge pairs cycle single and twin emitters; twins sit 72 units from the edge instead of 45, fire two slightly diverging shots every 300 ticks (single:240), and show paired barrels/spore sacs. HP, rewards, shot speed, charge, point-blank protection and boss suppression are unchanged.

## Longer Foundry, recessed emplacements and audio mixer
Opening waves1–4 now have five groups each (38 airborne enemies total), 300-tick group intervals, retaining the 120-tick final interval and original enemy stats. Later wave formations/boss schedule unchanged. Ground starts at wave1 after240ticks, spacing210ticks, cap5; every third spawn is variant2 at field centre, a recessed three-world bunker sprite with procedural fallback. Variant2 uses one aimed shot every300ticks and all existing charge/proximity/lifecycle rules.
Audio volume stores independent 0..1 values in 640k.volume.sound/music (defaults1). PCM gain and recorded/fallback music gains apply these values separately from mute. Title audio rows offer toggle, minus, 10-step level, plus and TEST; Left/Right adjusts selected audio, Enter toggles, V previews. Preview lasts five seconds by monotonic time; leaving title, blur/hide or losing ownership cancels it. All previews respect mute/volume. Sampled impact and burst load asynchronously on audio unlock, cache once, and use existing PCM bus/mute controls; failed loads use the old generators without replaying delayed effects.

## Core salvage, ground escalation and rocket cues
Ordinary eligible air kills now drop cores45% (30% original plus15% from the empty0.42..0.57 range); guaranteed weapons and bomb/shield/repair probabilities are unchanged. Each ground destruction adds one physical core pickup and one wreck, guarded by destroyed for exactly-once rewards. Ground wrecks are cosmetic, anchored to worldScroll, capped20, removed below screen and reset on new run/Continue/quit/checkpoint; boss suppression clears live units but retains wrecks until they scroll away.
Within each five-wave stage, ground intervals are210/180/150/120ticks for combat waves1–4, caps5/5/5/6; boss suppression unchanged. Rocket launch logic/damage/cadence are unchanged; pod extension uses cosmetic smoothstep, doors and readiness strip,12-tick flash/recoil/backblast and projectile exhaust. Animation uses fixed-step state and freezes on pause.
