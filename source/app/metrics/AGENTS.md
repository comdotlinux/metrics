<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# source/app/metrics

## Purpose
The rendering engine and everything both front-ends need to boot it. `index.mjs` turns a `{login, q}` request
into a rendered artefact: it picks a template, runs the base plugin and the template script, awaits the plugin
promises, then renders EJS into an SVG (or JSON, Markdown, PDF, or an insights HTML page) and hands the SVG to
puppeteer for height measurement and optional raster conversion. `setup.mjs` discovers templates, plugins and
GraphQL queries from disk; `metadata.mjs` parses every `metadata.yml` into typed inputs and generated
documentation; `presets.mjs` resolves `config_presets`; `merge.mjs` folds secondary accounts into the
primary's data when several tokens were given; `utils.mjs` is the helper hub injected into every template and
plugin as `imports`.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | `metrics({login, q}, {graphql, rest, plugins, conf, die, verify, convert, callbacks, warnings}, {Plugins, Templates})`. Validates the template against `conf.settings.templates.enabled`, builds `imports` and the `data` object, honours `debug.flags`, orders partials from `config.order`, runs `Plugins.base` then the template computer, collects errors, merges secondary accounts (see `merge.mjs`), then branches per output format. Also carries `metrics.insights` (a fixed JSON query over 13 plugins) and `metrics.insights.output` (puppeteer screenshot of the local insights page). |
| `merge.mjs` | `merge(data, clone, {imports, q, login, merged})` (default export) plus `MERGED`, the whitelist of plugins that can be combined across accounts: `["isocalendar", "calendar", "languages", "followup", "lines"]`. Folds a secondary account's JSON clone into the primary's LIVE `data`. |
| `metadata.mjs` | `metadata({log, diff})` walks `source/plugins` (including `community/`) and `source/templates`, returning `{plugins, templates, packaged, descriptor, env}`. Attaches `metadata.inputs` (flat map of every declared input) and the converters `metadata.to.query` / `metadata.to.yaml`. |
| `presets.mjs` | Resolves the `config_presets` list. `@name` fetches `https://raw.githubusercontent.com/lowlighter/metrics/presets/<name>/preset.yml`, `https://` fetches the URL, anything else is read from disk but only in the action environment. Only `schema: v1` is accepted; `token` inputs and inputs marked `preset: false` are rejected. |
| `setup.mjs` | `setup({log, sandbox, community, extras})`. Loads `settings.json` (skipped in sandbox), applies defaults, optionally clones community templates, discovers templates and plugins, loads metadata, resolves modes and allowed outputs, and returns `{Templates, Plugins, conf}`. |
| `utils.mjs` | 1012-line helper hub re-exported into every plugin and template as `imports`. Groups: puppeteer launcher, formatters, HTML/emoji helpers, command runners, markdown, filters, `imgb64`, the `svg` namespace, recording helpers, `D3node` and `Graph`. |

## For AI Agents
### Working In This Directory
This is core code. CONTRIBUTING.md asks contributors to avoid changing it and to add no new dependencies;
plugin-specific logic belongs in `source/plugins/<name>/index.mjs`, not here.

Engine flow in `index.mjs`. `convert` defaults to the template's first declared format. `imports` is
`{plugins, templates, metadata, ...utils, ...utils.formatters({timeZone})}`; for markdown outputs `imgb64` is
shadowed so it returns the URL unless `{force: true}` is passed. Output branches in order: `insights` returns
early through `metrics.insights.output`; `json` serialises `data` with Sets/Maps flattened and cycles replaced
by `[Circular]`; `markdown` fetches the user's template file (a bare path is resolved against the default
branch of `<login>/<q.repo || login>`), rewrites `{{ x }}` into `{%= x %}` and renders twice, once with `<>`
delimiters and once with `{}`, exposing an async `embed(name, q)` that recursively calls `metrics()` and
returns a `<img class="metrics-cacheable" data-name=...>` data URI; `markdown-pdf` pipes that through
`svg.pdf`; everything else renders `image.svg`, applies twemoji/gemoji/octicon substitution, optimizes, and
resizes.

Multi-account merge. The seam sits in `index.mjs` between the plugin-error check and the `//JSON output`
branch. When `conf.accounts` (set by the action, one entry per token) has more than one entry, every secondary
account is recomputed by a RECURSIVE `metrics()` call with `convert: "json"`, `conf.accounts: []` (the
recursion guard), `authenticated` set to that account, and a query with every plugin disabled except
`base`/`core` and the `MERGED` whitelist. That inner call's `console.debug` is silenced unless `conf.debug`,
so the action's error-path debug flush never prints secondary plugin lines. It is fail-closed: a thrown error
or any plugin error in a secondary aborts the whole render with
`account #<N> (<login>): <plugins> failed`. The block is skipped entirely in repository mode (`q.repo`).
Afterwards `data.user.accounts` holds the login list (read by `classic/partials/base.header.ejs`) and one
debug line per enabled non-merged plugin records that it ran for the primary only.

