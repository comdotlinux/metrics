<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/plugins/languages/analyzer

## Purpose
Implementation of the two heavy language analyzers used by the `languages` plugin (and, for `recent`, by `habits`).
Both subclass a shared `Analyzer` that owns cloning, per-commit iteration, category filtering, timeouts and result
accumulation; the subclasses differ only in where commits come from and how `linguist-js` is invoked. This directory is
reachable from the command line without the rest of the engine through `cli.mjs`, exposed as `npm run indepth`.

## Key Files
| File | Description |
|------|-------------|
| `analyzer.mjs` | `Analyzer` base class. Holds `login`, `authoring`, `uid`, `skipped`, `categories`, `timeout`, a `results` accumulator (`{partial, total, lines, stats, colors, commits, files, missed, elapsed}`) and regex `markers` for commit hashes, `+++ b/<file>` headers and `+`/`-` diff lines, plus a `parser` regex splitting `owner/name@branch:ref`. `run(runner)` wraps the runner in a promise that a global `setTimeout` can resolve early with `partial.global = true`. `clone()` shallow-clones (`--single-branch`) into `os.tmpdir()/<uid>-<owner>_<repo>`, injecting `core.getInput("token")` into the URL when `GITHUB_ACTIONS` is set. `analyze(path, {commits})` loops commits, enforces the per-repository timeout, calls the subclass `linguist()` and keeps only languages whose linguist `type` is in `categories`. `ignore()` applies `filters.repo`; `clean()` removes the temp dir. |
| `indepth.mjs` | `IndepthAnalyzer`. Adds `results.verified.signature`. `gpgarmor()` fetches GPG keys for the login and for `web-flow` (GitHub's web-UI signing key), appends every key email to `authoring`, and imports the keys with `gpg --import` only under `GITHUB_ACTIONS`. `filter()` collects commit SHAs with both `git log --author=` and `git log --grep=` per authoring value, then intersects with `git rev-list --boundary <ref>` when a ref range was given. `editions()` streams `git log <sha> --patch` through `shell.spawn` and tallies added/deleted lines and bytes per file. `linguist()` runs `git checkout <sha>` and a full-tree `linguist(path)` at most **once per SHA**, caching file-to-language and language metadata. |
| `recent.mjs` | `RecentAnalyzer`. Never clones: `patches()` pages the events API (`activity.listRepoEvents` in repository mode, otherwise `activity.listEventsForAuthenticatedUser`), keeps `PushEvent`s on the default branch, drops repositories matching `skipped` and events older than `days`, then fetches each commit body via `rest.request(commit.url)`, discards merges (`parents.length > 1`) and parses the per-file `patch` directly. Its `linguist()` calls `linguist(edition.path, {fileContent: edition.patch})` per file, so language detection runs on the patch text rather than the checked-out tree. Records `results.latest` (days since the oldest kept event) and `results.branch`. |
| `cli.mjs` | Standalone entry point. Parses `yargs-parser` argv, imports `source/app/metrics/setup.mjs` to get `metadata`, resolves `commits.authoring` through the `base` plugin inputs and `categories` / timeouts / `recent.*` through the `languages` plugin inputs (all with `account: "bypass"`), builds an `@octokit/rest` client when `--token` is given, prints a settings table and dispatches on `--mode` (`indepth` default, or `recent`). Its `help` constant is an empty string. |

## For AI Agents
### Working In This Directory
- CLI usage: `npm run indepth -- --login=<user> --token=<token> [--mode=indepth|recent] [--categories=...]`
  `[--timeout-global=<m>] [--timeout-repositories=<m>] [--commits-authoring=...] [--recent-load=<n>] [--recent-days=<n>]`
  `[--api-url=<url>] <owner/repo> [<owner/repo@branch:range> ...]`. Positional arguments become `repositories` and are
  only used by `indepth` mode. Note `--help` prints nothing useful today.
- **An analyzer instance is single-use.** `Analyzer.run()` sets `this.consumed` and throws on a second call. Create a new
  instance per analysis.
- **The global timeout does not cancel work**, it only resolves the promise early with whatever `results` holds; the
  runner keeps executing in the background. Do not rely on it to stop cloning or `git` subprocesses.
- `indepth` requires the system `git` and `gpg` binaries. `gpg <path>` is run even outside GitHub Actions (to validate the
  key file); only the actual `--import` is skipped.
- `authoring` is mutated by `gpgarmor()` - emails discovered on the user's GPG keys are appended, so the effective author
  filter is wider than `commits_authoring` alone.
- `recent.mjs` filters by `committer.email` against `authoring`, while `indepth.mjs` filters by `git log --author`/`--grep`.
  The two modes can legitimately disagree about which commits belong to the user.
- `analyzer.mjs` imports `filters` from `../../../app/metrics/utils.mjs` and `core` from `@actions/core` directly rather
  than through the injected `shell`/`imports` object; `shell.run` and `shell.spawn` are used for everything else.
- `RecentAnalyzer.analyze("/dev/null")` passes a dummy path because the base class signature expects one but the recent
  path never touches the filesystem.

### Testing Requirements
- There is no dedicated unit test. Coverage comes from `tests/cases/languages.plugin.yml` (the recently-used case) and
  `tests/cases/habits.plugin.yml`, both run by `npx jest --runInBand metrics.test.js`. The indepth example is
  `test: skip: true`, so indepth is not exercised in CI.
- Mocks used: `tests/mocks/api/github/rest/activity/listEventsForAuthenticatedUser.mjs`, `.../activity/listRepoEvents.mjs`,
  `tests/mocks/api/github/rest/request.mjs`, `.../repos/get.mjs`, `.../users/listGpgKeysForUser.mjs`.
- For a real end-to-end check, run the CLI against a small public repository rather than the jest suite.

### Common Patterns
- `this.debug(msg)` derives its prefix from `this.constructor.name`, producing
  `metrics/compute/<login>/plugins > languages > indepth analyzer > ...`.
- Every failure path degrades rather than throws: clone failures return `false`, per-commit errors increment
  `results.missed.commits`, GPG errors are logged and skipped.
- `shell.run(..., {log: false, debug: false, prefixed: false})` is the standard call shape for `git` invocations, always
  with `env: {LANG: "en_GB"}` so output parsing is locale-stable.

## Dependencies
### Internal
- `source/app/metrics/utils.mjs` (`filters`, and `run`/`spawn` through the injected `shell`), `source/app/metrics/setup.mjs`
  and `source/app/metrics/metadata.mjs` (both from `cli.mjs` only).
- Consumed by `../analyzers.mjs`, which is in turn used by `../index.mjs` and `source/plugins/habits/index.mjs`.
### External
- `linguist-js`, `simple-git`, `@actions/core`, `@octokit/rest`, `yargs-parser`; node builtins `fs/promises`, `os`, `path`.
- System binaries: `git` (clone, log, rev-list, checkout, verify-commit) and `gpg`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
