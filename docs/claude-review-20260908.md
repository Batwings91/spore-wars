# Claude review handoff — 2026-09-08

Review and test before further feature work. The owner has a separate chat handling player-ship/enemy visual reference designs: do not redesign the ship here.

## State
The owner authorised committing and handing over all latest work. Baseline before this handoff series: 150061f. Review git log and git diff 150061f..HEAD for the accumulated gameplay, presentation, art and audio changes. Pull master before starting in another checkout; check for local changes first. dist is ignored and was not committed. The website preview is a separate repository with its own deployment commits.

Latest isolated diff: C:/Users/Dell/.codex/visualizations/2026/09/05/01a0716a-9066-75c0-954c-715a4beee1f8/salvage-rockets.diff
Earlier review diffs in the same folder: foundry-mixer.diff, audio-ground-controls.diff, adaptive-music.diff, ground-sentries.diff, weapon-balance.diff.

## Latest changes
- Ordinary eligible air-kill core probability30% ->45%; other pickup chances preserved. Ground kills guarantee one physical core.
- Ground density210/180/150/120ticks through the four combat waves per stage; caps5/5/5/6. Bosses suppress ground spawns.
- Ground wrecks follow worldScroll, have no collision/reward, cap20, clean up offscreen and on run/sector boundaries.
- Rocket pod opening/doors, readiness strip, recoil/backblast and projectile exhaust only; damage1/cadence120ticks/active cap3 retained.

## Review priorities
1. Core rewards exactly once for gun/rocket/bomb kills; Continue/checkpoint/quit banking after shop spending.
2. Wreck lifecycle, ground density and performance/mobile playability. Check new centre bunker and all fallback art.
3. Volume/mute combinations, preview timeout and delayed decode, blur/tab ownership, sampled effect overlap and fallback.
4. Longer Foundry and later progression: playtest whether the new core income makes Workshop purchases achievable without trivialising runs.
5. Rocket cue alignment and pause/reset behaviour. No extra balance changes without review.

## Validation
Run node tools/smoke.js with local server on8000. Latest focused driver: node C:/Users/Dell/.codex/visualizations/2026/09/05/01a0716a-9066-75c0-954c-715a4beee1f8/salvage-preview.cjs
Other focused driver: node C:/Users/Dell/.codex/visualizations/2026/09/05/01a0716a-9066-75c0-954c-715a4beee1f8/foundry-mixer-preview.cjs
These use fresh headless Chrome profiles and check actual runtime state. Owner still needs to judge mobile feel and sound quality.

The owner has authorised Claude to review, test and make updates/fixes. Keep follow-up fixes in focused commits and preserve the separate visual-design chat’s ownership of ship redesign. Build release with node tools/build.js; dist stays ignored. The prior smoke and focused checks passed; rerun appropriate checks after fixes.
