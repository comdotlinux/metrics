<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/plugins

## Purpose
Every unit of content that metrics can render lives here: one directory per plugin, each holding an
`index.mjs` (the async function that fetches and shapes data), a `metadata.yml` (typed option descriptors,
category, supported account types, required token scopes), an `examples.yml` (workflow snippets that become
both README demos and jest test cases) and a generated `README.md`. `source/app/metrics/setup.mjs` (`load.plugin`)
imports every `index.mjs` into a `Plugins` registry and reads each `queries/*.graphql` file into
`conf.queries.<plugin>`; `source/app/metrics/metadata.mjs` (`metadata.plugin`) parses every `metadata.yml` into
the typed `inputs()` / `enabled()` / `extras()` helpers, into `action.yml`, into `settings.example.json` and into
the README option tables. At render time `core/index.mjs` fans out over `imports.plugins`, awaits each enabled
plugin and stores its return value (or the thrown error object) in `data.plugins.<name>`, which the template EJS
partials then read. `base/` and `core/` are not user-facing plugins: `base` populates `data.user` before anything
else runs and `core` is the global configuration namespace plus the plugin scheduler.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | GENERATED plugin index (links to every plugin README, grouped by category). Rebuilt by `npm run build`; `tests/ci.test.js` fails the build if it drifts. Never hand-edit. |

## Subdirectories
| Directory | Name (`metadata.yml`) | Category | Purpose |
|-----------|----------------------|----------|---------|
| `base/` | 🗃️ Base content | core | Fetches the account and its repositories into `data.user`; runs before every other plugin (see `base/AGENTS.md`). |
| `core/` | 🧱 Core | core | Global options (token, output, template, emojis, retries, debug flags) and the plugin scheduler (see `core/AGENTS.md`). |
| `achievements/` | 🏆 Achievements | github | Ranked GitHub "achievements" with leaderboard percentiles (see `achievements/AGENTS.md`). |
| `activity/` | 📰 Recent activity | github | Recent GitHub events rendered as a timeline (see `activity/AGENTS.md`). |
| `anilist/` | 🌸 Anilist watch list and reading list | social | Favorite animes, mangas and characters from an AniList account (see `anilist/AGENTS.md`). |
| `calendar/` | 📆 Commit calendar | github | Multi-year contribution calendar (see `calendar/AGENTS.md`). |
| `code/` | ♐ Random code snippet | github | A random syntax-highlighted diff hunk from recent pushes (see `code/AGENTS.md`). |
| `contributors/` | 🏅 Repository contributors | github | Contributors of a repository between two git refs (see `contributors/AGENTS.md`). |
| `discussions/` | 💬 Discussions | github | GitHub Discussions stats: started, comments, answers, per-category breakdown. |
| `followup/` | 🎟️ Follow-up of issues and pull requests | github | Open/closed issue and open/merged pull request ratios across repositories. |
| `gists/` | 🎫 Gists | github | Aggregated stats over published gists (stars, forks, comments, files). |
| `habits/` | 💡 Coding habits and activity | github | Active hours/days, indent style and recently used languages inferred from recent events. |
| `introduction/` | 🙋 Introduction | github | Account bio, or organization / repository description. |
| `isocalendar/` | 📅 Isometric commit calendar | github | Isometric SVG contribution calendar with streaks and daily average. |
| `languages/` | 🈷️ Languages activity | github | Language usage, with an optional indepth mode that clones and runs linguist over repositories. |
| `leetcode/` | 🗳️ Leetcode | social | Solved problems, skills and recent submissions from a LeetCode account. |
| `licenses/` | 📜 Repository licenses | github | License permissions/limitations/conditions plus dependency license stats. |
| `lines/` | 👨‍💻 Lines of code changed | github | Added and removed lines across repositories, with optional per-repository history. |
| `music/` | 🎼 Music activity and suggestions | social | Recent or top tracks from Spotify, Last.fm, Apple Music or YouTube Music. |
| `notable/` | 🎩 Notable contributions | github | Badges for organizations and repositories the user has contributed to. |
| `pagespeed/` | ⏱️ Google PageSpeed | social | Google PageSpeed Insights scores and metrics for a website. |
| `people/` | 🧑‍🤝‍🧑 People | github | Avatar grids of followers, following, sponsors, contributors, stargazers, members, etc. |
| `posts/` | ✒️ Recent posts | social | Latest articles from dev.to, Hashnode or Medium. |
| `projects/` | 🗂️ GitHub projects | github | Progress of user, organization and repository projects (classic and beta boards). |
| `reactions/` | 🎭 Comment reactions | github | Reaction distribution over the user's recent issue, comment and discussion activity. |
| `repositories/` | 📓 Featured repositories | github | Cards for pinned, starred, random or explicitly listed repositories. |
| `rss/` | 🗼 Rss feed | social | Entries from an arbitrary RSS/Atom feed. |
| `skyline/` | 🌇 GitHub Skyline | github | Animated 3D commit calendar captured from skyline.github.com (large output). |
| `sponsors/` | 💕 GitHub Sponsors | github | Sponsors of an account plus the sponsor goal / introduction card. |
| `sponsorships/` | 💝 GitHub Sponsorships | github | Accounts the user sponsors and the amount funded. |
| `stackoverflow/` | 🗨️ Stack Overflow | social | Reputation, badges, questions and answers from a Stack Overflow account. |
| `stargazers/` | ✨ Stargazers | github | Stargazer growth charts and an optional world map of stargazer locations. |
| `starlists/` | 💫 Star lists | github | GitHub star lists and the repositories they contain. |
| `stars/` | 🌟 Recently starred repositories | github | The most recently starred repositories. |
| `steam/` | 🕹️ Steam | social | Steam player profile, played games and playtime. |
| `support/` | 💭 GitHub Community Support | github | DEPRECATED (`deprecation:` set in `metadata.yml`): stats from the retired github.community forum. |
| `topics/` | 📌 Starred topics | github | Starred topics from GitHub Explore, as icons or labels. |
| `traffic/` | 🧮 Repositories traffic | github | Page views across affiliated repositories (requires a `repo`-scoped token). |
| `tweets/` | 🐤 Latest tweets | social | Latest tweets of a Twitter account (needs a Twitter API token). |
| `wakatime/` | ⏰ WakaTime | social | Coding time by language, editor, project and OS from a WakaTime account. |
| `community/` | (container) | community | 9 community-maintained plugins (`16personalities`, `chess`, `crypto`, `fortune`, `nightscout`, `poopmap`, `screenshot`, `splatoon`, `stock`) plus a GENERATED `README.md`. `setup.mjs` and `metadata.mjs` special-case this directory and load its children one level deeper. |

