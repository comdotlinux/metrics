<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# tests/mocks

## Purpose
The fake-API layer that makes the whole test suite offline and deterministic. `index.mjs` exports a single
function that both front-ends call when mocked data is requested (`source/app/action/index.mjs` when
`use_mocked_data` is set, `source/app/web/instance.mjs` when the instance is configured with mocking). It
returns replacement `graphql` and `rest` handles and, as a side effect, monkeypatches `axios.get`, `axios.post`,
`rss-parser` and the google-maps client in place. Every generated payload is built with `@faker-js/faker`, so
values differ on each run and plugins must not assert on exact data. Mocking is idempotent: a module-level
`mocked` flag makes the second call a no-op that hands the original handles back.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | The mocking entrypoint, `export default async function({graphql, rest})`. Recursively walks `api/` with `fs.readdir` + `fs.lstat`, `import()`s every file it finds and stores its default export under the file name minus the `.mjs` extension, mirroring the directory tree into a nested `mocks` object. Then installs four interception layers (GraphQL Proxy, REST Proxy, axios get/post Proxies, prototype patches for rss-parser and google-maps) and sets `process.env.METRICS_MOCKED = true`. Logs `metrics/compute/mocks > ...` lines throughout. |
| `.eslintrc.yml` | Turns off `max-params` and `no-unused-vars` for this subtree, because mock signatures take four positional arguments and typically ignore most of them. |

## Skipped subdirectories
- `api/` (and everything below it) has **no AGENTS.md at any level**: `index.mjs` `import()`s every single file it
  finds under `api/`, so a non-module file such as `AGENTS.md` would throw and break every mocked test. The whole
  tree is documented here instead.

### `api/axios/get/` (11 files, third party HTTP services)
| File | Mocks |
|------|-------|
| `lastfm.mjs` | `ws.audioscrobbler.com`; branches on `user.getrecenttracks`, `user.gettoptracks`, `user.gettopartists` |
| `lichess.mjs` | `lichess.org/api/games/user`, returns a stream of PGN games |
| `nightscout.mjs` | `testapp.herokuapp.com`, the Nightscout glucose endpoint used by the plugin example |
| `pagespeed.mjs` | `www.googleapis.com/pagespeedonline/v5`, only for `runPagespeed` calls carrying `&key=MOCKED_TOKEN` |
| `poopmap.mjs` | `api.poopmap.net`, only for `public_links/MOCKED_TOKEN` |
| `spotify.mjs` | `api.spotify.com` for `me/player/recently-played`, `me/top/tracks`, `me/top/artists`; every branch requires the header `Authorization: Bearer MOCKED_TOKEN_ACCESS` |
| `stackoverflow.mjs` | `api.stackexchange.com/2.2` for user profile, `filter=total`, questions and answers endpoints |
| `steam.mjs` | `store.steampowered.com/api/appdetails` plus `api.steampowered.com` for `IPlayerService/GetOwnedGames`, `ISteamUserStats/GetSchemaForGame`, `IPlayerService/GetSteamLevel`, `ISteamUser/GetPlayerSummaries` (largest mock in the tree) |
| `twitter.mjs` | `api.twitter.com` for `users/by/username` and `tweets/search/recent`, both gated on `Authorization: Bearer MOCKED_TOKEN` |
| `wakatime.mjs` | `wakatime.com/api/v1/users/*/stats` with `api_key=MOCKED_TOKEN`; `api_key=MOCKED_TOKEN_NO_PROJECTS` returns `projects: null` to exercise the empty branch |
| `yahoo.mjs` | `yh-finance.p.rapidapi.com/stock/v2` for `get-profile` and `get-chart` |

### `api/axios/post/` (5 files)
| File | Mocks |
|------|-------|
| `anilist.mjs` | `graphql.anilist.co`; dispatches on the query name in the request body: `Statistics`, `FavoritesCharacters`, `Favorites`, `Medias` |
| `hashnode.mjs` | `api.hashnode.com`, the Hashnode GraphQL endpoint used by the posts plugin |
| `leetcode.mjs` | `leetcode.com/graphql`; dispatches on body query name `Languages`, `Skills`, `Problems`, `Recent` |
| `spotify.mjs` | `accounts.spotify.com/api/token`, returns `access_token: "MOCKED_TOKEN_ACCESS"`, the value the get mock then demands |
| `youtubemusic.mjs` | `music.youtube.com/youtubei/v1`, the `browse` call |

### `api/github/graphql/` (49 files, GitHub GraphQL API)
The file name is turned into a regex: dots are dropped and the following letter uppercased, the first letter is
uppercased, and a trailing space is required. `user.calendar.mjs` therefore matches `^query UserCalendar `,
which is why every `source/plugins/*/queries/*.graphql` file must declare `query <Plugin><Query> ` with a space
before the brace.

