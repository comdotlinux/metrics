<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/scripts/files

## Purpose
Holds the single EJS source from which `build.mjs` generates `.github/workflows/examples.yml`. It is
kept out of `.github/workflows/` on purpose: a file with EJS tags in that directory would be an invalid
workflow and GitHub would report it as broken.

## Key Files
| File | Description |
|------|-------------|
| `examples.yml` | Template for the "Publish examples" workflow. Declares the triggers (`schedule` at `0 8 1/2 * *`, `workflow_dispatch`, and `workflow_call` requiring 13 secrets: `METRICS_TOKEN`, `METRICS_TOKEN_WITH_SCOPES`, `METRICS_TOKEN_PERSONAL`, `CHESS_TOKEN`, `PAGESPEED_TOKEN`, `GOOGLE_MAP_TOKEN`, `SPLATOON_TOKEN`, `SPLATOON_STATINK_TOKEN`, `SIXTEEN_PERSONALITIES_URL`, `SPOTIFY_TOKENS`, `STOCK_TOKEN`, `TWITTER_TOKEN`, `WAKATIME_TOKEN`). Defines two jobs. `examples` checks out the repository and switches to the `examples` branch, then splices in the generated render steps with `<%- steps.split("\n").map(line => `      ${line}`).join("\n") %>`, screenshots the markdown example by running `markdown_example.mjs` inside `ghcr.io/lowlighter/metrics:master`, and republishes the branch. `repository` runs after it and renders the three assets used by this repository's own documentation: `metrics.contributors.svg` (repository template, people plugin with `plugin_people_types: contributors`), `metrics.sponsors.svg` (sponsors plugin with `past`, `sections: list`, `size: 32`, using `METRICS_TOKEN_PERSONAL`) and `metrics.licenses.svg` (repository template, licenses plugin with `setup: npm ci`, `legal`, `ratio`). |

## For AI Agents
### Working In This Directory
- Only the static scaffolding lives here. The ~90 per-example steps in the generated workflow come from
  each plugin's and template's `examples.yml`, turned into `prod` test cases by the `testcase()`
  function in `build.mjs`. To add or change a render, edit the plugin's `examples.yml`, not this file.
- The `<%- steps ... %>` expression indents the injected YAML by six spaces. If you move the injection
  point to a different nesting level, change that padding or the generated workflow will not parse.
- After any edit, run `npm run build` and commit the regenerated `.github/workflows/examples.yml`
  alongside it. `tests/ci.test.js` fails a PR that modifies the generated workflow directly, and
  `.github/scripts/*` is maintainer-only for non-`lowlighter` authors.
- The publish steps do `git reset --soft c8d364ee752ad090945b7e104873d24d011b521e` followed by
  `git push --force`, so the `examples` branch is permanently squashed onto that one commit. That hash
  is hard-coded here.
- `set +e` precedes the publish blocks so that an empty commit (nothing changed) does not fail the job.
- New secrets must be declared twice: in the `workflow_call.secrets` block here **and** in the
  `publish-examples` job of `.github/workflows/ci.yml` that passes them through.

### Testing Requirements
- `npm run build` regenerates the workflow; diff `.github/workflows/examples.yml` to confirm the
  scaffolding rendered as intended.
- There is no way to dry-run the workflow itself. It only runs on `lowlighter/metrics`
  (`if: "github.repository == 'lowlighter/metrics'"`) and needs all 13 secrets.

### Common Patterns
- Every render step carries `if: ${{ success() || failure() }}` so one failing example does not stop the
  rest, `output_action: none` and `delay: 120`; these defaults are injected by `testcase()` in
  `build.mjs` for the `prod` environment.
- Commits from the workflow use the `github-actions[bot]` identity, matching the Node scripts.

## Dependencies
### Internal
- `.github/scripts/build.mjs` (renders this file), `.github/workflows/examples.yml` (the output),
  `.github/workflows/ci.yml` (calls the generated workflow and supplies the secrets),
  `.github/scripts/markdown_example.mjs`, every plugin and template `examples.yml`.

### External
- `lowlighter/metrics@master` as a GitHub Action, `actions/checkout@v3`,
  `ghcr.io/lowlighter/metrics:master`, and the `examples` branch of the repository.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
