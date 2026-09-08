# Spore Wars — Visual Evolution Direction

**Status:** dated visual reference; Phases 1–4 implemented

**Version:** 1.3 (Phase 4 implementation annotation)

**Date:** 2026-09-08

**Scope:** preserves the owner’s other-chat reference synthesis. The canonical repository, ARCHITECTURE.md and DECISIONS.md describe the implemented game. Shop/loadout work, side beams, living-world routes, the creature ecosystem and Brood Lattice are implemented.

## Intent

Evolve Spore Wars from a strong mechanical vertical shooter into a stranger, living journey. The player's craft should begin compact and visibly accumulate real equipment. The shop must sell those exact parts. The five campaign worlds move from machinery, through infection, into a fully alien ecosystem whose walls, fauna, routes, projectiles, and major creatures all participate in the action.

The supplied Xenon 2 screenshots are inspiration for principles only: scale contrast, modular growth, dense square shop inventory, organic wall hazards, large sustained beams, occasional rockets, route splits, and biological variety. Do not copy any creature, ship, interface, composition, sprite, or identifiable motif. All production designs must remain original to Spore Wars and follow the project's licensing policy.

## Current-state fit

The current game already provides useful foundations:

- Five campaign levels: **Orbital Foundry** (waves 1–5), **Infected Salvage** (6–10), **Spore Wilds** (11–15), **Living Labyrinth** (16–20), and **Brood Heart** (21–25).
- A 640×360 logic canvas / 1280×720 render, mid-1990s painted VGA direction, and a 256-colour master palette.
- A strong existing illustrated salesman and shop backdrop that should be retained.
- Shared equipment renderers for the shop preview and live ship: `drawGunMounts`, `drawEngines`, and `drawShieldLayers`.
- Six gun states (Pulse through Siege), shields, engines, support rockets, Seeker Orb, ground emplacements, eleven airborne enemy kinds and five bosses.
- Existing mechanical, infected, and biological ground-sentry art.
- Implemented Phase 3 living-world layer: cached decorative fauna in worlds 2–5, two telegraphed wall-fauna hazards, and a reusable stepped central-island split in Living Labyrinth wave 18. Both 168-unit lanes clear the widest current ship with margin; grounded rewards relocate to a lane while airborne combat remains reachable.

The redesign should extend these systems rather than replace the game's identity.

## Non-negotiable principles

1. **The ship is a visual record of the build.** Every equipped weapon or system with a physical form appears on the live craft at the correct mount.
2. **The shop never lies.** Tiles, detail preview, purchase result, projectile origin, firing behaviour, and gameplay model all describe the same equipment state.
3. **Growth keeps one identity.** The compact starting hull remains recognizable as modules widen, lengthen, armour, or surround it.
4. **Mechanical becomes biological.** The world progression changes silhouette, material, motion, hazards, and encounter structure—not just colour grading.
5. **The environment participates.** Alien walls can swell, open, fire, retract, shed spores, block routes, or reveal rewards.
6. **Combat remains readable.** Background detail stays subordinate to collision geometry, active enemies, player fire, enemy fire, and pickups.
7. **Spectacle has rhythm.** Thick sustained lasers are continuous power; rockets are less frequent, individually readable heavy punctuation.
8. **Originality is mandatory.** Use the reference images to identify design problems and emotional effects, never as production-art templates.

## Original three-part visual reference

The table below preserves the original mechanical → infected → alien concept, not the current level count. Its “Spore Heart” direction is now distributed across Spore Wilds, Living Labyrinth and Brood Heart.

| Stage | World language | Ship impression | Environmental activity | Enemy direction |
|---|---|---|---|---|
| 1. Orbital Foundry | Gunmetal plates, brass fittings, pipes, vents, hard orthogonal construction | Small, nimble core craft with exposed hardpoints | Mechanical sentries, shutters, vents, cranes, occasional open space | Manufactured drones and military hulls |
| 2. Infected Salvage | Broken machinery threaded with roots, membranes, sacs, and mauve infection | Clearly upgraded machine; modules remain clean enough to read against hybrid scenery | Infected turrets, wall pods, creeping roots, early lane constriction | Hybrid machines, parasites, scavengers, asymmetrical growth |
| 3. Spore Heart | Chitin, vascular webs, ivory ribs, wine flesh, amber/red incubator light | Mature modular gunship; optional alien-derived module accents without losing the human-made core | Living walls, spore mouths, retracting tissue, split passages, brood structures | Fully biological families with radically different silhouettes and motion |

