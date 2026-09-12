<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# tests/cases

## Purpose
54 fully generated yml files, one per registered plugin (`<plugin>.plugin.yml`, 49 files) and one per registered
template (`<template>.template.yml`, 5 files). Each holds the list of rendering scenarios that `metrics.test.js`
executes against the GitHub Action, the web instance and the browser placeholder. They are produced by
`.github/scripts/build.mjs` from `source/plugins/<name>/examples.yml` and `source/templates/<name>/examples.yml`
via its `testcase(name, "test", example)` helper, which is the same function that emits the production
counterparts into `.github/workflows/examples.yml`. Nothing here is authored by hand and `tests/ci.test.js`
fails any pull request that shows `tests/cases/*` as modified without the generator having been rerun.

## Key Files
Every file is a yaml sequence of test steps. The number in parentheses is how many steps the file currently
contains; a `[]` file means every example in the source `examples.yml` carries `test: {skip: true}`.

| File | Cases |
|------|-------|
| `16personalities.plugin.yml` (1), `achievements.plugin.yml` (2), `activity.plugin.yml` (1), `anilist.plugin.yml` (3), `base.plugin.yml` (1), `calendar.plugin.yml` (2), `chess.plugin.yml` (1), `code.plugin.yml` (1), `contributors.plugin.yml` (2), `core.plugin.yml` (6) | core and github category plugins |
| `discussions.plugin.yml` (1), `followup.plugin.yml` (4), `fortune.plugin.yml` (1), `gists.plugin.yml` (1), `habits.plugin.yml` (2), `introduction.plugin.yml` (2), `isocalendar.plugin.yml` (2), `languages.plugin.yml` (3), `leetcode.plugin.yml` (1), `licenses.plugin.yml` (1), `lines.plugin.yml` (2) | github and social category plugins |
| `music.plugin.yml` (8), `notable.plugin.yml` (2), `pagespeed.plugin.yml` (4), `people.plugin.yml` (2), `posts.plugin.yml` (2), `projects.plugin.yml` (1), `reactions.plugin.yml` (1), `repositories.plugin.yml` (2), `rss.plugin.yml` (1), `screenshot.plugin.yml` (1) | third party service plugins |
| `sponsors.plugin.yml` (2), `sponsorships.plugin.yml` (1), `stackoverflow.plugin.yml` (1), `stargazers.plugin.yml` (3), `starlists.plugin.yml` (2), `stars.plugin.yml` (1), `steam.plugin.yml` (2), `stock.plugin.yml` (1), `topics.plugin.yml` (2), `traffic.plugin.yml` (1), `wakatime.plugin.yml` (1) | remaining plugins |
| `crypto.plugin.yml`, `nightscout.plugin.yml`, `poopmap.plugin.yml`, `skyline.plugin.yml`, `splatoon.plugin.yml`, `support.plugin.yml`, `tweets.plugin.yml` | all `[]`: every example is skipped in the test environment (usually because it needs a live third party account or a very slow renderer) |
| `classic.template.yml` (1), `community.template.yml` (2), `markdown.template.yml` (3), `repository.template.yml` (1), `terminal.template.yml` (1) | template cases; `community.template.yml` exercises `setup_community_templates` with `@classic` and `@terminal` |

## For AI Agents
### Working In This Directory
- **Never hand-edit a file in this directory.** Edit `source/plugins/<name>/examples.yml` (or
  `source/templates/<name>/examples.yml`) and run `npm run build`. `tests/ci.test.js` asserts `tests/cases/*` is
  not in the branch diff, so a manual edit fails CI even if the yaml is valid.
- Step shape produced by the generator:
  - `name` becomes `"<plugin display name> - <example name>"`, for example
    `"Recent activity - Recent activity"` with the plugin emoji prefix taken from `metadata.yml`.
  - `uses: lowlighter/metrics@latest` is copied verbatim from the example and is not used by jest; only the
    `with` block, `modes` and `timeout` matter to `metrics.test.js`.
  - `with` is the example `with` merged with `test.with` overrides, then `use_mocked_data: yes` and
    `verify: yes` are forced, `filename` is deleted, and a falsy `base` is deleted.
  - `${{ secrets.NAME }}` placeholders are substituted with the mock values from `tests/secrets.json`, which is
    why tokens read `MOCKED_TOKEN` (or `NOT_NEEDED` when the example hardcodes it).
  - `modes` (optional, array of `action` / `web` / `placeholder`) restricts which describe blocks run the case.
  - `timeout` (optional, milliseconds) overrides the 60000 ms jest default.
- Controls available in the source `examples.yml`, under a per-example `test:` key: `skip: true` removes the
  example from this directory entirely, `with: {...}` overrides inputs for the test run only, plus `modes` and
  `timeout`. A sibling `prod:` key does the same for the generated examples workflow. `source/plugins/languages`
  is a good reference: it has four examples and only three appear in `languages.plugin.yml` because the indepth
  analysis example sets `test: {skip: true}`.
- Which templates a case actually runs against is not stored here. `metrics.test.js` derives the skip set from
  `metadata.templates[*].readme.compatibility` and from `supports: repository` in the plugin `metadata.yml`.
- A new plugin gets its case file automatically the first time `npm run build` runs after `setup.mjs` discovers
  the directory, so an empty or missing `examples.yml` yields `[]`, not an error.

### Testing Requirements
```
npm run build        # regenerate this directory after touching any examples.yml
npm run test-metrics # jest --runInBand metrics.test.js, consumes every file here
npm run test-contrib # fails if tests/cases/* shows up as modified in the branch diff
```
Every case runs with mocked APIs, so any input value referenced here must have a matching mock under
`tests/mocks/api/` or the request falls through to the real service and the test becomes flaky.

### Common Patterns
- Inputs use the GitHub Action naming (`plugin_<name>_<option>`); the web and placeholder blocks translate them
  to query naming (`<name>.<option>`) at runtime, so write options in action form in `examples.yml`.
- Cases that need a repository context set `template: repository` plus `repo: metrics` in `with`.
- Cases that only make sense in one front-end pin `modes`, for example `screenshot` and `licenses` are
  `action`-only because they shell out or drive puppeteer, and the presets case in `core` is `web`-only.

## Dependencies
### Internal
- Generated by `.github/scripts/build.mjs` from `source/plugins/*/examples.yml` and
  `source/templates/*/examples.yml`, using `tests/secrets.json` for placeholder substitution.
- Consumed by `tests/metrics.test.js` together with `source/app/metrics/metadata.mjs`.
- Guarded by `tests/ci.test.js`.

### External
Parsed with `js-yaml`. No runtime dependency of its own.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
