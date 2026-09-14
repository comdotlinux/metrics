<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# .github/workflows

## Purpose
Eleven GitHub Actions workflows: the ten inherited from upstream that build, test, format, publish and
maintain `lowlighter/metrics`, plus `publish-image.yml`, which this fork added. `ci.yml` is the upstream
spine: it runs on every push to `master` and chains fourteen jobs from testing through docker
publication, deployment of the two hosted web instances, example rendering and the GitHub release.
Three other workflows are also invoked by it through `workflow_call` (`test.yml`, `examples.yml`,
`examples.presets.yml`), on top of their own triggers; the rest react to pull requests, comments,
releases or a cron.

**Every job of those ten is gated on `if: github.repository == 'lowlighter/metrics'`, so none of them
runs here.** On `comdotlinux/metrics` the only workflow that does anything is `publish-image.yml`.

## Key Files
| File | Description |
|------|-------------|
| `ci.yml` | Continuous integration, `on: push` to `master`. Fourteen jobs, see the pipeline below. Reads two commit-message flags: `[skip test]` skips the test job, `[release]` unlocks the release half of the pipeline. |
| `test.yml` | "Build, test and analyze". Runs on `pull_request` to `master` and is reusable via `workflow_call` (no inputs). Three jobs: `lint` runs `npm run test-contrib` with `PR_AUTHOR` set from the pull request author, then `npm run linter`; `build` (needs `lint`) formats with dprint, builds `lowlighter/metrics:<branch>` from the `Dockerfile` and runs `npm run test-metrics` inside it; `analyze` (needs `lint`) runs CodeQL for javascript with `.github/config/codeql.yml`. |
| `examples.yml` | **GENERATED** from `.github/scripts/files/examples.yml` by `npm run build`. 49 KB, 97 steps, 90 of which are `uses: lowlighter/metrics@master` renders derived from every plugin and template `examples.yml`. Two jobs: `examples` renders everything onto the `examples` branch and screenshots the markdown example; `repository` (needs `examples`) renders this repository's own contributors, sponsors and licenses SVGs. Triggers: cron `0 8 1/2 * *`, `workflow_dispatch`, and `workflow_call` requiring 13 secrets. Both jobs are gated on `github.repository == 'lowlighter/metrics'`. Never edit directly. |
| `examples.presets.yml` | "Publish examples (presets)". Cron `0 16 1/2 * *`, `workflow_dispatch`, and `workflow_call` with no inputs. One job that checks out, installs and runs `npm run presets -- publish` with `GITHUB_TOKEN`, regenerating `example.svg` and `README.md` for every preset on the `presets` branch. |
| `test.presets.yml` | "Test (presets)". Runs on `pull_request` to the `presets` branch, and declares `workflow_call` with optional `ref` and `repo` string inputs. Checks out `master`, installs and runs `npm run test-presets` with `HEAD_REF` and `REPO` from those inputs so the test clones the contributor's preset branch. |
| `spelling.yml` | "Check Spelling". Runs on push to any branch (tags ignored), on `pull_request_target`, and on `issue_comment`. `spelling` job runs `check-spelling/check-spelling@v0.0.20` with the cspell html, filetypes, css, fullstack, django, npm and aws dictionaries, `post_comment: 0` and `suppress_push_for_open_pull_request: 1`, exporting a `followup` output. `comment` job reports it. `update` job applies `@check-spelling-bot apply` comments using the `CHECK_SPELLING` deploy key, and is disabled on the upstream repository (`github.repository_owner != 'lowlighter'`). Configuration lives in `.github/actions/spelling/`. |
| `label.yml` | Runs `actions/labeler@v4` on every `pull_request_target` with `configuration-path: .github/config/label.yml` and `sync-labels: yes`, so labels track the files a PR touches. |
| `branches.yml` | Runs on `pull_request_target` against `main`, `latest` or `examples`. Posts a comment via `actions/github-script@v6` explaining that those branches are fully automated, that code PRs go to `master` and preset PRs to `presets`, then fails the job with `exit 1`. |
| `stale.yml` | Cron `30 1 * * *` plus `workflow_dispatch`. `stale` marks pull requests inactive for 90 days with `⏹️ stale` and closes them 7 days later (issues are never marked, `days-before-stale: -1`; `📦 dependencies` is exempt). `lock` (needs `stale`) locks issues and PRs closed for 180 days with `dessant/lock-threads@v4`, labelling them `☑️ archived`. `workflows` runs `delete_workflows.sh lowlighter/metrics` to prune expired runs. |
| `clean.yml` | Runs on `release: published` and `workflow_dispatch`. One `continue-on-error` job running `delete_ghcr_dangling_images.sh lowlighter metrics` with `secrets.GHCR_BOT_TOKEN`. |
| `publish-image.yml` | **Fork-only, and the only workflow that runs on this repository.** "Publish image", `on: push: tags: ["v*"]`, `permissions: contents: read` + `packages: write`, single `publish` job on `ubuntu-latest` with no `github.repository` guard. Checks out with `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5` (SHA-pinned, the comment is the readable version), logs into `ghcr.io` with `${{ github.token }}`, then derives `TAG` from `package.json` exactly the way `source/app/action/run.sh` does (`grep -Po '(?<="version": ").*(?=")'`, keep `X.Y`, prefix `v`, append `-beta` when the version string ends in `-beta`). Builds `ghcr.io/${{ github.repository }}` lowercased (`tr "[:upper:]" "[:lower:]"`) as `$IMAGE:$TAG` and pushes it; for a non-beta version it also tags and pushes `$IMAGE:latest`. That is what published `ghcr.io/comdotlinux/metrics:{v3.35,v3.36,latest}` (public, anonymous pull works). Keep the tag derivation in sync with `run.sh`: the action pulls `ghcr.io/$METRICS_SOURCE/metrics:$METRICS_TAG` computed by the same rules, so a mismatch means every consumer falls back to a local docker build. |

