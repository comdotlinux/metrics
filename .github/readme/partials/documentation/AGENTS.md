<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/readme/partials/documentation

## Purpose
Hand-written Markdown documentation, plus one generated file. Only `setup.md` and `contributing.md`
are inlined into the root `README.md` (through `templated/documentation.md`); the rest are standalone
pages that readers reach by following a link, which is why they open with an `#` heading of their own
while the inlined ones open with `##`.

## Key Files
| File | Description |
|------|-------------|
| `setup.md` | The "🦮 Setup" section of `README.md`. Compares the five installation routes with their time estimates and trade-offs, linking into `setup/`: GitHub Action on a profile repository (~10 min, all features), the shared instance at metrics.lecoq.io (~1 min, compute-intensive features disabled), deploying a web instance (~20 min), docker one-shot rendering (~2 min), and local development setup (~20 min). Then links to the three additional resources: `organizations.md`, `selfhosted.md` and `compatibility.md`. |
| `contributing.md` | The "💪 Contributing" section of `README.md`. Links to `/CONTRIBUTING.md`, `/ARCHITECTURE.md`, `/LICENSE`, the GitHub GraphQL and REST API docs, the GraphQL Explorer, Primer Octicons, and points feedback and help requests at GitHub Discussions. |
| `compatibility.md` | **GENERATED.** The template/plugin compatibility matrix, 387 lines of HTML tables. Written by `build.mjs` from `../templated/compatibility.md`. First table is template rows against plugin columns with `✔️` / `❌` / `✓` (embed-only); second table is the three account modes (user, organization, repository) against the same columns. Listed in `tests/ci.test.js` as a generated file, so any PR that edits it fails. |
| `organizations.md` | Guide for rendering metrics on an organization account: a personal token with `read:org` is required whether or not you are a member, `user` is set to the organization name, plugins supporting organizations are labelled `👥 Organizations`, single sign-on may require authorizing the token, and workflows can live in the organization's `.github` repository. |
| `selfhosted.md` | Guide for self-hosted runners. Requires docker and `jq` on the runner, notes that the working user must be able to open `/var/run/docker.sock` and gives the `usermod -a -G docker` workaround, shows `runs-on: self-hosted` usage, and points at the core plugin's `debug` option. |
| `inspirations.md` | Credits list of nine similar projects (github-readme-stats, github-stats, readme-pagespeed-insights, isometric-contributions, github-activity-readme, sourcekarma, github-profile-trophy, profile-readme-stats, worldstar). Excluded from spell-checking by `excludes.txt`. Not linked from any other file in the repository. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `setup/` | The five step-by-step installation guides linked from `setup.md` (see `setup/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- **Never hand-edit `compatibility.md`.** Its content is derived from plugin `metadata.yml` `supports`
  lists and from which `partials/<plugin>*.ejs` files each template ships. To change a cell, change the
  metadata or the template partial, then run `npm run build`.
- Adding a new setup route means editing both `setup.md` (the comparison list) and adding the page
  under `setup/`.
- `setup.md` and `contributing.md` are inlined, so their headings must stay at `##` to sit correctly
  inside `README.md`. Standalone pages use `#`.
- All internal links are repository-absolute (`/.github/readme/partials/...`, `/source/plugins/core/README.md`)
  because `setup.md` is read both as a file and as part of the root `README.md`.

### Testing Requirements
- `npm run build` after any change, then check the regenerated root `README.md` diff.
- `npm run test-contrib` fails if `compatibility.md` shows up as modified in the diff against
  `origin/master`.
- The spelling workflow checks every file here except `inspirations.md`.

### Common Patterns
- Numbered setup steps use the keycap-style headings `## 0️`, `## 1️`, `## 2️` (a digit plus U+FE0F,
  without the enclosing-keycap character), matching the `setup/` pages.
- Screenshots are always emitted as a light/dark pair with `#gh-light-mode-only` and
  `#gh-dark-mode-only` anchors.

## Dependencies
### Internal
- `../templated/documentation.md` (inlines `setup.md` and `contributing.md`),
  `../templated/compatibility.md` (generates `compatibility.md`), `setup/*.md` (linked from
  `setup.md`), `../../imgs/` (screenshots), `/CONTRIBUTING.md` and `/ARCHITECTURE.md`.

### External
- Links only: docs.github.com (GraphQL, REST, runners, SSO), metrics.lecoq.io, docker.com, nodejs.org,
  github.com/stedolan/jq, primer/octicons.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
