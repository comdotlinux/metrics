<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# s3si

## Purpose
Vendored third-party code: a `deno bundle` build of
[spacemeowx2/s3si.ts](https://github.com/spacemeowx2/s3si.ts) v0.4.5, the tool that authenticates
against Nintendo Switch Online and exports Splatnet 3 battle data. The parent `splatoon` plugin spawns
it as a deno subprocess with `cwd` set to this directory, then reads the JSON files it writes into
`export/`. Nothing here is imported by JavaScript; the boundary is the process boundary.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | 7553 lines, ~264 KB, machine-generated. Header reads "This code was bundled using `deno bundle` and it's not recommended to edit it manually", with `deno-fmt-ignore-file` and `deno-lint-ignore-file` pragmas. Contains the full s3si.ts client: the Splatnet persisted-query hash table (`HomeQuery`, `LatestBattleHistoriesQuery`, `VsHistoryDetailQuery`, `CoopHistoryQuery`, `HistoryRecordQuery`, `ConfigureAnalyticsQuery` and friends), the Nintendo account and f-token flow via `api.imink.app`, and the `file` and `stat.ink` exporters. Version constants pinned in the bundle: `S3SI_VERSION` 0.4.5, `NSOAPP_VERSION` 2.6.0, `WEB_VIEW_VERSION` 4.0.0-d5178440. It has **zero remote imports**, which is what makes the parent's `--cached-only --no-remote` deno flags work without a `deno cache` step anywhere in the build. |
| `LICENSE.md` | GNU GPL-3.0, 35 KB, the upstream s3si.ts license. This is why `splatoon/metadata.yml` declares the whole plugin GPL-3.0 while the rest of the repository is MIT. |
| `.gitignore` | Ignores the three runtime artifacts written here: `cache`, `export`, `profile.json`. |

## Skipped subdirectories
- `mocks/` — deliberately has **no** `AGENTS.md`. `splatoon/index.mjs` does
  `readdir` on this directory when `plugin_splatoon_source: mocks` and then `JSON.parse`s **every** file
  it finds, so any non-JSON file (a Markdown doc included) crashes the plugin with a syntax error. It
  holds exactly three fixtures, each an object of `{type, exportTime, data}` matching the `file`
  exporter's output format:
  - `u_summary.json` (11 KB) — `type: "SUMMARY"`. `data` holds the three summary GraphQL payloads
    `HistoryRecordQuery`, `ConfigureAnalyticsQuery` and `CoopHistoryQuery`. Sample player is "Pearl" at
    level 50, rank S+0. `index.mjs` requires exactly one record with this type and throws
    `Failed to fetch player summary!` without it.
  - `u_vs.json` (15 KB) — `type: "VS"`. A Splat Zones win on Inkblot Art Academy, with
    `bankaraMatchChallenge`, `listNode`, `challengeProgress`, `rankState`, `rankBeforeState` and the
    `detail` block the plugin reads for teams, weapons and awards.
  - `u_coop.json` (10 KB) — `type: "COOP"`. A Salmon Run shift on Marooner's Bay with three
    `waveResults` and seven `enemyResults`, plus `listNode` and `groupInfo`.

## For AI Agents
### Working In This Directory
- Treat `index.ts` as a binary artifact. Do not hand-patch it and do not reformat it. Upgrading means
  regenerating the bundle from the upstream repository at a chosen tag and replacing the file wholesale,
  then re-checking that `--allow-net` in `splatoon/index.mjs` still lists every host the new version
  contacts. A missing host fails as a deno permission error, not an HTTP error.
- The permission allowlists live in the caller, not here: `splatoon/index.mjs` for the plugin path and
  `splatoon/token.ts` for the interactive token-minting path. Both pass the same `files` and `net` sets,
  so a change to one usually needs the same change to the other.
- `cache/`, `export/` and `profile.json` are created at runtime inside this directory and are gitignored.
  Do not commit them; `profile.json` in particular contains a live Nintendo session token.
- CI carve-outs that apply here: `.github/config/codeql.yml:7` excludes
  `source/plugins/community/splatoon/s3si/**` from CodeQL scanning, and
  `.github/actions/spelling/excludes.txt:50` excludes the whole `splatoon/` tree from check-spelling.
  Do not rely on those checks to catch problems in this code.
- Nintendo does not explicitly permit these web tokens. The upstream disclaimer is reproduced in
  `splatoon/metadata.yml` and printed by `splatoon/token.ts`; keep it if you touch either.

### Testing Requirements
- There is no automated test that runs `index.ts`. `tests/cases/splatoon.plugin.yml` is an empty list
  because every example sets `test.skip: true`.
- Exercise the plugin without deno or a Nintendo account by setting `plugin_splatoon_source: mocks`,
  which reads `mocks/` instead of `export/`. That is the only supported offline path.
- To verify a bundle upgrade end to end you need a real Nintendo Switch Online account. From the parent
  `splatoon/` directory run
  `deno run --allow-run --allow-read=profile.json --allow-write=profile.json --unstable token.ts`
  (the flags are also in that file's shebang) and follow the printed instructions.

### Common Patterns
- Process boundary, not module boundary: the parent plugin communicates with this code purely through
  CLI flags in and JSON files out. There is no shared type definition between the `.ts` bundle and the
  `.mjs` plugin, so field renames upstream surface only as runtime `undefined`s in the rendered SVG.
- Every exported record is `{type, exportTime, data}`, and the plugin dispatches on `type` being
  `SUMMARY`, `VS` or `COOP`.

## Dependencies
### Internal
- Invoked by `source/plugins/community/splatoon/index.mjs` via `imports.run`.
- Invoked by `source/plugins/community/splatoon/token.ts` for interactive token generation.

### External
- `deno` runtime (installed in the repository `Dockerfile`).
- Nintendo endpoints `accounts.nintendo.com`, `api.accounts.nintendo.com`,
  `api-lp1.znc.srv.nintendo.net`, `api.lp1.av5ja.srv.nintendo.net`, plus `api.imink.app` for the f-token
  and optionally `stat.ink` for upload.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
