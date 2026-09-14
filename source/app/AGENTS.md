<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# source/app

## Purpose
Application layer of metrics: the rendering engine and the two front-ends that drive it. `metrics/` holds the
engine (template selection, plugin scheduling, EJS render, puppeteer resize, output conversion) plus the
metadata, presets and setup loaders shared by everything. `action/` is the GitHub Action front-end that reads
`INPUT_*` environment variables and commits/uploads the result. `web/` is the Express instance that serves the
same engine over HTTP with a query-string API. Both front-ends build the same `q` query object and call
`metrics()` from `metrics/index.mjs`.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `action/` | GitHub Action entrypoint, its EJS `action.yml` source and the composite-action `run.sh` (see `action/AGENTS.md`) |
| `metrics/` | Rendering engine, metadata parser, presets loader, setup/discovery, shared utils (see `metrics/AGENTS.md`) |
| `web/` | Express web instance, routes, settings template and browser statics (see `web/AGENTS.md`) |

## For AI Agents
### Working In This Directory
Engine changes go in `metrics/`; a change there affects both front-ends and every plugin, so it is core code
that CONTRIBUTING.md asks you to avoid touching. Front-end-only changes (new action input plumbing, new HTTP
route) stay in `action/` or `web/`. Nothing in this tree declares plugin or template options: those come from
each `source/plugins/*/metadata.yml` and `source/templates/*/metadata.yml`, parsed by `metrics/metadata.mjs`.

Multi-account runs cross both layers: `action/index.mjs` splits the `token` input on newlines/commas, resolves
one `{login, graphql, rest, resources}` per token and puts the deduplicated list in `conf.accounts` (first =
primary), and `metrics/index.mjs` then recomputes every secondary account through a recursive `metrics()` call
and folds it into the primary `data` via `metrics/merge.mjs` before anything is rendered.

### Testing Requirements
`npm run test-metrics` runs `tests/metrics.test.js`, which exercises all three lanes (Action, web instance,
browser placeholder) against `tests/cases/*.yml` with mocked APIs. Mocked action run:
`INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes node source/app/action/index.mjs`.
Mocked web run: `npm start` with `"mocked": true` in `settings.json`.

### Common Patterns
ESM `.mjs` throughout, no semicolons, double quotes, 2-space indent, `{a, b}` object spacing, `//Comment`
without a space. Debug logs follow `console.debug("metrics/<area>/<login> > message")`.

## Dependencies
### Internal
`source/plugins/*` and `source/templates/*` (discovered at runtime by `metrics/setup.mjs`),
`tests/mocks/index.mjs` (imported directly by both front-ends for mocked mode), `settings.json` and
`package.json` at repo root.

### External
Node 22 runtime (`.tool-versions` pins `nodejs 22.23.2`, matching `node:22-bookworm-slim` in the
`Dockerfile`); see each subdirectory for its own npm dependencies.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