Density should breathe. Alternate enclosure and release: detailed wall passages, sparse open arenas, fauna-heavy pockets, then clean space before major threats. Do not cover every edge or every screen with growth.

## Modular player-ship system

### Silhouette targets

- **Starting craft:** reduce the apparent mass from the current fully developed hull. Aim for a narrow, compact central fuselage with two small stabilizing wings and visible empty hardpoints.
- **Mid-build:** weapons, shields, and engine housings add distinct but coordinated masses around the core.
- **Mature build:** rocket pods, heavy side laser housings, auxiliary thrusters, armour, and support systems produce a broad, formidable silhouette.
- The visual footprint may grow substantially, but the fair damage area should remain a clearly indicated central core. Avoid making decorative outer modules feel like invisible collision traps.

### Mount architecture

Define named attachment points once and use them for rendering and combat:

| Slot | Suggested mounts | Visual effect |
|---|---|---|
| Primary | nose, inner-left, inner-right | Changes barrel count, length, muzzle hardware, and forward-fire origin |
| Side weapon | outer-left, outer-right | Adds beam turrets or lateral defence; visibly widens the ship |
| Ordnance | pod-left, pod-right | Adds rocket magazines, doors, ammunition indicators, and launch flash |
| Engine | rear-left, rear-right, auxiliary-left, auxiliary-right | Adds housings, cooling ribs, nozzle size, flame length, and heat colour |
| Defence | shoulder-left, shoulder-right, core ring | Adds armour plates, shield emitters, or an energized ring |
| Support | upper-left, upper-right, dorsal | Adds drones, targeting hardware, collectors, or special systems |

Render order should be centralized: rear modules → base hull → armour/engines → weapons/pods → shield/effects. Projectile and exhaust origins must read from the same mount data used to draw the equipment.

### Cohesive growth rules

- Preserve top-left lighting, dark outlines, gunmetal/brass base materials, and cyan-white player-energy accents.
- Repeat a small set of connection forms: rails, braces, collars, power conduits, and keyed sockets.
- Increase mass in controlled steps; do not scale the base hull uniformly.
- Let upgrades change animation as well as shape: opening pod doors, tracking barrels, pulsing emitters, radiator movement, and stronger exhaust.
- A module may be asymmetrical while firing or damaged, but the resting loadout should remain easy to parse from overhead.

## Shop redesign

Retain the current salesman, workshop backdrop, character animation, and tone. Rebuild the product area as a compact equipment wall rather than three wide product cards.

### Layout at 640×360 logic resolution

- Keep the salesman and dialogue/counter zone on the left.
- Use the right-hand area for a **4-column square-tile grid** with category tabs or paged rows. Start with 8–12 visible products without shrinking icons into noise.
- Reserve a lower detail strip for name, tier, price, owned/equipped state, concise effect, and primary action.
- Show cores persistently at the upper right.
- Keyboard, gamepad, pointer, and touch navigation need the same deterministic focus order.
- If a comparison cannot fit, switch the detail strip between **CURRENT** and **PREVIEW**, rather than filling tiles with small text.

### Tile states

Each square tile requires distinct, accessible states:

- Available
- Focused/hovered
- Owned but not equipped
- Equipped
- Affordable next tier
- Unaffordable
- Locked/undiscovered
- Maximum tier
- Newly discovered

Do not communicate these states by colour alone. Use a combination of frame shape, icon, short label, meter/pips, and restrained colour.

### Live preview contract

Selecting a tile renders the **entire currently equipped ship**, with only the candidate slot temporarily overridden. The preview should demonstrate:

- Exact module position and silhouette
- Turret direction and muzzle/launch point
- Beam width or projectile count
- Rocket capacity/cadence where relevant
- Engine nozzle and exhaust change
- Shield/armour coverage
- Any trade-off, such as energy, heat, speed, or firing arc

