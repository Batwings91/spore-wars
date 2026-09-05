# SPORE WARS — project brief

**Studio:** 640K Games (brand; domains/itch handle to register).
**Owner:** non-coder, 50, grew up on C64/Amiga/early-90s PC. Owner decides; assistants (Claude Code, ChatGPT) build and review.
**Read this file first in every session. Append to CHANGELOG.md when you change something.**

## What it is
A vertical-scrolling shoot-'em-up in the style of 1991–95 PC games (Xenon 2 / Tyrian era), HTML5 + Canvas, no framework, no dependencies.
Target platforms, in order: **itch.io → CrazyGames (Basic Launch) → Poki**. Revenue model: portal ad revenue + rewarded video ("continue", "double cores"), *not* our own site. Own website is a later phase once a game has traction.
Budget: effectively £0/month for tools; keep everything free-licensed.

## Layout
```
index.html          dev build — loads ./assets/*.png and ./assets/fly.m4a. Serve over http (see below); file:// won't fetch the music.
assets/             final game sprites (already palette-reduced/outlined), music
tools/build.py      inlines assets into a single file → dist/spore-wars.html (this is what we upload to portals)
dist/               release artefact (regenerate with build.py; don't hand-edit)
docs/               palette256.json, contact sheets, extracted Tyrian sprites (docs/tyrian-sprites/, IDs like A050 match the index sheets)
CREDITS.txt         licence/attribution for every third-party asset. Keep it accurate; it ships with the game.
CHANGELOG.md        one entry per session
```
Run locally: `python3 -m http.server 8000` in the project folder, open `http://localhost:8000/index.html`.
Debug URL params: `?god=1` (invulnerable), `?wave=4` (start at wave N; bosses arrive when `(level+1)%5===0`, so `?wave=4` gives an immediate boss).

## Architecture (index.html, one IIFE)
- **Resolution:** logic runs in a 640×360 space (`LW,LH`), rendered at 1280×720 (`K=2`, `X(v)` converts). Playfield is `PX..PX+PW` (100..540 logic) with bevelled HUD panels either side. 16:9 is mandatory for Poki/CrazyGames. Portrait/phone-upright layout is a wanted future feature.
- **Loop:** fixed 60 Hz `stepLogic()` via accumulator (max 3 catch-ups per rAF). Drawing currently happens inside stepLogic per mode; `render()` is a no-op placeholder.
- **Modes:** `boot` (DOS-style boot screen; waits for assets) → `title` → `play` ↔ `dead`, `shop` (Workshop, spends banked cores).
- **Assets:** `IMG[name]` single images, `STRIP[name]={img,n,w,h}` animation strips; helpers `img(name,x,y,scale,alpha)` and `strip(name,frame,x,y,scale)`. Every asset has a procedural fallback (the old hand-drawn sprites) so the game never breaks on a missing image.
- **Entities:** `enemies[]` with `k`: 0 scout (drift), 1 bomber (dive), 2 frigate (aimed plasma), 3 lurker (procedural tentacles, from wave 6), 4 crawler (procedural hooks, from wave 9). `R[k]` = collision radii. `shots[]` (player, carries `g` gun level and `dmg`), `eshots[]` (`blue:true` = lurker/boss bow), `drops[]` (`k`: core/w/s/b), `booms[]` (strip explosions or spark particles), `floats[]`, `rings[]`.
- **Guns:** `GUN[0..4]` PULSE/TWIN/TRIPLE/SPREAD/STORM with dmg 1/1/2/2/3. New gun on first kill, then every ~9 kills (`dropFor`). Dying drops one gun level.
- **Megabomb:** `fireBomb()` — X/B/Shift or tap the BOMB panel. 6 dmg to all enemies, clears bullets, 25 to boss hull + 8 to turrets. Max 3, start with 1. Gold `B` capsule adds one.
- **Boss:** `boss` object; `startBossWarning()` → `spawnBoss()` → `updateBoss()`/`drawBoss()`. Only the Battleship exists. Phase 2 at 50% HP. Death sequence `bossDying` countdown. Bosses every 5th wave, HP scales with `bossCount`/`level`.
- **Audio (`SFX`):** all effects synthesised (rendered to 8-bit 11 kHz buffers = "Sound Blaster digitised" feel; explosions are layered filtered noise, deliberately no tonal component). Music: `TR.main` streamed from `MAIN_TRACK` via Web Audio BufferSource with trailing-silence trim + loop; an OPL-style synth loop is the fallback. `bossTheme()` exists but is a no-op (boss track removed by owner: "didn't mix"). `M` / SOUND panel toggles mute (persisted).
- **Save:** `localStorage['640k.sporewars.v3']` = {cores,best,weapon,shield,engine}.
- **Input:** arrows/WASD, auto-fire (Space also fires); touch = drag anywhere to move, tap panels. `TOUCH` hides keycap hints. Keyboard hints render as keycaps via `keycap()`.

