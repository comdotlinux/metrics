<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/app/web/statics/insights

## Purpose
The "insights" mode page: a dashboard rendering a user's metrics as HTML rather than as an SVG image. It reads
the JSON the engine produces for the fixed `metrics.insights` query (achievements, isocalendar, languages,
activity, notable, followup, introduction, topics, stars, reactions, repositories, sponsors, calendar) and
lays it out client-side. This same page is what the action screenshots when `config_output: insights` is
requested.

## Key Files
| File | Description |
|------|-------------|
| `index.html` | 57KB Vue 2 template mounted on `<main>`. One section per plugin, all bound to `metrics.rendered.*`, with the header and footer hidden when `?embed=1` is set. Loads `/.js/axios.min.js`, `/.js/vue.min.js` and `/insights/.statics/script.js`, and pulls `/.css/style.vars.css`, `/.css/style.css` and `/insights/.statics/style.css`. |
| `script.js` | The Vue app. Resolves the login from the last path segment (or `?user=`), then `search()` drives the two-phase fetch. Also holds `format(type, value, options)`, whose `comment` mode rewrites GitHub issue, pull request, discussion, commit and compare URLs into short `owner/repo#123` and `owner/repo@sha` forms and linkifies bare `#123` and `@user` mentions. |
| `style.css` | Page-specific styles layered on top of the shared `style.css`. Also pulled in by the OAuth page. |

## For AI Agents
### Working In This Directory
Routing. `instance.mjs` serves `index.html` for `/insights/`, `/insights/index.html` and `/insights/:login`,
and mounts this whole directory with `express.static` at `/insights/.statics/`, so any file added here is
publicly served under that prefix. `/about/*` permanently redirects to `/insights/*`. When the `insights` mode
is disabled in `settings.modes`, every `/insights/*` route answers `405`.

The two-phase fetch. `search()` calls `/insights/query/<login>`, which returns `202 {processing: true,
plugins: [...]}` and starts the computation server-side. The app then polls `/insights/query/<login>/<plugin>`
for each plugin: `base` first with 30 attempts at 5-second intervals, then all the others in parallel with 60
attempts at 10-second intervals. Each poll that returns data either seeds `metrics.rendered` (for `base`) or
merges into `metrics.rendered.plugins`. A `progress` fraction drives the loading bar. If the endpoint returns
the full object instead of `processing`, it is used directly.

localStorage mode. With `?localstorage=1` the app skips the network entirely and reads the JSON from
`localStorage["local.metrics"]`. That is how `metrics.insights.output` in `source/app/metrics/index.mjs`
renders the static HTML export: puppeteer loads `/insights/<login>?embed=1&localstorage=1`, writes the JSON
into localStorage, reloads, waits for `.container .user`, then serialises `document.querySelector("main")`
together with the three stylesheets fetched over HTTP. Changing the `.container .user` selector, the
`embed`/`localstorage` query parameters, or the `local.metrics` key breaks that export.

Per-plugin errors surface through the `warnings` computed property, which collects `error` fields out of
`metrics.rendered.plugins`.

### Testing Requirements
No jest coverage. Verify by running `SANDBOX=true npm start` and opening `/insights/<login>`, and by exercising
the export path with `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_CONFIG_OUTPUT=insights
INPUT_DRYRUN=yes node source/app/action/index.mjs`, which spawns the web instance and screenshots this page.

### Common Patterns
Same conventions as the other statics apps: Vue 2 `new Vue({el: "main"})` with no build step, palette from
`prefers-color-scheme` watched onto the `<body>` class, `session.metrics` restored from localStorage into the
`x-metrics-session` axios header, and `/.requests`, `/.version`, `/.hosted`, `/.oauth/enabled` fetched on
mount.

## Dependencies
### Internal
Served by `../../instance.mjs`; consumes `/insights/query/*`; driven by `metrics.insights.output` in
`source/app/metrics/index.mjs`. Its `style.css` is also loaded by `../oauth/index.html`. Copied into both
`insights/` and `about/` of the preview build by `.github/scripts/preview.mjs`.

### External
Vue 2 and axios, served from `node_modules` by the instance.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
