<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-16 -->

# source/app/web

## Purpose
The Express web instance. `instance.mjs` boots the engine through `setup()`, mocks tokens when asked, wires
octokit (plus per-session octokits for OAuth-authenticated visitors), then registers every route: the static
pages, the small JSON endpoints the browser apps poll, the OAuth flow, the insights mode, and finally the
catch-all `/:login/:repository?` route that renders metrics from the query string. `index.mjs` is the
three-line entrypoint `npm start` runs. `settings.example.json` is the EJS source for the root
`settings.example.json` that users copy to `settings.json`.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Imports `instance.mjs` and calls it with `{sandbox: process.env.SANDBOX}`. |
| `instance.mjs` | 591-line `export default async function({sandbox})`. Everything below is registered here. |
| `settings.example.json` | EJS source rendered by `.github/scripts/build.mjs` into the root `settings.example.json`. The static half documents every setting with `"//"` comment keys; the EJS loop emits one block per non-core plugin listing its `token`-typed inputs plus `"enabled": false`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `statics/` | Browser assets served by explicit routes: the landing page, the embed configurator, the insights page and the OAuth pages (see `statics/AGENTS.md`) |

## For AI Agents
### Working In This Directory
Never hand-edit the root `settings.example.json`; edit the EJS source here and run `npm run build`
(`tests/ci.test.js` enforces it). `settings.json` itself is gitignored and read by `setup.mjs`, not by this
file.

Routes registered by `instance.mjs`:

| Route | Behaviour |
|-------|-----------|
| `/`, `/index.html` | `statics/index.html` |
| `/favicon.ico`, `/.favicon.png` | `statics/favicon.png` |
| `/.opengraph.png` | `statics/opengraph.png`, or a redirect to `settings.web.opengraph` |
| `/.plugins` | Non-core plugins with `{name, category, deprecated, enabled}` |
| `/.plugins.base` | The five base parts (`header`, `activity`, `community`, `repositories`, `metadata`) |
| `/.plugins.metadata` | Per-plugin `{name, icon, category, web, supports, scopes, deprecated}`; for `core` the `web` keys are stripped of their `config.` prefix |
| `/.templates` | `{name, enabled}` per template |
| `/.templates/:template` | The cached `{image, style, fonts, partials, views}` object |
| `/.templates/<t>/partials` | `express.static` over `source/templates/<t>/partials` (one mount per template) |
| `/.modes`, `/.extras`, `/.extras.logged` | Enabled modes; the extras feature list (augmented with `settings.extras.logged` for an authenticated session); the logged-in bonus list |
| `/.css/style.css`, `/.css/style.vars.css` | `statics/style.css`, `statics/style.vars.css` |
| `/.css/style.prism.css` | `node_modules/prismjs/themes/prism-tomorrow.css` |
| `/.js/app.js`, `/.js/embed/app.js`, `/.js/embed/app.placeholder.js` | The three first-party browser scripts |
| `/.js/ejs.min.js`, `axios.min.js(.map)`, `vue.min.js`, `vue.prism.min.js`, `vue-prism-component.min.js.map`, `prism.min.js`, `prism.yaml.min.js`, `prism.markdown.min.js`, `clipboard.min.js` | Served straight out of `node_modules` |
| `/.js/faker.min.js` | A generated three-statement ES module that imports faker and calls `placeholder.init` |
| `/.js/faker` | `express.static` over `node_modules/@faker-js/faker/dist/esm` |
| `/.version` | `package.json` version string |
| `/.requests` | Rate-limit counters; with a valid `x-metrics-session` header it reports that user's own quota and login, and drops the session on a 401 |
| `/.hosted` | `settings.hosted` |
| `/.uncache` | Without a token, mints a random token bound to `?user=`; with `?token=`, flushes that user's cache entry |
| `/.oauth/`, `/.oauth/index.html`, `/.oauth/script.js`, `/.oauth/redirect` | The OAuth pages, only when `settings.oauth` is set |
| `/.oauth/authenticate` | Generates a CSRF state and redirects to `github.com/login/oauth/authorize` |
| `/.oauth/authorize` | Exchanges the code for a token, reads the login, stores an in-memory session, redirects to `/.oauth/redirect` |
| `/.oauth/revoke/:session` | Deletes the grant through the GitHub applications API and drops the session |
| `/.oauth/enabled` | `true` or `false` so the browser apps can hide the button |
| `/about/*` | Redirect (302, `res.redirect` default) to `/insights/*` |
| `/insights/`, `/insights/index.html`, `/insights/:login` | `statics/insights/index.html` |
| `/insights/.statics/*` | `express.static` over `statics/insights` |
| `/insights/query/:login/` | Starts an async insights computation, returns `202` with the plugin list, caches the JSON under `insights.<login>` |
| `/insights/query/:login/:plugin/` | Returns that plugin's cached partial result, or `204` while it is still pending |
| `/embed/`, `/embed/index.html` | `statics/embed/index.html` |
| `/.placeholders` | `express.static` over `statics/embed/placeholders` |
| `/:login/:repository?` | The render route. Logins starting with `.` or containing `/` fall through to the next handler |
| `/.control/stop` | `POST`, only when `settings.control.token` is set; requires that token in the `Authorization` header and exits the process after five seconds |

