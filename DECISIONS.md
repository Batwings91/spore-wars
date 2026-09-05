# Decisions (and why)

Format: **Decision** — reason. Date. Add new ones at the bottom; don't delete old ones, mark them superseded.

1. **Distribute via portals (itch.io → CrazyGames → Poki), not our own paywalled site.** Research showed a generic "try-then-pay" games portal is unlikely to return on a tiny budget; portals bring traffic and pay ad revenue share. Own site is a later phase. 2026-09-04.
2. **Vertical shooter, Xenon 2 lineage.** Owner preference; replayable/endless with upgrades and a rewarded-continue hook fits portal monetisation. 2026-09-04.
3. **Brand: 640K Games.** "Ready Games"/"Breadbin" rejected for name collisions. DOS-era theme; C64 dropped. 2026-09-04.
4. **Era look: mid-90s VGA (Tyrian/Raptor), not 1991 chunky.** Owner found early dithered look "crude". Consequences: 256-colour master palette, light dither, painted sprites. 2026-09-05.
5. **Resolution 1280×720 render / 640×360 logic.** 16:9 required by Poki/CrazyGames; 720p is the portal norm; phones downscale cleanly. Trade-off: 1.5× (not integer) to 1080p. 2026-09-05.
6. **No engine (plain Canvas).** Tiny file, no dependency risk, easy for two assistants to read. Accepted cost: we write our own sprite/anim helpers.
7. **Single-file release build, folder-based dev build.** Portals like one file; developing against Base64 was unworkable. `tools/build.py` is the only path to `dist/`. 2026-09-05.
8. **Asset licensing policy.** CC0/CC-BY/CC-BY-SA only; never non-commercial; never brand names or real game IP. Skorpio's CC-BY-SA means our derived sprites are CC-BY-SA (fine — code isn't). Every asset listed in CREDITS.txt with modification notes. 2026-09-04/05.
9. **Synthesised SFX rendered to 8-bit/11 kHz buffers; explosions are pure filtered noise.** Owner rejected FM-sounding effects; "digitised Sound Blaster" is the brief. Music is streamed real tracks, not synth. 2026-09-04.
10. **Boss track removed; "Fly" plays throughout.** Owner: the orchestral boss track "didn't mix". `bossTheme()` kept as a no-op hook. 2026-09-05.
11. **Fixed 60 Hz timestep with max 3 catch-ups, no forced step per frame.** ChatGPT found the original loop ran faster on high-refresh displays. 2026-09-05.
12. **Bosses every 5th wave; Battleship first; Mech and Mothership next; then rotate.** Gives runs shape; boss deaths are the natural rewarded-ad moment. 2026-09-05.
13. **Procedural fallbacks retained for every asset.** Game must never break on a missing image; also useful when testing without assets. 2026-09-04.
14. **Debug via URL params (`?god=1`, `?wave=N`), not in-game menus.** Zero UI cost, harmless if a player finds them; strip or gate before Poki if required. 2026-09-05.
