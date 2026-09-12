<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/repository/partials

## Purpose
The repository-mode partial set: 19 EJS fragments and the `_.json` render order that `repository/image.svg`
iterates. It is a deliberate subset of the classic partials, restricted to plugins that make sense for a
single repository, plus two partials (`contributors.ejs` and `licenses.ejs`) that exist only here because
their plugins are repository-only. The fragments read the repository-shaped data prepared by
`../template.mjs`, in particular `data.repo` and the rewritten `data.user`.

## Key Files
19 `.ejs` fragments and the ordering file. `_.json` holds 17 names; `lines` and `traffic` are absent from it
because their markup is inlined in `base.header.ejs`.

| File | Description |
|------|-------------|
| `_.json` | Render order: `base.header`, `introduction`, `followup`, `languages`, `projects`, `pagespeed`, `stargazers`, `people`, `activity`, `posts`, `rss`, `screenshot`, `stock`, `crypto`, `contributors`, `sponsors`, `licenses`. |
| `activity.ejs` | Activity plugin: `events` feed for the repository with optional `timestamps`. |
| `base.header.ejs` | Base plugin `header` part in repository mode: `user.name` (rewritten to `login/repo`), creation date with cakeday flag, `repo.deployments.totalCount`, disk usage, the synthesized 14 day calendar from `computed.calendar`, and inlined `plugins.traffic.views` and `plugins.lines` added/deleted fields. |
| `contributors.ejs` | Contributors plugin (repository-only): contributor avatars from `list`, commit range from `base`/`head` or `ref.base`/`ref.head` abbreviated oids, `contributions` counts and `categories` breakdown, filtered by `sections`. |
| `crypto.ejs` | Community crypto plugin: `logo`, `symbol`, `current_price`, `price_change_percentage_*`, sparkline `chart` over `days` in `vs_currency`. |
| `followup.ejs` | Follow-up plugin: open and closed issue and pull request counts with the `indepth` state breakdown. |
| `introduction.ejs` | Introduction plugin: repository description rendered as `text`, heading driven by `mode`. |
| `languages.ejs` | Languages plugin: `favorites` bar and list, `unique` count, `details` toggles, `recent` variant, `sections` filter. |
| `licenses.ejs` | Licenses plugin (repository-only): `default` license with `permissions`, `limitations` and `conditions`, plus dependency license `list`, `known`/`unknown` counts, `ratio` and `legal` text. |
| `lines.ejs` | Stub containing only an EJS comment; the added/deleted fields are rendered by `base.header.ejs`. Present so the compatibility matrix flags the lines plugin. |
| `pagespeed.ejs` | PageSpeed plugin: Lighthouse `scores` gauges, `metrics` table when `detailed`, optional `screenshot` of `url`. |
| `people.ejs` | People plugin: avatar grid per `types` (contributors, stargazers, watchers, sponsors, ...), scaled by `size`. |
| `posts.ejs` | Posts plugin: article `list` from `source` with optional `descriptions` and `covers`. |
| `projects.ejs` | Projects plugin: repository project boards from `list` with progress bars. Note `../template.mjs` forces `q["projects.limit"] = 0` and strips the `(login/repo)` suffix from project names. |
| `rss.ejs` | RSS plugin: `feed` entries from `source`. |
| `screenshot.ejs` | Community screenshot plugin: captured `image` with `title`, `width` and `height`. |
| `sponsors.ejs` | Sponsors plugin: sponsor avatars `list`, `goal` progress, `about` text, `count`, `sections`. |
| `stargazers.ejs` | Stargazers plugin: `total` stars and the `months` chart built from `increments`. |
| `stock.ejs` | Community stock plugin: `price`, `delta`, `chart` over `duration` for `symbol`/`company` in `currency`. |
| `traffic.ejs` | Stub containing only an EJS comment; traffic views are rendered by `base.header.ejs`. Present so the compatibility matrix flags the traffic plugin. |

## For AI Agents
### Working In This Directory
- The template has no `style.css` of its own, so every class used here must exist in
  `../../classic/style.css` (the `Repository`, `Contributors` and `Licenses` sections of that file cover the
  repository-specific blocks).
- A partial only renders when the plugin also declares `repository` in its `metadata.yml` `supports` list.
  Adding a file here for a user-only plugin produces a documentation entry but the plugin itself refuses to
  run, and `tests/metrics.test.js` skips it in the repository column.
- `data.repo` is only available in this template (set by `../template.mjs`); classic partials never see it.
- These files are served publicly at `/.templates/repository/partials` by the web instance
  (`express.static` mount in `source/app/web/instance.mjs`).
- New partial names must be added to `_.json`, except deliberate stubs like `lines.ejs` and `traffic.ejs`.

### Testing Requirements
- The repository column of the GitHub Action and web instance matrices in `tests/metrics.test.js` renders
  every compatible plugin case with `{repo: "metrics"}`, which is what exercises these partials.
- `tests/cases/repository.template.yml` is the template's own case file, generated from `../examples.yml`.
- Mocked render:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=repository INPUT_USER=lowlighter INPUT_REPO=metrics INPUT_PLUGIN_CONTRIBUTORS=yes node source/app/action/index.mjs`.

### Common Patterns
- Same guard/error/content skeleton and `<h2 class="field">` headings with inline octicons as the classic
  partials; several files are near-copies of their classic counterparts with user-specific rows removed.
- Optional chaining is used on plugin sub-objects that only exist in some modes, for example
  `plugins.contributors.ref?.base?.abbreviatedOid`.

## Dependencies
### Internal
`../template.mjs` (`data.repo`, rewritten calendar and user fields), `../image.svg` (include loop),
`../../classic/style.css` (all classes), `source/plugins/contributors`, `source/plugins/licenses` and the
other plugins rendered here, `source/app/metrics/metadata.mjs` (compatibility derivation).

### External
`ejs`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
