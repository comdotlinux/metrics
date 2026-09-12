<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# poopmap

## Purpose
Community plugin that reads a [PoopMap](https://poopmap.net) public share link and turns the entries
from the last N days into an hour-of-day histogram. The template draws it as a 24-bucket bar chart, so
the plugin's whole job is fetching, date filtering and bucketing.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | `GET https://api.poopmap.net/api/v1/public_links/<token>` and destructures `data.poops`. Filters entries whose `created_at` falls inside the last `days` days (also rewriting `created_at` to a `Date.toString()` along the way), buckets the survivors by local `getHours()`, and tracks the tallest bucket in `hours.max`. Returns `{poops: hours, days}`. When no token is set it returns `{poops: [], days: 7}` without calling the API and without raising an error. |
| `metadata.yml` | `category: community`, `authors: [matievisthekat]`, `supports: [user]`, `scopes: []`. Three inputs and a non-affiliation disclaimer. |
| `examples.yml` | One unnamed example reading `plugin_poopmap_token` from a `POOPMAP_TOKEN` secret, with `prod.skip: true`. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_poopmap` (boolean), `plugin_poopmap_token` (type `token`, no extras gating),
  `plugin_poopmap_days` (number restricted to 7, 30, 180 or 365, default 7).
- The "token" is the opaque id at the end of a PoopMap public share link, not an OAuth credential. It is
  interpolated straight into the URL path, so it must be URL-safe.
- Naming trap: the returned `poops` field is not the entry list. It is the histogram object
  `{"0": n, "1": n, ..., max: n}` keyed by hour, plus a `max` key used by the partial to scale bars.
  The no-token branch returns an empty array for the same field, so the partial has to tolerate both
  shapes.
- The missing-token branch is a silent no-op rather than an error, which is deliberate: the plugin
  renders an empty chart instead of an error box.
- Bucketing uses `new Date(...).getHours()`, the runner's local time. In the GitHub Action container that
  is UTC, so hours shift for users outside UTC. There is no timezone option.
- `days` is read after the token check, so an unset token also means `days` is never validated.

### Testing Requirements
- Case file: `tests/cases/poopmap.plugin.yml`, with `plugin_poopmap_token: MOCKED_TOKEN`.
- Mock: `tests/mocks/api/axios/get/poopmap.mjs` matches `^https:..api.poopmap.net.*$` and specifically
  `public_links/MOCKED_TOKEN`, returning 12 to 18 faker entries with `created_at` from
  `faker.date.past()`. Because those dates are up to a year old, most fall outside the default 7-day
  window and the rendered histogram is usually near-empty. Widen `plugin_poopmap_days` in a local run if
  you need visible bars.
- `npm run test-metrics` runs the case. `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.poopmap` or a false `enabled(...)`, then
  `try {} catch (error) { throw imports.format.error(error) }` around the body.
- The token arrives as the second-argument `token` property, not through `q`.
- Early return with a benign default (rather than throwing) is the pattern this plugin uses for a missing
  credential; most siblings throw instead.

## Dependencies
### Internal
- `imports.axios`, `imports.format.error`, `imports.metadata` from `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/poopmap.ejs` (classic template only).

### External
- `https://api.poopmap.net/api/v1/public_links/<token>`. No npm package beyond `axios`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
