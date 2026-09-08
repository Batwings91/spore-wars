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
index.html          dev build — loads src/*.js in order plus ./assets/. Serve over http (see below); file:// won't fetch the music.
src/                the game code, one topic per file (core, sprites, weapons, scene, audio, input, game, bosses, play, screens, main); see ARCHITECTURE.md
assets/             final game sprites (already palette-reduced/outlined), music
tools/build.js      release build → dist/ (build.py is the identical Python version; use whichever runtime the machine has)
tools/serve.js      dev server on port 8000 (or python3 -m http.server 8000)
tools/smoke.js      headless regression run; see TESTING.md
dist/               release artefact, NOT committed (gitignored): dist/index.html with the PNG sprites inlined plus dist/assets/ (WebP
                    illustrations + music, loaded after boot). Build at release time and zip the folder with index.html at the root.
docs/               palette256.json, contact sheets, extracted Tyrian sprites (docs/tyrian-sprites/, IDs like A050 match the index sheets)
CREDITS.txt         licence/attribution for every third-party asset. Keep it accurate; it ships with the game.
(logo)              the 640K Games logo lives outside this repo in `../Logo` (its own git repo; gen.js is the source). Copy exports into assets/ as needed. © 640K Games, not CC.
CHANGELOG.md        one entry per session
```
Run locally: `node tools/serve.js` (or `python3 -m http.server 8000`) in the project folder, open `http://localhost:8000/index.html`.
Debug URL params: `?god=1` (invulnerable), `?wave=4` (start at wave N; bosses arrive when `(level+1)%5===0`, so `?wave=4` gives an immediate boss).

## Architecture
See `ARCHITECTURE.md`. Decisions and their reasons: `DECISIONS.md`. How to test: `TESTING.md`.

## Asset sources & licences (details in CREDITS.txt)
- Skorpio (OGA) Space Ship Construction Kit 1 & 2, Alien Ships, Mechs — **CC-BY-SA 3.0**. Derived sprites in assets/ are CC-BY-SA; game code is not affected.
- Daniel Cook, Remastered Tyrian Graphics — **CC-BY 3.0** (bolts, plasma, pickup icons). Do not use in a clone of his games.
- chabull, explosions — **CC-BY 3.0**.
- LuminousDragonGames, Parallax Space Scene — **CC0** (background layers px_*).
- Kenney packs — **CC0** (not currently used in-game; UI/particles reserve).
- Music "Space Adventure" — MintoDog — **CC0**; compressed AAC with per-world EQ/echo variations.
- Never use Commodore/MS-DOS/brand names or any real game's characters/art. Retro *style* only.
- Raw source packs are on the owner's Mac (Downloads), not in this repo.

## Done
Boot screen, title and Workshop, six gun states, independent rocket pods, twin sustained side lasers, shields, persistent upgrades, megabomb, pickup fanfare, a 25-wave five-stage campaign, five bosses, painted/fallback scenery, synthesised SFX, streamed music, separate audio controls, touch controls, fixed timestep and debug params.

## Next (agreed order)
1. **Playtest balance** of the Battleship (owner feedback pending): sponginess, phase-2 bullet density, turret value.
2. **Mech boss** (wave 10; walk/fire frames exist: boss_mech, boss_mech_fire) and **Mothership** (wave 15; spawns scouts from bays). Then bosses rotate.
3. Score multiplier chain; DOS-style high-score initials + local table; pause (P); faster game-over→retry.
4. Rewarded-ad hooks: continue, double cores. Keep as clearly-labelled stubs until an SDK is chosen (CrazyGames SDK first, Poki SDK later).
5. Portrait layout for phones.
6. itch.io page (cover, GIF, description with credits/links) → CrazyGames Basic Launch → Poki submission (check current official developer docs before each; verify size limits — dist/index.html is the initial download (~2.5 MB); the ~4.5 MB of illustrations and music load after boot. Poki guidance was <8 MB initial load).
7. Later ideas: enemy ladder (cruiser/destroyer/heavycruiser unused so far), Tyrian ground/wall tiles for a surface stage, Human fleet as second faction, better logo/font, CC0 SFX pack from OGA if synth SFX not good enough.

## Working agreement between assistants
- One assistant edits at a time; commit with a clear message before handing over. Read the diff of the other's last commit before continuing.
- Prefer small, reviewable changes over rewrites. Keep the src/ file layout and load order (ARCHITECTURE.md); no framework or bundler.
- Don't rebalance and refactor in the same commit.
- Never regress: the procedural fallbacks, touch controls, mute persistence, and the debug params must keep working.
- Build dist/ (`node tools/build.js` or `python3 tools/build.py`) at release time only; it is not committed.

## Current campaign (2026-09-08)
Five levels  / 25 waves: Orbital Foundry, Infected Salvage, Spore Wilds, Living Labyrinth and Brood Heart. Bosses at5/10/15/20 / 25; Workshop breaks between levels and campaign victory after 25. Harder replay starts a fresh run from level1 with increased enemy HP; normal Launch resets difficulty. New scenery/creature silhouettes are procedural staging art pending the separate visual redesign. See docs/campaign-20260908.md. This supersedes the earlier rotating/endless roadmap.
