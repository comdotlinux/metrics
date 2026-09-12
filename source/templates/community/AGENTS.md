<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/community

## Purpose
Documentation, not a renderable template. It holds the guide for writing templates that live in external
repositories and are pulled in at runtime with the `setup_community_templates` input, plus the
`metadata.yml` and `examples.yml` that make this guide appear as an entry in the generated
`source/templates/README.md`. Because there is no `partials/_.json` here, `source/app/metrics/setup.mjs`
skips the directory when discovering templates, so `template: community` can never be selected;
`source/app/metrics/metadata.mjs` still loads it (it reads every directory) and deliberately sorts it last
in the template list.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | The community template handbook: `user/repo@branch:name` syntax, the `+trust` suffix and its remote-code-execution warning, passing custom parameters through `query`, `npm run quickstart template <name>` scaffolding, an annotated `image.svg`, the meaning of `fonts`/`style`/`partials`/`#metrics-end`, how to fill `metadata.yml` (including `extends`), `examples.yml` and `README.md`, how to write a partial, and a step-by-step recipe for base64 embedded fonts. The `<!--examples-->` block is generated. |
| `metadata.yml` | Only `name: 📕 Community templates` and a `description`. No `index`, `supports`, `formats` or `examples`, so the generated header shows no account types, no output formats and no preview. |
| `examples.yml` | Two workflow examples used by the generated docs and compiled into `tests/cases/community.template.yml`: `template: "@classic"` with `setup_community_templates: lowlighter/metrics@master:classic`, and `template: "@terminal"` with `lowlighter/metrics@master:terminal+trust`. Both are restricted to `modes: [action]`. |

## For AI Agents
### Working In This Directory
- Runtime flow implemented in `source/app/metrics/setup.mjs`: each entry is parsed with the regex
  `^(?<repo>.+?)@(?<branch>.+?):(?<name>.+?)(?<trust>[+]trust)?$`, git-cloned with
  `git clone --single-branch --branch <branch>` into `source/templates/.community`, then
  `source/templates/.community/source/templates/<name>` is renamed to `source/templates/@<name>` and the
  clone is deleted. The remote repository therefore has to mirror this repository's layout.
- Without `+trust` the downloaded `template.mjs` is deleted and replaced by the `template.mjs` of the
  template named in the remote `metadata.yml` `extends` key (typically `classic` or `repository`). With
  `+trust` the remote file is kept and executed, which is arbitrary code running with the metrics token in
  scope. The README states this explicitly.
- Community template download is gated: it only runs when `settings.extras.features` includes
  `metrics.setup.community.templates`, when `extras.default` is set, or in sandbox mode.
- `source/templates/.community` and `source/templates/@*` are gitignored (`.gitignore` lines 109-111), so
  downloaded templates never end up in a commit.
- Never add a `partials/` directory here. It would turn this documentation directory into a loadable
  template.

### Testing Requirements
- Backing case file: `tests/cases/community.template.yml`, generated from `examples.yml` by
  `npm run build`. Both cases carry `modes: [action]`, so the web and placeholder matrices skip them.
- `tests/metrics.test.js` deletes `source/templates/@classic` in both `beforeAll` and `afterAll` to clear
  leftovers from these cases.
- The skip set in `tests/metrics.test.js` is keyed on plugin names, so template-level cases (including
  these) resolve to `test.skip` in the current matrices.

### Common Patterns
The handbook's minimal partial, reproduced in every built-in template:

```ejs
<% if (plugins.name) { %>
  <% if (plugins.name.error) { %><%= plugins.name.error.message %><% } else { %>...<% } %>
<% } %>
```

## Dependencies
### Internal
`source/app/metrics/setup.mjs` (cloning, trust handling, `extends` fallback),
`source/app/metrics/metadata.mjs` (generated header, last position in the template list),
`.github/scripts/quickstart/template` (scaffolding copied by `npm run quickstart`),
`source/plugins/core` (`setup_community_templates` and `query` inputs).

### External
`git` (invoked through `child_process.execSync`), GitHub repositories hosting the templates.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
