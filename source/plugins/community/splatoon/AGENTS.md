<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# splatoon

## Purpose
Community plugin that renders a Splatoon 3 recap: overall player profile, recent Turf War / Anarchy
matches and recent Salmon Run shifts. Nintendo publishes no API, so the plugin shells out to a vendored
deno build of [spacemeowx2/s3si.ts](https://github.com/spacemeowx2/s3si.ts), which authenticates against
Nintendo Switch Online and exports Splatnet data as JSON files, then reads those files back. It is the
only plugin in the repository that requires an external binary and the only one licensed GPL-3.0 rather
than MIT, inherited from s3si.ts.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Parses the JSON `token` into `s3si/profile.json` (rejecting it with `Configuration is missing sessionToken` when `loginState.sessionToken` is absent), injecting `statInkApiKey` when the stat.ink integration is on. Then, for `source: splatnet`, runs deno with `cwd` set to `s3si/` through `imports.run` and an explicit allowlist: `--no-prompt --cached-only --no-remote --allow-read=` / `--allow-write=` limited to `profile.json`, `profile.json.swap`, `export`, `cache`, and `--allow-net=` limited to `api.imink.app`, `accounts.nintendo.com`, `api.accounts.nintendo.com`, `api-lp1.znc.srv.nintendo.net`, `api.lp1.av5ja.srv.nintendo.net` (plus `stat.ink` when enabled), with `--exporter="file[,stat.ink]" --with-summary --no-progress`. It then `readdir`s `s3si/export` (or `s3si/mocks`), `JSON.parse`s every file, picks the single `type === "SUMMARY"` record for the player block, sorts the rest by `data.detail.playedTime` descending, and splits them into `type === "VS"` and `type === "COOP"`. Returns `{sections, player, vs, salmon, icons}`. |
| `assets.mjs` | 37 KB static lookup tables mapping Splatoon names to images: 20 `stages`, 5 `modes`, 86 `weapons`, 14 `subweapons`, 19 `specials`, 16 `salmon` bosses, all pointing at `cdn.wikimg.net` (Inkipedia), plus 10 `icons` of which four (`rescues`, `rescued`, `kills`, `deaths`) are inline base64 PNG data URIs. `index.mjs` runs every one it uses through `imports.imgb64`. A name missing from a table yields `imgb64(undefined)`, so new content added by Nintendo needs an entry here. |
| `metadata.yml` | `category: community`, `authors: [lowlighter]`, `supports: [user, organization]` (no repository), `scopes: []`. Seven inputs plus the GPL-3.0 and Nintendo disclaimers. |
| `examples.yml` | Two examples, plain and stat.ink, both with `test.skip: true` and `prod.skip: true`. |
| `token.ts` | Standalone deno helper the user runs once, by hand, to mint the Nintendo token. Prints the warranty disclaimer, requires a typed `y` agreement, runs `s3si/index.ts --exporter=none` with the same permission allowlist, then prints the resulting `profile.json` as the value to paste into a `SPLATOON_TOKEN` repository secret and deletes the local file. Not imported by any JavaScript. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `s3si/` | Vendored deno bundle of s3si.ts plus its GPL-3.0 license and JSON fixtures (see `s3si/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- Options: `plugin_splatoon` (boolean), `plugin_splatoon_token` (type `token`, a whole JSON profile
  document, gated by the extras feature `metrics.api.nintendo.splatnet`),
  `plugin_splatoon_sections` (comma-separated `player`, `versus`, `salmon-run`, all three by default),
  `plugin_splatoon_versus_limit` and `plugin_splatoon_salmon_limit` (0 to 6, default 1),
  `plugin_splatoon_statink` (boolean, gated by `metrics.api.statink`),
  `plugin_splatoon_statink_token`, and `plugin_splatoon_source` (`splatnet` / `local` / `mocks`,
  marked `testing: yes` and `preset: no`).
- Use `plugin_splatoon_source: mocks` for all local development. It skips deno entirely and reads the
  three fixtures in `s3si/mocks/`, so no Nintendo account or network access is needed. `local` reuses a
  previously populated `s3si/export/` directory.
- Underscored option names arrive dot-separated: `versus_limit` is read as `"versus.limit"` and
  `statink_token` as `"statink.token"` in the destructuring.
- The plugin writes into its own source tree (`s3si/profile.json`, `s3si/export/`, `s3si/cache/`). Those
  paths are covered by `s3si/.gitignore`. A read-only checkout breaks the `splatnet` source.
- `deno` must be on `PATH`. The `Dockerfile` installs it into `/usr/local`. There is no `deno cache`
  step anywhere, which is fine only because `s3si/index.ts` is a `deno bundle` output with zero remote
  imports; `--cached-only --no-remote` would otherwise fail. Keep it bundled.
- Enabling `plugin_splatoon_statink` without `plugin_splatoon_statink_token` is not an error. The plugin
  pushes a warning onto `data.warnings` and continues without the stat.ink API key.
- Colors from Splatnet arrive as float RGB in 0-1 and are converted to hex inline with
  `Math.round(255 * c).toString(16).padStart(2, 0)`, both for the name plate and for each team.
- `.github/actions/spelling/excludes.txt:50` excludes all of `source/plugins/community/splatoon/` from
  check-spelling (line 53 also excludes the classic partial), so Splatoon proper nouns will not trip
  spelling CI here. `.github/config/codeql.yml:7` separately excludes `s3si/**` from CodeQL.
- Licensing: this directory is GPL-3.0 while the rest of the repository is MIT. Do not copy code from
  here into MIT-licensed parts of the tree.

### Testing Requirements
- There is no CI coverage. Both examples set `test.skip: true`, so `build.mjs` emits
  `tests/cases/splatoon.plugin.yml` as an empty list (`[]`), and `prod.skip: true` keeps it out of the
  generated examples workflow.
- Manual verification uses the mocks source. With a local web instance:
  `http://localhost:3000/<user>?base=0&splatoon=1&splatoon.source=mocks`, with
  `metrics.api.nintendo.splatnet` listed in `settings.json` `extras.features`.
- Adding a new field means extending `s3si/mocks/*.json` to match, since those fixtures are the only
  sample data in the repository.
- `npm run linter` before committing. `assets.mjs` is large but is still linted and dprint-formatted.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.splatoon` or a false `enabled(...)`, typed
  options from `imports.metadata.plugins.splatoon.inputs({data, account, q})`, body wrapped in
  `try {} catch (error) { throw imports.format.error(error) }`.
- `imports.__module(import.meta.url)` resolves this plugin's own directory; every `s3si/` path is built
  from it rather than from `process.cwd()`.
- Image URLs, both the Splatnet CDN ones in the fetched data and the Inkipedia ones in `assets.mjs`, are
  inlined with `imports.imgb64` so the SVG is self-contained.
- Optional chaining with a `?? null` fallback is used throughout for fields Splatnet omits per mode, for
  example `data.detail.knockout ?? null` and `data.listNode?.udemae ?? null`.

## Dependencies
### Internal
- `imports.run`, `imports.fs`, `imports.__module`, `imports.imgb64`, `imports.format.error`,
  `imports.metadata` from `source/app/metrics/utils.mjs`.
- `./assets.mjs` for every icon lookup.
- `./s3si/index.ts` executed as a subprocess, and `./s3si/mocks/` as the offline data source.
- Rendered by `source/templates/classic/partials/splatoon.ejs` (classic template only).

### External
- `deno` (a binary, not an npm package), installed in the `Dockerfile`.
- Nintendo Switch Online / Splatnet 3, reached through `api.imink.app` for token proofs and the
  `*.srv.nintendo.net` hosts. Optionally `stat.ink` for match upload.
- `cdn.wikimg.net` (Inkipedia) for the static weapon, stage and mode artwork.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
