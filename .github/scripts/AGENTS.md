<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# .github/scripts

## Purpose
Node ESM scripts that maintain the repository itself: regenerating every derived file, building the
static Vercel preview of the web instance, rendering the presets gallery, screenshotting the markdown
example, and publishing GitHub releases. Each is exposed as an npm script and is either run by a CI job
or by a maintainer. None of them is part of the metrics runtime; they import the application's
`metadata.mjs` and `setup.mjs` purely to read what plugins and templates exist.

## Key Files
| File | Description |
|------|-------------|
| `build.mjs` | `npm run build`. The generator for every derived file. Takes one positional argument, `dryrun` (default) or `publish`. Loops over `metadata({log: false, diff: true})` plugins and templates, rewriting the `<!--header-->`, `<!--examples-->` and `<!--options-->` blocks in each `README.md` and writing `tests/cases/<id>.plugin.yml` / `<id>.template.yml` from the plugin's `examples.yml`. Then eight `update()` calls render EJS into `action.yml` (with `run.sh` injected as `runsh`), `settings.example.json`, `README.md`, `source/plugins/README.md`, `source/plugins/community/README.md`, `source/templates/README.md` and `.github/readme/partials/documentation/compatibility.md`, followed by `.github/workflows/examples.yml` from `files/examples.yml`. In `publish` mode it commits every staged path as `ci: auto-regenerate files` under the `github-actions[bot]` identity and pushes to `origin master`. |
| `preview.mjs` | `npm run preview`. Builds a fully static copy of the web instance under `source/app/web/statics/preview` for Vercel. Calls `setup({log: false})` to obtain `conf` and `Templates`, writes the plugin list, base parts, filtered plugin metadata (only `name`, `icon`, `category`, `web`, `supports`, `scopes`) and template descriptors as dot-files, copies every template's `partials/`, copies `style.css`, `style.vars.css` and vendored JavaScript out of `node_modules` (ejs, faker ESM bundle plus locales, axios, vue, vue-prism-component, prismjs with yaml and markdown grammars, clipboard), stamps `.version` with `-preview`, and reproduces the `embed` and `insights`/`about` sub-apps. The `.templates__` and `.templates_` names it writes are the rewrite targets in `vercel.json`. |
| `presets_examples.mjs` | `npm run presets`. Takes `dryrun` (default) or `publish`. Clones or pulls the `presets` branch into `.presets/`, spawns the web instance (`node source/app/web/index.mjs` with `SANDBOX: true`) and waits for `Server ready !` on stdout, then for each preset directory fetches `http://localhost:3000/lowlighter?config.presets=@<preset>&plugins.errors.fatal=true` and writes `example.svg` plus a `README.md` table built from the preset's `preset.yml` `name` and `description`. In `publish` mode it commits and pushes to `origin presets`. Note the query-string mapping: option keys are un-prefixed of `plugin_` and underscores become dots. |
| `markdown_example.mjs` | Run only inside the docker image by the generated `examples.yml` workflow. Launches headless puppeteer (`PUPPETEER_BROWSER_PATH`, `--no-sandbox`), opens `github.com/lowlighter/metrics/blob/examples/metrics.markdown.md`, waits for `article.markdown-body`, sleeps 4 s, measures that element's bounding box and screenshots it to `/tmp/metrics.markdown.png` with `omitBackground`. The workflow then moves the PNG into `/metrics_renders/`. |
| `release.mjs` | Run by the `publish-release` job of `ci.yml`. Reads `GITHUB_TOKEN`, `GITHUB_REPOSITORY` and `GITHUB_COMMIT_MESSAGE`, extracts a `vX.Y` version from the commit message, and searches for the single merged PR authored and assigned to `lowlighter` whose title contains `Release <version>`. Fails if zero or more than one match. Deletes any existing release and its tag (waiting 15 s after the tag push) before creating the release named `Version X.Y` with the PR body as the patch note. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `files/` | The EJS source of the generated `examples.yml` workflow (see `files/AGENTS.md`) |
| `quickstart/` | The `npm run quickstart` scaffolder and its plugin and template skeletons (see `quickstart/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- `tests/ci.test.js` blocks any PR from a non-`lowlighter` author that touches `.github/scripts/*`.
- **`dryrun` vs `publish`** is the same contract in `build.mjs` and `presets_examples.mjs`: the mode is
  `process.argv.slice(2)[0]` and defaults to `dryrun`. Both always write files to disk; the only
  difference is whether the run ends with a git `add`/`commit`/`push`. Running `npm run build` locally
  is therefore safe but will dirty your working tree.
- What `build.mjs` stages: every plugin and template `README.md`, every `tests/cases/*.yml`, plus the
  eight `update()` outputs. In `publish` mode all of them are committed to `master` in a single commit.
  `presets_examples.mjs` stages `example.svg` and `README.md` per preset and pushes to `presets`.
- `build.mjs` reads `tests/secrets.json` at startup and substitutes `${{ secrets.NAME }}` placeholders
  with real values when generating the `test` variant of each case, while the `prod` variant keeps the
  placeholder and gains `uses: lowlighter/metrics@master`, `output_action: none`, `delay: 120`,
  `if: ${{ success() || failure() }}` and defaults for `user` and `plugins_errors_fatal`. An example
  with `test.skip: true` (or `prod.skip: true`) is dropped from that environment.
- That substitution is **global** (`v.replace(new RegExp(secrets.$regex.source, "g"), ...)`). It used to
  use the non-global `secrets.$regex` directly, which replaced only the first match, so a multi-line
  input such as the multi-account `token: |` block silently kept its remaining `${{ secrets.X }}` lines
  verbatim in `tests/cases/*`. Any new multi-line input relies on the global flag; do not revert it.
- `tests/secrets.json` gained `METRICS_TOKEN_WORK` (value `MOCKED_TOKEN_WORK`, a placeholder like every
  other key in that tracked file) for the two two-token examples in
  `source/plugins/isocalendar/examples.yml`. `tests/mocks/api/github/rest/users/getAuthenticated.mjs`
  resolves `MOCKED_TOKEN_<X>` to login `x`, which is how the generated case gets a second account.
- `build.mjs` calls `metadata()` twice with different options: once up front with `{diff: true}` for the
  plugin and template loop, and once per `update()` without it. The `diff` pass compares against the
  published `action.yml`, so a fully offline run can behave differently.
- Editing these scripts without regenerating leaves the repository inconsistent; run `npm run build`
  after changing the generator or any of its inputs.

### Testing Requirements
- `npm run build` (dryrun) is the smoke test for `build.mjs`; inspect `git status` afterwards and revert
  if you did not intend the changes.
- `npm run test-contrib` verifies the generated files were not hand-edited.
- `presets_examples.mjs` needs a working `settings.json` and a free port 3000; it clones the `presets`
  branch with `GITHUB_TOKEN`, so it cannot run unauthenticated.
- `markdown_example.mjs` and `release.mjs` have no local test path; both depend on CI-only environment
  (the docker image and puppeteer for one, repository write access for the other).

### Common Patterns
- Every script resolves the repository root the same way:
  `paths.join(paths.dirname(url.fileURLToPath(import.meta.url)), "../..")`, with `quickstart/index.mjs`
  using `"../../.."` because it sits one level deeper.
- `simple-git` is configured with the bot identity
  (`github-actions[bot]` / `41898282+github-actions[bot]@users.noreply.github.com`) before any commit.
- Files to commit are accumulated in a `const staged = new Set()` and passed to `git.add([...staged])`.
- Code style matches the rest of the repository: no semicolons, double quotes, `//Comment` with no
  space. dprint formats these files, except anything under `quickstart/`.

## Dependencies
### Internal
- `source/app/metrics/metadata.mjs` (build), `source/app/metrics/setup.mjs` (preview),
  `source/app/action/action.yml` and `run.sh`, `source/app/web/settings.example.json`,
  `source/app/web/statics/**` and `source/app/web/index.mjs`, `source/templates/*/partials/`,
  `.github/readme/partials/templated/*`, `files/examples.yml`, `tests/secrets.json`, `tests/cases/`,
  `vercel.json`.

### External
- npm: `ejs`, `js-yaml`, `simple-git`, `puppeteer`, `@actions/github` (octokit). Vendored at preview
  time from `node_modules`: `@faker-js/faker`, `axios`, `vue`, `vue-prism-component`, `prismjs`,
  `clipboard`. APIs: GitHub search, releases and git push; the `presets` and `examples` branches.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
