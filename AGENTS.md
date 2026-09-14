<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# metrics

## Purpose
`metrics` (`comdotlinux/metrics`, a fork of `lowlighter/metrics`, which is the `upstream` remote, v3.36.0, MIT) is an infographics generator for GitHub accounts, organizations and repositories. It gathers data from the GitHub GraphQL/REST APIs and ~20 third-party services through 40+ plugins, renders it with EJS templates into SVG (HTML/CSS embedded in SVG), then uses puppeteer to measure and optionally rasterize the result (PNG/JPEG), or emits JSON/Markdown/PDF. The same engine is exposed two ways: a GitHub Action (composite action running a Docker image, published as `ghcr.io/comdotlinux/metrics:{vX.Y,latest}`) and a self-hostable Express web instance. Node 22, ESM (`.mjs`), no build step for the app itself.

Fork-only feature: the action's `token` input takes SEVERAL tokens (newline- or comma-separated), and one render then combines those accounts. The first token's owner is the primary account; the others contribute nameless numbers only, folded in by `source/app/metrics/merge.mjs`. Plugins outside its `MERGED` whitelist stay primary-only, and no secondary repository, owner or organization name may ever reach `data` (JSON output would serialize it) — `data.user.accounts`, the login list, is the single exception.

Read `ARCHITECTURE.md` for the maintainer's own description of the design, and `CONTRIBUTING.md` for what kind of changes are accepted (plugins yes, core/templates/repository files restricted).

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Scripts (`start`, `test`, `test-metrics`, `test-merge`, `test-contrib`, `test-presets`, `linter`, `build`, `quickstart`, `preview`, `dev`, `indepth`) and dependencies. `jest` config inline (`testTimeout: 60000`, `--runInBand`). **No `postinstall`**: puppeteer 25 ships `install.mjs` and no `node_modules/puppeteer/install.js`, so the old hook broke `npm ci` — nothing downloads a browser any more, set `PUPPETEER_BROWSER_PATH`. `overrides: {"canvas": "^3.0.0"}` keeps `gifencoder` off canvas 2 → node-pre-gyp → the critical tar 6 subtree. |
| `action.yml` | **Generated** GitHub Action descriptor (composite action). Inputs section is templated from every plugin `metadata.yml`; `runs` embeds `source/app/action/run.sh`. Regenerate with `npm run build`; never hand-edit. |
| `settings.example.json` | **Generated** example config for the web instance (`cp settings.example.json settings.json` locally). Templated from `source/app/web/settings.example.json`. |
| `Dockerfile` | `node:22-bookworm-slim`, `LABEL org.opencontainers.image.source` pointing at the fork, + Google Chrome (for puppeteer), deno (splatoon plugin), ruby `licensed` gem (licenses plugin), python3; runs `npm ci && npm run build`; entrypoint is the action (`source/app/action/index.mjs`). The two `PUPPETEER_*` `ENV` lines sit **above** the big `RUN` so the in-image `npm ci` skips the browser download and gets the absolute Chrome path (puppeteer 25 will not resolve a bare executable name); `xz-utils` is in the apt line because `gem install licensed` builds nokogiri, which needs `xzcat`. Same image is used for tests and is what `publish-image.yml` pushes to ghcr. |
| `vercel.json` | Rewrites for the `metrics.lecoq.io` static front (proxies dynamic routes to the hosted instance). Maintainer-only. |
| `CLAUDE.md` | Claude Code entry point: imports this file, lists the exact dev/test commands and the big-picture flow, and points to the hub `AGENTS.md` files. |
| `ARCHITECTURE.md` | Project structure, rendering pipeline explanation, package reference. |
| `CONTRIBUTING.md` | Contribution matrix: plugins (changes+additions), templates (changes after discussion, new ones as community templates), presets (on `presets` branch), core (avoid, no new deps), repository files (maintainers only). |
| `README.md` | **Generated** from `.github/readme/partials/templated/README.md` + partials. |
| `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE` | Policy files. |
| `.gitattributes` | Marks generated files (`linguist-generated`) and vendored template code; useful list of what not to edit by hand. |
| `.gitignore` | Ignores `settings.json`, `.presets`, `source/templates/.community` and `source/templates/@*` (downloaded community templates), `source/app/web/statics/preview`. |
| `.dockerignore`, `.editorconfig` | `node_modules` excluded from image; 2-space indentation. |
| `.tool-versions` | Pins `nodejs 22.23.2` for asdf and mise, what `node:22-bookworm-slim` ships. Install under this version — native optional deps (`sharp`, `libxmljs2`) build against whatever `node` is first on `PATH`: `asdf install nodejs 22.23.2`, then `PUPPETEER_SKIP_DOWNLOAD=true SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `source/` | All application code: engine (incl. `app/metrics/merge.mjs`, the multi-account merge), action + web front-ends, plugins, templates (see `source/AGENTS.md`) |
| `tests/` | Jest test harness, generated test cases, API mocks (see `tests/AGENTS.md`) |
| `.github/` | Workflows, build/release/preview scripts, README partials, quickstart scaffolds (see `.github/AGENTS.md`). All ten inherited upstream workflows are guarded (every one of their 30 jobs) with `if: github.repository == 'lowlighter/metrics'` and therefore skip here, so the fork has **no PR CI** — verify locally and in Docker before pushing. `publish-image.yml` is the fork's own: on a `v*` tag it builds and pushes `ghcr.io/<repository>:vX.Y` (+ `:latest` for non-beta versions). |
| `.omc/` | Local orchestration state, untracked. Ignore. |

## For AI Agents

### Working In This Directory
- **Find the right layer first.** Data fetching/computation → `source/plugins/<name>/index.mjs`. Rendering → `source/templates/<template>/partials/<name>.ejs` (+ `style.css`). Option definitions → `source/plugins/<name>/metadata.yml` (this single file drives `action.yml`, README option tables, web UI, input validation and the `plugin_x_y` ↔ `x.y` naming). Engine/orchestration → `source/app/metrics/`. HTTP/action glue → `source/app/web/instance.mjs`, `source/app/action/index.mjs`.
- **Never hand-edit generated files** (`README.md`, `action.yml`, `settings.example.json`, `tests/cases/*`, `source/plugins/README.md`, `source/plugins/community/README.md`, `source/templates/README.md`, `.github/workflows/examples.yml`, `.github/readme/partials/documentation/compatibility.md`, and the `<!--header-->`/`<!--options-->`/`<!--examples-->` blocks in each plugin/template README). Edit the source (`metadata.yml`, `examples.yml`, `.github/readme/partials/templated/*`) and run `npm run build` (needs network: it diffs against the published `action.yml`). `tests/ci.test.js` fails PRs that modify them directly.
- **Code style is enforced**: ESLint (`source/.eslintrc.yml`) forbids semicolons, requires double quotes, `{a, b}` object spacing without inner spaces, `//Comment` with no space, stroustrup braces, max 4 params. dprint (`.github/config/dprint.json`) reformats `*.mjs`/`*.js` in CI, so formatting nits are not worth arguing about; lint errors are.
- **`@actions/*` and `@octokit/*` are ESM-only majors with no default export**: any new import of `@actions/core`, `@actions/github`, `@octokit/graphql` or `@octokit/rest` must be a namespace import (`import * as core from "@actions/core"`), never `import core from ...`. Call sites are unchanged; only the import form differs. Existing examples: `source/app/action/index.mjs`, `source/app/web/instance.mjs`, `source/app/metrics/setup.mjs`, `source/plugins/languages/analyzer/{cli,analyzer}.mjs`, `.github/scripts/release.mjs`.
- **Adding a plugin**: `npm run quickstart -- plugin <name>` scaffolds into `source/plugins/community/<name>/`; then add a partial `source/templates/classic/partials/<name>.ejs` and append `"<name>"` to `source/templates/classic/partials/_.json`; add mock data under `tests/mocks/api/...` if it calls an API; run `npm run build` to generate README/tests.
- **Secrets/tokens**: plugins that need third-party tokens declare `type: token` inputs; tests substitute `${{ secrets.X }}` placeholders with values from `tests/secrets.json`. Never read or commit real tokens; `settings.json` is gitignored.
- Directories where a stray file breaks things (so they intentionally have no AGENTS.md): `tests/mocks/api/**` (every file is `import()`ed), `source/plugins/*/queries/` (every file is loaded as a GraphQL query), `source/plugins/community/splatoon/s3si/mocks/` (every file is JSON-parsed), `.github/scripts/quickstart/{plugin,template}/` (copied into scaffolds), `.github/ISSUE_TEMPLATE/`.

### Testing Requirements
- `npm run linter` — ESLint over `source/**/*.mjs`.
- `npm run test-metrics` — full jest matrix: every `tests/cases/*.yml` case × templates (classic, terminal, repository) × modes (action, web, placeholder) with mocked APIs. Slow (tens of minutes); needs Chrome for puppeteer (`export PUPPETEER_BROWSER_PATH=/usr/bin/google-chrome-stable` — there is no `postinstall` download any more).
- **The gate actually used** is the whole suite in the image minus the contrib check: `docker build -t metrics . && docker run --rm --entrypoint="" metrics npx jest --runInBand --testPathIgnorePatterns tests/ci.test.js`. `tests/ci.test.js` diffs generated files against upstream's `origin/master` and is meaningless on the fork. Two cases fail in every mode without live web access (Music `Spotify - Random track from playlist`, 16personalities `MBTI Personality profile`) because puppeteer is not mocked and those plugins scrape the web; the other 363 tests pass.
- `npm run test-merge` — 12 jest tests over `source/app/metrics/merge.mjs`, driven by `tests/merge.fixtures.mjs` (spawned as a node script). No Chrome, no network, ~1s. Run it after touching `merge.mjs` or any of the exports it depends on: `aggregate()` in `source/plugins/core/index.mjs`, `statistics()`/`render()` in `source/plugins/isocalendar/index.mjs`, `format()` in `source/plugins/languages/index.mjs`, `history()` in `source/plugins/lines/index.mjs`.
- Quick manual check of one plugin without the whole matrix: `INPUT_TOKEN=MOCKED_TOKEN INPUT_USE_MOCKED_DATA=yes INPUT_DRYRUN=yes INPUT_PLUGINS_ERRORS_FATAL=yes INPUT_PLUGIN_<NAME>=yes node source/app/action/index.mjs`, or start `npm start` and open `http://localhost:3000/<user>?base=0&<name>=1&<name>.<option>=...`.
- `npm run test-contrib` (`tests/ci.test.js`) only makes sense in an upstream PR context (diffs against `origin/master`); on this fork it always fails, hence the exclusion above.
- Spelling: `check-spelling` (`.github/workflows/spelling.yml`) is one of the repository-guarded workflows, so it does not run here; new vocabulary still goes in `.github/actions/spelling/expect.txt`, excluded paths in `excludes.txt`.

### Common Patterns
- Plugin and template discovery is filesystem-driven (`source/app/metrics/setup.mjs` `readdir`s `source/plugins`, `source/plugins/community`, `source/templates`); a directory is a plugin if it is a directory (must contain `index.mjs`), a template if it contains `partials/_.json`.
- Options travel as one flat query object `q`: web URL params (`languages.limit=5`) and action inputs (`plugin_languages_limit: 5`) are normalized by `metadata.mjs` (`metadata.to.query` converts action-style keys to web-style, `metadata.to.yaml` the reverse).
- Every plugin returns a plain data object stored in `data.plugins.<name>`; templates read it in EJS partials. Errors are caught per plugin and rendered as an error box unless `plugins_errors_fatal`.
- Logging is `console.debug` with a `metrics/<area>/<login> > step > detail` breadcrumb prefix.

## Dependencies

### Internal
Single npm package, no workspaces. Runtime code imports only within `source/` plus `tests/mocks/index.mjs` (the action imports the mocker when `use_mocked_data` is set).

### External
- Runtime: `express`, `compression`, `express-rate-limit`, `@octokit/graphql` 9, `@octokit/rest` 22, `@actions/core` 3, `@actions/github` 9 (these four are ESM-only with no default export → namespace imports, see above), `axios`, `ejs`, `puppeteer` 25 (+ system Chrome in Docker; needs an absolute `PUPPETEER_BROWSER_PATH`), `sharp` 0.35, `png-js`, `gifencoder` (opt), `svgo`, `csso`, `purgecss`, `d3`, `jsdom`, `marked`, `sanitize-html`, `prismjs`, `js-yaml`, `memory-cache`, `minimatch`, `simple-git`, `linguist-js`, `rss-parser`, `open-graph-scraper`, `@twemoji/parser`, `emoji-name-map`, `@primer/css`, `@primer/octicons`, `xml-formatter`, `libxmljs2` 0.37 (opt), `file-type`, `@faker-js/faker` (mocks), `vue` 2 + `vue-prism-component` + `clipboard` (web UI, served from `node_modules`).
- Optional: `@googlemaps/google-maps-services-js` (stargazers worldmap), `chess.js`, `color`, `yargs-parser` (languages CLI). `rss` is declared in `optionalDependencies` but imported nowhere.
- Dev: `jest` 30, `eslint`, `dprint`. Docker image also installs `deno` (splatoon) and Ruby `licensed` (licenses plugin).
- Overrides/audit: `overrides: {"canvas": "^3.0.0"}` removes the critical tar 6 subtree that `gifencoder` → canvas 2 → node-pre-gyp pulled in. `npm audit --audit-level=high` still exits 1 on exactly one advisory — `@faker-js/faker` `helpers.fake`, used by mocks only and never called here; the fix is a major with ~130 call sites, so it is accepted, not a regression.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
