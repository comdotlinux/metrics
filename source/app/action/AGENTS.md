<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# source/app/action

## Purpose
GitHub Action front-end. `index.mjs` is the process that runs inside the metrics Docker container: it reads
every option from `INPUT_*` environment variables, builds the `q` query object, calls the engine, then writes
the render to `/renders` and performs the requested output action (commit, pull request, gist, or nothing).
`action.yml` here is the EJS source that `.github/scripts/build.mjs` renders into the repository-root
`action.yml`, embedding `run.sh` verbatim as the composite action's single bash step.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | 750-line runner. Loads `setup()`, parses core/base/plugin inputs through `metadata.plugins.<name>.inputs.action({core, preset})`, builds one API pair per token (rate limit and scope checks per token), resolves each token's owner into `conf.accounts`, calls `metrics()`, then saves and publishes the result. Exits 0 on success/skip, 1 on failure via `core.setFailed`. |
| `action.yml` | EJS template for the root `action.yml`. Loops over `plugins` to emit one `inputs:` entry per option from each plugin's `meta.action[input].descriptor`, then the composite `runs:` block that inlines `run.sh` and passes `METRICS_ACTION`, `METRICS_ACTION_PATH`, `METRICS_USE_PREBUILT_IMAGE`, `INPUTS` (`toJson(inputs)`) and `TZ`. |
| `run.sh` | Composite-action bash. Checks `docker` and `jq` exist, writes `.env` from `INPUTS` (each key becomes `INPUT_<KEY>` URI-encoded) plus all `GITHUB*`/`ACTIONS*`/`CI`/`TZ` variables, creates `/metrics_renders`, picks the image (official vs forked branch, see below), then `docker run --init --rm` with `$GITHUB_EVENT_PATH` and the renders folder mounted, and deletes `.env`. |

