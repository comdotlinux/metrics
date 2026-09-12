<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates

## Purpose
Every visual theme metrics can render lives here. A template is a directory that owns the outer SVG
document, the CSS, and one EJS partial per plugin; plugins produce data, templates decide how that data
looks. `source/app/metrics/setup.mjs` auto-discovers templates by scanning this directory and keeping any
child that contains `partials/_.json`; there is no registry to edit. `source/app/metrics/metadata.mjs`
reads every `metadata.yml` here (even directories `setup.mjs` skips) to build the typed template list, the
plugin/template compatibility matrix, and the generated `README.md` headers. Rendering happens in
`source/app/metrics/index.mjs`, which pulls `{image, style, fonts, views, partials}` out of
`conf.templates[template]` and runs `ejs.render(image, {...data, s, f, style, fonts}, {views, async: true})`.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | GENERATED index of the five templates, rebuilt by `npm run build`. `tests/ci.test.js` fails the build if it appears in the diff against `origin/master`. Never hand-edit. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `classic/` | Default template, GitHub-like look, 48 partials, user and organization accounts (see `classic/AGENTS.md`) |
| `community/` | Documentation-only pseudo-template explaining how to write and load external templates (see `community/AGENTS.md`) |
| `markdown/` | Renders a user-supplied markdown file instead of an SVG, exposes UPPERCASE aliases and `embed()` (see `markdown/AGENTS.md`) |
| `repository/` | Repository-scoped template, fetches a single repo and rewrites `data.user` before core runs (see `repository/AGENTS.md`) |
| `terminal/` | SSH-session look, monospace `<pre>` output with typing animations (see `terminal/AGENTS.md`) |

## For AI Agents
### Working In This Directory
The template contract, file by file:

- `metadata.yml` (required): `name`, `description`, `examples` (map of label to preview URL), `index`
  (sort order in the generated README; `community` is always pushed last), `supports` (`user`,
  `organization`, `repository`), `formats` (`svg`, `png`, `jpeg`, `json`, `markdown`, `markdown-pdf`),
  and `extends` (used only by community templates, names the template whose `template.mjs` is copied in
  when the remote one is not trusted). `supports` and `formats` are enforced at runtime by
  `metadata.templates[template].check({q, account, format})`, called from `source/plugins/core/index.mjs`.
- `template.mjs` (optional): `export default async function(login, {data, ...}, {imports})`. It runs
  before the render and MUST call `await imports.plugins.core(...arguments)`, otherwise no plugin is
  computed and the format/support checks never run. Templates use the slot to mutate `data` or `q` before
  or after core (see `repository/template.mjs` and `terminal/template.mjs`).
- `image.svg` (optional, EJS root): receives `partials`, `style`, `fonts`, `base`, `plugins`, `user`,
  `computed`, `meta`, `config`, `account`, `errors`, `warnings`, `extras.css`, plus helpers `s()`
  (pluralize) and `f()` (format). The body is HTML inside a `<foreignObject>`, and it must end with
  `<div id="metrics-end"></div>` because puppeteer measures that marker to crop the 99999px canvas.
- `style.css` / `fonts.css` (optional): injected as `<%= style %>` and `<%= fonts %>`. The style tag is
  marked `data-optimizable="true"` so CSS post-processing may purge and minify it.
- `partials/_.json` (required, this file is what makes the directory a template): a JSON array of partial
  names, without the `.ejs` suffix, in render order. `index.mjs` merges it with the user `config_order`
  input: `new Set([...order.filter(p => partials.includes(p)), ...partials])`.
- `partials/<plugin>.ejs`: one file per plugin. The file name drives documentation and test skipping.
  `metadata.plugin` marks a plugin compatible with a template when a partial matches
  `^<plugin>(?:[.][\s\S]+)?[.]ejs$`, so `base.header.ejs` and `base.repositories.ejs` all count for the `base`
  plugin. `metadata.template` uses the stricter exact `<plugin>.ejs` match for the template README icons.

