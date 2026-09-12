<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/plugins/community

## Purpose
Home of the nine community-maintained plugins. Each subdirectory is a complete plugin
(`index.mjs` + `metadata.yml` + `examples.yml` + generated `README.md`) that is auto-discovered
exactly like a core plugin: both `source/app/metrics/setup.mjs` and `source/app/metrics/metadata.mjs`
walk `source/plugins/` and special-case the literal directory name `community` by recursing one level
into it, so `source/plugins/community/chess/` registers as plugin `chess` in the same flat namespace as
`source/plugins/activity/`. Community plugins therefore cannot reuse an official plugin name. The only
structural differences from core plugins are `category: community` and a required `authors:` list in
`metadata.yml`, which `metadata.mjs` turns into `Plugins[<name>].community = true` and uses to sort
them last (`categories = ["core", "github", "social", "community"]`).

## Key Files
| File | Description |
|------|-------------|
| `README.md` | GENERATED. Do not hand-edit. Built from `.github/readme/partials/templated/plugins.community.md`, whose EJS filters `plugins` for `category === "community"` and lays them out two per row (name link, `authors` as `@user` links, demo image from `metadata.yml` `examples.default`), followed by the hand-written "Creating community plugins" guide that also lives in that partial. Regenerate with `npm run build`; `tests/ci.test.js` fails the build if it drifts. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `16personalities/` | by `@lowlighter`. Puppeteer-scrapes a 16personalities profile page for personality type, role/strategy and trait scores (see `16personalities/AGENTS.md`) |
| `chess/` | by `@lowlighter`. Fetches the last game from lichess.org as PGN and renders an animated chessboard (see `chess/AGENTS.md`) |
| `crypto/` | by `@dajneem23`. CoinGecko coin profile plus a price timeline chart (see `crypto/AGENTS.md`) |
| `fortune/` | by `@lowlighter`. Picks a random weighted fortune message. No network, no options (see `fortune/AGENTS.md`) |
| `nightscout/` | by `@legoandmars`. Reads blood glucose entries from a self-hosted Nightscout site (see `nightscout/AGENTS.md`) |
| `poopmap/` | by `@matievisthekat`. Buckets PoopMap public-link entries into an hour-of-day histogram (see `poopmap/AGENTS.md`) |
| `screenshot/` | by `@lowlighter`. Puppeteer screenshot or `innerText` of an arbitrary URL restricted by a CSS selector (see `screenshot/AGENTS.md`) |
| `splatoon/` | by `@lowlighter`. Splatoon 3 recap fetched from Splatnet by a bundled deno build of `s3si.ts`. GPL-3.0, not MIT (see `splatoon/AGENTS.md`) |
| `stock/` | by `@lowlighter`. Yahoo Finance via RapidAPI: company quote plus a price timeline chart (see `stock/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- Scaffold a new plugin with `npm run quickstart -- plugin <name>`. `.github/scripts/quickstart/index.mjs`
  hardcodes `source/plugins/community` as the target for `mode: "plugin"`, so every scaffolded plugin
  lands here regardless of intent.
- Adding or removing a subdirectory changes generated output. Run `npm run build` afterwards to refresh
  this `README.md`, the root `README.md`, `action.yml`, `settings.example.json`, `tests/cases/*` and
  `.github/readme/partials/documentation/compatibility.md`.
- Documentation links inside plugin `README.md` and `metadata.yml` descriptions must use the
  `/source/plugins/community/<name>/README.md` form, not `/source/plugins/<name>/README.md`.
  `splatoon/metadata.yml` is the in-repo example of a cross-option link.
- Contribution policy (`CONTRIBUTING.md`): new community plugins are accepted provided they are
  functional and not redundant with an existing plugin. Changes to an existing plugin must be optional
  and backward compatible. Maintainers are explicitly not obliged to support community plugins.
- Guidelines restated in the generated `README.md`: a plugin must not depend on another plugin (only
  `core` and `base` output may be reused), must not mutate its arguments, must route all option reads
  through `imports.metadata.plugins.<name>.inputs({data, account, q})`, must avoid new npm dependencies
  and sub-processes, and must work on Ubuntu because the action runs there.
- Gotcha: `base.activity+community.ejs` in the template partials is the `base` plugin's "contributions
  to other repositories" section. It has nothing to do with community plugins.

### Testing Requirements
- `npm test` runs the whole suite; `npm run test-metrics` runs only `tests/metrics.test.js`, which walks
  `tests/cases/*.yml` (generated from each plugin's `examples.yml` by `build.mjs`).
- Seven of the nine plugins have real CI coverage: `16personalities`, `chess`, `fortune`, `nightscout`,
  `poopmap`, `screenshot`, `stock`. `crypto` and `splatoon` set `test.skip: true` on every example, so
  `tests/cases/crypto.plugin.yml` and `tests/cases/splatoon.plugin.yml` are literally `[]`.
- Third-party HTTP is mocked per-service under `tests/mocks/api/axios/get/`
  (`lichess.mjs`, `nightscout.mjs`, `poopmap.mjs`, `yahoo.mjs`). There is no puppeteer mock at all, so
  the `16personalities` and `screenshot` cases hit the live web even under `use_mocked_data: yes`.
- Mocked local run of the action: `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes`.
- `npm run linter` must pass: no semicolons, double quotes, 2-space indent, `{a, b}` spacing,
  `//Comment` with no space.

### Common Patterns
- Every `index.mjs` follows the same shape: bail with `return null` when `!q.<name>` or when
  `imports.metadata.plugins.<name>.enabled(enabled, {extras})` is false, read options through
  `inputs({data, account, q})`, then wrap the body in `try {} catch (error) { throw imports.format.error(error) }`.
- Option names arrive in web dot-notation: `plugin_splatoon_versus_limit` in the action becomes
  `"versus.limit"` on the object returned by `inputs()`.
- Tokens are declared `type: token` in `metadata.yml` and delivered as the second argument
  (`{enabled, extras, token}`), never through `q`.
- An `extras:` list on an input gates it behind a web-instance permission. `metadata.mjs` compares the
  list against `settings.json` `extras.features` and throws `Option "<key>" is disabled on this server`
  when a permission is missing. In use here: `metrics.run.puppeteer.scrapping`, `metrics.api.chess.any`,
  `metrics.api.yahoo.finance`, `metrics.npm.optional.d3`, `metrics.api.nintendo.splatnet`,
  `metrics.api.statink`.
- Debug output uses a template literal of the form `metrics/compute/<login>/plugins > <name> > message`
  passed to `console.debug`.
- Rendering: `source/templates/classic/partials/` has an `.ejs` for all nine plugins. `repository` has
  `crypto`, `screenshot`, `stock`. `terminal` has only `screenshot`. `markdown` renders none of them.
  `metadata.mjs` derives the compatibility matrix from those file names.

## Dependencies
### Internal
- `source/app/metrics/setup.mjs` and `source/app/metrics/metadata.mjs` (the `community` special case).
- `source/app/metrics/utils.mjs` supplies `imports.axios`, `imports.puppeteer`, `imports.imgb64`,
  `imports.record`, `imports.sharp`, `imports.Graph`, `imports.run`, `imports.fs`, `imports.__module`,
  `imports.format.error`.
- `source/plugins/core` validates `supports` and `inputs` before any plugin runs.
- `source/templates/*/partials/` render the returned objects.
- `.github/readme/partials/templated/plugins.community.md` generates this directory's `README.md`.
- `.github/scripts/quickstart/index.mjs` scaffolds into this directory.

### External
- APIs: lichess.org, api.coingecko.com, a user-supplied Nightscout host, api.poopmap.net,
  yh-finance.p.rapidapi.com, Nintendo Splatnet plus api.imink.app, stat.ink, and arbitrary URLs for
  `screenshot` and `16personalities`.
- npm: `axios`, `puppeteer`, `sharp`, plus `optionalDependencies` `chess.js` (chess) and `d3` (stock charts).
- Binaries: `deno` for `splatoon` (installed in the `Dockerfile`), Chrome for the puppeteer plugins.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