## Art rules (owner is particular about these)
- Look: **mid-90s VGA** (smooth 256-colour shading, light dither), not 8-bit chunky. A 256-colour master palette (`docs/palette256.json`) was built from the art; UI colours pinned. Nebula uses its own 64-colour range; green bolt / blue plasma got their own small ranges (the master palette is red/grey heavy).
- Pipeline for new sprites: crop → resize LANCZOS to target width × 4/3 → quantize to palette, no dither → 1px dark outline (`#0c0e1a`). Explosions: alpha → ordered dither to 1-bit, fire palette.
- Sizes at 1280 render: player 123 px wide; scout 67, bomber 77, frigate 88, cruiser 101, destroyer 112, heavycruiser 128; battleship 253, mech 227, mothership 400.
- UI: bevelled steel panels (`bevel()`), Xenon-2 style. Owner wants the menu "super slick"; a real bitmap font and hand-drawn logo are the obvious next upgrades.

## Asset sources & licences (details in CREDITS.txt)
- Skorpio (OGA) Space Ship Construction Kit 1 & 2, Alien Ships, Mechs — **CC-BY-SA 3.0**. Derived sprites in assets/ are CC-BY-SA; game code is not affected.
- Daniel Cook, Remastered Tyrian Graphics — **CC-BY 3.0** (bolts, plasma, pickup icons). Do not use in a clone of his games.
- chabull, explosions — **CC-BY 3.0**.
- LuminousDragonGames, Parallax Space Scene — **CC0** (background layers px_*).
- Kenney packs — **CC0** (not currently used in-game; UI/particles reserve).
- Music "Fly" — Alexandr Zhelanov — **CC-BY 3.0**, wants a link back to the project.
- Never use Commodore/MS-DOS/brand names or any real game's characters/art. Retro *style* only.
- Raw source packs are on the owner's Mac (Downloads), not in this repo.

## Done
Boot screen, title (fleet flyby, buttons), 5 gun levels, shields, cores/workshop upgrades, megabomb, pickup fanfare (flash/slow-mo/banner), five enemy types, Battleship boss, six-layer parallax, full sprite set, synthesised SFX, streamed music, mute, touch controls, fixed timestep, debug params.

## Next (agreed order)
1. **Playtest balance** of the Battleship (owner feedback pending): sponginess, phase-2 bullet density, turret value.
2. **Mech boss** (wave 10; walk/fire frames exist: boss_mech, boss_mech_fire) and **Mothership** (wave 15; spawns scouts from bays). Then bosses rotate.
3. Score multiplier chain; DOS-style high-score initials + local table; pause (P); faster game-over→retry.
4. Rewarded-ad hooks: continue, double cores. Keep as clearly-labelled stubs until an SDK is chosen (CrazyGames SDK first, Poki SDK later).
5. Portrait layout for phones.
6. itch.io page (cover, GIF, description with credits/links) → CrazyGames Basic Launch → Poki submission (check current official developer docs before each; verify size limits — dist is ~4.8 MB, Poki guidance was <8 MB initial load).
7. Later ideas: enemy ladder (cruiser/destroyer/heavycruiser unused so far), Tyrian ground/wall tiles for a surface stage, Human fleet as second faction, better logo/font, CC0 SFX pack from OGA if synth SFX not good enough.

## Working agreement between assistants
- One assistant edits at a time; commit with a clear message before handing over. Read the diff of the other's last commit before continuing.
- Prefer small, reviewable changes over rewrites. Keep the single-IIFE structure unless the owner agrees to a refactor.
- Don't rebalance and refactor in the same commit.
- Never regress: the procedural fallbacks, touch controls, mute persistence, and the debug params must keep working.
- Rebuild dist/ (`python3 tools/build.py`) before any release/upload.
