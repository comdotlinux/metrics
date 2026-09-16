<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-16 -->

# list

## Purpose
The achievement catalog of the `achievements` plugin. Each module exports one async function that receives
`{list, login, data, computed, imports, graphql, queries, rest, rank, leaderboard}`, issues its account-type
query, and pushes one object per achievement onto `list`. The parent `index.mjs` calls
`compute[account]({...})` so the export names must stay `user` and `organization`. Nothing here filters or
sorts; that happens in the parent.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Three lines: re-exports `organizations.mjs` as `organization` and `users.mjs` as `user`. |
| `users.mjs` | 24 achievements for user accounts, 398 lines (most of it inline SVG icon markup). Runs `queries.achievements({login})` then `queries.achievements.ranking(scores)` where `scores = {followers, created, stars, forks}`. |
| `organizations.mjs` | 10 achievements for organization accounts, 168 lines. Runs `queries.achievements.organizations({login})` then the same `ranking` query with `followers: 0`. |

## For AI Agents
### Working In This Directory
- **Achievement object shape**: `{title, text, icon, ...rank(value, [c, b, a, s, max]), value, unlock, leaderboard?}`.
  `title` is what `plugin_achievements_only` and `plugin_achievements_ignored` match (lower-cased, without the
  rank adjective). `icon` is raw inline SVG using the literal strings `#primary` and `#secondary`, which the
  parent replaces with the rank color pair. `unlock` is `new Date(node?.createdAt)` and renders as `null` when
  the node is missing.
- **Secret achievements** set `rank: value ? "$" : "X"` and `progress: value ? 1 : 0` directly instead of
  calling `rank()`. They only appear when `plugin_achievements_secrets` is on.
- **Leaderboards**: only `Developer(s)`, `Influencer`, `Maintainer(s)` and `Inspirer(s)` pass a `leaderboard`.
  The `requirement` guard (`requirements = {stars: 5, followers: 3, forks: 1, created: 1}`) makes the
  leaderboard `null` for accounts below the floor, which keeps meaningless percentiles out of the render.
- **User achievements**: Developer (public repositories, `[1,20,50,100,250]`, leaderboard `created_rank`),
  Forker (forks, `[1,5,10,20,50]`), Contributor (pull requests, `[1,200,500,1000,2500]`), Manager (user
  `projectsV2` boards, `[1,2,3,4,5]`; the classic `projects` field it used before was removed from the
  GraphQL API, see upstream PR 1834), Reviewer (pull request reviews, `[1,200,500,1000,2500]`), Packager (packages plus
  ghcr.io containers via `rest.packages.listPackagesForUser`, `[1,5,10,20,30]`), Gister (gists,
  `[1,20,50,100,250]`), Worker (organizations, `[1,2,4,8,10]`), Stargazer (starred repositories,
  `[1,200,500,1000,2500]`), Follower (following, `[1,200,500,1000,2500]`), Influencer (followers,
  `[1,200,500,1000,2500]`, leaderboard `user_rank`), Maintainer (most-starred repository,
  `[1,1000,5000,10000,25000]`, leaderboard `repo_rank`), Inspirer (highest `forkCount` in
  `data.user.repositories.nodes`, `[1,100,500,1000,2500]`, leaderboard `forks_rank`), Polyglot (distinct
  languages across repositories, `[1,4,8,16,32]`), Member (`computed.registered.years`, `[1,3,5,10,15]`),
  Sponsor (sponsorships as sponsor, `[1,3,5,10,25]`), Deployer (`computed.repositories.deployments`,
  `[1,200,500,1000,2500]`), Chatter (discussions started plus comments, `[1,200,500,1000,2500]`), Helper
  (discussion answers, `[1,20,50,100,250]`), and five secrets: Verified (a GPG key exists at
  `https://github.com/<login>.gpg`), Explorer (starred topics page does not say "doesn't have any starred
  topics yet"), Automator (`process.env.GITHUB_ACTIONS` is set, so it can only unlock on the Action),
  Infographile (`queries.achievements.metrics()` reports `viewerHasStarred` on `lowlighter/metrics` and the
  viewer is the rendered login), Octonaut (`queries.achievements.octocat()` reports `viewerIsFollowing` on
  `octocat` and the viewer is the rendered login).
- **Organization achievements**: Developers (`[1,50,100,200,300]`, leaderboard `created_rank`), Forkers
  (`[1,10,30,50,100]`), Managers (`[1,2,4,8,10]`), Packagers (packages plus ghcr.io containers via
  `rest.packages.listPackagesForOrganization`, `[1,20,50,100,250]`), Maintainers (most-starred repository,
  `[1,5000,10000,30000,50000]`, leaderboard `repo_rank`), Inspirers (highest `forkCount`,
  `[1,500,1000,3000,5000]`, leaderboard `forks_rank`), Polyglots (`[1,8,16,32,64]`), Sponsors
  (`[1,5,10,20,50]`), Organization (`membersWithRole`, `[1,100,500,1000,2500]`), Member
  (`computed.registered.years`, `[1,3,5,10,15]`).
- Adding an achievement: append a block to the relevant file, reuse `rank()` and `imports.s()` for pluralizing,
  and remember that any new GraphQL field must be added to `../queries/achievements.graphql` or
  `../queries/organizations.graphql` **and** to the matching mock in
  `tests/mocks/api/github/graphql/achievements.default.mjs` / `achievements.organizations.mjs`, otherwise mocked
  test runs read `undefined`.
- Some values come from `data.user` and `computed` rather than the plugin's own query (Inspirer, Polyglot,
  Member, Deployer), so they depend on `base` having run with enough `repositories` fetched.
- Fields that would need extra token scopes (project names, package names, organization names) are commented out
  in the queries; do not uncomment them without adding the scope to `metadata.yml`.

### Testing Requirements
- Exercised through the parent plugin only: `npm run test-metrics` with `tests/cases/achievements.plugin.yml`.
  The `plugin_achievements_only` lists in `../examples.yml` name specific achievements
  (`sponsor, maintainer, octonaut` and `polyglot, stargazer, sponsor, deployer, member, maintainer, developer,
  scripter, packager, explorer, infographile, manager`), so renaming a `title` silently empties those cases.
  Note that `scripter` in the compact example matches no achievement in this directory.
- Mocks: `tests/mocks/api/github/graphql/achievements.default.mjs`, `achievements.organizations.mjs`,
  `achievements.ranking.mjs`, `achievements.metrics.mjs`, `achievements.octocat.mjs`.
- The Verified and Explorer achievements issue unmocked `imports.axios.get` calls to `github.com` even under
  `use_mocked_data`.

### Common Patterns
- One `{ ... }` block per achievement, opened by a `//Title` comment, computing `value` and `unlock`, then a
  single `list.push({...})`.
- `imports.s(value)` / `imports.s(value, "y")` build the plural suffix inside the `text` template string.
- REST calls that may lack scopes are written `(await rest.packages.list...(...).catch(() => ({data: []})))?.data?.length || 0`.

## Dependencies
### Internal
- `../index.mjs` (supplies `rank`, `leaderboard`, and the resolved totals), `../queries/*.graphql`,
  `source/app/metrics/utils.mjs` (`imports.s`, `imports.axios`), `data.user` and `data.computed` produced by
  `source/plugins/base/index.mjs` and `source/plugins/core/index.mjs`.

### External
- GitHub GraphQL API, GitHub REST packages API, and direct HTTPS reads of `github.com/<login>.gpg` and
  `github.com/stars/<login>/topics`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
