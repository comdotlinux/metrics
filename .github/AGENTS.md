<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# .github

## Purpose
Repository infrastructure inherited from `lowlighter/metrics` and now running in the fork
`comdotlinux/metrics`: everything GitHub itself reads (issue template
config, funding, dependabot, pull request template), the CI/CD workflows that build, test, format and
publish the project, the Node scripts those workflows run (`npm run build`, `npm run presets`,
`npm run quickstart`, `npm run preview`, release publishing), the EJS sources that generate the root
`README.md` and the plugin/template indexes, and the screenshots those docs embed. Nothing here ships
inside the Docker image's runtime path; it is all build, documentation and repository automation. Every
file in this tree is maintainer-only upstream and is enforced as such by `tests/ci.test.js`.

Fork caveat: every job of the ten inherited workflows is gated on
`if: github.repository == 'lowlighter/metrics'` and therefore skips here. `workflows/publish-image.yml`
is the one workflow this fork added and the only one that runs, building and pushing
`ghcr.io/comdotlinux/metrics:vX.Y` (plus `:latest`) on a `v*` tag.

## Key Files
| File | Description |
|------|-------------|
| `dependabot.yml` | Weekly npm updates on `/`, but `open-pull-requests-limit: 0` disables them ("Will not be managed by npm anymore in v4"). Ignores all semver-patch bumps and pins `vue-prism-component` away from `2.0.0`. Labels PRs `📦 dependencies`, prefixes commits `chore(deps)`, reviewer `lowlighter`. |
| `FUNDING.yml` | Single GitHub Sponsors entry (`github: lowlighter`). |
| `pull_request_template.md` | HTML-comment-only template: read `CONTRIBUTING.md`, avoid duplicates, note that `github-actions` reformats code and head branches are auto-deleted. Renders as an empty PR body. |
| `architecture.svg` | draw.io export (761x1011) embedded by `ARCHITECTURE.md`; the diagrams.net source is kept in the `content` attribute of the root `<svg>`. Edit it on app.diagrams.net, not by hand. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `actions/` | Shell helpers for repository housekeeping and the check-spelling configuration (see `actions/AGENTS.md`) |
| `config/` | Configuration consumed by third-party actions: CodeQL, dprint, labeler (see `config/AGENTS.md`) |
| `readme/` | EJS partials and screenshots that generate and illustrate the documentation (see `readme/AGENTS.md`) |
| `scripts/` | Node scripts run by workflows and npm scripts: build, presets, preview, release, quickstart (see `scripts/AGENTS.md`) |
| `workflows/` | The eleven GitHub Actions workflows: ten inherited and skipped on this fork, plus the fork's own `publish-image.yml` (see `workflows/AGENTS.md`) |

## Skipped subdirectories
- `ISSUE_TEMPLATE/` - no AGENTS.md: GitHub parses every `.md` file in that directory as an issue
  template and would surface it in the "New issue" chooser. It contains a single `config.yml` with
  `blank_issues_enabled: false` and three `contact_links` redirecting users to GitHub Discussions
  (`q-a` for setup help and bug reports, `ideas` for feature requests, `general` for everything else).
  There are no actual issue templates: all issue intake is funnelled to Discussions.

## For AI Agents
### Working In This Directory
- **Everything under `.github` is maintainer-only.** `tests/ci.test.js` runs as `npm run test-contrib`
  in the `lint` job of `test.yml` with `PR_AUTHOR` set to the PR author. Unless that author is
  `lowlighter`, the test fails if the diff against `origin/master` modifies any of
  `.github/config/*`, `.github/ISSUE_TEMPLATE/*`, `.github/readme/partials/license.md`,
  `.github/scripts/*`, `.github/workflows/*`, `.github/architecture.svg`, `.github/dependabot.yml`,
  `.github/FUNDING.yml`, `.github/pull_request_template.md/*`, plus `LICENSE`, `ARCHITECTURE.md`,
  `SECURITY.md`, `tests/ci.test.js`, `source/.eslintrc.yml`, `source/app/mocks/.eslintrc.yml` and
  `vercel.json`. A separate check in the same file forbids any PR from modifying the generated files
  (`README.md`, the three index READMEs, `action.yml`, `settings.example.json`, `tests/cases/*`,
  `.github/workflows/examples.yml`, `.github/readme/partials/documentation/compatibility.md`).
