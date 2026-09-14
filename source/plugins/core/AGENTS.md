<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# core

## Purpose
`core` is the global configuration namespace and the plugin scheduler. Its `metadata.yml` declares the 50
options that are not attached to any particular plugin (`token`, `user`, `repo`, `committer_*`, `filename`,
`output_action`, `template`, `config_*`, `optimize`, `retries*`, `quota_required_*`, `debug*`,
`experimental_features`, `use_mocked_data`, ...), which become the top-level inputs of `action.yml` and the
top-level keys of `settings.example.json`. Its `index.mjs` is called by every template's `template.mjs` as the
first step of rendering: it applies the timezone, display width, animation and base64 settings to `data`,
seeds `data.computed` (commit totals, license stats, registration age, token scopes, avatar, two-week
calendar), pushes every enabled plugin onto the `pending` promise list, and applies the `debug_flags`.
Because `metadata.plugin` treats `category: core` specially, these inputs are read from `q` without the
`plugin.` prefix.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | The scheduler and common-metrics computer. Reads `config.animations`, `config.display`, `config.timezone`, `config.base64` and `debug.flags`; calls `imports.metadata.templates[template].check({q, account, format})`; builds `data.computed`; loops over `imports.plugins` pushing `data.plugins[name] = await imports.plugins[name](...)` into `pending`; aggregates per-repository totals, licenses, disk usage, registration age and cakeday; reads token scopes from the `x-oauth-scopes` header of `rest.request("HEAD /")`; sets `data.meta`; applies debug flags. Always returns `null`. |
| `metadata.yml` | 611 lines, 50 inputs. `category: core`, `supports: user, organization, repository`, `scopes: []`. Inputs after the `🚧 Options below are mostly used for testing` comment carry `testing: yes` and are excluded from presets. |
| `examples.yml` | Seven examples (organization, large display, JSON output, PNG output, insights, presets, plugin error) that become the repository-root README demos and `tests/cases/core.plugin.yml`. The presets example is `prod.skip`, the plugin-error example is `test.skip`. |
| `README.md` | GENERATED from `metadata.yml` + `examples.yml` by `npm run build`. Never hand-edit. |

## For AI Agents
### Working In This Directory
- **Adding a global option** means adding it to `metadata.yml` and running `npm run build`; that regenerates
  `action.yml`, `settings.example.json`, this `README.md` and the repository-root README tables. The option is
  then readable as `imports.metadata.plugins.core.inputs({data, account, q})["<dotted.name>"]`.
- Input flags that matter beyond type/default: `global: yes` (surfaced as a server-wide setting on the web
  instance), `preset: no` (excluded from community presets), `testing: yes` (grouped as a testing option),
  `extras: [...]` (needs the listed permission in `conf.settings.extras.features`). Options gated by extras are
  `setup_community_templates` (`metrics.setup.community.templates`), `extras_css`
  (`metrics.run.puppeteer.user.css`), `extras_js` (`metrics.run.puppeteer.user.js`), `config_presets`
  (`metrics.setup.community.presets`) and `verify` (`metrics.npm.optional.libxml2`).
- **Option groups.** Auth and target: `token` (accepts the literal `NOT_NEEDED`, which sets
  `conf.settings.notoken`, and SEVERAL tokens separated by newlines or commas — see `source/app/action/AGENTS.md`),
  `user` (ignored when several tokens are given), `repo`. Output: `filename`, `config_output`
  (`auto|svg|png|jpeg|json|markdown|markdown-pdf|insights`), `markdown`, `markdown_cache`, `optimize`,
  `output_condition`. Publishing: `output_action`
  (`none|commit|pull-request[-merge|-squash|-rebase]|gist`), `committer_token`, `committer_branch`,
  `committer_message` (supports `${filename}`), `committer_gist`. Rendering: `template`, `query`, `extras_css`,
  `extras_js`, `config_display`, `config_animations`, `config_base64`, `config_padding`, `config_timezone`,
  `config_order`, `config_twemoji`, `config_gemoji`, `config_octicon`, `config_presets`. Robustness:
  `retries`, `retries_delay`, `retries_output_action`, `retries_delay_output_action`, `delay`,
  `quota_required_rest|graphql|search`, `clean_workflows`, `notice_releases`, `github_api_rest`,
  `github_api_graphql`. Testing: `use_prebuilt_image`, `plugins_errors_fatal`, `debug`, `verify`,
  `debug_flags`, `debug_print`, `dryrun`, `experimental_features` (only `--optimize-svg`), `use_mocked_data`.
