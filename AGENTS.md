<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# metrics

## Purpose
`metrics` (lowlighter/metrics, v3.35.0-beta, MIT) is an infographics generator for GitHub accounts, organizations and repositories. It gathers data from the GitHub GraphQL/REST APIs and ~20 third-party services through 40+ plugins, renders it with EJS templates into SVG (HTML/CSS embedded in SVG), then uses puppeteer to measure and optionally rasterize the result (PNG/JPEG), or emits JSON/Markdown/PDF. The same engine is exposed two ways: a GitHub Action (composite action running a Docker image) and a self-hostable Express web instance. Node 20, ESM (`.mjs`), no build step for the app itself.

Read `ARCHITECTURE.md` for the maintainer's own description of the design, and `CONTRIBUTING.md` for what kind of changes are accepted (plugins yes, core/templates/repository files restricted).

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Scripts (`start`, `test`, `test-metrics`, `linter`, `build`, `quickstart`, `preview`, `dev`, `indepth`) and dependencies. `jest` config inline (`testTimeout: 60000`, `--runInBand`). `postinstall` downloads puppeteer's browser. |
| `action.yml` | **Generated** GitHub Action descriptor (composite action). Inputs section is templated from every plugin `metadata.yml`; `runs` embeds `source/app/action/run.sh`. Regenerate with `npm run build`; never hand-edit. |
| `settings.example.json` | **Generated** example config for the web instance (`cp settings.example.json settings.json` locally). Templated from `source/app/web/settings.example.json`. |
| `Dockerfile` | `node:20-bookworm-slim` + Google Chrome (for puppeteer), deno (splatoon plugin), ruby `licensed` gem (licenses plugin), python3; runs `npm ci && npm run build`; entrypoint is the action (`source/app/action/index.mjs`). Same image is used for CI tests. |
| `vercel.json` | Rewrites for the `metrics.lecoq.io` static front (proxies dynamic routes to the hosted instance). Maintainer-only. |
| `CLAUDE.md` | Claude Code entry point: imports this file, lists the exact dev/test commands and the big-picture flow, and points to the hub `AGENTS.md` files. |
| `ARCHITECTURE.md` | Project structure, rendering pipeline explanation, package reference. |
| `CONTRIBUTING.md` | Contribution matrix: plugins (changes+additions), templates (changes after discussion, new ones as community templates), presets (on `presets` branch), core (avoid, no new deps), repository files (maintainers only). |
| `README.md` | **Generated** from `.github/readme/partials/templated/README.md` + partials. |
| `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE` | Policy files. |
| `.gitattributes` | Marks generated files (`linguist-generated`) and vendored template code; useful list of what not to edit by hand. |
| `.gitignore` | Ignores `settings.json`, `.presets`, `source/templates/.community` and `source/templates/@*` (downloaded community templates), `source/app/web/statics/preview`. |
| `.dockerignore`, `.editorconfig` | `node_modules` excluded from image; 2-space indentation. |
| `.tool-versions` | Pins `nodejs 20.20.2` for asdf and mise, matching the `node:20` base image in `Dockerfile`. Run `npm ci` under this version: native optional deps (`sharp`, `libxmljs2`) build against whatever `node` is first on `PATH`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `source/` | All application code: engine, action + web front-ends, plugins, templates (see `source/AGENTS.md`) |
| `tests/` | Jest test harness, generated test cases, API mocks (see `tests/AGENTS.md`) |
| `.github/` | Workflows (CI, examples, spelling, stale), build/release/preview scripts, README partials, quickstart scaffolds (see `.github/AGENTS.md`) |
| `.omc/` | Local orchestration state, untracked. Ignore. |

## For AI Agents