Purchasing updates the same loadout model used by gameplay. Never maintain separate shop-only art or inferred weapon positions.

### Expanded product families

Prioritize physical, legible upgrades:

1. **Primary guns:** Pulse, Twin, Triple, Spread, Storm; retain the current core progression but improve physical differentiation.
2. **Side laser turrets:** sustained heavy beams; tiers improve duration, width, cooling, or firing arc.
3. **Rocket pods:** separate ordnance from primary-gun level; tiers improve magazine, guidance, damage, or reload—not all at once.
4. **Engines/thrusters:** speed and handling, with visible housings and exhaust.
5. **Shield emitters:** capacity/recovery with visible emitters and layered shield effects.
6. **Armour plating:** survivability at the cost of mass or handling, visibly thickening the core.
7. **Targeting module:** lock speed, rocket reacquisition, or aimed side fire; represented by a sensor mast or dish.
8. **Support drone:** collector, defender, or gun drone; only one role per equipped model for readability.
9. **Core collector:** increases salvage attraction radius; represented by small field vanes or a ring.
10. **Late alien graft:** a rare Spore Heart-derived system with an original organic form and an explicit mechanical socket, reinforcing that it was installed rather than transforming the whole ship.

Avoid launching all ten families at once. Phase the catalogue and keep save migration backward-compatible with the current `{weapon, shield, engine}` values.

## Signature weapons

### Heavy side lasers

- Side-mounted hardware should emit very thick, sustained forward beams. A later variant may add limited lateral coverage, but side mounting alone must not imply a direction the weapon does not fire.
- Use a brilliant narrow core inside a broader coloured body and a soft, bounded halo. Keep the damaging width visually honest.
- Add a brief charge tell at the turret, stable sustain, visible impact flare, and short heat/cooldown recovery.
- Beam tiers should visibly change the turret housing and at least one of width, duration, stability, or cooling fins.
- Use local illumination and modest camera response; avoid full-screen bloom or shake that compromises dodging.
- Player beams remain cyan/blue-white. Enemy organic shots stay in amber, red, violet, or pink channels.

### Rockets

- Rockets fire substantially less often than primary shots and beams.
- Keep alternating pod launches, readable ignition, a clear exhaust trail, limited steering, and a weighty impact.
- Rocket racks should visibly open, empty/refill, or display a small readiness light.
- Do not hide automatic rockets inside primary-gun progression. The equipped ordnance slot controls their presence and behaviour.

## Environmental fauna and route design

### Wall fauna

Build original wall-mounted organisms from interchangeable anatomical ideas: roots, stems, armoured bulbs, soft sacs, mouths, petals, cilia, tendrils, and mineral/chitin anchors. Example roles:

- **Spore spitters:** swell, change colour, open, and eject slow globules at irregular but fair intervals.
- **Seed mortars:** arc clusters into predicted areas after a visible contraction.
- **Puff vents:** release drifting clouds that deny space without looking like ordinary bullets.
- **Snap blooms:** briefly extend into the playfield, then retract.
- **Nursery pods:** decorative until damaged, then burst into small creatures or salvage.

Active fauna must use stronger outlines, brighter organs, and motion. Decorative fauna should be darker, slower, and visually embedded in the background.

### Layering

Use three environmental layers where useful:

1. Deep background: low-contrast webs, roots, distant chambers, and silhouettes.
2. Structural plane: walls, rocks, ribs, sockets, and readable navigation boundaries.
3. Active foreground: firing organs, destructible pods, tendrils, particles, and impact reactions.

Cache repeated decorative assets and keep contrast beneath gameplay elements. Background motion should never resemble incoming projectiles.

### Split routes

Create reusable scrolling segment templates: open, left enclosure, right enclosure, central island, two-lane split, converging tunnel, fauna pocket, and arena release.

