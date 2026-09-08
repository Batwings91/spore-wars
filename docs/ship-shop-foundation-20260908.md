# Ship and Workshop foundation — Phase 1

**Date:** 2026-09-08
**Status:** implemented foundation; sustained side lasers remain Phase 2

This phase implements the approved ship/shop portion of `visual-direction-20260908.md` without adding new binary artwork. The existing AI-assisted trader and modular player hull remain the production images. The equipment-wall tiles, state frames and locked side-laser hardpoint marker are original 640K Games runtime Canvas composition; their ship thumbnails reuse the live hull and procedural module renderers.

## Equipment contract

`src/weapons.js` owns `EQUIPMENT`, `SHIP_MOUNTS` and the six `GUN` profiles. A product record supplies its save key, loadout slot, owned tiers, prices, effect copy, gameplay profile and module renderer. `savedLoadout()` produces the installed launch fit; `candidateLoadout()` clones a complete fit and overrides only one unlocked candidate slot. The title Workshop uses the saved launch fit, while a checkpoint Workshop uses the actual in-run weapon, remaining shield and run-owned Orb. `drawShipAssembly()` calls the same module hooks for the Workshop and flight.

Primary shot origins and velocities live in `GUN[].shots`; `GUN_PORTS` is derived from those records. Rocket rendering and launch logic both read `SHIP_MOUNTS.ordnance`. This makes shop art, ship hardware and projectile origins testable as one contract rather than parallel tables.

## Workshop layout

The 640×360 screen keeps the illustrated salesman on the left. The right equipment wall uses four square columns with six focusable entries: Primary, Shield, Engine, Rocket Pods, Seeker Orb and Side Laser. The lower strip shows the complete candidate ship plus short ownership, price and effect text. Focus, locked, ready, shortfall and equipped states use text/brackets as well as colour. Pointer/touch hit bounds are derived from the same tile geometry used for drawing.

The Side Laser record reserves `sideWeapon` mounts and a `sideLaser` loadout key, but it is locked, has no cost, does not override previews and has a no-op renderer. No laser can be bought, equipped or fired before the sustained beam, charge and heat/cooldown gameplay exists.

## Rocket ordnance and migration

Twin rocket pods are Mk I ordnance, not a primary-gun side effect. They install immediately, remain visible at every primary tier, alternate the shared left/right mounts and use a three-second (180 fixed-tick) reload, damage 1, two-live cap and the existing homing/reacquisition behavior. The slower rhythm keeps rockets as readable punctuation beside rapid primary fire.

The storage key remains `640k.sporewars.v3`. Fresh saves default `rockets` to 0. When an existing v3 object lacks the field, migration preserves its cores, best score, weapon, shield, engine and Orb values and grants `rockets:1`. This player-favouring default retains a capability that all existing players previously received automatically after reaching Twin during a run. The migrated field is written back immediately.

## Asset provenance

No new image, audio or font file was created. The equipment grid and marker are original code-drawn UI, using the existing project palette, bitmap alphabet and credited hull/module artwork. `CREDITS.txt` records this runtime composition.
