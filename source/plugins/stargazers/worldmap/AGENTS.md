<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/plugins/stargazers/worldmap

## Purpose
Optional sub-module of the `stargazers` plugin that turns raw stargazer profile location strings into a
480x315 choropleth SVG of the world. It geocodes each location with the Google Maps Geocoding API to get
an ISO country code, counts stars per country, then colours a Natural Earth 1:50m country polygon layer
with `d3-geo`. It is only reachable through the dynamic `await import("./worldmap/index.mjs")` in
`../index.mjs`, which happens solely when `plugin_stargazers_worldmap` is enabled and the
`metrics.api.google.maps` extra is allowed.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | `export default async function(login, {locations, sample, imports, token})`. Throws `{error: {message: "Google Maps API token is not set"}}` when `token` is falsy. Lowercases and shuffles `locations` via `imports.shuffle`, slices to `sample || Infinity`, then geocodes each distinct string through a local `Map` cache with `new Gmap().geocode({params: {address, key: token}})`, keeping the `country` component's `short_name ?? long_name`. Geocoding failures are caught, logged and counted under the `undefined` key. Renders with `D3node`: reads `atlas/50m_countries.geojson`, fits a `d3.geoMercator()` projection to the SVG width, joins `countries.features`, resolves each feature's country code from `iso_a2`, falling back to `wb_a2`, then the first two characters of `sov_a3`, and fills with `#216e39` mixed toward white by rank in the sorted list of distinct star counts. Stroke `#afafaf` at `0.6px`. Returns `d3n.svgString()`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `atlas/` | The bundled `50m_countries.geojson` country polygons plus its license note (see `atlas/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- The geojson path is resolved at runtime with `imports.paths.join(imports.__module(import.meta.url), "atlas/50m_countries.geojson")`, so `atlas/` must stay a sibling of `index.mjs`. Moving either breaks the render with a filesystem error, not a build error.
- The file header credits the port: "Mostly ported from https://github.com/dyatko/worldstar". Keep that attribution if you rewrite the renderer.
- `@googlemaps/google-maps-services-js` and `color` are `optionalDependencies` in `package.json`, so this module can fail to import on an install that skipped optional deps. That is why `../index.mjs` imports it dynamically and gates it behind the `metrics.api.google.maps` extra.
- Colour scaling is rank-based, not linear: `splits.indexOf(value) / splits.length` over the sorted distinct counts. One country with a huge count therefore does not wash out the rest.
- Countries with no stars resolve `stars.get(code)` to `undefined`, `splits.indexOf(undefined)` is `-1`, and `Math.max(0, -1)` makes them the lightest shade. Do not "fix" the `-1` without keeping that behaviour.
- Every distinct location string costs one billable Google Geocoding request; `plugin_stargazers_worldmap_sample` exists to bound that. The cache only dedupes within a single run.

### Testing Requirements
- Covered by the third case in `tests/cases/stargazers.plugin.yml` (`plugin_stargazers_worldmap: yes`, `plugin_stargazers_worldmap_token: MOCKED_TOKEN`, `plugin_stargazers_worldmap_sample: 200`).
- There is no mock file for this module. `tests/mocks/index.mjs` instead monkey-patches `Gmap.prototype.geocode` to return a faker city plus a faker `countryCode` as the `country` component's `short_name`. Location strings themselves come from `tests/mocks/api/github/graphql/stargazers.default.mjs` (`node.location`).
- Commands: `npm run test-metrics`, or `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes` with the stargazers worldmap inputs set.

### Common Patterns
- Server-side d3 rendering through the repo's own `D3node` wrapper rather than a browser DOM.
- A per-run `Map` cache in front of a paid external API.
- Defensive country-code resolution across three geojson property names because Natural Earth data is inconsistent for disputed and dependent territories.

## Dependencies
### Internal
- `../../../app/metrics/utils.mjs` for `D3node`.
- `imports.fs`, `imports.paths`, `imports.__module`, `imports.shuffle` passed in from the parent plugin.
- `atlas/50m_countries.geojson`.

### External
- `@googlemaps/google-maps-services-js` (optional dependency) and the Google Maps Geocoding API.
- `d3` (`d3.geoPath`, `d3.geoMercator`).
- `color` (optional dependency) for the `mix()` shading.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