- Two files inside this tree are themselves generated and must never be hand-edited:
  `workflows/examples.yml` (from `scripts/files/examples.yml`) and
  `readme/partials/documentation/compatibility.md` (from `readme/partials/templated/compatibility.md`).
  Regenerate both with `npm run build`.
- **The fork has no PR CI.** `workflows/test.yml` (lint, docker build + `test-metrics`, CodeQL) carried the
  `pull_request` gate and is guarded like the rest, so nothing checks a branch automatically. Verify
  locally and inside the docker image
  (`docker run --rm --entrypoint="" <image> npx jest --runInBand --testPathIgnorePatterns tests/ci.test.js`),
  then fast-forward push. Keep the `github.repository` guard on any job copied down from upstream:
  without it, enabling Actions here would push to upstream registries and branches.
- Documentation changes almost always belong in `readme/partials/`, never in the root `README.md`.
- Adding a plugin also means adding a label rule to `config/label.yml`; the labeler runs on every
  `pull_request_target`.

### Testing Requirements
- `npm run test-contrib` (jest `tests/ci.test.js`) is the gate for everything in this directory. Run it
  locally with `PR_AUTHOR=<your-login> npm run test-contrib` to see what a non-maintainer PR would hit.
- `npm run build` regenerates all generated files; it reads `tests/secrets.json` and the plugin and
  template metadata, so it needs a working install (`npm ci`).
- Workflow YAML has no local test harness. Validate changes by reading `workflows/ci.yml`, which wires
  the reusable workflows together. `workflows/publish-image.yml` is only exercised by pushing a `v*` tag;
  its tag derivation must stay identical to the one in `source/app/action/run.sh`, or consumers of the
  action stop finding the prebuilt image and fall back to a slow local docker build.

### Common Patterns
- Workflows that need to push use the bot identity `github-actions[bot]` /
  `41898282+github-actions[bot]@users.noreply.github.com`.
- Commit-message flags drive CI: `[skip test]` skips the build/test/analyze job, `[release]` triggers
  the release pipeline, `[skip ci]` is honoured by GitHub itself.
- Branches are roles, not features: `master` is the development trunk, `main` and `latest` are
  auto-rebased mirrors, `examples` holds rendered example images, `presets` holds user presets.

## Dependencies
### Internal
- `tests/ci.test.js` (enforces the maintainer-only file list), `tests/secrets.json` (test credentials
  substituted into generated test cases), `source/app/metrics/metadata.mjs` and
  `source/app/metrics/setup.mjs` (consumed by the build and preview scripts), `package.json` scripts
  (`build`, `presets`, `quickstart`, `preview`, `linter`, `test-*`), `Dockerfile` (built by CI).

### External
- GitHub Actions: `actions/checkout@v3` (plus `actions/checkout@v5`, SHA-pinned, in
  `workflows/publish-image.yml`), `actions/setup-node@v3`, `actions/labeler@v4`,
  `actions/stale@v6`, `actions/github-script@v6`, `github/codeql-action@v2`,
  `check-spelling/check-spelling@v0.0.20`, `dessant/lock-threads@v4`.
- GitHub Container Registry: `ghcr.io/comdotlinux/metrics` (written by `workflows/publish-image.yml`,
  pulled by `source/app/action/run.sh`) and `ghcr.io/lowlighter/metrics` (skipped upstream jobs only),
  the deployed web instances (`metrics.lecoq.io`, `beta-metrics.lecoq.io`), dprint, and the `gh` CLI.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
