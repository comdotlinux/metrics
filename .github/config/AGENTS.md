<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/config

## Purpose
Three configuration files handed to third-party GitHub Actions by explicit path, one per consumer:
CodeQL scanning, dprint formatting, and the pull request labeler. They are not read by any application
code, only by workflow steps.

## Key Files
| File | Description |
|------|-------------|
| `codeql.yml` | Passed as `config-file: ./.github/config/codeql.yml` to `github/codeql-action/init@v2` in the `analyze` job of `test.yml`. Adds the `security-and-quality` query pack on top of the default suite, and excludes three paths from analysis: `copyrighted/**`, `.github/scripts/quickstart/**` (EJS-templated scaffolds that are not valid JavaScript) and `source/plugins/community/splatoon/s3si/**` (vendored third-party code). Language is set to `javascript` in the workflow, not here. |
| `dprint.json` | Passed as `npx dprint fmt --config .github/config/dprint.json` by the `format` job of `ci.yml` and the `build` job of `test.yml`. Encodes the project's style for `**/*.{js,mjs}` with the `typescript-0.83.0.wasm` plugin: `lineWidth` 360, `indentWidth` 2, `semiColons: "asi"` (no semicolons), `quoteStyle: "preferDouble"`, `useBraces: "preferNone"`, `singleBodyPosition`/`nextControlFlowPosition: "nextLine"`, `arrowFunction.useParentheses: "preferNone"`, `commentLine.forceSpaceAfterSlashes: false` (so `//Comment`), `taggedTemplate.spaceBeforeLiteral: false`, `spaceSurroundingProperties: false` (so `{a, b}`). Excludes `node_modules/**/*` and `.github/scripts/quickstart/**/*`. |
| `label.yml` | Passed as `configuration-path` to `actions/labeler@v4` in `label.yml` with `sync-labels: yes`, so labels are added *and removed* as a PR changes. Maps 43 emoji labels to path globs: area labels (`📊 metrics embed` for `source/app/action/**` and `source/app/web/**`, `✨ metrics insights`, `🧩 plugins`, `🖼️ templates`, `🗃️ base`, `🧱 core`, `🎲 community plugins`) plus 36 `<emoji> plugin <name>` labels, one per core plugin directory under `source/plugins/`. |

## For AI Agents
### Working In This Directory
- `tests/ci.test.js` blocks any PR from a non-`lowlighter` author that touches `.github/config/*`.
- `dprint.json` and `source/.eslintrc.yml` must stay in agreement. dprint is what actually rewrites
  code in CI (the `format` job commits `chore: code formatting` straight to `master`), while ESLint
  only reports through `npm run linter`. Changing one without the other produces a CI loop where the
  formatter and the linter fight.
- The `excludes` entry for `.github/scripts/quickstart/**/*` exists because those files contain EJS
  tags (`<%= name %>`) and are not parseable JavaScript. The same path is excluded in `codeql.yml` for
  the same reason. Adding new templated scaffolds means adding them to both.
- Adding a core plugin means adding a `<emoji> plugin <name>` entry to `label.yml`; the label itself
  must already exist in the repository settings or the labeler silently skips it.
- Community plugins share the single `🎲 community plugins` label; do not add per-plugin entries there.

### Testing Requirements
- Formatting: `npm install -g dprint && npx dprint fmt --config .github/config/dprint.json`, then
  `npm run linter` to confirm ESLint agrees.
- CodeQL and the labeler only run in CI; there is no local equivalent. A malformed `label.yml` fails the
  `label` job on the next `pull_request_target`.

### Common Patterns
- Every file here is referenced by an explicit path from a workflow step, never auto-discovered. If you
  move or rename one, grep `.github/workflows/` for the old path.

## Dependencies
### Internal
- `.github/workflows/test.yml` (codeql.yml, dprint.json), `.github/workflows/ci.yml` (dprint.json),
  `.github/workflows/label.yml` (label.yml), `source/.eslintrc.yml` (must match dprint.json).

### External
- `github/codeql-action/init@v2`, `actions/labeler@v4`, dprint and its
  `https://plugins.dprint.dev/typescript-0.83.0.wasm` plugin.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