Mode gating. `settings.modes` defaults to `["embed", "insights"]`. A disabled mode replaces its routes with a
`405`, so `/embed/*` or `/insights/*` answer "Method not allowed" instead of 404.

Rate limiting and caching. Two layers: a fixed `limiter` (60 requests per minute, effectively unlimited when
`debug` is on) on the cheap metadata routes, and the configurable `settings.ratelimiter` (passed straight to
`express-rate-limit`, `max: 0` disables it, `trust proxy` is set) applied only to the render and insights
routes. That limiter skips requests already served from cache. A middleware sets `Cache-Control` from
`?cache=` or `settings.cached`. Renders are memoised in `memory-cache` keyed by login; `settings.maxusers`
caps the number of distinct cached users and answers `503` beyond it. A `pending` map de-duplicates concurrent
requests for the same login (bypassed in debug and mocked modes).

Sandbox mode. `SANDBOX=true npm start` passes `sandbox` into `setup()`, which skips reading `settings.json`
entirely, and then forces `{sandbox: true, optimize: true, cached: 0, "plugins.default": true, extras:
{default: true}}`. It also implies mocked data.

Mocked mode. `settings.mocked` (or sandbox) swaps in `tests/mocks/index.mjs` and fills every plugin's missing
token settings with `MOCKED_TOKEN`; the value `"force"` overwrites even real tokens. `mocks()` now takes
`{graphql, rest, token}` and wraps every api object it is handed; this file calls it once, without a token,
which behaves as before. Only its axios/rss/google-maps global patches are installed once per process.

Single account only. Multi-account rendering is an action feature: `conf.accounts` is built from the
multi-valued `token` input in `source/app/action/index.mjs`, and this file never sets it, so
`source/app/metrics/merge.mjs` is never reached from a web request and `user.accounts` stays undefined. A
visitor renders exactly one login, as before.

Settings keys read here: `token`, `maxusers`, `restricted`, `debug`, `cached`, `port`, `ratelimiter`,
`plugins`, `plugins.default`, `mocked`, `modes`, `outputs`, `templates.enabled`, `hosted`, `oauth.{id,
secret, url}`, `api.{rest, graphql}`, `control.token`, `extras.{default, features, logged}`, `web.opengraph`,
`repositories`, `padding`, `optimize`, `debug.headless`, `notoken`.

Render route specifics. The query string is the `q` object. A second path segment becomes `repo` and switches
the template to `repository` unless one was given. `restricted` is an allow-list of logins. An authenticated
session adds `settings.extras.logged` permissions to a shallow copy of `conf` for that request only.
`config.presets` is honoured only when the `metrics.setup.community.presets` extra is granted. The output
format is clamped to `settings.outputs`. Error mapping: `user not found` to 404, `unsupported template` to
400, `not supported for: ...` to 406, GitHub timeout errors to 500 with the failing request name, everything
else to 500.

### Testing Requirements
`npm run test-metrics` runs the "Web instance" describe block of `tests/metrics.test.js` against this module
with mocked APIs. Manual run: `npm start` after copying `settings.example.json` to `settings.json` (set
`"mocked": true` to avoid burning quota), or `SANDBOX=true npm start`.

### Common Patterns
Every user-supplied path segment is stripped of `\n` and `\r` before being logged or used, and validated
against `/^[-\w]+$/i`. Debug logs are `metrics/app/<login> > ...` and `metrics/app/oauth > ...`. Sessions are
logged by their first six characters only.

## Dependencies
### Internal
`../metrics/index.mjs`, `../metrics/setup.mjs`, `../metrics/presets.mjs`, `../../../tests/mocks/index.mjs`,
`statics/**`, `source/templates/*/partials`, and several `node_modules` paths resolved through
`conf.paths.node_modules`.

### External
`express`, `express-rate-limit`, `compression`, `memory-cache`, `axios`, `@octokit/graphql`, `@octokit/rest`,
Node `crypto`/`url`/`util`. External APIs: `github.com/login/oauth/*` and `api.github.com` for the OAuth flow.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