PRIVACY INVARIANT: no secondary repository name, owner login or organization name may be written into `data` —
JSON output serialises everything in there, and `data.user.accounts` is the only field allowed to name a
secondary. `merge.mjs` therefore unions repository nodes into a transient `merged` accumulator owned by the
caller's loop, never onto `data`, and feeds it to `aggregate()` through a shallow throwaway wrapper.

`merge.mjs` imports NAMED exports from four plugins, so those four signatures are load-bearing engine API, not
plugin-internal helpers: `aggregate({data, computed, imports})` from `plugins/core`, `statistics(weeks)` and
`render(weeks, duration)` from `plugins/isocalendar`, `format(languages, {...options, imports, login})` from
`plugins/languages` and `history(weeks, imports)` from `plugins/lines`. Changing one of them breaks merging
silently, since the merge path is only covered by `npm run test-merge`, not by the render matrix.

Known approximations of the merge (documented, not bugs): merged calendar colours are re-bucketed by quartile
of the merged daily maximum rather than GitHub's per-user quantiles; `repositoriesContributedTo` and
"repositories with contributed commits" are only corrected for the overlap visible in the fetched node lists;
languages bytes can double-count a repository both accounts see under a non-default
`repositories_affiliations`; and every plugin outside `MERGED` stays primary-only, so e.g. the stargazers
chart shows the primary's stars while the merged `Stargazers` counter covers both.

Optimization and verification. `conf.settings.optimize` may be `true` or an array containing `css`, `xml`
and/or `svg`, selecting `svg.optimize.css` (purgecss on `<style data-optimizable="true">` blocks, then csso),
`svg.optimize.xml` (xml-formatter) and `svg.optimize.svg` (SVGO, gated behind the `--optimize` experimental
feature flag). Verification with `libxmljs2` (an optional dependency) sits behind `verify` plus the core
`verify` extra.

Adding an input. Declare it in the owning plugin's `metadata.yml`; `metadata.plugin` builds the parser for
you. `meta.inputs({data, q, account}, defaults)` returns the typed values keyed by query name, resolving
`q["plugin.<name>.<opt>"]`, then `q["<name>.<opt>"]`, then the raw yaml key, then the default. Type coercion:
`boolean` accepts true/on/yes/1 and false/off/no/0; `number` clamps to `min`/`max`; `array` URI-decodes then
splits on the declared `format` separator (comma, space or newline, auto-detected when several are listed),
lowercases, and filters against `values`; `string` validates against `values`; `json` parses raw or
URI-encoded text; `token` passes through. The special defaults `.user.login`, `.user.twitter` and
`.user.website` are replaced from the fetched user. `meta.inputs.action({core, preset})` is the action-side
wrapper that reads `INPUT_*`.

Naming. `metadata.to.query("plugin_isocalendar_duration")` gives `isocalendar.duration`;
`metadata.to.yaml("duration", {name: "isocalendar"})` gives `plugin_isocalendar_duration`. That is the single
place the action-vs-web naming convention lives.

Gating. `meta.enabled(enabled, {extras, error})` throws unless the plugin is enabled and its extras are
permitted. `meta.extras(input, {extras, error})` checks an input's `extras:` permission list against
`settings.extras.features` (or the legacy boolean / `extras.default`), and understands the deprecated
`extras.css`, `extras.js` and `extras.presets` switches.

Generated documentation. `metadata.plugin` also produces `meta.action` (one yaml descriptor per input, with
defaults masked as `<default-value>` except `config_presets`, `config_timezone` and `use_prebuilt_image`),
`meta.web` (the form-control descriptors the web UI consumes), and `meta.readme` (`header`, `table`, `demo`
HTML blocks). `metadata.template` produces the template README header, the plugin compatibility map derived
from `partials/<plugin>*.ejs` file names, and a `check({q, account, format})` guard. `diff: true` fetches the
`latest` branch `action.yml` so new options can be marked with a sparkle in the README table. Everything here
feeds `.github/scripts/build.mjs`; never hand-edit the generated `README.md`, `action.yml` or
`settings.example.json`.

Discovery gotchas in `setup.mjs`. A template directory is only loaded when it contains `partials/_.json`;
missing `image.svg`, `style.css`, `fonts.css` or `template.mjs` fall back to `classic`. A community template
`repo@branch:name[+trust]` is cloned into `source/templates/.community`, moved to `source/templates/@name`,
and its `template.mjs` is deleted unless `+trust` is set, in which case it is executed as-is. For plugins,
**every** file under `queries/` is read as a GraphQL query string and registered as
`conf.queries.<plugin>.<basename>`, so a non-query file placed there becomes a bogus query. When
`settings.debug` is true, templates and queries are re-read from disk on every access through getters.