| Plugin prefix | Files |
|---------------|-------|
| `achievements` (6) | `achievements.default.mjs` (repositories feeding achievement counters), `achievements.metrics.mjs` (`viewerHasStarred`), `achievements.octocat.mjs` (`viewerIsFollowing`), `achievements.organizations.mjs` (org repositories), `achievements.ranking.mjs` (repo/fork/star rank counts), `achievements.total.mjs` (global repository, issue and user counts) |
| `base` (7) | `base.calendar.mjs` and `base.contributions.mjs` (contribution calendar and collection), `base.field.mjs` (packages, starred repositories, watching counters), `base.field.repositories.mjs` (repositories `totalCount`/`totalDiskUsage`), `base.repositories.mjs` (paginated repository list), `base.repository.mjs` (single `metrics` repository), `base.user.mjs` (profile: `databaseId`, name, login, `createdAt`, avatar, website, twitter) |
| `calendar` / `isocalendar` (2) | `calendar.default.mjs` and `isocalendar.calendar.mjs` build week-by-week contribution days by parsing the `from:`/`to:` ISO dates out of the query and walking the range day by day |
| `contributors` (1) | `contributors.commit.mjs` returns a commit object with `oid: "MOCKED_SHA"` |
| `discussions` (3) | `discussions.categories.mjs`, `discussions.comments.mjs`, `discussions.statistics.mjs` (started/comments/answers counters) |
| `followup` (3) | `followup.user.mjs` and `followup.repository.mjs` return `issues_open`/`issues_drafts`/`issues_skipped` style aliased counts; `followup.repository.collaborators.mjs` returns `["github-user"]` |
| `gists` (1) | `gists.default.mjs` paginated gists with stargazer, fork, file and comment counts |
| `introduction` (3) | `introduction.user.mjs` (bio), `introduction.organization.mjs` and `introduction.repository.mjs` (description) |
| `licenses` (2) | `licenses.default.mjs` (the SPDX license catalogue, AGPL-3.0 and friends), `licenses.repository.mjs` (repository `licenseInfo`, MIT) |
| `notable` (2) | `notable.contributions.mjs` (`repositoriesContributedTo`), `notable.issues.mjs` (issues and pull requests) |
| `people` (3) | `people.default.mjs`, `people.repository.mjs`, `people.sponsors.mjs` |
| `projects` (4) | `projects.user.mjs` / `projects.repository.mjs` (ProjectsV2) and `projects.user.legacy.mjs` / `projects.repository.legacy.mjs` (classic projects) |
| `reactions` (1) | `reactions.default.mjs` |
| `repositories` (4) | `repositories.pinned.mjs`, `repositories.random.mjs`, `repositories.starred.mjs` (all resolving to `lowlighter/metrics`), `repositories.repository.mjs` (full repository node) |
| `sponsors` (3) | `sponsors.active.mjs`, `sponsors.all.mjs` (paginated), `sponsors.description.mjs` (`sponsorsListing` with an `activeGoal`) |
| `sponsorships` (2) | `sponsorships.default.mjs` (total sponsored cents), `sponsorships.all.mjs` (paginated) |
| `stargazers` / `stars` (2) | `stargazers.default.mjs` (paginated stargazers), `stars.default.mjs` (`starredRepositories` with `starredAt`) |

### `api/github/rest/` (12 files, octokit REST)
| File | Mocks |
|------|-------|
| `request.mjs` | `rest.request`: a `HEAD /` response carrying `x-oauth-scopes: repo`, and `GET .../commits/MOCKED_SHA` with a patch body. See the caveat in "Working In This Directory": this file is currently unreachable. |
| `activity/listEventsForAuthenticatedUser.mjs` | `rest.activity.listEventsForAuthenticatedUser`, paged event feed |
| `activity/listRepoEvents.mjs` | `rest.activity.listRepoEvents`, re-exports the events mock above |
| `emojis/get.mjs` | `rest.emojis.get`, the emoji name to URL map |
| `rateLimit/get.mjs` | `rest.rateLimit.get`, quota resources so the token check passes |
| `repos/get.mjs` | `rest.repos.get` for `{owner, repo}` |
| `repos/getContributorsStats.mjs` | `rest.repos.getContributorsStats` |
| `repos/getViews.mjs` | `rest.repos.getViews`, traffic plugin |
| `repos/listCommits.mjs` | `rest.repos.listCommits` with `{page, per_page, owner, repo}` |
| `repos/listContributors.mjs` | `rest.repos.listContributors` |
| `users/getByUsername.mjs` | `rest.users.getByUsername` |
| `users/listGpgKeysForUser.mjs` | `rest.users.listGpgKeysForUser` |

## For AI Agents
### Working In This Directory
- **Adding a GraphQL mock**: create `api/github/graphql/<plugin>.<query>.mjs` exporting
  `export default function({faker, query, login = faker.internet.userName()})` and returning the plain data
  object the plugin destructures (no `data` wrapper). The file name must map to the `query <Name> ` declared in
  `source/plugins/<plugin>/queries/<query>.graphql`, including the space after the query name.