Missing files fall back to `classic`: `setup.mjs` resolves `image.svg`, `style.css` and `fonts.css` per
file (`fs.existsSync(...) ? name : "classic"`) and imports `classic/template.mjs` when the template has
none. A directory without `partials/_.json` is skipped entirely by `setup.mjs`, which is why `community/`
cannot be selected with `template: community` even though it shows up in the generated README.

Community templates are cloned at runtime by `setup.mjs` when `setup_community_templates` is set:
`user/repo@branch:name[+trust]` is git-cloned into `source/templates/.community`, moved to
`source/templates/@<name>`, and selected with `template: "@<name>"`. Without `+trust` the remote
`template.mjs` is deleted and replaced by the `extends` target's one. Both `.community` and `@*` are
gitignored (`.gitignore` lines 109-111).

Do not edit the built-in templates. `CONTRIBUTING.md` requires template changes to be discussed first and
points new themes at community templates; `tests/ci.test.js` carries a test with the same message. Scaffold
a new one with `npm run quickstart -- template <name>`.

### Testing Requirements
- `npm run test-metrics` runs `tests/metrics.test.js`, which renders every case through three matrices:
  GitHub Action (`classic`, `terminal`, `repository` with `{repo: "metrics"}`), web instance (same three)
  and web placeholder (`classic`, `terminal` only).
- Every `examples.yml` here is compiled by `npm run build` into `tests/cases/<template>.template.yml`
  (`classic`, `community`, `markdown`, `repository`, `terminal`). Those files are generated, and
  `tests/ci.test.js` rejects diffs on `tests/cases/*`.
- Skip logic: for each case the test builds
  `skip = templates where !metadata.templates[t].readme.compatibility[name]`, then adds `repository` when
  the subject does not `supports: repository`. For plugin cases `name` is a plugin id, so a plugin only
  runs against templates that ship a matching partial. For template cases `name` is a template id, and
  `compatibility` only ever contains plugin ids plus `base`, so every `*.template.yml` case currently
  resolves to `test.skip` in all three matrices.
- Manual render without the test harness:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=classic node source/app/action/index.mjs`.

### Common Patterns
- A partial guards itself: `<% if (plugins.<name>) { %>` ... `<% if (plugins.<name>.error) { %>` render
  `error.message` `<% } else { %>` render content. `image.svg` never checks plugin state.
- Numbers go through `f()` and plurals through `s()`, for example
  `<%= f(plugins.lines.added) %> line<%= s(plugins.lines.added) %>`.
- Cross-partial inclusion: `lines.ejs` and `traffic.ejs` are empty stubs in `repository/` and `terminal/`
  (and `traffic.ejs` in `classic/`) that exist only so the compatibility matrix flags the plugin; the real
  markup is inlined in the base partials.
- The web instance serves partials publicly: `source/app/web/instance.mjs` mounts
  `express.static(<templates>/<name>/partials)` at `/.templates/<name>/partials`, and exposes
  `GET /.templates` and `GET /.templates/:template` as JSON.

## Dependencies
### Internal
- `source/app/metrics/setup.mjs` - discovery, file caching, community template cloning.
- `source/app/metrics/metadata.mjs` - `metadata.template()` and `metadata.plugin()` build compatibility,
  README headers and the runtime `check()`.
- `source/app/metrics/index.mjs` - EJS render, markdown branch, `embed()`, puppeteer height measurement.
- `source/plugins/core/index.mjs` - calls `imports.metadata.templates[template].check(...)`.
- `source/app/web/instance.mjs` - `/.templates` routes and static partial serving.
- `.github/scripts/build.mjs` and `.github/scripts/quickstart` - generation and scaffolding.

### External
`ejs` (templating, `include()` and `async: true`), `js-yaml` (metadata parsing), `puppeteer` (height
measurement and PNG/JPEG/PDF conversion), `marked` (description rendering in generated headers).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