- **Debug flags** (`debug_flags`, space-separated). `--cakeday` forces `computed.cakeday = true`.
  `--halloween` and `--winter` rewrite calendar colors to `--color-calendar-<scheme>-graph-day-Lx-bg` CSS
  variables, both in `computed.calendar` and, in a promise appended to `pending` that awaits the other plugins,
  inside `data.plugins.isocalendar.svg` and `data.plugins.calendar.years`; only the first of the two schemes is
  applied. With several tokens neither scheme survives: `source/app/metrics/merge.mjs` runs after the plugins and
  re-colours the merged calendars from its own default palette. `--error` throws `Failed as requested by --error flag`. The `--puppeteer-debug`,
  `--puppeteer-disable-headless` and `--puppeteer-wait-{load,domcontentloaded,networkidle0,networkidle2}` flags
  are consumed in `source/app/metrics/index.mjs`, not here, and only when `conf.settings.debug` or
  `GITHUB_ACTIONS` is set.
- **Plugin scheduling.** The loop skips any plugin whose `q[name]` is falsy, and stores a thrown error object in
  `data.plugins[name]` rather than rethrowing, so one failing plugin never aborts a render (unless
  `plugins_errors_fatal` is on). `extras` passed down to each plugin is
  `conf.settings?.extras?.features ?? conf.settings?.extras?.default ?? false`. `callbacks.plugin` is invoked
  after every plugin for the web instance's progressive rendering.
- **`data.computed`** is the shared aggregate other plugins and partials read: `commits`, `sponsorships`,
  `licenses.{favorite,used,about}`, `token.scopes`, `repositories.*` totals, `diskUsage`, `registered`,
  `registration`, `cakeday`, `calendar` (last 14 days), `avatar` (base64, with a 1x1 transparent PNG fallback).
- **`index.mjs` also named-exports `aggregate({data, computed, imports})`** — the repositories-derived part of
  `data.computed` (resets then recomputes `computed.repositories.*`, `licenses.used`/`about`/`favorite`,
  `diskUsage` and `commits` from `data.user.repositories.nodes`). It is a behaviour-preserving extraction of code
  that used to be inline, and `source/app/metrics/merge.mjs` imports it to recompute those totals over the union
  of every merged account's repositories. Changing its signature, or making it accumulate instead of resetting
  first, breaks multi-account merging.
- `config_base64: no` replaces `imports.imgb64` with an identity function for the rest of the render, so every
  plugin that inlines images is affected globally.

### Testing Requirements
- `npm run test-metrics` runs `tests/cases/core.plugin.yml` across the `classic`, `terminal` and `repository`
  templates in Action, web and placeholder modes; the presets case is web-only (`test.modes: [web]`).
- Token scopes come from `tests/mocks/api/github/rest/request.mjs` (the `HEAD /` branch returns
  `x-oauth-scopes: repo`). `config_gemoji` reads `tests/mocks/api/github/rest/emojis/get.mjs`; quota checks read
  `rest/rateLimit/get.mjs`.
- To exercise a flag by hand:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_DEBUG_FLAGS=--cakeday node source/app/action/index.mjs`.

### Common Patterns
- Options are destructured with their dotted query names:
  `const {"config.display": display, "debug.flags": dflags} = imports.metadata.plugins.core.inputs({data, account, q})`.
- Plugin results are pushed as self-contained async IIFEs onto `pending` with `try/catch/finally`, so
  `Promise.all(pending)` in `source/app/metrics/index.mjs` resolves once every plugin settled.
- Timezone offsets are derived by parsing `UTC+n` out of `toLocaleString("fr", {timeZoneName: "short"})`, and an
  unusable timezone sets `data.config.timezone.error` instead of throwing.

## Dependencies
### Internal
- `source/app/metrics/index.mjs` (builds `data`, `imports`, `pending` and reads `core` inputs itself for
  `debug.flags`, `experimental.features` and `config.order`),
  `source/app/metrics/metadata.mjs` (`inputs()`, `extras()`, and `metadata.inputs` which `action.yml` is built
  from), `source/app/metrics/setup.mjs`, `source/app/action/index.mjs` and `source/app/web/instance.mjs`
  (both consume these options), every `source/templates/*/template.mjs` (each calls `imports.plugins.core`),
  `source/plugins/base/index.mjs` (runs before it).

### External
- `@octokit/rest` for the `HEAD /` scope probe; no third-party service is contacted by this plugin itself.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