- **Adding a REST mock**: create `api/github/rest/<section>/<method>.mjs` exporting
  `export default async function({faker}, target, that, [args])`. `target` is the real octokit method, so
  `return target(...args)` is the passthrough escape hatch. The proxy only intercepts a method when both the
  section directory and the method file exist.
- **Adding an axios mock**: create `api/axios/get/<service>.mjs` with
  `export default function({faker, url, options})` (post mocks receive `body` instead of `options`). Return a
  falsy value when the url is not yours: `index.mjs` iterates every service mock in order and takes the first
  truthy result, falling through to the real axios when all decline. Always guard with a url regex first.
- **Pagination convention**: paginated mocks return a first page whose cursor is the literal `"MOCKED_CURSOR"`,
  then detect `after: "MOCKED_CURSOR"` in the incoming query and return an empty page to terminate the loop.
  Follow it or the plugin will paginate forever.
- **Token convention**: mocks recognise the fake credentials that `tests/secrets.json` injects into
  `tests/cases/*`, mostly `MOCKED_TOKEN` and `NOT_NEEDED`. The spotify pair is a chain: the post mock mints
  `MOCKED_TOKEN_ACCESS` and the get mock refuses anything else.
- **Known gap 1**: `api/github/rest/request.mjs` never runs. The rest Proxy wraps `target.request` in a Proxy
  that only defines a `get` trap, so calling `rest.request(...)` reaches the real octokit request. Callers in
  `source/plugins/core/index.mjs`, `code`, `habits` and `languages/analyzer/recent.mjs` therefore hit the live
  API during mocked runs; `core` swallows the failure in a try/catch and reports empty token scopes.
- **Known gap 2**: `api/github/graphql/base.field.repositories.mjs` never matches, because
  `source/plugins/base/queries/field.repositories.graphql` starts with `query BaseFieldRepositories{` and the
  generated regex requires a space before the brace. Adding that space would activate the mock.
- `process.env.METRICS_MOCKED` is set here but is not read anywhere else in the repository.
- Mock files are linted by `npm run linter` under the relaxed rules in `.eslintrc.yml`, and still follow the repo
  style: no semicolons, double quotes, `//Comment` with no space.

### Testing Requirements
```
npm run test-metrics # every case in tests/cases runs through this layer
npm run linter       # eslint source/**/*.mjs (mocks are covered via the shared config)
```
A single mocked run of the action, useful for checking one new mock without jest:
```
INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes node source/app/action/index.mjs
```
Grep the output for `metrics/compute/mocks > mocking ...` lines to confirm the mock was selected. If a plugin
silently hits the network instead, the mock name or its url regex is wrong.

### Common Patterns
- Every mock logs one `console.debug("metrics/compute/mocks > mocking ... result > <name>")` line before
  returning; keep that so failures are traceable in CI output.
- Data is generated with the faker 8 API (`faker.number.int`, `faker.person.fullName`, `faker.location.city`,
  `faker.image.urlLoremFlickr`, `faker.date.recent({days})`), not the pre-8 namespaces.
- The rss-parser patch replaces `rss.prototype.parseURL` and always returns 30 lorem items regardless of feed
  url; the google-maps patch replaces `Gmap.prototype.geocode` and returns one fully formed geocoding result.
  Both are unconditional, so there is no per-feed or per-address mock file.

## Dependencies
### Internal
- Imported by `source/app/action/index.mjs` and `source/app/web/instance.mjs`; nothing in `tests/*.test.js`
  imports it directly.
- Mirrors the GraphQL query names in `source/plugins/*/queries/*.graphql`.

### External
`@faker-js/faker`, `axios`, `rss-parser`, `@googlemaps/google-maps-services-js` (optional dependency), plus node
builtins `fs/promises`, `path`, `url`. The mocked services themselves are GitHub GraphQL and REST, Last.fm,
Lichess, Nightscout, PageSpeed Insights, PoopMap, Spotify, Stack Exchange, Steam, Twitter, WakaTime, Yahoo
Finance, AniList, Hashnode, LeetCode and YouTube Music.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

- Multi-account mocking: `api/github/rest/users/getAuthenticated.mjs` maps the token being mocked to a login:
  `MOCKED_TOKEN` -> the repository owner (`GITHUB_REPOSITORY`, else `octocat`), `MOCKED_TOKEN_<X>` -> lowercased
  `x` (`work`, `fail`). `base.user.mjs` throws for login `fail` so a forced secondary failure can be tested.
  `faker` is seeded per login (graphql `login:`, rest `username`/`owner`), so each account gets stable data.
  `mocks({graphql, rest, token})` wraps every api object passed to it; only the global axios/rss/google-maps
  patches are once-only.