### Working In This Directory
- **Find the right layer first.** Data fetching/computation → `source/plugins/<name>/index.mjs`. Rendering → `source/templates/<template>/partials/<name>.ejs` (+ `style.css`). Option definitions → `source/plugins/<name>/metadata.yml` (this single file drives `action.yml`, README option tables, web UI, input validation and the `plugin_x_y` ↔ `x.y` naming). Engine/orchestration → `source/app/metrics/`. HTTP/action glue → `source/app/web/instance.mjs`, `source/app/action/index.mjs`.
- **Never hand-edit generated files** (`README.md`, `action.yml`, `settings.example.json`, `tests/cases/*`, `source/plugins/README.md`, `source/plugins/community/README.md`, `source/templates/README.md`, `.github/workflows/examples.yml`, `.github/readme/partials/documentation/compatibility.md`, and the `<!--header-->`/`<!--options-->`/`<!--examples-->` blocks in each plugin/template README). Edit the source (`metadata.yml`, `examples.yml`, `.github/readme/partials/templated/*`) and run `npm run build` (needs network: it diffs against the published `action.yml`). `tests/ci.test.js` fails PRs that modify them directly.
- **Code style is enforced**: ESLint (`source/.eslintrc.yml`) forbids semicolons, requires double quotes, `{a, b}` object spacing without inner spaces, `//Comment` with no space, stroustrup braces, max 4 params. dprint (`.github/config/dprint.json`) reformats `*.mjs`/`*.js` in CI, so formatting nits are not worth arguing about; lint errors are.
- **Adding a plugin**: `npm run quickstart -- plugin <name>` scaffolds into `source/plugins/community/<name>/`; then add a partial `source/templates/classic/partials/<name>.ejs` and append `"<name>"` to `source/templates/classic/partials/_.json`; add mock data under `tests/mocks/api/...` if it calls an API; run `npm run build` to generate README/tests.
- **Secrets/tokens**: plugins that need third-party tokens declare `type: token` inputs; tests substitute `${{ secrets.X }}` placeholders with values from `tests/secrets.json`. Never read or commit real tokens; `settings.json` is gitignored.
- Directories where a stray file breaks things (so they intentionally have no AGENTS.md): `tests/mocks/api/**` (every file is `import()`ed), `source/plugins/*/queries/` (every file is loaded as a GraphQL query), `source/plugins/community/splatoon/s3si/mocks/` (every file is JSON-parsed), `.github/scripts/quickstart/{plugin,template}/` (copied into scaffolds), `.github/ISSUE_TEMPLATE/`.

### Testing Requirements
- `npm run linter` — ESLint over `source/**/*.mjs`.
- `npm run test-metrics` — full jest matrix: every `tests/cases/*.yml` case × templates (classic, terminal, repository) × modes (action, web, placeholder) with mocked APIs. Slow (tens of minutes); needs Chrome for puppeteer (set `PUPPETEER_BROWSER_PATH` or rely on the `postinstall` download). CI runs it inside the Docker image: `docker build -t metrics . && docker run --rm --entrypoint="" metrics npm run test-metrics`.
- Quick manual check of one plugin without the whole matrix: `INPUT_TOKEN=MOCKED_TOKEN INPUT_USE_MOCKED_DATA=yes INPUT_DRYRUN=yes INPUT_PLUGINS_ERRORS_FATAL=yes INPUT_PLUGIN_<NAME>=yes node source/app/action/index.mjs`, or start `npm start` and open `http://localhost:3000/<user>?base=0&<name>=1&<name>.<option>=...`.
- `npm run test-contrib` (`tests/ci.test.js`) only makes sense in a PR context (diffs against `origin/master`).
- Spelling: `check-spelling` runs on every push (`.github/workflows/spelling.yml`); new vocabulary goes in `.github/actions/spelling/expect.txt`, excluded paths in `excludes.txt`.

### Common Patterns
- Plugin and template discovery is filesystem-driven (`source/app/metrics/setup.mjs` `readdir`s `source/plugins`, `source/plugins/community`, `source/templates`); a directory is a plugin if it is a directory (must contain `index.mjs`), a template if it contains `partials/_.json`.
- Options travel as one flat query object `q`: web URL params (`languages.limit=5`) and action inputs (`plugin_languages_limit: 5`) are normalized by `metadata.mjs` (`metadata.to.query` converts action-style keys to web-style, `metadata.to.yaml` the reverse).
- Every plugin returns a plain data object stored in `data.plugins.<name>`; templates read it in EJS partials. Errors are caught per plugin and rendered as an error box unless `plugins_errors_fatal`.
- Logging is `console.debug` with a `metrics/<area>/<login> > step > detail` breadcrumb prefix.

## Dependencies

### Internal
Single npm package, no workspaces. Runtime code imports only within `source/` plus `tests/mocks/index.mjs` (the action imports the mocker when `use_mocked_data` is set).

### External
- Runtime: `express`, `compression`, `express-rate-limit`, `@octokit/graphql`, `@octokit/rest`, `@actions/core`, `@actions/github`, `axios`, `ejs`, `puppeteer` (+ system Chrome in Docker), `sharp`, `png-js`, `gifencoder` (opt), `svgo`, `csso`, `purgecss`, `d3`, `jsdom`, `marked`, `sanitize-html`, `prismjs`, `js-yaml`, `memory-cache`, `minimatch`, `simple-git`, `linguist-js`, `rss-parser`, `open-graph-scraper`, `@twemoji/parser`, `emoji-name-map`, `@primer/css`, `@primer/octicons`, `xml-formatter`, `libxmljs2` (opt), `file-type`, `@faker-js/faker` (mocks), `vue` 2 + `vue-prism-component` + `clipboard` (web UI, served from `node_modules`).
- Optional: `@googlemaps/google-maps-services-js` (stargazers worldmap), `chess.js`, `color`, `yargs-parser` (languages CLI). `rss` is declared in `optionalDependencies` but imported nowhere.
- Dev: `jest`, `eslint`, `dprint`. Docker image also installs `deno` (splatoon) and Ruby `licensed` (licenses plugin).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
