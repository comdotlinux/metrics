<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# tests

## Purpose
The whole automated test surface of the project. Three independent jest suites live here: `metrics.test.js`
renders every generated case in `cases/` through both front-ends with the GitHub APIs replaced by `mocks/`,
`ci.test.js` guards contribution rules by diffing the branch against `origin/master`, and `presets.test.js`
validates the community presets hosted on the separate `presets` branch. Everything is CommonJS (`require`)
even though the application is ESM `.mjs`, because jest runs with `transform: {}` and no ESM support, so ESM
values are pulled in by spawning `node` subprocesses. Jest config lives in `package.json` (`testEnvironment:
node`, `testTimeout: 60000`, no transform).

## Key Files
| File | Description |
|------|-------------|
| `metrics.test.js` | Main suite. Loads `action.yml` for input defaults, loads plugin/template metadata by spawning `node --input-type=module --eval 'import metadata from "./source/app/metrics/metadata.mjs"'` and parsing the JSON it prints, then builds a flat test index from `cases/<name>.<plugin\|template>.yml` for every entry in `metadata.plugins` and `metadata.templates`. Runs each case three ways (see below). `beforeAll` starts the web instance and removes `source/templates/@classic`; `afterAll` kills it and removes that directory again. |
| `ci.test.js` | No rendering. Uses `simple-git` to compute `git diff origin/master... --name-status` and asserts that modified (`M`) files do not include auto-generated paths (`README.md`, `source/plugins/README.md`, `source/plugins/community/README.md`, `source/templates/README.md`, `action.yml`, `settings.example.json`, `tests/cases/*`, `.github/workflows/examples.yml`, `.github/readme/partials/documentation/compatibility.md`). When `process.env.PR_AUTHOR` is not `lowlighter` it also forbids edits to repository-level files (`.github/config/*`, `.github/scripts/*`, `.github/workflows/*`, `LICENSE`, `ARCHITECTURE.md`, `SECURITY.md`, `tests/ci.test.js`, `source/.eslintrc.yml`, `vercel.json`, and others). A last block pushes template changes towards community templates. |
| `presets.test.js` | Clones `https://github.com/$REPO.git --branch $HEAD_REF --single-branch` into `.presets/` at the repo root when that directory is missing (defaults `lowlighter/metrics` and `presets`; both env values are regex-validated before being passed to `git clone`). For every non-dotted directory it loads `preset.yml`, loads `@schema/<preset.schema>.yml`, and emits one test per schema property checking presence (`required`) and type. Type syntax supports `'literal'`, `type[]` and `type{}` suffixes. `.presets` is gitignored. |
| `secrets.json` | Read only by `.github/scripts/build.mjs` (do not read or print it; a permission rule blocks it). It is a JSON object mapping GitHub Actions secret names to harmless mock values. `build.mjs` loads it and attaches `$regex` = the pattern matching `${{ secrets.NAME }}`; when generating the `test` variant of an example, every `with:` value matching that pattern is textually replaced by `secrets[NAME]`. That is how `token: ${{ secrets.METRICS_TOKEN }}` in an `examples.yml` becomes `token: MOCKED_TOKEN` in `cases/`. The `prod` variant keeps the `${{ secrets.* }}` placeholder so the generated `.github/workflows/examples.yml` reads real repository secrets. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `cases/` | 54 generated yml files, one per plugin and per template, consumed by `metrics.test.js` (see `cases/AGENTS.md`) |
| `mocks/` | Mocked GraphQL, REST, axios, rss-parser and google-maps layers injected by both front-ends when mocked data is requested (see `mocks/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- `metrics.test.js` runs the same index of cases through three `describe` blocks:
  - **GitHub Action** spawns `node source/app/action/index.mjs` as a child process with `INPUT_*` env vars built
    from `action.yml` defaults merged with the case `with:` block, plus `GITHUB_REPOSITORY=lowlighter/metrics`.
    It forces `plugins_errors_fatal: true`, `dryrun: true`, `use_mocked_data: true`, `verify: true`, `retries: 1`.
    Exit code 0 passes; otherwise stdout and stderr are printed and the test rejects.
  - **Web instance** spawns `node source/app/web/index.mjs` with `SANDBOX=true` once in `beforeAll`, waits for
    `Server ready !` on stdout, then issues `GET http://localhost:3000/lowlighter?<query>` and asserts HTTP 200.
    Case keys are translated from action form to query form by stripping the `plugin_` prefix and replacing `_`
    with `.` (`plugin_activity_limit` becomes `activity.limit`).
  - **Web instance (placeholder)** `require`s `source/app/web/statics/embed/app.placeholder.js` (a browser script
    that assigns `globalThis.placeholder`), calls `placeholder.init({faker, ejs, axios})` with an axios shim that
    prefixes `http://localhost:3000`, and asserts the returned SVG is a string. This block only runs the
    `classic` and `terminal` templates; the other two blocks also run `repository` with `{repo: "metrics"}`.
- Skip rules per case are computed while building the index, not written in the yml: a template is skipped when
  `metadata.templates[template].readme.compatibility[name]` is falsy, and `repository` is additionally skipped
  when the plugin or template `metadata.yml` does not list `repository` under `supports`. A case with a `modes`
  array only runs in the listed modes (`action`, `web`, `placeholder`); an empty or absent `modes` means all.
- Per-case `timeout` (milliseconds) is passed as the third argument to jest `test()` and overrides the global
  60000 ms. Long cases such as `licenses` and `screenshot` use 1800000.
- Do not add tests by hand here. New cases come from `source/plugins/<name>/examples.yml` or
  `source/templates/<name>/examples.yml` and are materialized by `npm run build`.
- `ci.test.js` is itself on the protected list, so contributors cannot modify it. If a legitimate change makes a
  generated file dirty, run `npm run build` and commit the regenerated output rather than relaxing the test.
- `metrics.test.js` deletes `source/templates/@classic` before and after the run. That path is where a community
  template fetched at runtime is unpacked, so a stale copy would poison the suite.

### Testing Requirements
```
npm test            # jest --runInBand, all three suites, slow (renders every case three times)
npm run test-metrics # jest --runInBand metrics.test.js
npm run test-contrib # jest --runInBand ci.test.js --noStackTrace (needs PR_AUTHOR and an origin/master ref)
npm run test-presets # jest --runInBand presets.test.js --noStackTrace (clones the presets branch)
```
`--runInBand` is mandatory: the suite binds port 3000 and spawns puppeteer, so parallel workers collide.
In CI (`.github/workflows/test.yml`) `test-contrib` and `npm run linter` run on the host, while `test-metrics`
runs inside the freshly built docker image. `test-presets` runs from `.github/workflows/test.presets.yml` with
`HEAD_REF` and `REPO` inputs.

### Common Patterns
- ESM values are obtained from CommonJS by spawning node with `--input-type module --eval` and parsing stdout
  JSON. Reuse that hack rather than converting a suite to ESM.
- `action.input(vars)` uppercases every key and prefixes it with `INPUT_`, matching how `@actions/core` reads
  inputs; `action.defaults` comes from the `default:` of each entry in the generated `action.yml`.
- A single flat `tests` array of `[name, inputs, {skip, modes, timeout}]` tuples is shared by all three describe
  blocks, so adding a mode means adding a new describe block over the same array.

## Dependencies
### Internal
- `action.yml` (generated) for input names and defaults.
- `source/app/metrics/metadata.mjs` for the plugin and template registry plus template compatibility.
- `source/app/action/index.mjs` and `source/app/web/index.mjs` are spawned as subprocesses.
- `source/app/web/statics/embed/app.placeholder.js` is required directly for the placeholder block.
- `.github/scripts/build.mjs` generates `cases/` and consumes `secrets.json`.
- `mocks/index.mjs` is imported by `source/app/action/index.mjs` and `source/app/web/instance.mjs`, not by the
  test files themselves.

### External
`jest`, `js-yaml`, `axios`, `ejs`, `@faker-js/faker`, `simple-git`, plus node builtins `child_process`, `fs`,
`path`, `url`. `presets.test.js` shells out to the `git` binary.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
