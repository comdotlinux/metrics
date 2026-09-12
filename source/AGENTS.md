<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source

## Purpose
All application code. Three layers: `app/` (engine + the two front-ends), `plugins/` (data collectors, one directory per plugin, filesystem-discovered), `templates/` (EJS/CSS renderers, one directory per template). Everything is Node 20 ESM (`.mjs`); there is no transpile/bundle step. The linter config for the whole tree lives here.

## Key Files
| File | Description |
|------|-------------|
| `.eslintrc.yml` | ESLint rules for `source/**/*.mjs` (`npm run linter`): `eslint:recommended` + strict style: `semi: never`, `quotes: double`, `object-curly-spacing: never`, `spaced-comment: never`, `brace-style: stroustrup`, `max-params: 4`, `max-classes-per-file: 1`, `prefer-template`, `no-var`, `eqeqeq`, `arrow-parens: as-needed`. Globals `document`/`window`/`XMLSerializer` allowed (puppeteer page scripts). Repository-level file: do not change in PRs. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | Engine (`metrics/`), GitHub Action entry (`action/`), Express web instance + browser UI (`web/`) (see `app/AGENTS.md`) |
| `plugins/` | 40 core plugins + `community/` plugins; each has `index.mjs`, `metadata.yml`, `examples.yml`, generated `README.md`, optional `queries/*.graphql` (see `plugins/AGENTS.md`) |
| `templates/` | `classic` (default), `terminal`, `markdown`, `repository`, plus `community` docs; EJS partials per plugin (see `templates/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Discovery is by directory: `app/metrics/setup.mjs` loads every directory in `plugins/` (and `plugins/community/`) as a plugin and every directory in `templates/` that has `partials/_.json` as a template. Do not leave stray directories here.
- Runtime downloads may appear under `templates/.community` and `templates/@<name>` (community templates cloned by `setup.mjs`); both are gitignored.
- Keep the layer boundary: plugins fetch and compute, templates only format `data.plugins.<name>`; `imports` (from `app/metrics/utils.mjs`) is the shared toolbox passed to both.

### Testing Requirements
`npm run linter` for style; `npm run test-metrics` for behavior (see root `AGENTS.md`).

### Common Patterns
See `plugins/AGENTS.md` for the plugin contract and `templates/AGENTS.md` for the partial/`_.json` contract.

## Dependencies

### Internal
`tests/mocks/index.mjs` is imported by `app/action/index.mjs` and `app/web/instance.mjs` when mocked data is requested.

### External
See root `AGENTS.md`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
