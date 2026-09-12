<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/scripts/quickstart

## Purpose
The scaffolder behind `npm run quickstart -- <plugin|template> <name>`. It copies one of the two
skeleton directories into `source/plugins/community/<name>` or `source/templates/<name>`, rendering
every file through EJS with `{name}` in scope, so a contributor starts from a working plugin or
template rather than an empty folder.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Reads `mode` and `name` from `process.argv.slice(2)`, throws `Usage is "npm run quickstart -- <mode> <name>"` when either is missing, rejects any mode other than `plugin` or `template`, and refuses to overwrite an existing target. Resolves the destination as `source/plugins/community/<name>` for `plugin` and `source/templates/<name>` for `template`, `mkdir`s it, then calls its own `rcopy(from, to)` helper: for every entry in the source directory it recreates subdirectories and writes each file as `ejs.renderFile(path, {name}, {async: true})`. |

## Skipped subdirectories
- `plugin/` - no AGENTS.md: `rcopy` in `index.mjs` copies and EJS-renders **every** file in this
  directory into the newly scaffolded plugin, so an `AGENTS.md` here would land in every new plugin.
  Contents (4 files):
  - `index.mjs` - the plugin entry point skeleton. Exports the standard async default function
    `({login, q, imports, data, computed, rest, graphql, queries, account}, {enabled = false, extras = false} = {})`,
    returns `null` when `!q.<name>` or `!imports.metadata.plugins.<name>.enabled(enabled, {extras})`,
    returns `{}` as the result, and wraps everything in
    `try {} catch (error) { throw imports.format.error(error) }`.
  - `metadata.yml` - `name: 🧩 <Name>` with the first letter upper-cased by an inline EJS expression,
    `category: community`, placeholder description, a via.placeholder.com example image,
    `authors: [octocat]`, `supports: [user, organization, repository]`, empty `scopes`, and a single
    boolean input `plugin_<name>` defaulting to `no`.
  - `examples.yml` - one example step named "Example" using `lowlighter/metrics@latest` with
    `filename: metrics.plugin.<name>.svg`, `token: ${{ secrets.METRICS_TOKEN }}`, `base: ""` and
    `plugin_<name>: yes`, carrying `prod: {skip: true}` so `build.mjs` emits it as a test case but not
    as a published example render.
  - `README.md` - empty `<!--header-->`, `<!--options-->` and `<!--examples-->` marker pairs under the
    "➡️ Available options" and "ℹ️ Examples workflows" headings, which `build.mjs` fills in.
- `template/` and `template/partials/` - no AGENTS.md, same reason. Contents (5 files):
  - `image.svg` - the EJS-in-EJS root template, 480 px wide by 99999 px tall with the
    `no-animations` class toggled by `animated`. Injects `fonts`, an optimizable `style` block and
    `extras.css`, then iterates `partials` inside a `foreignObject` and closes with the
    `<div id="metrics-end">` marker puppeteer measures. Every tag is escaped as `<%%` so the scaffolder
    emits literal EJS rather than evaluating it.
  - `metadata.yml` - `name: 🖼️ Template name`, `extends: classic`, placeholder description and example,
    `authors: [octocat]`, `supports: [user, organization, repository]`, and `formats: [svg, png, jpeg,
    json, markdown, markdown-pdf]`.
  - `partials/_.json` - the ordered render list, containing just `["hello"]`.
  - `partials/hello.ejs` - a sample `<section>` with an inline octicon SVG, a "Community templates"
    heading and prose showing how to interpolate data, demonstrating the `<%= user.login %>` syntax by
    printing both the literal tag and its rendered value.
  - `README.md` - empty `<!--header-->` and `<!--examples-->` marker pairs.

## For AI Agents
### Working In This Directory
- `index.mjs` renders every file it copies, so **any** `<% %>` or `<%= %>` in a skeleton file is
  evaluated at scaffold time with only `name` in scope. To emit literal EJS into the generated file,
  double the opening delimiter (`<%%`), as `template/image.svg` and `template/partials/hello.ejs` do.
- `plugin` mode always scaffolds into `source/plugins/community/`, never into `source/plugins/`; new
  core plugins are not created this way. That matches the contribution policy, which routes new
  plugins and templates to the community directories.
- Both skeleton directories are excluded from tooling because their contents are not valid JavaScript
  or JSON: `.github/config/dprint.json` excludes `.github/scripts/quickstart/**/*` and
  `.github/config/codeql.yml` has `paths-ignore: .github/scripts/quickstart/**`. Adding a new skeleton
  file needs no change there, but removing those exclusions would break both tools.
- After scaffolding, run `npm run build` so the new plugin or template gets its README blocks, its
  `tests/cases/<name>.plugin.yml` entry and a row in the compatibility matrix.
- `rcopy` has no overwrite protection below the top level; the only guard is the `fs.existsSync(target)`
  check on the destination root.

### Testing Requirements
- Scaffold into a throwaway name and check it loads: `npm run quickstart -- plugin demo`, then
  `npm run build`, then `npm run test-metrics` (or the single generated case in `tests/cases/`).
- A new template only loads if `partials/_.json` exists; `setup.mjs` skips template directories without
  it, which is why the skeleton ships one.
- The scaffolded plugin returns `{}`, so its generated test case passes only because it renders nothing.

### Common Patterns
- Placeholder identity throughout the skeletons: author `octocat`, example image
  `https://via.placeholder.com/468x60?text=No%20preview%20available`.
- Generated README files are only marker pairs; all their content comes from `build.mjs`.

## Dependencies
### Internal
- `package.json` (`quickstart` script), `source/plugins/community/` and `source/templates/` (targets),
  `source/app/metrics/setup.mjs` (loads what is scaffolded), `.github/scripts/build.mjs` (fills the
  README markers and the test case), `.github/config/dprint.json` and `.github/config/codeql.yml`
  (both exclude this tree).

### External
- npm: `ejs`. Node builtins `fs`, `path`, `url`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
