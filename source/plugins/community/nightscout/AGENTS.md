<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# nightscout

## Purpose
Community plugin that displays recent blood glucose readings from a self-hosted
[Nightscout](http://nightscout.info) site. Nightscout is an open-source continuous glucose monitor
relay, so the plugin points at a URL the user controls rather than a shared service, and decorates each
reading with a trend arrow, a UTC timestamp and an alert level derived from user-configured thresholds.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Normalises the URL (adds a trailing `/`, rewrites `http://` to `https://`, prefixes a bare host with `https://`), rejects an empty URL or the literal metadata default `https://example.herokuapp.com` with `Nightscout URL is not set`, clamps `datapoints` up to at least 1, then `GET <url>api/v1/entries.json?count=<datapoints>`. For each entry it adds `arrowHumanReadable` (from `direction` via the local `directionArrow` helper), `timeUTCHumanReadable` (`HH:MM` UTC via the local `addZero` helper), and `color`/`alert`. Returns `{data}` reversed, so oldest reading first. |
| `metadata.yml` | `category: community`, `authors: [legoandmars]`, `supports: [user]`, `scopes: []`. Six inputs and a non-affiliation disclaimer. |
| `examples.yml` | One unnamed example reading `plugin_nightscout_url` from a `NIGHTSCOUT_URL` secret, with `prod.skip: true`. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_nightscout` (boolean), `plugin_nightscout_url` (string, default
  `https://example.herokuapp.com` which the code treats as unset), `plugin_nightscout_datapoints`
  (number, default 12, `min: 0`, `zero: disable`), and four thresholds:
  `lowalert` 80, `highalert` 180, `urgentlowalert` 50, `urgenthighalert` 250. No token, no extras gating.
- The `zero: disable` annotation on `datapoints` is documentation only. `index.mjs` forces
  `datapoints <= 0` to `1`, so zero does not disable anything; it fetches a single reading.
- Alert colors are the GitHub contribution-graph greens: `#40c463` normal, `#30a14e` high/low,
  `#216e39` urgent high/low. There is a `TODO` in the file noting these should probably be red and
  yellow instead. Changing them alters every rendered output.
- `directionArrow` maps the Nightscout `direction` enum (`DOUBLEUP`, `SINGLEUP`, `FORTYFIVEUP`, `FLAT`,
  `FORTYFIVEDOWN`, `SINGLEDOWN`, `DOUBLEDOWN`, `NONE`, `NOT COMPUTABLE`, `RATE OUT OF RANGE`) to Unicode
  arrows. Unknown values fall through to an empty string rather than throwing.
- The plugin mutates `resp.data[i]` in place, which is fine because the response object is local, but do
  not extend the pattern to the shared `data` argument.
- Timestamps are formatted in UTC, not in the user's timezone. There is no timezone option.
- A Nightscout site may require an `API-SECRET` or token query parameter. This plugin sends neither, so
  it only works against an instance whose `/api/v1/entries.json` is readable unauthenticated.

### Testing Requirements
- Case file: `tests/cases/nightscout.plugin.yml`, pinned to
  `plugin_nightscout_url: https://testapp.herokuapp.com/`.
- Mock: `tests/mocks/api/axios/get/nightscout.mjs` matches `^https:..testapp.herokuapp.com.*$` and
  returns 12 faker-generated `sgv` entries (40-400) with random `direction` values, all stamped at the
  same 5-minute interval. The mock URL must stay `testapp`, since `example.herokuapp.com` is rejected by
  the plugin before any request is made.
- `npm run test-metrics` runs the case. `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.nightscout` or a false `enabled(...)`, typed
  options from `imports.metadata.plugins.nightscout.inputs({data, account, q})`, everything wrapped in
  `try {} catch (error) { throw imports.format.error(error) }`.
- Unlike most plugins here, it defines module-level helper functions (`addZero`, `directionArrow`) below
  the default export rather than inlining them.
- Errors are thrown as `{error: {message}}` literals for `imports.format.error`.

## Dependencies
### Internal
- `imports.axios`, `imports.format.error`, `imports.metadata` from `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/nightscout.ejs` (classic template only).

### External
- A user-supplied Nightscout instance, endpoint `GET /api/v1/entries.json?count=<n>`. No npm package
  beyond `axios`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
