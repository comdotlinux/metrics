<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# stock

## Purpose
Community plugin that shows a company's share price, its change since the previous close, and a price
timeline for a configurable range and interval. Data comes from the Yahoo Finance endpoints published on
RapidAPI, so it needs a RapidAPI key rather than a Yahoo account. It is the equity counterpart of the
`crypto` plugin and shares its chart helper.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Uppercases `symbol`, then two `imports.axios.get` calls to `https://yh-finance.p.rapidapi.com/stock/v2/`, both sending `headers: {"x-rapidapi-key": token}` and `params.region: "US"`: `get-profile?symbol=<symbol>` for `quoteType.shortName` (falling back to the symbol itself), and `get-chart?interval=<interval>&symbol=<symbol>&range=<duration>` for `chart.result[0]` with `meta`, `timestamp` and `indicators.quote[0].close`. Builds an SVG path with `imports.Graph.timeline` (`low`/`high` from the close extremes, `points: false`, `text: false`, `width: 480 * (1 + data.large)`, `height: 200`), converting each `timestamp` from seconds to milliseconds. Returns `{chart, currency, price, previous, delta, symbol, company, interval, duration}` where `price` is `meta.regularMarketPrice`, `previous` is `meta.previousClose` and `delta` is their difference. |
| `metadata.yml` | `category: community`, `authors: [lowlighter]`, `supports: [user, organization, repository]`, `scopes: []`. Five inputs. |
| `examples.yml` | One example, "Stock prices from Tesla" (`TSLA`), reading the key from a `STOCK_TOKEN` secret. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_stock` (boolean, gated by two extras features, `metrics.npm.optional.d3` and
  `metrics.api.yahoo.finance`), `plugin_stock_token` (type `token`, required, throws
  `API token is not set`), `plugin_stock_symbol` (required, throws `Company stock symbol is not set`),
  `plugin_stock_duration` (`1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`,
  default `1d`), `plugin_stock_interval` (`1m`, `2m`, `5m`, `15m`, `60m`, `1d`, default `5m`).
- Naming trap: `metadata.yml` labels the token "Yahoo Finance token", but the code sends it as
  `x-rapidapi-key` to `yh-finance.p.rapidapi.com`. It is a RapidAPI subscription key for the
  `yh-finance` API, obtained from rapidapi.com, not from Yahoo.
- `duration` maps to the API's `range` parameter, not to a parameter named `duration`. Yahoo rejects
  some range/interval pairs (for example `1m` over `max`); the failure surfaces as a destructuring error
  on `chart.result[0]` rather than a readable message.
- `interval` and `duration` are passed through to the template unchanged so the partial can caption the
  chart.
- Because the extras list includes `metrics.npm.optional.d3`, a web instance without that feature
  refuses the plugin outright rather than failing later inside `imports.Graph`. The sibling `crypto`
  plugin uses the same chart helper but declares no extras, which is an inconsistency, not a rule.
- The free RapidAPI tier for this API has a low monthly quota. Repeated local runs exhaust it and return
  HTTP 429.

### Testing Requirements
- Case file: `tests/cases/stock.plugin.yml`, with `plugin_stock_token: MOCKED_TOKEN` and
  `plugin_stock_symbol: TSLA`.
- Mock: `tests/mocks/api/axios/get/yahoo.mjs` matches `^https:..yh-finance.p.rapidapi.com.stock.v2.*$`
  and branches on `get-profile` versus `get-chart`, returning faker-generated company names and a
  synthetic close series. Any new endpoint added to the plugin needs a matching branch there.
- `npm run test-metrics` runs the case. `npm run linter` before committing.
- Local mocked run: `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes` with
  `INPUT_PLUGIN_STOCK=yes INPUT_PLUGIN_STOCK_TOKEN=MOCKED_TOKEN INPUT_PLUGIN_STOCK_SYMBOL=TSLA`.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.stock` or a false `enabled(...)`, typed
  options from `imports.metadata.plugins.stock.inputs({data, account, q})`, body wrapped in
  `try {} catch (error) { throw imports.format.error(error) }`.
- Deep destructuring in the request expression itself (for example
  `const {data: {chart: {result: [{meta, timestamp, indicators: {quote: [{close}]}}]}}} = await ...`) is
  the house style here; it is terse but gives poor error messages when the shape changes.
- Chart width scales with the shared `data.large` flag, as in `crypto` and `screenshot`.
- The token arrives as the second-argument `token` property, not through `q`.

## Dependencies
### Internal
- `imports.axios`, `imports.Graph.timeline`, `imports.format.error`, `imports.metadata` from
  `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/stock.ejs` and
  `source/templates/repository/partials/stock.ejs`.

### External
- `https://yh-finance.p.rapidapi.com/stock/v2/get-profile` and `.../get-chart`, authenticated with a
  RapidAPI key.
- `d3` (via `imports.Graph`) for the timeline path.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
