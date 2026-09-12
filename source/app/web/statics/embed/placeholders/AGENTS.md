<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/app/web/statics/embed/placeholders

## Purpose
Seven pre-rendered preview assets used by the embed configurator for the plugins whose output is too complex
to fake client-side. `instance.mjs` mounts this directory with `express.static` at `/.placeholders`, so every
file placed here is publicly served under that prefix.

## Key Files
| File | Used by |
|------|---------|
| `lines.history.svg` | `lines` plugin preview, fetched as text and inlined |
| `stock.svg` | `stock` plugin preview, fetched as text and inlined |
| `stargazers.worldmap.svg` | `stargazers` worldmap option, 3.4MB, fetched as text and inlined |
| `isocalendar.full-year.svg` | `isocalendar` preview when `isocalendar.duration` is `full-year` |
| `isocalendar.half-year.svg` | `isocalendar` preview when `isocalendar.duration` is `half-year` |
| `screenshot.png` | Referenced as the image URL `/.placeholders/screenshot.png` in the `screenshot` plugin preview |
| `skyline.png` | Referenced as the animation URL `/.placeholders/skyline.png` in the `skyline` plugin preview |

The four SVGs and the two PNGs are read by `../app.placeholder.js`; the SVGs go through `staticPlaceholder()`,
which fetches them as text, and the PNGs are set as `src` values. The isocalendar file name is built from the
selected duration, so a new duration value needs a matching `isocalendar.<value>.svg` here.

`.github/scripts/preview.mjs` copies every file in this directory into the preview build's `.placeholders/`
folder.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
