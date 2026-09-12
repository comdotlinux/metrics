<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/readme

## Purpose
Documentation source tree. `.github/scripts/build.mjs` sets this directory as the EJS `root`
(`options: {root: __readme}`) when it renders `partials/templated/README.md` into the repository
`README.md`, which is why every `include()` inside a partial is written as an absolute
`/partials/...` path. It holds the hand-written and templated Markdown, plus the screenshots those
documents embed.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `imgs/` | 53 screenshots and GIFs referenced from the documentation partials (see `imgs/AGENTS.md`) |
| `partials/` | Markdown and EJS sources for `README.md` and the standalone guides (see `partials/AGENTS.md`) |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
