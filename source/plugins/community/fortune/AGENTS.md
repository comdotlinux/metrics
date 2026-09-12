<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# fortune

## Purpose
The simplest plugin in the repository: it picks one of thirteen hardcoded fortune messages at random and
returns it with a display color. No network call, no token, no configuration beyond the enable flag. It
exists partly as a minimal reference implementation of the community-plugin contract.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Holds a literal `fortunes` array of `{chance, color, text}` entries ranging from "Godly Luck" to "Very Bad Luck", including two Japanese ASCII-art entries. Draws `Math.random()` and walks the array accumulating `chance` to pick a weighted entry, then returns the spread entry `{chance, color, text}`. Calls `inputs({data, account, q})` purely for its side effect of validating the account type against `supports`; the return value is discarded. |
| `metadata.yml` | 18 lines, the smallest in the repo. `category: community`, `authors: [lowlighter]`, `supports: [user]`, `scopes: []`, and the single `plugin_fortune` boolean input. |
| `examples.yml` | One example, "Fortune", with `token: NOT_NEEDED`. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Only option: `plugin_fortune` (boolean, default no). No extras gating, no token, no scopes.
- The declared `chance` values sum to 1.06, not 1.0, and the selection loop has an off-by-one: it tests
  `x <= r` before adding the current entry's `chance`, so entry `i` is drawn with entry `i-1`'s weight.
  Measured over 200k draws, "Reply hazy" (declared 0.06) and "Godly Luck" (declared 0.01) never appear,
  "Excellent Luck" gets 0.06, "Good Luck" gets 0.03, and so on down the list. Fixing it means moving the
  accumulation before the comparison and renormalising the weights. That changes rendered output, so it
  is a behavior change, not a refactor.
- `chance` is returned to the template even though the partial does not use it. The visible fields are
  `color` (a hex string) and `text`.
- The text entries contain non-ASCII Japanese characters. They are intentional and must survive any edit
  as UTF-8.
- This is the file to copy when starting a new community plugin by hand rather than with
  `npm run quickstart -- plugin <name>`.

### Testing Requirements
- Case file: `tests/cases/fortune.plugin.yml`, generated from `examples.yml`. It runs in all three modes
  (action, web, placeholder) with no mock, since nothing external is called.
- `npm run test-metrics` runs it. Output is nondeterministic by design, so assertions can only check that
  a fortune rendered, not which one.
- `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.fortune` or a false `enabled(enabled, {extras})`,
  then `try {} catch (error) { throw imports.format.error(error) }`.
- Calling `inputs()` for validation only, without destructuring, is the idiom for a plugin with no
  options; do not delete the call, it is what enforces `supports: [user]`.

## Dependencies
### Internal
- `imports.metadata` and `imports.format.error` from `source/app/metrics/utils.mjs`. Nothing else.
- Rendered by `source/templates/classic/partials/fortune.ejs` (classic template only).

### External
None. No npm package beyond the runtime, no HTTP, no binaries.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
