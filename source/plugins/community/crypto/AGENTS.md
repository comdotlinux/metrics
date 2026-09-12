<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# crypto

## Purpose
Community plugin that shows the current price and a price timeline for one cryptocurrency, using the
public CoinGecko REST API. It is the crypto counterpart of the `stock` plugin and shares its charting
approach, but needs no token because the CoinGecko demo endpoints are unauthenticated.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Two `imports.axios.get` calls against `https://api.coingecko.com/api/v3`: `/coins/<id>` with `params: {market_data: true}` for name, symbol, logo, current price and 24h change, then `/coins/<id>/market_chart` with `params: {vs_currency, days, precision}` for the `prices` array of `[timestampMs, price]` pairs. Feeds those points to `imports.Graph.timeline` (`low`/`high` from the price extremes, `points: false`, `text: false`, `width: 480 * (1 + data.large)`, `height: 200`). Returns `{chart, id, precision, days, symbol, name, current_price, price_change_percentage_24h, vs_currency, logo}`. Throws `Crypto currency id is not set` on an empty id and `Crypto currency not found` when the first response has no body. |
| `metadata.yml` | `category: community`, `authors: [dajneem23]`, `supports: [user, organization, repository]`, `scopes: []`. Five inputs. `examples.default` is the placeholder image, so the generated README shows no real render. |
| `examples.yml` | One example, "Crypto Metrics" (bitcoin / usd / 1 day / precision 2), with both `prod.skip: true` and `test.skip: true`. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_crypto` (boolean), `plugin_crypto_id` (CoinGecko coin id such as `bitcoin`, required),
  `plugin_crypto_vs_currency` (default `usd`), `plugin_crypto_days` (string, default `"1"`),
  `plugin_crypto_precision` (number, default 2). No token and no extras gating.
- `id` is the CoinGecko coin slug, not a ticker. `bitcoin` works, `btc` returns a 404 that surfaces as an
  axios error.
- The human-readable range label comes from a hardcoded lookup
  `{"1": "Today", "14": "2 Weeks", "30": "1 Month", max: "All-time"}[days]`. Any other value CoinGecko
  accepts (`7`, `90`, `365`) renders as `undefined` in the output. Extend that map when adding a range.
- `vs_currency` is used twice with different meanings: as a CoinGecko query parameter for the chart and
  as an index into `coin.market_data.current_price[vs_currency]`. An unsupported currency yields
  `undefined` for the price instead of an error.
- `imports.Graph.timeline` needs `d3`, which is a regular dependency here but is declared as the extras
  feature `metrics.npm.optional.d3` in the sibling `stock` plugin. This plugin declares no extras at all.
- CoinGecko's free tier is aggressively rate limited. Repeated local runs return HTTP 429, which the
  partial renders as an error message.

### Testing Requirements
- There is effectively no CI coverage. Both `prod.skip` and `test.skip` are set on the single example, so
  `build.mjs` emits `tests/cases/crypto.plugin.yml` as an empty list (`[]`).
- There is no CoinGecko mock under `tests/mocks/api/axios/get/`. Adding one means creating
  `tests/mocks/api/axios/get/coingecko.mjs` matching `^https:..api.coingecko.com.*$` and returning both
  response shapes, then removing `test.skip` and running `npm run build` to regenerate the case file.
- Manual check: `npm start`, then
  `http://localhost:3000/<user>?base=0&crypto=1&crypto.id=bitcoin&crypto.days=1`.
- `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.crypto` or a false `enabled(...)`, typed
  options from `imports.metadata.plugins.crypto.inputs({data, account, q})`, body wrapped in
  `try {} catch (error) { throw imports.format.error(error) }`.
- Chart width scales with `data.large`, the shared "large output" flag that other chart plugins use too.
- Errors are thrown as `{error: {message}}` literals for `imports.format.error`.

## Dependencies
### Internal
- `imports.axios`, `imports.Graph.timeline`, `imports.format.error`, `imports.metadata` from
  `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/crypto.ejs` and
  `source/templates/repository/partials/crypto.ejs`.

### External
- `https://api.coingecko.com/api/v3/coins/<id>` and `.../coins/<id>/market_chart`. No API key.
- `d3` (via `imports.Graph`) for the timeline path.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
