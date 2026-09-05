# Architecture

All game code is one IIFE in `index.html`. No framework, no build step for dev.

## Systems
- **Resolution:** logic runs in a 640×360 space (`LW,LH`), rendered at 1280×720 (`K=2`, `X(v)` converts). Playfield is `PX..PX+PW` (100..540 logic) with bevelled HUD panels either side. 16:9 is mandatory for Poki/CrazyGames. Portrait/phone-upright layout is a wanted future feature.
- **Loop:** fixed 60 Hz `stepLogic()` via accumulator (max 3 catch-ups per rAF). Drawing currently happens inside stepLogic per mode; `render()` is a no-op placeholder.
- **Modes:** `boot` (DOS-style boot screen; waits for assets) → `title` → `play` ↔ `dead`, `shop` (Workshop, spends banked cores). `paused` is a flag inside `play` (Esc/P): `update()` is skipped, `pauseScreen()` overlays the frozen scene; `quitRun()` exits to title and banks cores like death does.
- **Assets:** `IMG[name]` single images, `STRIP[name]={img,n,w,h}` animation strips; helpers `img(name,x,y,scale,alpha)` and `strip(name,frame,x,y,scale)`. Every asset has a procedural fallback (the old hand-drawn sprites) so the game never breaks on a missing image.
- `ASSET_EXT` selects WebP for new illustrated sprites; other images use PNG. Both release builders inline either format using its correct MIME type. Hangar/lurker WebP encoding preserves visible pixels and alpha.
- **Entities:** `enemies[]` with `k`: 0 scout (drift), 1 bomber (dive), 2 frigate (aimed plasma), 3 lurker (procedural tentacles, from wave 6), 4 crawler (procedural hooks, from wave 9). `R[k]` = collision radii. `shots[]` (player, carries `g` gun level and `dmg`), `eshots[]` (`blue:true` = lurker/boss bow), `drops[]` (`k`: core/w/s/b), `booms[]` (strip explosions or spark particles), `floats[]`, `rings[]`.
- **Lurker art:** `drawLurkerArt()` uses `IMG.lurker_body`, subtle breathing, shaded tendrils and a charge cue driven by `e.ct`. Tendril endpoints match the existing tip collision expression. Missing art uses the original `drawLurker()` with its original scaling; crawler rendering is unchanged.
- **Guns:** `GUN[0..4]` PULSE/TWIN/TRIPLE/SPREAD/STORM with dmg 1/1/2/2/3. New gun on first kill, then every ~9 kills (`dropFor`). Dying drops one gun level.
- **Weapon visuals:** `BOLT[0..4]` caches original white/cyan procedural projectiles at startup. `GUN_PORTS` and `drawGunMounts()` draw 1/2/3/5/6 mounts matching existing shot origins. Enemy plasma uses its separate sprites/fallbacks. Legacy bolt PNGs remain packaged but are no longer drawn.
- **Megabomb:** `fireBomb()` — X/B/Shift or tap the BOMB panel. 6 dmg to all enemies, clears bullets, 25 to boss hull + 8 to turrets. Max 3, start with 1. Gold `B` capsule adds one.
- **Boss:** `boss` object; `startBossWarning()` → `spawnBoss()` → `updateBoss()`/`drawBoss()`. The rotation is Battleship (5, 20...), Mech (10, 25...), Mothership (15, 30...). Mothership uses updateMothership(): destructible launch bays, at most six scouts, and volleys with a marked two-lane gap. Mech uses updateMech() for movement, 45-tick aim lock, and twin-cannon spreads. Phase 2 below 50% HP. Death sequence `bossDying` countdown. Bosses every 5th wave, HP scales with `bossCount`/`level`.
- **Audio (`SFX`):** all effects synthesised (rendered to 8-bit 11 kHz buffers = "Sound Blaster digitised" feel; explosions are layered filtered noise, deliberately no tonal component). Music: `TR.main` streamed from `MAIN_TRACK` via Web Audio BufferSource with trailing-silence trim + loop; an OPL-style synth loop is the fallback. `bossTheme()` exists but is a no-op (boss track removed by owner: "didn't mix"). `M` / SOUND panel toggles mute (persisted).
- **Save:** `localStorage['640k.sporewars.v3']` = {cores,best,weapon,shield,engine}.
- **Input:** arrows/WASD, auto-fire (Space also fires); touch = drag anywhere to move, tap panels. `TOUCH` hides keycap hints. Keyboard hints render as keycaps via `keycap()`.

## Art rules (owner is particular about these)
- Look: **mid-90s VGA** (smooth 256-colour shading, light dither), not 8-bit chunky. A 256-colour master palette (`docs/palette256.json`) was built from the art; UI colours pinned. Nebula uses its own 64-colour range; green bolt / blue plasma got their own small ranges (the master palette is red/grey heavy).
- Pipeline for new sprites: crop → resize LANCZOS to target width × 4/3 → quantize to palette, no dither → 1px dark outline (`#0c0e1a`). Explosions: alpha → ordered dither to 1-bit, fire palette.
- Sizes at 1280 render: player 123 px wide; scout 67, bomber 77, frigate 88, cruiser 101, destroyer 112, heavycruiser 128; battleship 253, mech 227, mothership 400.
- UI: bevelled steel panels (`bevel()`), Xenon-2 style. Owner wants the menu "super slick"; a real bitmap font and hand-drawn logo are the obvious next upgrades.
- Title presentation: `menu_hangar` illustration with a procedural fallback, live text and buttons. `TITLE_BUTTONS` supplies both draw bounds and pointer hit areas. `glassPanel()` provides translucent overlays; combat notices stay near the field edges. Gameplay HUD panels still use `bevel()`.

## Where things live (search these identifiers in index.html)
| System | Identifiers |
|---|---|
| Asset loading | `ASSET_DATA`, `IMG`, `STRIP`, `img()`, `strip()`, `assetsReady` |
| Main loop | `frame()`, `stepLogic()`, `render()` (no-op) |
| Player | `ship`, `spd()`, `hitShip()`, `drawShip()`, `GUN`, `MAXW`, `fireT` |
| Enemies | `spawnWave()`, `enemies`, `R`, `drawLurker()`, `drawCrawler()` |
| Boss | `startBossWarning()`, `spawnBoss()`, `updateBoss()`, `drawBoss()`, `bombBoss()`, `updateMech()`, `updateMothership()`, `drawMechFallback()`, `drawMothershipFallback()`, `bossWarn`, `bossDying`, `bossCount` |
| Projectiles | `shots`, `eshots`, `BOLT`, `PLASMA` |
| Pickups/economy | `drops`, `dropFor()`, `pickupEvent()`, `save`, `persist()`, `SHOP`, `buy()` |
| Megabomb | `fireBomb()`, `bombs`, `bombFx` |
| Effects | `booms`, `boom()`, `floats`, `addFloat()`, `rings`, `shake`, `flash`, `slow` |
| Background | `drawField()` → `layer()` (px_* parallax), `STARS`, `BG` (procedural fallback) |
| HUD/UI | `drawPanels()`, `bevel()`, `keycap()`, `txt()`, `titleScreen()`, `deadScreen()`, `shopScreen()`, `bootScreen()` |
| Audio | `SFX` (IIFE): `pcm()`, `opl()`, `explosion()`, `TR`, `loadTrack()`, `select()`, `music()`, `bossTheme()`, `toggleMute()` |
| Input | `keys`, `KEYMAP`, `ptr`, `tapped`, `tapSrc`, `TOUCH`, `titleSel`, `paused` |
| Debug | `DBG`, `GOD`, `STARTWAVE` |
