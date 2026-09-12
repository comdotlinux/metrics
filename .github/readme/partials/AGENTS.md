<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/readme/partials

## Purpose
Source of every piece of project documentation. Two kinds of file live under here: EJS templates in
`templated/`, rendered by `.github/scripts/build.mjs` against the parsed plugin and template metadata,
and plain Markdown in `documentation/`, either inlined into the generated `README.md` or linked as a
standalone guide. The repository `README.md` is assembled from these files and must never be edited
directly.

## Key Files
| File | Description |
|------|-------------|
| `license.md` | The MIT notice ("Copyright (c) 2020-present lowlighter") plus the sponsors banner pulled from the `examples` branch. Included last by `templated/README.md`, so it becomes the final section of the root `README.md`. Listed by name in `tests/ci.test.js` as maintainer-only, unlike the rest of `partials/`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `documentation/` | Hand-written guides plus the generated compatibility matrix (see `documentation/AGENTS.md`) |
| `templated/` | EJS templates rendered into `README.md` and the three index READMEs (see `templated/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- The include graph, from `build.mjs`: `templated/README.md` includes `templated/introduction.md`,
  `templated/documentation.md` and `license.md`; `templated/documentation.md` in turn includes
  `documentation/setup.md`, `templated/templates.md`, `templated/plugins.md` and
  `documentation/contributing.md`. Everything else in `documentation/` is a standalone page linked by
  URL, not inlined.
- Includes are written as `include('/partials/<path>.md')` with a leading slash because `build.mjs`
  passes `{root: .github/readme}` to `ejs.renderFile` for the README render only. That root is **not**
  set for the other four `update()` calls, so a leading-slash include inside `plugins.md`,
  `plugins.community.md`, `templates.md` or `compatibility.md` would fail to resolve.
- Links inside partials must be repository-absolute (`/.github/readme/imgs/...`, `/CONTRIBUTING.md`,
  `/source/plugins/<name>/README.md`) so they keep working once the partial is inlined into the root
  `README.md`, which sits at a different depth.
- After any change here, run `npm run build` and commit both the partial and the regenerated files.
  `tests/ci.test.js` fails a PR that ships a modified `README.md`, so never stage a hand-edited one.

### Testing Requirements
- `npm run build` (dryrun mode, the default) renders everything without committing. `npm run build -- publish`
  is what CI runs; it also commits and pushes to `master`.
- `npm run test-contrib` verifies that no generated file was modified by hand.
- The spelling workflow checks this prose. `.github/actions/spelling/excludes.txt` skips only
  `documentation/inspirations.md` and any `AGENTS.md`.

### Common Patterns
- Light/dark screenshot pairs:
  `![alt](/.github/readme/imgs/x.light.png#gh-light-mode-only)` on one line, the `.dark.png` variant
  with `#gh-dark-mode-only` on the next.
- Callouts use emoji blockquotes: `> 💡` for tips, `> ⚠️` for warnings, `> ℹ️` for notes.
- Rendered example images are linked from the `examples` branch
  (`https://github.com/lowlighter/metrics/blob/examples/metrics.*.svg`), never committed here.

## Dependencies
### Internal
- `.github/scripts/build.mjs` (renderer), `source/app/metrics/metadata.mjs` (supplies `plugins`,
  `templates`, `packaged` and `descriptor` to the EJS context), `.github/readme/imgs/` (screenshots),
  `tests/ci.test.js` (guards the generated outputs).

### External
- `ejs` (async rendering with `include`), `js-yaml` and `simple-git` by way of `build.mjs`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
