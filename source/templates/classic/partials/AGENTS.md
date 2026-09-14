<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-14 -->

# source/templates/classic/partials

## Purpose
One EJS fragment per plugin for the classic template, plus `_.json` which lists them in render order.
`classic/image.svg` iterates `partials` (the parsed `_.json`, reordered by the user `config_order` input)
and calls `include("partials/<name>.ejs")` for each entry. Each fragment decides on its own whether to
render: it checks `plugins.<name>` for truthiness, then branches on `plugins.<name>.error`. File names are
load-bearing: `source/app/metrics/metadata.mjs` derives the plugin/template compatibility matrix from this
listing, so a plugin without a file here is documented as unsupported by classic.

## Key Files
48 `.ejs` fragments and the ordering file. `_.json` holds 47 names; `traffic` is intentionally missing from
it because its markup lives inside `base.repositories.ejs`.

| File | Description |
|------|-------------|
| `_.json` | JSON array of 47 partial names in render order, starting `base.header`, `introduction`, `base.activity+community`, `base.repositories`, `lines`, `followup` and ending `16personalities`, `fortune`, `splatoon`, `steam`. |
| `16personalities.ejs` | Community 16personalities plugin: personality `type`, per-trait bars from `traits`, accent `color`, `sections` filter. |
| `achievements.ejs` | Achievements plugin: GitHub achievement badges from `list`, compact or detailed `display`. |
| `activity.ejs` | Activity plugin: `events` feed (comment, member, star, release, fork, push, ref, review, wiki, public) with optional `timestamps`. |
| `anilist.ejs` | Anilist plugin: anime and manga `lists`, favourite `characters`, `user` profile, `sections` filter. |
| `base.activity+community.ejs` | Base plugin `activity` and `community` parts (user accounts only): commits, pull requests reviewed and opened, issues, issue comments, organizations, following, sponsoring. |
| `base.header.ejs` | Base plugin `header` part: avatar, display name (followed by ` (login1 + login2)` from `user.accounts` when several accounts were merged, see `source/app/metrics/merge.mjs`; single-account renders are byte-identical to before), registration date with cakeday flag, followers, hireable badge, inline contribution calendar squares, contributed repositories. Has separate user, organization and repository branches. |
| `base.repositories.ejs` | Base plugin `repositories` part: repository count and forks, favourite license, releases, packages, disk usage, sponsors, stargazers, forks, watchers. Also inlines `plugins.traffic.views` and the `base` section of `plugins.lines`. |
| `calendar.ejs` | Calendar plugin: full contribution grid per year from `years`. |
| `chess.ejs` | Chess plugin: last game board `animation`, `moves`, `platform`, `result` and `meta` (players, opening). |
| `code.ejs` | Code plugin: random highlighted `snippet` of the day. |
| `crypto.ejs` | Community crypto plugin: coin `logo` and `symbol`, `current_price` in `vs_currency`, `price_change_percentage_*`, sparkline `chart` over `days`, `precision`. |
| `discussions.ejs` | Discussions plugin: discussions `started`, `comments`, `answers`, `upvotes`, `categories`, `display` mode. |
| `followup.ejs` | Follow-up plugin: open/closed issue and pull request bars, `indepth` state breakdown, `sections` filter. |
| `fortune.ejs` | Community fortune plugin: random `text` rendered with a `color`. |
| `gists.ejs` | Gists plugin: `totalCount`, `stargazers`, `forks`, `files`, `comments`. |
| `habits.ejs` | Habits plugin: `facts` (busiest day and hour, preferred `indents`), `charts`, `linguist` language guesses, all derived from recent `commits`, with a `trim` toggle. |
| `introduction.ejs` | Introduction plugin: rendered profile bio `text` with a `title` that adapts to `mode` (user, organization, repository). |
| `isocalendar.ejs` | Isocalendar plugin: pre-rendered isometric `svg`, current and max `streak`, `max` and `average` commits per day. |
| `languages.ejs` | Languages plugin: `favorites` progress bar and list, `details` toggles (percentage, bytes, lines), `indepth`/`recent` variants, `unique`, `total`, `verified`, `partial` and `sections` flags. |
| `leetcode.ejs` | LeetCode plugin: solved `problems` by difficulty, `skills`, `recent` submissions for `user`, `sections` filter. |
| `lines.ejs` | Lines plugin `history` and `repositories` sections: per-repository added/deleted bars and a history chart. The `base` section is rendered by `base.repositories.ejs` instead. |
| `music.ejs` | Music plugin: `tracks` (recently played or suggestions) with `provider`, `played_at`, heading taken from `mode`. |
| `nightscout.ejs` | Community nightscout plugin: blood glucose readings from `data` as a chart with trend arrows. |
| `notable.ejs` | Notable plugin: `contributions` to notable organizations and repositories. |
| `pagespeed.ejs` | PageSpeed plugin: Lighthouse `scores` as gauges, `metrics` table when `detailed`, optional page `screenshot` of `url`. |
| `people.ejs` | People plugin: avatar grid per requested `types` (followers, following, sponsors, contributors, stargazers, watchers, thanks, members), scaled by `size`. |
| `poopmap.ejs` | Community poopmap plugin: `poops` count aggregated over `days`. |
| `posts.ejs` | Posts plugin: article `list` from `source` (dev.to, Hashnode, ...) with optional `descriptions` and `covers`. |
| `projects.ejs` | Projects plugin: GitHub project cards from `list` with progress bars, `totalCount`, optional `descriptions`. |
| `reactions.ejs` | Reactions plugin: emoji `list` with percentages over the last N `comments`, `details` counts, `twemoji` rendering. |
| `repositories.ejs` | Repositories plugin: featured repository cards from `list` (stars, forks, language, description). |
| `rss.ejs` | RSS plugin: `feed` entries with publication dates from `source`. |
| `screenshot.ejs` | Community screenshot plugin: captured `image` with `title`, `width` and `height` (optionally a `content` selector crop). |
| `skyline.ejs` | Skyline plugin: 3D contribution skyline frame or `animation`, with a `compatibility` fallback image and `width`/`height`. |
| `splatoon.ejs` | Community splatoon plugin: `player` gear and rank, `vs` battle results, `salmon` run results, `icons`, `sections` filter. |
| `sponsors.ejs` | Sponsors plugin: sponsor avatars from `list`, `goal` progress bar, `past` sponsors, `about` text, custom `title`, `count`, `size`, `sections`. |
| `sponsorships.ejs` | Sponsorships plugin: sponsored accounts `list`, total `amount`, `started` date, optional `image`, `size`, `sections`. |
| `stackoverflow.ejs` | Stack Overflow plugin: `user` profile card and per-`sections` answers, questions and comments rendered as `lines`. |
| `stargazers.ejs` | Stargazers plugin: `total` stars, `months` chart built from `increments`, optional `worldmap` and extra `charts`. |
| `starlists.ejs` | Star lists plugin: star `lists` with their repositories and counts. |
| `stars.ejs` | Stars plugin: recently starred `repositories` with descriptions and star counts. |
| `steam.ejs` | Community steam plugin: `player` profile, `games` with playtime and achievements, `sections` filter. |
| `stock.ejs` | Community stock plugin: `price` and `delta` for `symbol`/`company` in `currency`, `chart` over `duration`. |
| `support.ejs` | Support plugin: GitHub Community Support `stats` (hearts received, topics created, posts, solutions) and earned `badges`. |
| `topics.ejs` | Topics plugin: starred or mastered topics from `list`, layout driven by `mode` (starred, labels, icons, mastered) and `type`. |
| `traffic.ejs` | Stub containing only an EJS comment. Traffic views are rendered inside `base.repositories.ejs`; this file exists so `metadata.plugin` flags the traffic plugin as classic-compatible. |
| `tweets.ejs` | Tweets plugin (deprecated upstream): latest tweets `list` for `username` with optional `profile` card. |
| `wakatime.ejs` | WakaTime plugin: total `time`, and bars for `languages`, `editors`, `projects` and `os` over `days`, filtered by `sections`. |

