<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/repository

## Purpose
The repository-mode template (`index: 1`, `supports: [repository]` only). It is the only built-in template
with a substantial `template.mjs`: before the core plugin runs it fetches one repository, replaces the
user-shaped data with repository-shaped data, and synthesizes a 14 day commit calendar, so all the
downstream plugins and partials keep working against `data.user` while actually describing a single repo.
It is also the template used by `embed()` in markdown templates whenever a `repo` is passed.

## Key Files
| File | Description |
|------|-------------|
| `metadata.yml` | `name: 📘 Repository template`, `index: 1`, `supports: [repository]`, `formats: [svg, png, jpeg, json]`. The `supports` list is enforced by `metadata.templates.repository.check()` from the core plugin, so a run without `repo` is rejected as "template not supported for: user". |
| `template.mjs` | The repository pre-processor, described below. Ends by calling `imports.plugins.core(...arguments)` and awaiting `pending`. |
| `image.svg` | Like classic but simpler: width `960` when `large` else `480`, no `columns` mode, and an extra `errors` banner that replaces the whole partial loop when `errors.length` (so a missing `repo` shows only the error). Footer prints only the generation date. Ends with `#metrics-end`. |
| `examples.yml` | One example: `user: lowlighter`, `repo: metrics`, `plugin_lines`, `plugin_followup`, `plugin_projects` with `plugin_projects_repositories: lowlighter/metrics/projects/1`, using `METRICS_TOKEN_WITH_SCOPES`. |
| `README.md` | GENERATED header and examples, plus a short section on using `repo` with this template. |

No `style.css` and no `fonts.css`: `setup.mjs` falls back to `classic/style.css` and the empty
`classic/fonts.css`.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `partials/` | 19 `.ejs` partials and the 17-entry `_.json` (see `partials/AGENTS.md`) |

## For AI Agents
### Working In This Directory
What `template.mjs` does, in order:

- Rejects a missing `q.repo` by pushing `{error: {message: 'You must pass a "repo" argument to use this template'}}`
  onto `data.errors` and returning `imports.plugins.core(...arguments)` early.
- Fetches the repository with `graphql(queries.base.repository({login, repo, account}))`, that is
  `source/plugins/base/queries/repository.graphql`, whose `$account` placeholder becomes `user` or
  `organization` (`bypass` maps to `user`). Result is written to `data.user.repositories.nodes` (single
  element), `data.repo`, and `data.user.repositoriesContributedTo.nodes` is emptied.
- Counts contributors through `rest.repos.listContributors` and copies
  `data.user.sponsorshipsAsMaintainer` onto `data.repo`.
- Pages `rest.repos.listCommits` up to 100 pages of 100 commits, tolerating the "Git Repository is empty"
  error, then buckets the commit dates into a 14 day array and rewrites
  `data.user.calendar.contributionCalendar.weeks` with CSS `var(--color-calendar-graph-day-L*-bg)` colors.
- Overrides `data.user.createdAt`, `data.user.repositories.totalDiskUsage` and `data.user.websiteUrl` with
  the repository values, and forces `q["projects.limit"] = 0`.
- If `rest.repos.getContent({path: "action.yml"})` succeeds, treats the repo as a GitHub Action and counts
  users with `rest.search.code({q: "uses <login> <repo> path:.github/workflows language:YAML"})`, stored as
  `data.repo.actionUsersCount`.
- After core and `await Promise.all(pending)`, sets `data.user.name = "<login>/<repo>"` and strips the
  `(login/repo)` suffix from project names.

Consequences worth knowing: the commit paging and the code search make this template noticeably more
API-hungry than the others, `rest.search.code` requires an authenticated token (hence
`METRICS_TOKEN_WITH_SCOPES` in the example), and any plugin reading `user.createdAt` or
`user.repositories.totalDiskUsage` silently gets repository-scoped values here.

### Testing Requirements
- Backing case file: `tests/cases/repository.template.yml` (generated from `examples.yml`).
- `repository` is the third column of the GitHub Action and web instance matrices in
  `tests/metrics.test.js`, always with `query = {repo: "metrics"}`; it is absent from the placeholder
  matrix. Any plugin whose `metadata.yml` does not list `repository` under `supports` is skipped in that
  column.
- Run `npm run test-metrics`, or a single mocked render with
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=repository INPUT_USER=lowlighter INPUT_REPO=metrics node source/app/action/index.mjs`.
- Mocks backing the extra calls live in `tests/mocks/api/github/rest` (`repos`, `search`) and
  `tests/mocks/api/github/graphql`.

### Common Patterns
- Same guard/error/content partial skeleton as classic, but partials read repository-shaped data such as
  `data.repo.contributors` and `plugins.licenses`.
- `image.svg` short-circuits on `errors.length`, which is how the missing-`repo` message is surfaced
  instead of an empty card.

## Dependencies
### Internal
`source/plugins/base/queries/repository.graphql`, `source/plugins/core` (invoked as
`imports.plugins.core`), `source/plugins/contributors` and `source/plugins/licenses` (repository-only
plugins rendered here), `../classic` (style and fonts fallback), `source/app/metrics/index.mjs`
(`embed()` selects this template when `repo` is set).

### External
GitHub GraphQL API, GitHub REST API (`repos.listContributors`, `repos.listCommits`, `repos.getContent`,
`search.code`), `ejs`, `puppeteer`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