## Skipped subdirectories
- `*/queries/` (in `achievements/`, `anilist/`, `base/`, `calendar/`, `contributors/`, `discussions/`, `followup/`,
  `gists/`, `introduction/`, `isocalendar/`, `leetcode/`, `licenses/`, `notable/`, `people/`, `posts/`, `projects/`,
  `reactions/`, `repositories/`, `sponsors/`, `sponsorships/`, `stargazers/`, `stars/`) — no AGENTS.md anywhere:
  `setup.mjs` `load.plugin` does `readdir(queries)` and reads **every** file as a GraphQL query string, so an
  `AGENTS.md` would be registered as `queries.<plugin>["AGENTS.md"]`. Each `queries/*.graphql` file is instead
  described inside its plugin's own AGENTS.md.

## For AI Agents
### Working In This Directory
- **Plugin contract.** `index.mjs` default-exports
  `async function({login, q, imports, data, computed, rest, graphql, queries, account}, {enabled = false, extras = false, ...settings} = {})`.
  Return `null` when `!q.<name>` or when `!imports.metadata.plugins.<name>.enabled(enabled, {extras})`; return a plain
  object otherwise. Wrap the whole body in `try {} catch (error) { throw imports.format.error(error) }` so the
  scheduler stores a `{error: {message, instance}}` object in `data.plugins.<name>` instead of crashing the render.
