<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/readme/partials/templated

## Purpose
EJS templates that `.github/scripts/build.mjs` renders against the parsed plugin and template metadata
to produce the repository's generated Markdown. Four of the seven files are direct render targets named
in the `update()` calls of `build.mjs`; the other three are included by `README.md` and never rendered
on their own. Every EJS context here comes from `metadata({log: false})` and exposes `plugins`,
`templates`, `packaged` (the parsed `package.json`) and `descriptor` (the action input descriptor).

## Key Files
| File | Description |
|------|-------------|
| `README.md` | Renders to the repository root `README.md`. Title with the Product Hunt badge and the CI status badge, then includes `templated/introduction`, `templated/documentation` and `license` in that order. This is the only `update()` call that passes `options: {root: .github/readme}`, which is why every `include()` in this tree uses an absolute `/partials/...` path. |
| `introduction.md` | Included by `README.md`. Builds the big showcase table: the base plugin demo for user and organization accounts, then a two-column grid of every non-community, non-deprecated plugin with its render demo, then the community plugins grid (demos wrapped in `<details><summary>Render example</summary>` and credited to their `authors`), then the templates grid, and finally the embed and insights GIF cells. Counts in the headings ("Customizable with N plugins and M options") are computed from `plugins` and `descriptor.inputs`. |
| `documentation.md` | Included by `README.md`. Emits the "📚 Documentation" heading, a beta banner when `packaged.version` ends in `.0-beta` (computing the previous released version as `(version - 0.01).toFixed(2)`), then includes `documentation/setup`, `templated/templates`, `templated/plugins` and `documentation/contributing`. |
| `plugins.md` | Renders to `source/plugins/README.md`. Lists core-team plugins grouped by `category` (the `github` category is relabelled "GitHub", others are capitalised), each linking to `/source/plugins/<id>/README.md` and tagged `⚠️ deprecated` when `deprecation` is set, then a separate community section linking into `/source/plugins/community/` with author credits. |
| `plugins.community.md` | Renders to `source/plugins/community/README.md`. A two-column grid of community plugins with author credits and render demos, followed by the hand-written "📪 Creating community plugins" guide: independence from other plugins, no mutation of shared arguments, use of `imports.metadata.plugins.{name}.inputs()`, graceful error partials, no new dependencies, `imports.which()` before spawning a subprocess, and the standard partial error-handling skeleton (`plugins.{name}.error.message`). The guide escapes literal EJS delimiters as `<%= "%" %>` so they survive rendering. |
| `templates.md` | Renders to `source/templates/README.md`. One bullet per entry in `templates`, linking to `/source/templates/<id>/README.md`. |
| `compatibility.md` | Renders to `.github/readme/partials/documentation/compatibility.md`. Two HTML tables: templates against plugins using `readme.compatibility[plugin]` mapped through `{true:"✔️", false:"❌", embed:"✓"}`, and the three account modes against plugins using `supports.includes(mode)`. Both filter out the `core` plugin and the `community` category (and the `community` template). Closes with a note that the markdown template can embed any SVG metrics. |

## For AI Agents
### Working In This Directory
- Editing any file here changes generated output. Always follow with `npm run build` and commit the
  regenerated targets together with the template; `tests/ci.test.js` fails a PR that ships one without
  the other, and also fails a PR that hand-edits the target.
- The template-to-output map, straight from `build.mjs`:
  `README.md` to `README.md`, `plugins.md` to `source/plugins/README.md`, `plugins.community.md` to
  `source/plugins/community/README.md`, `templates.md` to `source/templates/README.md`,
  `compatibility.md` to `.github/readme/partials/documentation/compatibility.md`.
  `introduction.md` and `documentation.md` have no direct target; they reach output through
  `README.md`.
- Only the `README.md` render gets `root: .github/readme`. Do not add a `/partials/...` include to any
  of the other four templates, it will not resolve.
- `build.mjs` strips whitespace-only lines from the output (`content.replace(/^[ ]+$/gm, "")`), so EJS
  whitespace-control (`-%>`, `<%#  -%>`) is used liberally to keep tables clean. Keep those trailing
  markers when editing.
- To emit a literal EJS delimiter in documentation prose, use the `<%= "%" %>` escape as
  `plugins.community.md` does; writing `<% %>` directly makes the renderer try to execute it.
- `readme.demo`, `readme.header`, `readme.table` and `readme.compatibility` are produced by
  `source/app/metrics/metadata.mjs`, not by these templates. If a demo image or an options table is
  wrong, fix the plugin `metadata.yml` or `metadata.mjs`, not the EJS.

### Testing Requirements
- `npm run build` renders everything in dryrun mode (no commit); `npm run build -- publish` is what the
  `update-indexes` job of `ci.yml` runs, and it commits `ci: auto-regenerate files` to `master`.
- `npm run test-contrib` (jest `tests/ci.test.js`) checks that no generated target appears in the diff.
- A rendering error surfaces as a thrown EJS exception from `npm run build`; there is no separate lint
  for these files.

### Common Patterns
- Two-column grids are built by pairing entries (`[["even", elements[i]], ["odd", elements[i+1]]]`) and
  padding an odd-length list with a spacer cell
  (`<td align="center"><img width="900" height="1" alt=""></td>`).
- Demo images are rewritten inline with `readme.demo.replace(/<img src=/g, '<img alt="" width="400" src=')`
  so the README stays accessible and evenly sized.
- Filters exclude infrastructure entries consistently:
  `!["base", "core"].includes(key)`, `value.category !== "community"`, `!value.deprecation`.

## Dependencies
### Internal
- `.github/scripts/build.mjs` (renderer and output map), `source/app/metrics/metadata.mjs` (supplies
  `plugins`, `templates`, `packaged`, `descriptor` and all `readme.*` fields),
  `../license.md` and `../documentation/*.md` (included partials), `package.json` (version used by the
  beta banner).

### External
- `ejs` with `async: true`; the rendered output links to producthunt.com (badge), the `examples` branch
  images, and github.com/mde/ejs.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