### Testing Requirements
`npm run test-metrics` (jest, `tests/metrics.test.js`) covers all three lanes; `npm test` adds
`tests/ci.test.js`, which is what fails when generated files drift. Plugins are backed by the mocks in
`tests/mocks/api/**` (graphql, rest, axios, rss, google-maps), wired by `tests/mocks/index.mjs`. Cases come
from each plugin's and template's `examples.yml` via `npm run build`. The merge path has its own fast lane:
`npm run test-merge` (`tests/merge.test.js` + `tests/merge.fixtures.mjs`, no Chrome, no network, ~1s).

### Common Patterns
Debug lines are `console.debug("metrics/compute/<login> > message")` and `metrics/setup > ...`,
`metrics/inputs > ...`, `metrics/svg/<step> > ...`. Errors from plugins are collected in `data.errors` and in
resolved `pending` promises rather than thrown, unless `die` is set.

`utils.mjs` exports, by group:

| Export | What it does |
|--------|--------------|
| `axios, d3, emoji, fs, git, minimatch, opengraph, os, paths, processes, sharp, url, util` | Re-exported modules so plugins do not import them directly |
| `__module(import.meta.url)` | Directory of the calling module |
| `puppeteer` | `launch()` wrapper honouring `PUPPETEER_BROWSER_PATH`, plus mutable `headless` and `events` (wait conditions) |
| `s(value, end)` | Plural suffix helper used throughout the templates |
| `formatters({timeZone})` | Returns `format` and attaches `format.bytes`, `.percentage`, `.ellipsis`, `.date`, `.license`, `.error` |
| `shuffle`, `htmlescape`, `htmlunescape`, `stripemojis` | Small string/array helpers |
| `language({filename, patch})` | Single-file language detection through linguist-js |
| `run(command, options, {prefixed, log, debug})` | Exec a command and buffer the whole output (`wsl` prefix on win32) |
| `spawn(command, args, options, {stdout, timeout})` | Same but streams stdout line by line; requires a `stdout` callback |
| `which(command)` | Existence check built on `run` |
| `highlight(code, lang)`, `markdown(text, {mode, codelines})` | Prism highlighting and the sanitize-then-marked-then-sanitize markdown pipeline, with multiline code blocks tagged and trimmed |
| `filters.github(text, object)` | Evaluates a GitHub-style search query (`key:value`, `NOT`, `-`) against an object |
| `filters.repo`, `filters.text` | Minimatch-based repository and text filters |
| `imgb64(image, {width, height, fallback})` | Fetches or reads an image and returns a data URI, resizing through sharp; returns a 1x1 transparent PNG on failure |
| `svg.pdf` | Markdown to PDF through puppeteer with `@primer/css/dist/markdown.css` |
| `svg.resize(rendered, {paddings, convert, scripts})` | Loads the SVG in puppeteer, runs user post-scripts, measures height from the `#metrics-end` marker, applies relative and absolute padding, and converts to png/jpeg when asked |
| `svg.hash(rendered)` | Hash of the SVG with its metadata stripped, used by the action's `data-changed` condition |
| `svg.twemojis`, `svg.gemojis`, `svg.octicons` | Inline emoji and octicon substitution |
| `svg.optimize.css/.xml/.svg` | The three optimizers described above |
| `wait(seconds)`, `record({page, ...})`, `gif({page, ...})` | Frame capture helpers; `gif` lazily imports the optional `gifencoder` and falls back to a 1x1 PNG |
| `D3node` | Minimal jsdom-backed d3 container (loosely based on d3-node) |
| `Graph.timeline/.line/.graph/.pie` | SVG chart builders used by the chart-rendering plugins |

## Dependencies
### Internal
`source/plugins/**` and `source/templates/**` (read from disk, not imported statically — except `merge.mjs`,
which statically imports the named exports of `plugins/core`, `plugins/isocalendar`, `plugins/languages` and
`plugins/lines`), `settings.json`,
`package.json`, `action.yml` (read back by `metadata.mjs`), `node_modules/@primer/css` (PDF styling).
Consumed by `source/app/action/index.mjs`, `source/app/web/instance.mjs` and `.github/scripts/build.mjs`.

### External
`ejs`, `js-yaml`, `marked`, `puppeteer`, `sharp`, `axios`, `d3`, `jsdom`, `svgo`, `csso`, `purgecss`,
`xml-formatter`, `sanitize-html`, `prismjs`, `linguist-js`, `minimatch`, `simple-git`, `@primer/octicons`,
`@twemoji/parser`, `emoji-name-map`, `file-type`, `png-js`, `open-graph-scraper`, `@octokit/rest`.
Optional: `libxmljs2` (SVG verification), `gifencoder` (gif recording). External calls: GitHub raw content
(presets), `github.com` clone over https (community templates).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