- **Option naming.** `metadata.yml` keys are written `plugin_<name>_<option>` (GitHub Action input spelling).
  `metadata.to.query` strips the `plugin_` prefix, turns `_` into `.` and then drops the plugin prefix, so the web
  query object uses `<name>.<option>` and `imports.metadata.plugins.<name>.inputs({data, q, account})` hands you a
  plain `option` key. Lookup order inside `inputs()` is `q["plugin.<name>.<option>"]`, then `q["<name>.<option>"]`,
  then `q["plugin_<name>_<option>"]`, then the declared `default`. Types `boolean|number|string|array|json|token`
  are coerced there (arrays honour `format: comma-separated|space-separated|newline-separated`, strings with a
  `values:` list fall back to the default, `.user.login` / `.user.twitter` / `.user.website` are templated from the
  fetched user).
- **`enabled` vs `extras`.** `enabled` is the per-instance switch (`settings.json` `plugins.<name>.enabled` on a web
  instance, always true in the Action). `meta.enabled()` throws `Error` with `.enabled = true` when the plugin is
  disabled, and additionally runs `meta.extras("enabled")`. `meta.extras(input)` checks the `extras:` permission
  list declared on that input (for instance `metrics.run.puppeteer.scrapping`, `metrics.api.github.overuse`,
  `metrics.run.git`, `metrics.run.tempdir`) against `conf.settings.extras.features`; pass `{error: false}` to get a
  boolean instead of a throw, which is the pattern for gating a single optional feature inside a plugin.
- **`account`.** One of `"user"`, `"organization"` (set by `base`) or `"bypass"`. `inputs()` refuses to run when the
  current context (`q.repo ? "repository" : account`) is missing from `supports:` in `metadata.yml`, throwing
  `Unsupported context <context>`. Use `account: "bypass"` only for global/base-level reads.
- **Shared options.** `base` writes `data.shared["repositories.skipped"]`, `data.shared["users.ignored"]`,
  `data.shared["commits.authoring"]` and `data.shared["repositories.batch"]`. A plugin that declares an
  `inherits: repositories_skipped` / `inherits: users_ignored` input must append the shared list to its own, e.g.
  `skipped.push(...data.shared["repositories.skipped"])`, then filter with `imports.filters.repo(repo, skipped)` or
  `imports.filters.text(value, ignored)`.
- **`imports` toolbox** (`source/app/metrics/utils.mjs` spread into `imports`, plus `plugins`, `templates`,
  `metadata`): `axios`, `graphql`/`rest` are passed separately; `format` (and `format.bytes`, `format.percentage`,
  `format.ellipsis`, `format.date`, `format.license`, `format.error`), `s(n)` pluralizer, `imgb64`, `markdown`,
  `highlight`, `htmlescape`/`htmlunescape`, `language`, `filters.repo`/`filters.text`/`filters.github`, `shuffle`,
  `wait`, `puppeteer.launch`, `run`/`spawn`/`which`, `git`, `fs`, `os`, `paths`, `minimatch`, `d3`/`Graph`/`D3node`,
  `sharp`, `emoji`, `opengraph`, `record`/`gif`, `svg`.
- **Adding a plugin.** 1) `npm run quickstart -- plugin <name>` scaffolds `source/plugins/community/<name>/` with
  `index.mjs`, `metadata.yml`, `examples.yml` and `README.md` from `.github/scripts/quickstart/plugin/`.
  2) Fill `metadata.yml`: `name`, `category`, `description`, `index`, `supports`, `scopes`, and one
  `plugin_<name>: {type: boolean, default: no}` input plus the rest. 3) Implement `index.mjs` following the contract
  above; put GraphQL in `queries/<file>.graphql` (`queries.<name>()` is `queries/<name>.graphql`,
  `queries.<name>.<file>()` is `queries/<file>.graphql`; `$var` placeholders are replaced textually, so they are not
  real GraphQL variables and must be injected as already-escaped strings). 4) Add a render partial
  `source/templates/classic/partials/<name>.ejs` and register it in `source/templates/classic/partials/_.json` —
  `metadata.mjs` derives plugin/template compatibility purely from the partial file name. 5) Add mocks under
  `tests/mocks/api/**` (a GraphQL mock file `<plugin>.<query>.mjs` is matched against `query <Plugin><Query> `, so
  `achievements.default.mjs` backs `query AchievementsDefault`). 6) Run `npm run build` to regenerate `README.md`,
  `source/plugins/README.md`, `action.yml`, `settings.example.json`, `tests/cases/<name>.plugin.yml` and the
  workflow examples. New plugins go to `community/` per CONTRIBUTING.md; changes to existing plugins must stay
  optional and backward compatible.