## For AI Agents
### Working In This Directory
**The `ci.yml` pipeline, in dependency order** (upstream only, all fourteen jobs are skipped here by the
repository guard documented below):
1. `build-test-analyze` calls `test.yml` (skipped when the commit message contains `[skip test]`).
2. `format` runs when the previous job succeeded or was skipped: `dprint fmt`, then commits
   `chore: code formatting` directly to `master`.
3. `update-indexes` runs `npm run build -- publish`, committing `ci: auto-regenerate files`.
4. `update-main` and `docker-master` both fan out from `update-indexes`. `update-main` merges `master`
   into `main`; `docker-master` builds and pushes `ghcr.io/lowlighter/metrics:master`, plus a
   `v<X.Y>-beta` tag parsed out of `package.json` and a `main` tag.
5. `deploy-master` and `action-master-test` fan out from `docker-master`. The first restarts
   beta-metrics.lecoq.io via `POST /.control/stop` with `WEB_DEPLOY_BETA_TOKEN`, waits 120 s and polls
   `/.version`; the second runs `lowlighter/metrics@master` with `use_mocked_data` and `verify`.
6. `publish-examples` (calls `examples.yml`, passing all 13 secrets) and `publish-examples-presets`
   (calls `examples.presets.yml`) both need `action-master-test`.
7. `docker-release` needs `publish-examples` **and** `contains(head_commit.message, '[release]')`. It
   retags the master image as `v<X.Y>` and `latest`.
8. `update-latest` merges `master` into `latest`; `deploy-latest` (needs `docker-release` and
   `deploy-master`) restarts metrics.lecoq.io.
9. `action-latest-test` runs the mocked action against `@latest`.
10. `publish-release` (needs `action-latest-test` and `deploy-latest`) runs
    `node .github/scripts/release.mjs`.

**The fork's release path replaces all of that:** bump `version` in `package.json`, verify locally and
inside the docker image, fast-forward `master`, then push a `vX.Y` tag. `publish-image.yml` picks the tag
up and pushes `ghcr.io/comdotlinux/metrics:vX.Y` (plus `:latest` for a non-beta version). Nothing here
regenerates files, deploys a web instance or creates a GitHub release; do those by hand if you need them.

**Other things to know:**
- **The repository guard.** All 27 jobs of the eight inherited workflows carry
  `if: github.repository == 'lowlighter/metrics'` (`ci.yml` 14, `spelling.yml` 3, `stale.yml` 3,
  `test.yml` 3, `branches.yml` 1, `clean.yml` 1, `label.yml` 1, `test.presets.yml` 1); `examples.yml`
  (2 jobs) and `examples.presets.yml` (1) were already guarded upstream, in the quoted
  `if: "github.repository == 'lowlighter/metrics'"` form. Without it, enabling Actions on the fork would
  push images to upstream registries, push to `master`/`main`/`latest`/`examples`/`presets`, hit the
  `lecoq.io` deploy endpoints and fail on missing secrets. Keep the guard on anything copied from
  upstream, and leave it off a fork-only workflow such as `publish-image.yml`.
- **Consequence: the fork has no PR CI.** `test.yml` (lint, docker build + `test-metrics`, CodeQL) was the
  `pull_request` gate and it is guarded too. Verify locally and inside the docker image, then
  fast-forward push; see `../../tests/AGENTS.md` for the command actually used.