- Telegraph a split before the commitment point.
- Both paths must fit the largest supported ship silhouette with a safety margin.
- Paths may offer different risk/reward, pickups, firing angles, or enemy formations, but neither should require one particular purchased weapon.
- Rejoin routes cleanly and prevent enemies or rewards from becoming unreachable behind terrain.
- Start with simple rectangular/circular collision shapes that match the visible rock/chitin edge; do not infer collision from painted pixels.
- Mix fauna-heavy wall sections with bare rock, open void, and quiet stretches to control rhythm.

## Alien creature families

The final reference establishes a desired sense of biological abundance and a huge creature-to-ship scale contrast. Translate that into an original family system rather than variants of one identifiable body.

### Family grammar

All late-world creatures may share wine-red flesh, ivory or violet chitin, amber/red internal light, and root-like connective tissue. They should differ strongly in silhouette, locomotion, and attack:

| Family | Silhouette | Motion | Combat role |
|---|---|---|---|
| Carapace rammer | Broad shield or shell with recessed organs | Heavy drift, turn, then charge | Space displacement and collision threat |
| Tendril hunter | Small core with long articulated limbs | Side-entry stalking and elastic lunges | Flanking pressure |
| Spore ray | Wide leaf/manta form with trailing roots | Swooping curves and banking | Formation breaker |
| Seeder | Bulbous abdomen with orbiting or trailing pods | Slow advance with periodic contraction | Releases mines, spores, or hatchlings |
| Needle larva | Thin segmented body with a bright head organ | Fast corkscrew or darting motion | Precision projectile threat |
| Colony mass | Asymmetrical cluster attached to wall or central spine | Mostly anchored; organs pulse independently | Set-piece, turret network, or boss phase |

Create variants by changing anatomy and behaviour together—not merely hue shifting. A variant should alter at least silhouette, movement timing, and attack pattern.

### Central living structure

Develop an original **Brood Lattice** set-piece for Spore Heart: an irregular branching vascular structure that spans the central background and contains clusters of red/amber incubation nodes. It must not reproduce the reference creature or its vertical composition.

Possible behaviours:

- Nodes pulse in a travelling wave before releasing spores.
- Some nodes are background-only; active nodes push forward, brighten, and gain a clear rim before becoming targetable.
- Destroying selected nodes opens one route while causing tissue to close another.
- A rare intact node releases salvage; damaged nodes burst into harmless biological particles rather than ordinary explosion fire.
- The lattice may foreshadow or form part of the Brood Mother encounter, but it should first appear as environmental storytelling.

Vary node size, clustering, depth, and colour temperature. Avoid a regular bead grid or a single repeated “red ball” stamp.

## Visual tokens and readability

Continue using the existing master palette and painted mid-1990s VGA treatment.

| Function | Dominant treatment |
|---|---|
| Player hull | Gunmetal, brass/gold edges, controlled cool highlights |
| Player energy/fire | Cyan to blue-white, brightest core values |
| Mechanical world | Charcoal, steel, muted brass, sparse hazard amber |
| Infection | Desaturated mauve/violet flesh over rusted machinery |
| Fully alien world | Wine, dark violet, ivory chitin, amber/red organs |
| Enemy projectiles | Warm amber/red or pink/violet; never player cyan-white |
| Pickups | Gold/yellow and clean icon shapes with breathing room |
| Decorative background | Lower saturation, lower contrast, slower motion |

Motion vocabulary:

- Mechanical: snaps, locks, tracks, rotates, vents.
- Infected: mechanical motion interrupted by twitching, swelling, and uneven recovery.
- Alien: breathes, ripples, contracts, unfurls, recoils, and propagates movement across connected tissue.

## Implementation architecture recommendation

Create one loadout definition as the source of truth. Each shop product should resolve to data shaped approximately like:

```js
{
  id, slot, tier, cost,
  mounts,
  drawModule,
  fireProfile,
  projectileOrigins,
  previewEffect,
  description
}
```

The exact structure can follow the codebase's plain-script style, but these concepts should not be duplicated across shop and gameplay. Extend the existing shared renderers rather than creating separate preview sprites.

Recommended separations:

- `equipment definitions`: ownership, tier, slot, price, and compatibility
- `ship assembly`: base hull, mount anchors, render order, and loadout override for preview
- `weapon behaviour`: beam sustain/heat and rocket cadence/guidance
- `world segments`: background/decor/terrain/active-fauna layers and collision primitives
- `creature families`: anatomy renderer or asset, movement profile, and attack profile