## For AI Agents
### Working In This Directory
- Adding a file here changes generated documentation: `metadata.plugin` matches
  `^<plugin>(?:[.][\s\S]+)?[.]ejs$` against this listing to fill the plugin README compatibility row and
  `.github/readme/partials/documentation/compatibility.md`, while `metadata.template` uses an exact
  `<plugin>.ejs` match for the classic README icon row. Both outputs are regenerated by `npm run build`.
- A new partial must also be added to `_.json`, otherwise `image.svg` never includes it.
- These files are served publicly by the web instance: `source/app/web/instance.mjs` mounts
  `express.static(<templates>/classic/partials)` at `/.templates/classic/partials`, so anything added here
  is downloadable by any visitor of a hosted instance.
- Partials run with `async: true`, so `await include(...)` is legal, and the render context contains
  `plugins`, `base`, `user`, `computed`, `meta`, `config`, `account`, `errors`, `warnings`, plus `s()` and
  `f()` helpers (`f.date`, `f.license`, `f.bytes`).
- `CONTRIBUTING.md` asks for discussion before changing built-in templates; new themes belong in a
  community template repository.

### Testing Requirements
- Every plugin case in `tests/cases/*.plugin.yml` renders through classic in all three matrices of
  `tests/metrics.test.js` unless the plugin has no partial here, so a syntax error in one file breaks a
  large portion of `npm run test-metrics`.
- Data shown by these partials comes from the mocks in `tests/mocks/api/**` (GraphQL, REST, axios),
  selected with `use_mocked_data: yes`.
- Quick visual check of a single partial:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=classic INPUT_PLUGIN_<NAME>=yes node source/app/action/index.mjs`.

### Common Patterns
- Guard, error branch, content:
  `<% if (plugins.x) { %>` then `<% if (plugins.x.error) { %><div class="field error">…error.message…</div><% } else { %>`.
- Headings are `<h2 class="field">` with an inline octicon `<svg>` pasted before the label.
- Counts use the helpers, for example `<%= plugins.gists.totalCount %> Gist<%= s(plugins.gists.totalCount) %>`.
- Bracket access is required for the plugin whose name starts with a digit: `plugins["16personalities"]`.

## Dependencies
### Internal
`source/plugins/*` and `source/plugins/community/*` (data shapes rendered here), `source/plugins/base`
(`base.*` partials), `../style.css` (all classes), `../image.svg` (include loop),
`source/app/metrics/metadata.mjs` (compatibility derivation).

### External
`ejs`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
