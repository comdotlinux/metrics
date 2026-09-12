<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/plugins/stargazers/worldmap/atlas

## Purpose
Bundled vector basemap for the stargazers worldmap. It holds a single vendored GeoJSON file of world
country polygons at 1:50m resolution, checked into the repository so the choropleth renders offline with
no map tile service, plus a pointer to the upstream license.

## Key Files
| File | Description |
|------|-------------|
| `50m_countries.geojson` | 2.6 MB `FeatureCollection` of country `Polygon` / `MultiPolygon` features. Each feature carries an `id` and a `properties` object whose `iso_a2`, `wb_a2` and `sov_a3` fields are the country codes the renderer matches against. Derived from the Natural Earth 1:50m admin-0 dataset as redistributed by the `visionscarto-world-atlas` npm package. Listed in `.github/actions/spelling/excludes.txt` so the spell-check workflow skips it. |
| `LICENSE.md` | One line pointing at https://www.npmjs.com/package/visionscarto-world-atlas for the upstream license terms. |

## For AI Agents
### Working In This Directory
- `../index.mjs` loads this file at render time, not at import time: `JSON.parse(await imports.fs.readFile(imports.paths.join(imports.__module(import.meta.url), "atlas/50m_countries.geojson")))`. The path is hardcoded, so the filename and the `atlas/` directory name are both load-bearing.
- `d3.geoMercator().fitWidth(480, countries)` fits the projection to this exact feature collection, so swapping in a different projection source (a TopoJSON file, a different resolution) means changing the parse step in `../index.mjs` too.
- The renderer reads `properties.iso_a2` first, then `properties.wb_a2`, then the first two characters of `properties.sov_a3`. A replacement dataset must keep at least one of those properties or every country falls back to the lightest fill.
- This is vendored third-party data. Do not regenerate or reformat it casually; keep `LICENSE.md` alongside it if you do replace it.

### Testing Requirements
- Exercised indirectly by the worldmap case in `tests/cases/stargazers.plugin.yml`. There is no mock: the real file is read even in mocked runs, only the Google geocoding call is faked.
- Command: `npm run test-metrics`.

## Dependencies
### Internal
- Read only by `../index.mjs`.

### External
- Natural Earth 1:50m admin-0 countries, redistributed via the `visionscarto-world-atlas` npm package (vendored, not installed).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
