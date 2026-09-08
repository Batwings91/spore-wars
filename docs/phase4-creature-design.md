# Phase 4 creature ecosystem and Brood Lattice

Date: 2026-09-08

## Silhouette study

`docs/phase4-creature-silhouettes.png` is an original six-cell design reference generated with OpenAI's built-in image generation tool under 640K Games art direction. It is not loaded by the game. It was used to audit scale-readability and prevent the late roster from collapsing into one repeated body plan.

The cells map to runtime families as follows:

1. Carapace Rammer (`k=9`): broad procedural crescent shell, heavy drift, brace, then a locked charge.
2. Tendril Hunter (`k=10`): small procedural core with three long articulated hooks, stalk, visible contraction, then an elastic lunge. The rendered endpoints and damaging endpoints use the same `hunterTendrils()` result.
3. Spore Ray (`k=5`): the existing credited `spore_skimmer.webp` core inside a new wide procedural membrane, banking sweep and three-shot warm barb volley.
4. Seeder (`k=6`): existing credited `seeder_body.webp`, slow advance and paired biological shot pattern.
5. Needle Larva (`k=7`): existing credited `needle_body.webp`, thin fast corkscrew/dart motion and single precision channel.
6. Colony Mass (`k=8`): existing credited `colony_body.webp`, slow asymmetric mass and independently legible three-shot organ volley.

The production implementation deliberately reuses the four approved painted bodies where they already fit the grammar and adds procedural anatomy where a silhouette was missing. All six remain original Spore Wars forms. Missing WebPs retain the existing procedural fallbacks.

## Brood Lattice contract

The Brood Lattice is cached procedural Canvas art, not a raster asset. Eleven irregularly positioned nodes vary in radius, depth and colour temperature; only three are interactive. It appears faintly in the Brood Heart background before its wave-23 set-piece, then arrives after 180 fixed ticks. A travelling warm pulse reaches one selected node, which pushes forward for a 42-tick tell before a 150-tick targetable window.

Only a clearly rimmed open node accepts main shots, rockets, twin side lasers or megabombs. Non-interactive nodes remain background-only. Destroyed targets become split shells with biological impacts. Destroying all three yields 300 score and releases exactly three core pickups once. Boss/checkpoint/menu/life transitions clear the set-piece, and pause freezes every timer and position.

## Exact image-generation prompt

```text
Use case: stylized-concept
Asset type: original game creature silhouette design sheet for Spore Wars
Primary request: Create one clean 2-by-3 silhouette sheet containing exactly six radically different original alien creature families, viewed top-down for a vertical shooter. Panel 1: carapace rammer, an extremely broad shield-like crescent shell with a tiny recessed core and rear stabilizing lobes. Panel 2: tendril hunter, a very small asymmetrical central knot with three extremely long articulated hook tendrils and one shorter counter-limb. Panel 3: spore ray, a very wide thin leaf/manta diamond with swept lateral fins and two trailing root tails. Panel 4: seeder, a heavy pear-shaped abdomen with three small detached-but-nearby seed pods in a trailing arc. Panel 5: needle larva, an extremely thin segmented corkscrew body with a single enlarged spearhead at the front. Panel 6: colony mass, a large irregular multi-lobed cluster with several unequal satellite organs fused by short bridges.
Scene/backdrop: flat warm light-gray design-sheet background, six equal cells separated by fine gray rules.
Style/medium: pure filled black silhouette study, crisp hard edges, no shading, no texture, no color, no outlines inside the silhouettes.
Composition/framing: landscape sheet, 2 rows by 3 columns, one centered creature per cell, generous consistent padding; each creature faces upward; include only small plain black numerals 1 through 6 in the upper-left corners outside the creatures.
Constraints: exactly six creatures and exactly six cells; every silhouette must remain instantly distinguishable when reduced to roughly 40 pixels tall; original anatomy only; strong negative space; no text other than numerals 1–6; no logos; no watermark.
Avoid: recognizable creatures or sprites from any commercial game; spacecraft shapes; humanoids; insects with ordinary bilateral legs; repeated red balls; bead grids; realistic biological diagrams; internal details; perspective views; backgrounds or scenery.
```

Generated 2026-09-08 with OpenAI built-in image generation. No uploaded reference image and no third-party asset pack were used.
