<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/actions/spelling

## Purpose
Configuration consumed by `check-spelling/check-spelling@v0.0.20`, which the `spelling.yml` workflow
runs on every push to any branch and on every `pull_request_target`. The action discovers this
directory by convention (it is the default `config` path) and merges its dictionaries with the cspell
extra dictionaries requested in the workflow. Nothing here is code; it is the project's
allow/reject/ignore vocabulary and the advice comment posted when the check fails.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | Upstream cheat sheet listing every configuration file check-spelling understands, its format and a link to the wiki page for it. Also notes that any file may be replaced by a directory of the same base name whose contents are merged. |
| `allow.txt` | 46 words added to the dictionary, one per line, letters and apostrophes only. Mostly third-party API vocabulary the plugins use: `appid`, `apikey`, `appdetails`, `steamid`, `steamcommunity`, `steampowered`, `personaname`, `playerstats`, `unlocktime`, `ISteam`, `statink`/`STATINK`, `Splatnet`, `splatoon`, `leetcode`, `joinmastodon`, `githubassets`, `tspan`, `xticks`/`yticks`, `deno`, `npx`, `ubuntu`, `ssh`, `MBTI`, `pgn`. |
| `expect.txt` | 376 sorted words that are not in any dictionary but are expected to appear. This is the file check-spelling rewrites when a maintainer comments `@check-spelling-bot apply`, and the one that grows when new identifiers land. |
| `excludes.txt` | Perl regexes for files skipped entirely. Binary and generated extensions (`.png`, `.svg`, `.woff2?`, `.min..`, lockfiles, `vendor/`), plus targeted exclusions: this whole directory (`^\.github/actions/spelling/`), `spelling.yml` itself, `inspirations.md`, all of `source/plugins/community/splatoon/`, `source/plugins/sponsors/index.mjs`, the 50m countries geojson atlas, several template partials and fonts, three mock files (`emojis/get.mjs`, `axios/get/lichess.mjs`, `axios/get/steam.mjs`), and `(?:^|/)AGENTS\.md$` so agent documentation is never spell-checked. |
| `patterns.txt` | Perl regexes for substrings ignored inside checked lines, ordered, first match wins, each annotated with the hit and file counts that justified it. Covers w3.org and github.com URLs, JavaScript regex literals and `.replace(/.../)` calls, percent-escapes, `githubusercontent.com` paths, `data:` URLs in quotes, YouTube / Apple Music / Spotify embed URLs, AWS S3 URLs, long hex runs and CSS or HTML color escapes, `Signed-off-by:` trailers, revert commit messages, repeated-character runs, and the chess FEN strings `rnbqkbnr` / `RNBQKBNR`. |
| `line_forbidden.patterns` | Regexes that *fail* a line when matched, used for house style rather than spelling: `Github`, `Gitlab`, `Javascript`, `MicroSoft` (wrong capitalisation), `an other`, `greater then`, `less then`, `other wise`, `non existing`, `non-existent`, `pre-existing`, `pre-empt`, `re-entrant`, and a duplicate-word detector. |
| `reject.txt` | Grep patterns removing words from the dictionary even after `allow.txt`: `^attache$`, `benefitting`, `occurences?`, `^dependan.*`, `^oer$`, `Sorce`, `^[Ss]pae.*`, `^untill$`, `^untilling$`, `^wether.*`. |
| `candidate.patterns` | Two suggestion-only patterns (Apple Music and Spotify embed URLs) that the action can propose; both are already promoted into `patterns.txt`. |
| `advice.md` | Markdown appended to the failure comment. Explains the false-positive workflow: exclude a whole file via `excludes.txt`, or ignore a well-formed token via `patterns.txt`, with a link to regexplanet for testing and a reminder that patterns cannot span lines. |

## For AI Agents
### Working In This Directory
**When spelling CI fails, pick the file by the kind of failure:**
- A real English word flagged as unknown, or a project identifier the check does not know: add it to
  `expect.txt` (sorted, one per line). This is the default answer for most failures.
- A term you want permanently treated as correct everywhere, made only of letters and apostrophes:
  `allow.txt`. Use it for vocabulary, not for one-off identifiers.
- A token that is part of a URL, a hash, a regex literal or another machine string: write a Perl regex
  in `patterns.txt` so the whole construct is ignored on the line.
- An entire file that should never be checked (binary, vendored, generated, foreign-language):
  `excludes.txt`, anchored with `^` against the repository-relative path.
- The check complained about `Github`, `Javascript`, a duplicated word, or similar: that is
  `line_forbidden.patterns` doing its job. Fix the prose, do not edit the pattern.
- A word that must never be accepted even though a dictionary contains it: `reject.txt`.

Other gotchas:
- `dictionary.txt` and `only.txt` are documented in `README.md` but **do not exist here**; creating
  `dictionary.txt` would replace the default dictionary wholesale, and `only.txt` would restrict the
  check to matching files. Do not create either without intent.
- This directory excludes itself from the check (`^\.github/actions/spelling/` in `excludes.txt`), so
  its own contents are never spell-checked.
- `expect.txt` must stay alphabetically sorted; the action regenerates it sorted and will report a diff
  otherwise.
- On `lowlighter/metrics` the bot-apply path is deliberately disabled:
  `experimental_apply_changes_via_bot` is `${{ github.repository_owner != 'lowlighter' && 1 || 0 }}`,
  so it is `1` only on forks. On the upstream repository the maintainer edits these files by hand.
- These files are maintainer-only for non-`lowlighter` PR authors only in spirit: `tests/ci.test.js`
  lists `.github/config/*` and `.github/scripts/*` but **not** `.github/actions/*`, so contributors may
  legitimately add words here in a PR.

### Testing Requirements
- There is no local runner. Push to a branch and read the `Check Spelling` workflow, or run the
  `check-spelling` action against a fork. The `comment` job posts the result with `advice.md` appended
  when `steps.spelling.outputs.followup` is set.
- Test a candidate regex at https://www.regexplanet.com/advanced/perl/ before committing it; the advice
  file points contributors there too.

### Common Patterns
- Every entry in `patterns.txt` carries a `# hit-count: N file-count: M` comment plus a human label.
  Keep that shape when adding one; it is what lets a reviewer judge whether the pattern is too broad.
- Path anchors use `\Q...\E` to quote literal paths (`^\Qsource/plugins/sponsors/index.mjs\E$`).

## Dependencies
### Internal
- `.github/workflows/spelling.yml` (the only consumer; also names the `CHECK_SPELLING` deploy-key
  secret used by the `update` job).

### External
- `check-spelling/check-spelling@v0.0.20` and the cspell dictionaries it pulls in via
  `extra_dictionaries`: `cspell:html/html.txt`, `cspell:filetypes/filetypes.txt`, `cspell:css/css.txt`,
  `cspell:fullstack/fullstack.txt`, `cspell:django/django.txt`, `cspell:npm/npm.txt`,
  `cspell:aws/aws.txt`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
