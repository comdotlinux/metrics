<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/classic

## Purpose
The default template (`index: 0`, selected when no `template` input is given) and the fallback every other
template inherits from. It mimics GitHub's visual identity: a white card of stacked `<section>` blocks built
from HTML inside an SVG `<foreignObject>`. It is also the widest template by far, shipping a partial for
every renderable plugin, which is why `source/app/metrics/setup.mjs` falls back to this directory's
`image.svg`, `style.css`, `fonts.css` and `template.mjs` whenever another template omits one of them.

## Key Files
| File | Description |
|------|-------------|
| `metadata.yml` | `name: 📗 Classic template`, `index: 0`, `supports: [user, organization]`, `formats: [svg, png, jpeg, json]`, `examples.default` points at `examples/metrics.classic.svg`. No `extends`. |
| `template.mjs` | Three lines: `export default async function(_, __, {imports}) { await imports.plugins.core(...arguments) }`. The minimal legal template processor, and the one copied into untrusted community templates. |
| `image.svg` | EJS root. Width is `960` when `large`, `100%` when `columns`, else `480`; classes carry `large`/`columns`/`no-animations`. Injects `fonts`, `style` (tagged `data-optimizable="true"`) and `extras.css`, renders a warnings banner, loops every entry of `partials/_.json` through `include()`, then the `base.metadata` footer and the `#metrics-end` marker used by puppeteer to compute height. |
| `style.css` | 32 KB, ~47 commented sections: SVG global context, large/columns display, headers, fields, avatar, commit calendar, progress bars, follow-up, labels, habits, gauges, per-plugin blocks (music, posts, topics, tweets, anilist, steam, licenses, contributors, stackoverflow, achievements, skyline, leetcode, code snippet), markdown and syntax highlighting, charts, autosize, twemoji, cake day, rainbow animation, end delimiter. |
| `fonts.css` | Empty (0 bytes). Classic relies on the system font stack; `terminal/fonts.css` is the only template shipping embedded fonts. |
| `examples.yml` | One example (`base: header, repositories`, `plugin_lines: yes`) compiled into `tests/cases/classic.template.yml`. |
| `README.md` | GENERATED. The `<!--header-->` and `<!--examples-->` blocks come from `metadata.yml` plus `examples.yml` via `npm run build`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `partials/` | 48 `.ejs` partials plus the `_.json` render order (see `partials/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- Do not edit these files. `CONTRIBUTING.md` sends new themes to community templates, and changing classic
  changes the fallback for every other template at once.
- Adding a plugin partial here is what makes the plugin show up as classic-compatible in the generated
  docs: `metadata.plugin` matches `^<plugin>(?:[.][\s\S]+)?[.]ejs$` against this `partials/` listing. A new
  partial also has to be appended to `partials/_.json` or it is never rendered.
- `style.css` is shared with every template that does not ship its own, so a selector added for one plugin
  leaks into `markdown`, `repository` (which has no `style.css`) and any community template.
- `image.svg` reads `large`, `columns` and `animated` from the core plugin's `config_display` and
  `config_animations` inputs; `warnings` is populated by `embed()` and the action front-end.
- The footer only renders when `base.metadata` is enabled and prints whether private contributions are
  included, based on `computed.token.scopes.includes("repo")`.

### Testing Requirements
- Backing case file: `tests/cases/classic.template.yml` (generated from `examples.yml`).
- `classic` is the first column of all three matrices in `tests/metrics.test.js` (action, web instance,
  web placeholder), so nearly every plugin case renders through this template. A broken partial here fails
  a large share of `npm run test-metrics`.
- Mocked single render:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=classic node source/app/action/index.mjs`.

### Common Patterns
- Section skeleton: `<% if (plugins.<name>) { %><section><h2 class="field">…</h2>` then an error branch
  printing `plugins.<name>.error.message` inside `<div class="field error">`, else the content.
- Inline octicon SVGs are pasted directly into `<h2 class="field">`; there is no icon helper.
- Layout uses `<div class="row">` with nested `<section>` columns, and `largeable`/`largeable-inline-flex`
  classes to opt a block into the `config_display: large` layout.

## Dependencies
### Internal
`source/app/metrics/setup.mjs` (fallback resolution), `source/app/metrics/index.mjs` (EJS render),
`source/app/metrics/metadata.mjs` (README header and compatibility), `source/plugins/*` (every partial
reads `plugins.<name>` produced there), `source/plugins/base` (header, activity, community, repositories,
metadata parts).

### External
`ejs`, `puppeteer` (height measurement via `#metrics-end`, PNG/JPEG conversion).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
