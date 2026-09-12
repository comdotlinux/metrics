<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# chess

## Purpose
Community plugin that fetches the most recent game a user played on a supported chess platform and
hands the parsed move list to the template, which replays it as an animated chessboard inside the SVG.
Only lichess.org is implemented; the platform is a `switch` with one real case, so the option exists
mainly as an extension point.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | `GET https://lichess.org/api/games/user/<user>?max=1` with an `Authorization: Bearer <token>` header, returning raw PGN text. Parses it with `new Chess()` / `board.loadPgn(PGN)` from `chess.js`, then returns `{platform, meta, moves, animation, result}` where `meta` is `board.header()`, `moves` is `board.history({verbose: true})` and `result` splits the PGN `Result` header (`"1-0"`) into `{white, black}` numbers. Throws `Unspecified platform` on an empty platform and `Unsupported platform "<x>"` otherwise. |
| `metadata.yml` | `category: community`, `authors: [lowlighter]`, `supports: [user, organization, repository]`, `scopes: []`. Five inputs including the `animation` JSON blob. |
| `examples.yml` | One example, "Last chess game from lichess.org", with `token: NOT_NEEDED` for GitHub and a `CHESS_TOKEN` secret for lichess. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_chess` (boolean), `plugin_chess_token` (type `token`, gated by extras feature
  `metrics.api.chess.any`), `plugin_chess_user` (string, defaults to the special value `.user.login`,
  `preset: no`), `plugin_chess_platform` (string, only allowed value `lichess.org`),
  `plugin_chess_animation` (JSON `{size, delay, duration}`).
- `chess.js` is an `optionalDependency` in `package.json` (`^1.0.0-beta.6`). A `npm ci --omit=optional`
  install makes the top-level `import {Chess} from "chess.js"` fail at plugin load, not at call time.
- Animation defaults disagree between the two files. `metadata.yml` documents
  `{size: 40, delay: 3, duration: 0.6}`, but `index.mjs` re-coerces any `NaN` or negative entry to
  `{size: 40, delay: 1, duration: 4}`. Change both if you touch either.
- Adding a platform means a new `case` in the `switch` that populates `PGN` with a PGN string; the rest
  of the pipeline is platform-agnostic because everything downstream works off the parsed board.
- The lichess endpoint returns PGN by default; do not add an `Accept: application/json` header without
  also changing the parser.
- Rendering the board (piece glyphs, move timing) lives in
  `source/templates/classic/partials/chess.ejs`, which consumes `animation` directly.

### Testing Requirements
- Case file: `tests/cases/chess.plugin.yml`, with `plugin_chess_token: MOCKED_TOKEN` and
  `plugin_chess_platform: lichess.org`.
- Mock: `tests/mocks/api/axios/get/lichess.mjs` matches `https://lichess.org/api/games/user/*` and
  returns the Kasparov vs Topalov 1999 Wijk aan Zee game as a fixed PGN string, so the parsed output is
  deterministic (44 moves, result `1-0`).
- `npm run test-metrics` runs the case; `npm run linter` before committing.
- A local mocked run: `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes` with
  `INPUT_PLUGIN_CHESS=yes INPUT_PLUGIN_CHESS_PLATFORM=lichess.org`.

### Common Patterns
- Standard community-plugin skeleton: `return null` when `!q.chess` or `enabled(...)` is false, typed
  options from `imports.metadata.plugins.chess.inputs({data, account, q})`, one
  `try {} catch (error) { throw imports.format.error(error) }` around the body.
- Errors are thrown as `{error: {message}}` objects rather than `Error` instances, which is what
  `imports.format.error` expects for user-facing messages.
- The API token arrives as the second-argument `token` property, not through `q`.

## Dependencies
### Internal
- `imports.axios`, `imports.format.error`, `imports.metadata` from `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/chess.ejs` (classic template only).

### External
- `chess.js` (optional npm dependency) for PGN parsing and move history.
- `https://lichess.org/api/games/user/<user>` with a lichess personal access token.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