## For AI Agents
### Working In This Directory
Never hand-edit the root `action.yml`; edit `action.yml` here (or a plugin's `metadata.yml`) and run
`npm run build`. `tests/ci.test.js` fails CI when the generated file is stale.

Input parsing. Every option is declared in a plugin `metadata.yml`, not here. `index.mjs` destructures the
core plugin's parsed inputs and renames them into local variables; when you add a core option you add it to
`source/plugins/core/metadata.yml` and then destructure it. Outside GitHub Actions (`metadata.env.ghactions`
false, meaning plain `docker run`), values are read straight from `process.env.INPUT_<KEY>` and defaults are
forced to `output_action: none`, `committer_token: token`, `GITHUB_REPOSITORY: octocat/hello-world`.

Tokens and accounts. `token` accepts SEVERAL personal access tokens separated by newlines or commas (in a
workflow: `token: |` with one `${{ secrets.X }}` per line). They are split, trimmed and turned into one
`{login, graphql, rest, resources}` entry each; the first token's owner is the primary account and the others
contribute nameless data only (`conf.settings.token` and the committer fallback are the first token). Owners
are resolved with `rest.users.getAuthenticated()` after the API objects are built, and duplicate owners are
dropped at that point; with several tokens a failed resolution throws `cannot resolve owner of token #<n>`
instead of falling back to `github.context.repo.owner`. `_user` (the `user` input) is IGNORED when more than
one token is given, with a single `GitHub user | (ignored: multiple tokens, ...)` line. The deduplicated list
goes to `conf.accounts`, plus `conf.authenticated` (primary login) and `conf.debug`; the engine reads all
three. Log lines to expect, in order: `GitHub tokens | <n>`, then per token `GitHub token #<i>` /
`GitHub token format` / the API and rate-limit lines, then `GitHub account #<i> | <login>` and finally
`GitHub account | <login>` for the primary.

`core.setSecret(t)` is called for every token but ONLY when `metadata.env.ghactions` is true: outside GitHub
Actions (plain `docker run`) `setSecret` has no runner to talk to and simply prints `::add-mask::<value>`,
i.e. the raw token, to stdout.

Token format is only reported, never enforced: the old throw on `github_pat_` (fine-grained) tokens is gone
because GraphQL accepts them now. All that remains is the informational
`GitHub token format | fine-grained | classic | legacy or invalid` line.

Presets. `config_presets` is resolved first by `presets.mjs`; preset values only fill inputs the user left
unset, and preset-sourced values are marked with `*` in the startup log.

Mocked mode. `use_mocked_data: yes` replaces the octokit instances with `tests/mocks/index.mjs`, skips the
rate-limit and scope checks, and skips the closing "consumed API requests" report. A token matching
`NOT_NEEDED` also skips those checks. Mocking is applied per token (`mocks({...api, token: t})`), and the
`users.getAuthenticated` mock maps `MOCKED_TOKEN` to the repository owner and `MOCKED_TOKEN_<X>` to `x`, which
is what makes a two-token mocked run resolve into two distinct accounts.

Output modes. `output_action` is one of `none`, `gist`, `commit`, `pull-request`,
`pull-request-merge|squash|rebase`. The committer block only runs when `dryrun` is false and the action is not
`none`: it resolves `committer_token` (falling back to `token`), creates the head branch
`metrics-run-<runId>` for pull-request modes, and fetches the previous blob oid via a GraphQL `object(expression:
"<head>:<filename>")` query so the file can be updated through the contents API. Gist output rejects `png`,
`jpeg` and `markdown-pdf`. Merge mode polls `pulls.get` up to 240 times waiting for `mergeable`, merges, then
deletes the head branch.

Skips and conditions. A `push` event whose head commit message contains `[Skip GitHub Action]` or matches
`Auto-generated metrics for run #<n>` exits early as "skipped". With `config_output: svg` and
`output_condition: data-changed`, the previous file is fetched and compared using `svg.hash` (metadata
stripped) before committing; a second guard compares `git hash-object` of the render against the stored oid.

Retries. `retry(func, {retries, delay})` wraps the whole render; `retries_output_action` and
`retries_delay_output_action` wrap each API write (gist update, file commit, PR create, merge, branch delete,
markdown cache upload). `delay` sleeps that many seconds before the job ends.

Other flags. `optimize` and `verify` are forwarded through `conf.settings` / the `metrics()` options.
`setup_community_templates` is passed to `setup({community: {templates}})`. `plugins_errors_fatal` becomes
`die`. `clean_workflows` deletes completed workflow runs of the current workflow matching the given
conclusions (or `all`). `notice_release` compares `package.json` against the latest release tag.
`config_output: insights` spawns `node /metrics/source/app/web/index.mjs` and waits for `Server ready !`
on stdout before rendering, with a five-minute timeout.

Markdown outputs. After rendering, every `<img class="metrics-cacheable" data-name="..." src="data:image/...">`
is committed under `markdown_cache` and the tag is rewritten to a `https://github.com/<owner>/<repo>/blob/...`
URL.

Debug. When `debug` is false, `console.debug` is redirected into an in-memory buffer that is dumped only if
the run throws. `debug_flags` is forwarded to the engine as `q["debug.flags"]`.

### Testing Requirements
`npm run test-metrics` drives this file through `tests/metrics.test.js` ("GitHub Action" describe block) with
every `tests/cases/*.yml`. Manual mocked run:
`INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes node source/app/action/index.mjs`.
`tests/ci.test.js` checks that the generated root `action.yml` matches what `action.yml` here would produce.

### Common Patterns
`info(left, right, {token})` prints the aligned two-column startup report; `info.section`, `info.group` and
`info.break` structure it, and token values are never printed, only `(provided)`/`(missing)`/`(MOCKED TOKEN)`.
GitHub Actions workflow commands are emitted directly (`::group::`, `::endgroup::`, `::warning::`,
`::notice::`).

`@actions/core`, `@actions/github`, `@octokit/graphql` and `@octokit/rest` are ESM-only majors with no default
export, so they are imported as namespaces (`import * as core from "@actions/core"`, same for `github`,
`octokit` here, and `OctokitRest` in the three files that need the REST constructor: `../metrics/setup.mjs`,
`../web/instance.mjs` and `../../plugins/languages/analyzer/cli.mjs`). Call sites are unchanged; any NEW import
of these four packages must use the namespace form or it fails at load time.

## Dependencies
### Internal
`../metrics/index.mjs`, `../metrics/setup.mjs`, `../metrics/presets.mjs`, `../metrics/utils.mjs` (dynamic
import of `svg.hash`), `../../../tests/mocks/index.mjs`, `../web/index.mjs` (spawned for insights output).

### External
`@actions/core`, `@actions/github`, `@octokit/graphql`, `simple-git`, Node `child_process`/`fs`/`path`/`util`.
`run.sh` needs `docker` and `jq` on the runner. It derives `METRICS_SOURCE` from `$METRICS_ACTION` (the
`github.action` name, e.g. `__comdotlinux_metrics` -> `comdotlinux`) and `METRICS_TAG` from `package.json`
(`v<major.minor>`, plus a `-beta` suffix for unreleased versions). The official branch
(`METRICS_SOURCE == lowlighter`) pulls `ghcr.io/lowlighter/metrics:$METRICS_TAG`; the forked branch now
mirrors it and pulls `ghcr.io/$METRICS_SOURCE/metrics:$METRICS_TAG` (this fork publishes
`ghcr.io/comdotlinux/metrics`). Both fall back to a local `docker build` with the same
`Failed to fetch docker image from GitHub registry, will rebuild it locally` message, and both skip the pull
entirely when `use_prebuilt_image` is falsy (local image `metrics:<version>` / `metrics:forked-<version>`).
Trap: `$GITHUB_ACTION_REPOSITORY` is empty inside a composite `run:` step, so the owner MUST keep coming from
`$METRICS_ACTION`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