Preserve procedural fallbacks for every new production asset.

## Proposed delivery roadmap (not an implementation queue)

### Phase 1 — Cohesive ship and truthful shop

- Redesign the base player hull into the compact starting craft.
- Centralize mount data and full-loadout rendering.
- Convert the shop product area to the square grid while retaining the salesman.
- Make the preview show current loadout plus candidate override.
- Separate rockets from primary-gun progression without breaking existing saves.
- Add side-laser and rocket-pod product tiles with placeholder/procedural art if necessary.

### Phase 2 — Signature weapon spectacle

- Implement sustained heavy side beams, charge, heat/cooldown, impact, and matching shop demonstration.
- Improve rocket launch, rack state, trail, and impact feedback.
- Tune projectile colour channels and effects under worst-case screen density.

### Phase 3 — Living-world encounters

**Implemented 2026-09-08.** Cached procedural overlays add dense/sparse/quiet fauna bands from Infected Salvage through Brood Heart. Spore organs and snap blooms provide two original strong-tell hazards. Living Labyrinth wave 18 introduces the first telegraphed central-island/two-lane segment with shared visible/collision rectangles, mature-build clearance, grounded-reward relocation, airborne overflight and a clean open rejoin. No raster asset or reference-derived production shape was added.

### Phase 4 — Creature ecosystem and Brood Lattice

**Implemented 2026-09-08.** An original six-cell silhouette study establishes the Carapace Rammer, Tendril Hunter, Spore Ray, Seeder, Needle Larva and Colony Mass grammars. The late roster now preserves all six identities, with new rammer/hunter state machines and a widened, banking, warm-volley Spore Ray. Brood Heart foreshadows an irregular eleven-node Brood Lattice before its wave-23 set-piece; three sequential nodes travel-pulse, push forward and open to every player weapon, then release three salvage cores exactly once. Existing approved creature art remains in use with procedural fallbacks; prompt/provenance is in `docs/phase4-creature-design.md`.

## Proposed feature acceptance checks

- A lineup of the same ship at base, early, mid, and mature loadouts reads as one evolving craft and four clearly different power states.
- Every equipped physical product is visible in gameplay; removing it removes the part and its effect.
- A shop preview and an in-flight screenshot of the same loadout match in module count, placement, tier, and weapon origin.
- Thick beams look powerful without hiding the damaging width, player position, enemy bullets, or route boundaries.
- Rockets are individually trackable and perceptibly less frequent than continuous or rapid-fire weapons.
- Foundry, Salvage, and Heart screenshots are distinguishable by geometry, material, motion, and fauna—not colour treatment alone.
- Active wall fauna can be identified before it fires without relying only on colour.
- Split routes are telegraphed, both accommodate the mature ship, and both reconnect without trapping enemies or rewards.
- Alien variants differ in silhouette, movement, and attack; no family is just a recolour.
- The Brood Lattice reads as a living alien structure with varied nodes, not as repeated red circles.
- New art uses original forms, documented provenance, and the existing licensing rules.
- The game continues to hold the fixed timestep and retains fallback visuals if an asset fails to load.

## Reference-derived proposals log

1. Compact starting ship that grows through visible, cohesive modules.
2. Shop stock and preview must mirror the actual flight loadout.
3. Retain the current salesman; replace the three-card offer with a square multi-item equipment grid.
4. Transition from mechanical stages to active alien ecosystems with wall-mounted spore/fire fauna.
5. Add environmental density rhythm and occasional branching routes.
6. Make side-mounted heavy laser beams a signature high-tier weapon; keep rockets slower and less frequent.
7. Expand late-world alien variety through distinct creature families.
8. Add an original central living structure with varied red/amber incubation nodes.

## Change control

Update this document when a visual decision changes. Record implementation-specific decisions in `DECISIONS.md` only after they are accepted. Add asset prompts and provenance to dedicated dated files in `docs/`, and update `CREDITS.txt` for every production asset as required by the repository policy.
