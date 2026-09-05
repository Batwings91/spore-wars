# 640K Games — brand assets

The studio mark is a DOS-style prompt: `C:\>640K GAMES` with a cursor. It is drawn from a 5×7 pixel
font as plain SVG rectangles, so it has no font dependency, scales crisply at any integer factor, and
can be edited in Inkscape/Illustrator/Figma or by hand. This folder will move to its own repo once a
second game needs it.

**Licence:** the logo is © 640K Games, all rights reserved. It is *not* covered by the CC licences that
apply to the game's third-party art (see ../CREDITS.txt).

## Files
```
gen.js            source of truth: bitmap font + layouts → svg/
export-png.js     renders svg/ → png/ with headless Chrome (no installs)
svg/
  640k-prompt*.svg         wordmark, 588×90 at 1×  (colour on black / transparent / animated cursor /
                           underscore cursor / mono-light / mono-dark)
  640k-icon*.svg           square icon, 32×32 at 1× (">640K" over "GAMES") for avatars, favicons, HUD
png/                       exports named <name>@<scale>x.png
```

## Which file to use
| Need | File |
|---|---|
| Website header, itch.io banner | `svg/640k-prompt-animated.svg` (blinking cursor) or `png/640k-prompt@2x.png` |
| On a photo or coloured ground | `640k-prompt-transparent` or `640k-prompt-mono-light` |
| Print, light backgrounds | `640k-prompt-mono-dark` |
| itch.io avatar, favicon, app icon | `png/640k-icon@8x.png` (256 px), `@4x` (128), `@2x` (64), `@1x` (32) |
| In-game HUD badge | icon at 4× render scale; boot screen: the prompt at 2 px per cell |

Colours are the game's UI palette: amber `#ffc83c`, white `#e8e8f0`, prompt grey `#a8a8a8`, ink `#0c0e1a`.

## Editing
- Change a letter: edit its rows in `F` in `gen.js` (`#` = pixel). Add a glyph the same way.
- Change colours or spacing: `INK` and the `wordmark()` / `icon()` layouts.
- Regenerate everything:
  ```
  node brand/gen.js && node brand/export-png.js
  ```
- Scaling rule: only integer multiples of the 1× size, otherwise pixels blur. In CSS use
  `image-rendering: pixelated` for PNGs; the SVGs carry `shape-rendering="crispEdges"`.