- Reusable workflows, all referenced as `lowlighter/metrics/.github/workflows/<file>@master`:
  `test.yml` (no inputs), `examples.yml` (13 required secrets), `examples.presets.yml` (nothing), and
  `test.presets.yml` (`ref`, `repo`). Nothing in this repository currently calls `test.presets.yml`;
  it exists for a caller in the presets workflow chain.
- `examples.yml` is generated. Edit `.github/scripts/files/examples.yml` and run `npm run build`.
  `tests/ci.test.js` fails any PR that modifies the generated file, and fails a non-`lowlighter`
  author's PR that modifies **any** file in this directory.
- `pull_request_target` is used by `spelling.yml`, `label.yml` and `branches.yml` because they need
  write permissions on forked pull requests. Never add a step that checks out and executes untrusted
  head-branch code inside those workflows.
- Several jobs push straight to `master` (`format`, `update-indexes`). A change that makes either job
  produce output on every run creates a commit loop.
- Node 20 via `actions/setup-node@v3` and `npm ci` is the standard setup in the inherited (skipped)
  upstream jobs, with `actions/checkout@v3` and `fetch-depth: 0` wherever git history or another branch
  is needed. Those versions describe upstream, not the current runtime: the image and `.tool-versions`
  are Node 22, and `publish-image.yml` needs no node setup at all because it only builds the image.

### Testing Requirements
- `npm run test-contrib` locally mirrors the `lint` job's first step; `npm run linter` mirrors the
  second; `npm run test-metrics` mirrors what the `build` job runs inside docker. On the fork
  `test-contrib` is meaningless (it diffs against `origin/master` and enforces the upstream
  maintainer-only file list); the gate actually used is
  `docker run --rm --entrypoint="" <image> npx jest --runInBand --testPathIgnorePatterns tests/ci.test.js`.
- Workflow YAML itself is not validated by any local tool. A syntax error surfaces only after pushing.
- The mocked action smoke test used by `action-master-test` and `action-latest-test` can be reproduced
  locally with `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes`.

### Common Patterns
- Publishing steps set `set +e` before `git commit` so that an empty commit does not fail the job.
- Every pushing step configures `git config user.name github-actions[bot]` and
  `user.email 41898282+github-actions[bot]@users.noreply.github.com`.
- Docker tags are derived with `grep -Po 'v\d+[.]\d+'` over the head commit message, or
  `grep -Po '(?<="version": ")\d+[.]\d+(?=[.]0-beta")'` over `package.json` for the beta tag.
- Branch names are sanitised for docker tags with `sed 's/[^a-z]/-/g'`.
- Housekeeping jobs that call the `ghcr-clean` scripts set `continue-on-error: true` and
  `working-directory: .github/actions/ghcr-clean`.

## Dependencies
### Internal
- `.github/config/{codeql.yml,dprint.json,label.yml}`, `.github/actions/spelling/*`,
  `.github/actions/ghcr-clean/*.sh`, `.github/scripts/{build.mjs,release.mjs,markdown_example.mjs,presets_examples.mjs}`,
  `.github/scripts/files/examples.yml` (source of `examples.yml`), `tests/ci.test.js`,
  `tests/metrics.test.js`, `tests/presets.test.js`, `Dockerfile`, `package.json` (scripts and version).

### External
- Actions: `actions/checkout@v3` (upstream jobs) and `actions/checkout@v5` SHA-pinned in
  `publish-image.yml`, `actions/setup-node@v3`, `actions/labeler@v4`, `actions/stale@v6`,
  `actions/github-script@v6`, `github/codeql-action/{init,analyze}@v2`,
  `check-spelling/check-spelling@v0.0.20`, `dessant/lock-threads@v4`, `lowlighter/metrics@{master,latest}`.
- Services: `ghcr.io` (`ghcr.io/comdotlinux/metrics` is what `publish-image.yml` writes and what
  `source/app/action/run.sh` pulls; `ghcr.io/lowlighter/metrics` only from the skipped upstream jobs),
  `metrics.lecoq.io`, `beta-metrics.lecoq.io`.
- Secrets: `METRICS_TOKEN`, `METRICS_TOKEN_WITH_SCOPES`, `METRICS_TOKEN_PERSONAL`, `CHESS_TOKEN`,
  `PAGESPEED_TOKEN`, `GOOGLE_MAP_TOKEN`, `SPLATOON_TOKEN`, `SPLATOON_STATINK_TOKEN`,
  `SIXTEEN_PERSONALITIES_URL`, `SPOTIFY_TOKENS`, `STOCK_TOKEN`, `TWITTER_TOKEN`, `WAKATIME_TOKEN`,
  `WEB_DEPLOY_TOKEN`, `WEB_DEPLOY_BETA_TOKEN`, `GHCR_BOT_TOKEN`, `CHECK_SPELLING`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
