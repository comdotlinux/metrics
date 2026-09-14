<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# .github/readme/partials/documentation/setup

## Purpose
The five step-by-step installation guides linked from `../setup.md`, one per supported way of running
metrics. They are standalone pages: none of them is inlined into the root `README.md`, so each opens
with its own `#` title carrying the time estimate from the comparison list. Together they are the
canonical answer to "how do I set this up", and the place where token scopes, secrets and instance
settings are documented for end users.

## Key Files
| File | Description |
|------|-------------|
| `action.md` | GitHub Action on a profile repository (~10 min, 178 lines). Steps: create a repository named after your login so its `README.md` shows on your profile; create a personal access token and pick scopes (none required by default, `public_repo`, `read:org`, `repo` plus `read:user`, `read:packages`, `read:project`, `gist` as features need them); store it as a repository secret; add the workflow. Substep 3.1 compares `@latest`, `@master`/`@main`, a fork and a pinned version; 3.2 covers configuring options; 3.3 documents the fork's multi-account `token: |` block (primary = first token's owner, secondaries contribute nameless data only, plus the four caveats); step 4 embeds the rendered images. Twelve screenshots, the most of any page here. |
| `web.md` | Deploying a web instance (~20 min, 204 lines). Needs docker and a scope-less token. Fetch `settings.example.json`, rename it `settings.json` and edit it. Substep 2.1 covers access lists and rate limiting, 2.2 the global configuration, 2.3 the extras features with an explicit warning that some allow remote code execution and must never be enabled outside a container. Step 3 runs the container, step 4 embeds images and documents the URL parameter syntax, and a final optional section sets the instance up as a service. |
| `shared.md` | The free shared instance at metrics.lecoq.io (~1 min, 41 lines). Same profile-repository preamble as `action.md`, then points at the site. Notes that compute-intensive plugins are disabled there, that metrics.lecoq.io tracks `@latest` while beta-metrics.lecoq.io tracks `@master`, that availability is not guaranteed, and asks users to consider sponsoring. Numbering jumps from step 0 straight to step 2. |
| `docker.md` | One-shot rendering with docker (~2 min, 18 lines). Single `docker run --rm --env INPUT_TOKEN=**** --env INPUT_USER=user --volume=/tmp:/renders ghcr.io/lowlighter/metrics:latest` command. Explains that every action option maps to an `INPUT_`-prefixed uppercase environment variable, that output lands in the mounted `/renders`, and that `output_action` defaults to `none` under docker unless both `GITHUB_REPOSITORY` (no `INPUT_` prefix) and `INPUT_COMMITTER_TOKEN` are set. |
| `local.md` | Local development setup (~20 min, 45 lines). Clone, `npm install`, `cp settings.example.json settings.json`, then follow `web.md` minus the docker parts, and `npm start`. Advises crafting URLs like `http://localhost:{port}/username?base=0&newplugin=1&newplugin.option1=hello` rather than using the web UI while developing. Closes with a testing section describing the jest setup, the Proxy-and-Faker mocks in `tests/mocks/index.mjs`, and the advice to let GitHub Actions run the slow suite. |

## For AI Agents
### Working In This Directory
- These pages are the user-facing contract for token scopes and option names. When a plugin gains a new
  required scope or a new credential, update the scope list in `action.md` and, if it is an extra, the
  extras section of `web.md`.
- `docker.md` documents the `INPUT_<OPTION>` environment variable convention that
  `source/app/action/index.mjs` implements. Keep them in sync if the prefix logic changes.
- `web.md` and `local.md` both describe `settings.json`, which is generated from
  `source/app/web/settings.example.json` by `npm run build`. Document new settings in the template
  first, then here.
- Adding a sixth setup route means adding the file here **and** an entry in `../setup.md`; nothing
  discovers these pages automatically.
- Links are repository-absolute (`/settings.example.json`, `/source/plugins/core/README.md`,
  `/tests/mocks/index.mjs`) so they resolve from GitHub's rendered view at this depth.

### Testing Requirements
- No build step renders these files; they are read as-is on GitHub. `npm run build` does not touch
  them.
- The spelling workflow checks all five. There is no link checker in CI, so verify internal links by
  hand after moving any target.

### Common Patterns
- Headings are numbered `## 0️`, `## 1️`, `## 2️` with substeps `### 2️.1️`, and optional sections use
  `## *️⃣`.
- Screenshots always appear as a light/dark pair with `#gh-light-mode-only` and `#gh-dark-mode-only`.
- Code fences are labelled by intent: `yaml` for workflow snippets, `shell` for commands, `javascript`
  for `settings.json` examples (it is JSON, but the fence says `javascript` so comments render).

## Dependencies
### Internal
- `../setup.md` (the only page linking here), `../../../imgs/` (screenshots), `/settings.example.json`
  and `/source/app/web/settings.example.json`, `/source/plugins/core/README.md` (option reference),
  `/tests/mocks/index.mjs`, `/Dockerfile` (cited for the supported Node version).

### External
- ghcr.io/lowlighter/metrics, metrics.lecoq.io and beta-metrics.lecoq.io, docker.com, nodejs.org,
  jest, Faker.js, and GitHub documentation on personal access tokens and secrets.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
