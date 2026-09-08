# Modular player hull — first implementation

Approved concept: four-stage ship lineup generated with OpenAI image generation, 2026-09-08. Reference is original AI-assisted artwork directed by 640K Games; no third-party sprite used to derive the new hull.

The production hull was generated from the approved first craft, with all guns, shield hardware, pods and exhaust omitted for separate composition. Two transparent-background attempts returned opaque checkerboards. A subsequent image-generation edit supplied a solid magenta sprite background; asset import keyed that background, trimmed the sprite and encoded a 79×100 transparent PNG with up to 256 colours and no dithering. Source generation ID: exec-1aa4b345-cf45-4130-be2c-f7b8737e6617.

Runtime assembly shares the bare hull, gun ports, engines, shield emitters and rocket pods between flight and next-run Workshop previews. Gun ports remain 1/2/3/5/6 and projectile origins/rates/damage are unchanged. Guns have one visible muzzle per actual shot origin. Engine and shield art changes are presentation only. The shield outlines are subtle so the ship remains readable.

The shop still sells its existing three upgrade families. Previewing one candidate retains other saved starting upgrades and never mutates save/run state. The existing rule that guns/shields apply on future runs is explicitly retained. Independent rocket purchases, lasers, new shop catalogue and new saves are later tasks.

New hull is a separate asset, player_hull.png; old player.png remains the credited fallback, followed by procedural SHIP. HUD lives and fallback title use the new hull too. Source commit must include CREDITS and tests; dist stays ignored.
