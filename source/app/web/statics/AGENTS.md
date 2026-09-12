<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/app/web/statics

## Purpose
Browser assets for the web instance: the landing page and its Vue app, the shared stylesheet and the vendored
Primer CSS variables, and the two images used for the favicon and the Open Graph card. The subdirectories hold
the three sub-apps (embed configurator, insights page, OAuth pages). Nothing here is bundled or built; the
files are served as-is.

## Key Files
| File | Description |
|------|-------------|
| `index.html` | Landing page. Vue 2 template mounted on `<main>`: header with version and the GitHub sign-in link, one card per enabled mode (embed and insights) with a username input, and a footer. Loads `/.js/axios.min.js`, `/.js/vue.min.js`, `/.js/app.js`. |
| `app.js` | Landing-page Vue app. On mount it picks the palette from `prefers-color-scheme`, restores `session.metrics` from localStorage into the `x-metrics-session` axios header, then fetches `/.requests`, `/.version`, `/.hosted`, `/.modes` and `/.oauth/enabled`. Two methods navigate to `/insights?user=` and `/embed?user=`. `preview` and `beta` are derived from the version suffix. |
| `style.css` | Shared stylesheet for all four pages. Written against the Primer custom properties, so it works in both palettes without duplication. |
| `style.vars.css` | Vendored Primer colour variables (65KB, from `primer/css`, licence noted in the first line). Defines the `.dark` and `.light` scales that `style.css` consumes. Do not edit by hand; it is a copy of an upstream file. |
| `favicon.png` | Served at `/favicon.ico` and `/.favicon.png`. |
| `opengraph.png` | Served at `/.opengraph.png` unless `settings.web.opengraph` points elsewhere. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `embed/` | The embed configurator app and its client-side mock renderer (see `embed/AGENTS.md`) |
| `insights/` | The insights page (see `insights/AGENTS.md`) |
| `oauth/` | The GitHub OAuth pages (see `oauth/AGENTS.md`) |

## For AI Agents
### Working In This Directory
There is no blanket `express.static` over this directory. `instance.mjs` registers one explicit route per
file, so a new asset is invisible until you add its route. The mapping is:

| URL | File |
|-----|------|
| `/`, `/index.html` | `index.html` |
| `/favicon.ico`, `/.favicon.png` | `favicon.png` |
| `/.opengraph.png` | `opengraph.png` |
| `/.css/style.css` | `style.css` |
| `/.css/style.vars.css` | `style.vars.css` |
| `/.js/app.js` | `app.js` |
| `/embed/`, `/embed/index.html` | `embed/index.html` |
| `/.js/embed/app.js`, `/.js/embed/app.placeholder.js` | `embed/app.js`, `embed/app.placeholder.js` |
| `/insights/`, `/insights/index.html`, `/insights/:login` | `insights/index.html` |
| `/.oauth/`, `/.oauth/index.html`, `/.oauth/script.js`, `/.oauth/redirect` | the matching `oauth/` files |

Three subtrees are the exception and are mounted with `express.static`, so every file in them is publicly
served: `/.placeholders` over `embed/placeholders`, `/insights/.statics/` over `insights`, and
`/.templates/<template>/partials` over each template's partials directory.

Cache busting is manual: the HTML files carry `?v=3.34` on their stylesheet and script tags. Bump it when a
change must not be served from a stale browser cache.

Vue 2 is used, not Vue 3. The apps are plain `new Vue({el: "main", ...})` objects with no build step, so no
JSX, no single-file components, and no optional chaining in template expressions.

Palette handling is duplicated in each app: a `palette` data property watched with `immediate: true` swaps the
`light`/`dark` class on `<body>`, and `<main>` is bound to the same value.

`.github/scripts/preview.mjs` produces a static snapshot of this tree under `statics/preview/` for the GitHub
Pages preview: it copies `index.html`, `favicon.png` and `opengraph.png`, writes the JSON endpoints
(`.plugins`, `.plugins.base`, `.plugins.metadata`, `.modes`, `.version`, `.hosted`) as plain files, copies
`style.css`/`style.vars.css` and the vendored scripts out of `node_modules` into `.js/` and `.css/`, copies
each template's partials under `.templates/`, mirrors `embed/` and its placeholders into `embed/` and
`.placeholders/`, and duplicates `insights/` under both `insights/` and `about/`. The version it writes is
suffixed `-preview`, which is what the `preview()` computed property in each app tests for.

### Testing Requirements
Only `embed/app.placeholder.js` is directly covered by jest (`tests/metrics.test.js`, "Web instance
(placeholder)"). The other files are verified by running the instance: `npm start` (or `SANDBOX=true npm
start`) and loading `/`, `/embed`, `/insights/<login>` and `/.oauth`.

### Common Patterns
Every app reads and writes `localStorage.session.metrics` and sets it as the `x-metrics-session` axios header;
when `/.requests` comes back without a `login` the session is treated as stale and removed. All localStorage
access is wrapped in `try/catch` because the pages must also work with storage disabled.

## Dependencies
### Internal
Served by `../instance.mjs`; snapshotted by `.github/scripts/preview.mjs`.

### External
Vue 2, axios, Prism (embed page only), clipboard.js (embed page only), all served from `node_modules` by the
instance rather than from a CDN. `style.vars.css` is vendored from `primer/css`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
