<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# base

## Purpose
`base` is not a renderable plugin: it is the bootstrap step that fills `data.user`, `data.account`,
`data.base` and `data.shared` before any other plugin runs. `source/app/metrics/index.mjs` calls
`Plugins.base(...)` directly (and awaits it) ahead of the template computer, and unlike other plugins it
mutates `data` in place and returns `{}` rather than a result object. It probes the login as a `user` first
and then as an `organization`, runs one bulk GraphQL query per account type with a per-field fallback path for
when the bulk query times out, paginates the account's repositories, patches the packages count from the REST
container registry endpoint, and publishes the cross-plugin shared options. It also decides which of the five
"base parts" (`header`, `activity`, `community`, `repositories`, `metadata`) the template will render.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | The bootstrap function plus two helper objects: `postprocess` (`user`, `organization`, `skip` — seed `data.user` with the NaN-filled fields the account type cannot provide) and `legacy.converter` (accepts `yes/no/true/false/0/1` for the legacy `base` query parameter). |
| `metadata.yml` | Declares the `base`, `base_indepth`, `base_hireable`, `base_skip` inputs and the globally shared `repositories`, `repositories_batch`, `repositories_forks`, `repositories_affiliations`, `repositories_skipped`, `users_ignored`, `commits_authoring` inputs. `category: core`, `supports: user, organization, repository`, `scopes: public_access`. |
| `examples.yml` | One example (`Default metrics`, `filename: metrics.base.svg`) used as `tests/cases/base.plugin.yml`. The README demo pair (`metrics.classic.svg`, `metrics.organization.svg`) comes from the `examples:` block of `metadata.yml`. |
| `README.md` | GENERATED from `metadata.yml` + `examples.yml` by `npm run build`. Never hand-edit. |

## Skipped subdirectories
- `queries/` — no AGENTS.md: `setup.mjs` `load.plugin` reads every file in it as a GraphQL query string. Its ten
  files, and the `$variables` each one expects (placeholders are substituted textually, not sent as GraphQL
  variables), are:
  - `user.graphql` (`BaseUser`, `$login`) — identity fields of a user: `databaseId`, `name`, `login`, `location`, `createdAt`, `avatarUrl`, `websiteUrl`, `twitterUsername`.
  - `organization.graphql` (`BaseOrganization`, `$login`) — same identity fields for an organization, plus `isVerified`.
  - `user.x.graphql` (`BaseUserX`, `$login`, `$affiliations`, `$calendar.from`, `$calendar.to`) — the bulk user query: packages, starred repositories, watching, sponsorships both ways, followers/following, issue comments, organizations, repositories contributed to, `repositories(last: 0 $affiliations) {totalCount totalDiskUsage}`, the whole `contributionsCollection` counters and the last-14-days contribution calendar days
    (`date`, `contributionCount` and `color` — `date` and `contributionCount` are there because
    `source/app/metrics/merge.mjs` keys the multi-account calendar sum on the API date and re-colours by
    the merged daily maximum).
  - `organization.x.graphql` (`BaseOrganizationX`, `$login`, `$affiliations`) — the bulk organization query: packages, sponsorships both ways, `membersWithRole`, repositories totals.
  - `field.graphql` (`BaseField`, `$account`, `$login`, `$field`) — unit fallback that fetches `totalCount` of a single named connection.
  - `field.repositories.graphql` (`BaseFieldRepositories`, `$account`, `$login`, `$affiliations`, `$field`) — unit fallback for `repositories.totalCount` / `repositories.totalDiskUsage`.
  - `contributions.graphql` (`BaseContributions`, `$login`, `$range`, `$field`) — one `contributionsCollection` counter; `$range` is either empty (last year) or a literal `(from: "...", to: "...")` used by indepth mode.
  - `calendar.graphql` (`BaseCalendar`, `$login`, `$calendar.from`, `$calendar.to`) — the contribution calendar only (same `date`/`contributionCount`/`color` day shape as `user.x.graphql`), the fallback when the bulk query fails. Keep the two day selections identical or a merged calendar loses its keys on the fallback path.
  - `repositories.graphql` (`BaseRepositories`, `$account`, `$login`, `$type`, `$after`, `$repositories`, `$forks`, `$affiliations`, `$constraints`) — the paginated repository list ordered by `UPDATED_AT DESC` with cursors, returning name/owner/fork state/watchers/stargazers/releases/deployments/environments/top 8 languages/licenseInfo and open, closed and merged issue and pull request counts.
  - `repository.graphql` (`BaseRepository`, `$account`, `$login`, `$repo`) — a single repository with the same fields plus `diskUsage` and `homepageUrl`. Not used by this plugin: `source/templates/repository/template.mjs` calls `queries.base.repository(...)` to populate `data.repo`.

