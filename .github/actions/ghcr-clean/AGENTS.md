<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/actions/ghcr-clean

## Purpose
Two standalone bash scripts that keep the repository's GitHub-side storage from growing without bound.
Both drive the `gh` CLI against the REST API and both are invoked by workflows with
`working-directory: .github/actions/ghcr-clean`, so they are executed as `./<script>.sh` from this
directory and rely on `GITHUB_TOKEN` being exported by the calling step. Despite the directory name,
only the first script touches the container registry; the second prunes Actions history.

## Key Files
| File | Description |
|------|-------------|
| `delete_ghcr_dangling_images.sh` | Takes `<owner> <container>` (used as `lowlighter metrics`). Pages `GET /users/{owner}/packages/container/{container}/versions` into `ghcr_prune.ids`, selects versions whose `.metadata.container.tags` is `[]` with `jq`, and `DELETE`s each one. Exits 0 with a message when there is nothing dangling. Run by `clean.yml` on every published release and on manual dispatch, with `GITHUB_TOKEN: secrets.GHCR_BOT_TOKEN` (package deletion needs a PAT, not the default job token). |
| `delete_workflows.sh` | Takes `<owner>/<repo>` (used as `lowlighter/metrics`). Pages `GET /repos/{repo}/actions/runs` into `workflow_runs.payload`, then deletes in two passes: first every completed run whose conclusion is neither `success` nor `failure` (cancelled, skipped, timed out), then every remaining run whose `/artifacts` total count is `0` and whose `/logs` endpoint returns an error. Run by the `workflows` job of `stale.yml` on the daily cron, with the default `github.token`. |

## For AI Agents
### Working In This Directory
- Both scripts start `set -e`, write a temporary file in the current working directory and `rm -rf` it
  at the end; if you change the working directory contract in the workflow, the relative temp paths
  break.
- The `echo -n | gh api --method DELETE ... --input -` idiom is a deliberate workaround for
  `cli/cli#4286` and `cli/cli#3937` (the `gh` CLI otherwise hangs waiting for a request body on
  DELETE). Do not "simplify" it away.
- `delete_ghcr_dangling_images.sh` wraps the delete loop in `set +e` / `set -e` so one failed deletion
  does not abort the whole run; `delete_workflows.sh` does not, which is why its job sets
  `continue-on-error: true`.
- These are destructive against the live repository. Never run them locally against
  `lowlighter/metrics`; both take the target as an argument precisely so they can be pointed at a fork.
- Body indentation is hard tabs, unlike the two-space JavaScript in the rest of the repo. dprint only
  formats `*.js`/`*.mjs`, so nothing reformats these files.

### Testing Requirements
- No automated test covers these scripts. `shellcheck` is not wired into CI either. Verification is
  manual: authenticate `gh` against a fork and run `./delete_workflows.sh <your-fork>`.
- Both jobs that call them are marked `continue-on-error: true`, so a failure here does not fail CI and
  will not be noticed without reading the run logs.

### Common Patterns
- Fetch with `gh api ... --paginate`, filter ids with a `jq -r` expression, guard on the empty string,
  then loop with `while read -r line` over a here-string.

## Dependencies
### Internal
- `.github/workflows/clean.yml` (calls `delete_ghcr_dangling_images.sh`) and
  `.github/workflows/stale.yml` (calls `delete_workflows.sh`).

### External
- `gh` CLI (preinstalled on `ubuntu-latest`), `jq`, GitHub REST API endpoints for user packages and
  Actions runs, and the `GHCR_BOT_TOKEN` repository secret.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
