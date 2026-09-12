<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/app/web/statics/embed

## Purpose
The embed configurator: the page where a visitor toggles plugins and options, sees a live preview, and copies
either a Markdown image tag or a ready-to-paste GitHub Action workflow. The preview is not rendered by the
server. `app.placeholder.js` re-implements the whole render pipeline in the browser, fetching the real
template and partials over HTTP and filling them with faker data, so the preview costs no API quota. That same
file is required directly by the jest suite, which makes it a second consumer with its own expectations.

## Key Files
| File | Description |
|------|-------------|
| `index.html` | Vue 2 template mounted on `<main>`. Header with version and sign-in, a three-tab nav (`overview`, `action`, `markdown`), a sidebar with the username field, the generate button, template picker and the plugin/option controls, and a preview pane. Loads axios, Prism plus its markdown and yaml grammars, ejs, faker (as an ES module), Vue, vue-prism-component, clipboard.js, then `app.placeholder.js` and `app.js`. |
| `app.js` | The configurator app. Fetches `/.plugins.metadata` before instantiating Vue, then on mount fetches `/.requests`, `/.templates`, `/.plugins`, `/.plugins.base`, `/.extras`, `/.version`, `/.hosted`, `/.oauth/enabled`. Builds the `url`, `embed` and `action` computed strings, tracks `unusable` options, debounces preview regeneration through `mock()`, and calls `/.uncache` before hitting the render route in `generate()`. |
| `app.placeholder.js` | 75KB client-side mock renderer. Exposes `globalThis.placeholder(set)` and `globalThis.placeholder.init(globals)`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `placeholders/` | Seven pre-rendered preview assets for the plugins the mock renderer cannot fake (see `placeholders/AGENTS.md`) |

## For AI Agents
### Working In This Directory
Adding a plugin means adding a placeholder branch. `app.placeholder.js` builds a `data` object shaped exactly
like the engine's, with one entry per plugin under `data.plugins`, then renders the template's `image.svg`
through client-side EJS. A plugin with no branch there renders empty or throws in the preview even though the
server render works.

How the mock renderer works. `load(url)` caches `GET`s of `/.templates/<selected>` and each
`/.templates/<selected>/partials/<partial>.ejs`. Server-side `await include(...)` calls are rewritten to
`await $include(...)`, a trap that fetches the partial and renders it with the same data. The data object
carries the template plumbing (`style`, `fonts`, `partials`, `errors`, `warnings`, the `s` and `f` helpers,
`meta`, `animated: false`, `large`, `columns`, `config`, `extras`, `base`, `computed`) plus a faker-generated
value for every plugin option. `distribution(length)` produces descending random weights that sum to one, used
wherever the real plugin returns percentages.

Static placeholders. `staticPlaceholder(condition, name)` fetches `/.placeholders/<name>` as text and is used
for the four assets too complex to fake: `lines.history.svg`, `stock.svg`, `stargazers.worldmap.svg` and
`isocalendar.<duration>.svg`. Two more are referenced as image URLs rather than inlined SVG:
`/.placeholders/screenshot.png` and `/.placeholders/skyline.png`.

Dependency injection. The file runs its IIFE with `{axios, faker, ejs}` taken from `globalThis`, and
`placeholder.init(globals)` re-binds them afterwards. The browser calls it from the generated
`/.js/faker.min.js` shim once the faker ES module has loaded; jest calls it with its own node-side
`axios`/`faker`/`ejs` instances. Keep both call sites working when you change the signature.

The `action` computed property in `app.js` is the template for the workflow snippet users copy. It maps
enabled plugins to `plugin_<name>: yes`, options to `plugin_<name>_<option>: <value>` (dots become
underscores, booleans become `yes`/`no`), config to `config_<key>`, and emits `token: NOT_NEEDED` when the
selected plugins need no scope. This duplicates the action-vs-web naming rule that `metadata.to.yaml`
implements server-side, so the two must stay in agreement.

Preview height. The mock SVG is emitted with `height="99999"` and a `#metrics-end` marker; a 100ms interval in
`app.js` calls `mockresize()`, which measures the marker's offset and rewrites the attribute, then removes the
marker. This mirrors what `svg.resize` does with puppeteer on the server.

Only plugins whose metadata `supports` includes `user` or `organization` are listed; repository-only plugins
are filtered out of the sidebar.

### Testing Requirements
`tests/metrics.test.js` requires `app.placeholder.js` directly, moves `globalThis.placeholder` into a local
binding, calls `placeholder.init` with node-side globals, and runs every `tests/cases/*.yml` case that does
not opt out through `modes`, asserting the render returns a string. Run it with `npm run test-metrics`; the
describe block is "Web instance (placeholder)". Interactive check: `SANDBOX=true npm start`, then open
`/embed`.

### Common Patterns
`app.js` and `app.placeholder.js` are plain browser scripts with no module syntax and no build step, but they
are linted and dprint-formatted like the rest of the repo (no semicolons, double quotes, `//Comment`). Faker
is the v7+ namespaced API (`faker.number.int`, `faker.person.*`), not the flat legacy one.

## Dependencies
### Internal
Served by `../../instance.mjs` at `/embed/` and `/.js/embed/*`; consumes `/.templates/*` and the metadata
endpoints; reads `placeholders/` through `/.placeholders`. Required by `tests/metrics.test.js`. Copied into
the preview build by `.github/scripts/preview.mjs`.

### External
Vue 2, axios, ejs, `@faker-js/faker`, Prism with its markdown and yaml grammars, vue-prism-component,
clipboard.js, all served out of `node_modules` by the instance.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