## For AI Agents
### Working In This Directory
- Anything that changes the shape of `data.user` belongs here, and it breaks every downstream plugin. The two
  query paths must stay in sync: the bulk `<account>.x` query and the per-field fallback loop that runs in its
  `catch`. Adding a field to `user.x.graphql` without adding it to the `fields` arrays in `index.mjs` means the
  field silently disappears whenever the bulk query times out.
- `postprocess.user` / `postprocess.organization` set the fields an account type cannot provide to `NaN` (an
  organization has no calendar, no followers, no contributions collection). Keep new fields consistently
  NaN-filled so templates render `NaN` rather than crashing on `undefined`.
- `base_skip: yes` (or `token: NOT_NEEDED`, surfaced as `conf.settings.notoken`) routes through
  `postprocess.skip`, which fabricates an empty user with `account = "bypass"` and the avatar URL guessed from
  `https://github.com/<login>.png`. Plugins meant to work token-less must tolerate that shape.
- `base_indepth: yes` requires the `metrics.api.github.overuse` extras permission and walks the whole account
  lifetime in 24-week windows (`setUTCHours(+6 * 4 * 7 * 24)`), one request per contribution field per window, taking `Math.max` against the
  last-year values. Without it, total commits are patched from `rest.search.commits({q: "author:<login>"})`.
- Repository pagination halves `repositories_batch` on GraphQL failure and gives up when the batch drops below
  1; `repositories` caps the total, and organizations are additionally capped at 25 per query. Results are
  truncated with `nodes.splice(repositories)` after the loop.
- `repositories_affiliations` is injected as raw GraphQL text (`, ownerAffiliations: [OWNER, ...]`), and the
  `affiliations:` clause is only added when the token owner equals the queried login (`conf.authenticated === login`).
- The shared options block is the contract other plugins depend on:
  `data.shared["repositories.skipped"]`, `["users.ignored"]`, `["commits.authoring"]`, `["repositories.batch"]`.
  `commits_authoring` defaults to `.user.login`, which `metadata.mjs` templates from the fetched user.
- `base` parts are resolved from `conf.settings.plugins.base.parts` (hard-coded in `setup.mjs` to the five names)
  crossed with `q.base` and `q["base.<part>"]`; `legacy.converter` keeps the old web instance `base=0` syntax working.
- The packages patch calls `rest.packages.listPackagesForUser` / `listPackagesForOrganization` with
  `package_type: "container"`; it fails silently without the `read:packages` scope.
- `README.md` is generated. Change `metadata.yml` or `examples.yml` and run `npm run build`.

### Testing Requirements
- `npm run test-metrics` runs `tests/cases/base.plugin.yml` (generated from `examples.yml`) against the
  `classic`, `terminal` and `repository` templates in Action, web and placeholder modes.
- Mocks backing this code: `tests/mocks/api/github/graphql/base.user.mjs`, `base.repositories.mjs`,
  `base.repository.mjs`, `base.field.mjs`, `base.field.repositories.mjs`, `base.contributions.mjs`,
  `base.calendar.mjs`, plus `tests/mocks/api/github/rest/users/getByUsername.mjs` and `rest/request.mjs`.
  There is no `base.organization.mjs` mock, so mocked runs always resolve as a user account.
- A one-off mocked Action run: `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes node source/app/action/index.mjs`.

### Common Patterns
- `Object.assign(data.user, (await graphql(queries.base[...]({...})))[account])` — every query is written so the
  account type is the top-level field name and can be indexed dynamically.
- Every failure path is a `try/catch` that logs through
  ``console.debug(`metrics/compute/${login}/base > ...`)`` and degrades to `NaN` instead of throwing.
- The account probe loop `for (const account of ["user", "organization"])` only continues to the next type on a
  `Could not resolve to a User with the login of` error; any other error is rethrown.
- `callbacks?.plugin?.(login, "base", success, data)` is invoked on every exit path (used by the web instance for
  progressive rendering).

## Dependencies
### Internal
- `source/app/metrics/index.mjs` (calls this plugin before the template computer),
  `source/app/metrics/setup.mjs` (registers `queries.base`, sets `conf.settings.plugins.base.parts`),
  `source/app/metrics/metadata.mjs` (`inputs()`, `extras()`),
  `source/templates/*/partials/base.header.ejs`, `base.activity+community.ejs`, `base.repositories.ejs`
  (`classic`, `terminal`; `repository` only has `base.header.ejs`),
  `source/templates/repository/template.mjs` (uses `queries.base.repository`).

### External
- GitHub GraphQL API through `@octokit/graphql`, GitHub REST API through `@octokit/rest`
  (`rest.search.commits`, `rest.packages.listPackagesForUser` / `listPackagesForOrganization`).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