- **Generated files, never hand-edit**: `README.md` here and in every plugin (the `<!--header-->`,
  `<!--options-->`, `<!--examples-->` blocks), `community/README.md`, repository-root `README.md`, `action.yml`,
  `settings.example.json`, `tests/cases/*`, `.github/workflows/examples.yml`.

### Testing Requirements
- `npm run test-metrics` runs `tests/metrics.test.js`. It shells out to `metadata.mjs`, then for every plugin loads
  `tests/cases/<name>.plugin.yml` (built from that plugin's `examples.yml`) and runs each case three times: as the
  GitHub Action (`node source/app/action/index.mjs` with `INPUT_*` env), against a live web instance on port 3000,
  and through the browser placeholder renderer. Each case runs against the `classic`, `terminal` and `repository`
  templates, skipping templates that have no matching partial and skipping `repository` unless `supports:` lists it.
- Action runs are forced with `use_mocked_data: yes`, `plugins_errors_fatal: true`, `dryrun: true`, `verify: true`,
  `retries: 1`, so any plugin error fails the test.
- `tests/mocks/index.mjs` proxies `graphql`, octokit `rest.*`, `axios.get`/`axios.post`, `rss-parser` and the Google
  Maps client. Anything not matched falls through to the real network, so an unmocked endpoint makes tests flaky.
- `npm run test-contrib` (`tests/ci.test.js`) verifies that generated files match what `npm run build` produces.
- Lint with `npm run linter` (ESLint: no semicolons, double quotes, 2-space indent, `{a, b}` with no inner spacing,
  `//Comment` with no space).

### Common Patterns
- Debug logging: ``console.debug(`metrics/compute/${login}/plugins > <name> > message`)``.
- Repository-scoped plugins read `data.repo` (set by `source/templates/repository/template.mjs`) or pick the single
  entry of `data.user.repositories.nodes` when `q.repo` is set.
- Paginated REST reads loop `for (let page = 1; page <= pages; page++)` over `per_page: 100` and break inside a
  `catch` when the API stops returning pages.
- Third-party HTTP goes through `imports.axios`; 429 responses are handled by waiting `retry-after` seconds with
  `imports.wait` and retrying once.
- Images are inlined with `await imports.imgb64(url)` so outputs stay self-contained (disabled by `config_base64: no`).

## Dependencies
### Internal
- `source/app/metrics/setup.mjs` — discovers plugins, imports `index.mjs`, registers `queries/*.graphql`.
- `source/app/metrics/metadata.mjs` — parses `metadata.yml` into `inputs()`, `enabled()`, `extras()`, README tables,
  `action.yml` and `settings.example.json`.
- `source/app/metrics/index.mjs` — builds `data`, `imports` and calls `base` then the template computer.
- `source/app/metrics/utils.mjs` — everything spread into `imports`.
- `source/templates/*/partials/<plugin>.ejs` and `partials/_.json` — rendering and plugin/template compatibility.
- `.github/scripts/build.mjs`, `.github/scripts/quickstart/` — code generation and scaffolding.
- `tests/metrics.test.js`, `tests/cases/*.plugin.yml`, `tests/mocks/**`.

### External
- `@octokit/graphql` and `@octokit/rest` for the GitHub APIs, `axios` for third-party HTTP, `js-yaml` for
  `metadata.yml`, `ejs` for rendering, `puppeteer` for scraping and resizing, `minimatch`, `simple-git`, `d3`,
  `sharp`, `prismjs`, `marked`, `rss-parser`, `@faker-js/faker` (tests only).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
