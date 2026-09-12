<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/markdown

## Purpose
The only template that does not produce an image. Instead of rendering `image.svg`, the markdown branch of
`source/app/metrics/index.mjs` fetches the file named by the `markdown` input and renders it with EJS using
the full metrics data as context, producing a markdown document (or a PDF when `config_output` is
`markdown-pdf`). It supports user, organization and repository accounts, and it is the only template whose
generated header advertises `embed()`, the helper that renders SVG metrics inline inside the markdown.

## Key Files
| File | Description |
|------|-------------|
| `metadata.yml` | `name: 📒 Markdown template`, `index: 3`, `supports: [user, organization, repository]`, `formats: [markdown, markdown-pdf, json]`. Because `formats` contains `markdown`, `metadata.template` marks every plugin without a partial here as `"embed"` instead of unsupported in the generated compatibility row. |
| `template.mjs` | Calls `imports.plugins.core(...arguments)` first, then assigns roughly 35 UPPERCASE aliases onto `data` so user templates can write `{{ COMMITS }}` instead of digging into the raw objects. |
| `image.svg` | Not an SVG. A single sentence telling the user that a valid `markdown` query parameter is required to use this template, used as the fallback source when the `markdown` input is missing or cannot be fetched. |
| `example.md` | Reference template rendered as the `metrics.markdown.full.md` example: includes the `activity`, `posts`, `rss` and `topics` partials, keeps the deprecated `tweets` block commented out, then calls `embed()` three times (isocalendar, languages, base parts). |
| `example.pdf.md` | Smaller reference template for the `markdown-pdf` output: one `rss` partial plus one `embed()` of the isocalendar. |
| `examples.yml` | Three workflow examples (plain markdown, markdown with plugin configuration for embeds, PDF output with `config_twemoji` and `config_padding: 5%`), all committing to the `examples` branch in `prod`. |
| `README.md` | GENERATED header and examples, plus hand-written docs on EJS syntax (`<%= %>`, `<%- %>`, `<% %>`, and the `{{ }}` sugar), available data, plugins with a markdown version, and `embed()`. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `partials/` | 5 markdown-flavoured partials and an empty `_.json` (see `partials/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- Render path (`source/app/metrics/index.mjs`, markdown branch): the `markdown` input is used as-is when it
  starts with `https:`, otherwise it is resolved against the repository default branch through
  `rest.repos.get` and fetched from `raw.githubusercontent.com`. `{{ x }}` is rewritten to `{%= x %}`, then
  the source is rendered twice, first with `<`/`>` delimiters and then with `{`/`}` delimiters, both with
  `async: true` and `views` pointing at this directory, which is what makes
  `include("partials/rss.ejs")` work from a user file hosted anywhere.
- The render context is `{...data, s, f, embed}`: all plugin data, the pluralize and format helpers, and
  `embed(name, query)`. `embed()` re-enters `metrics()` with every plugin disabled except the ones passed,
  forces `template: "repository"` when `repo` is set and `classic` otherwise, disables animations for PDF
  output, and returns an `<img class="metrics-cacheable" data-name="<name>" src="data:image/...;base64,…">`
  tag. The action writes those images to the `markdown_cache` directory (`core` plugin input).
- Aliases are assigned after `core` has run, so plugin-derived ones are empty unless the plugin is enabled:
  `LINES_ADDED`/`LINES_DELETED` and `GISTS`/`GISTS_STARGAZERS` default to `0`, `LANGUAGES`, `POSTS`,
  `TWEETS` and `TOPICS` default to `[]`. Profile aliases (`NAME`, `LOGIN`, `REGISTRATION_DATE`,
  `REGISTERED_YEARS`, `LOCATION`, `WEBSITE`, `REPOSITORIES`, `REPOSITORIES_DISK_USAGE`, `PACKAGES`,
  `STARRED`, `WATCHING`, `SPONSORING`, `SPONSORS`, `REPOSITORIES_CONTRIBUTED_TO`, `COMMITS`,
  `COMMITS_PUBLIC`, `COMMITS_PRIVATE`, `ISSUES`, `PULL_REQUESTS`, `PULL_REQUESTS_REVIEWS`, `FOLLOWERS`,
  `FOLLOWING`, `ISSUE_COMMENTS`, `ORGANIZATIONS`, `WATCHERS`, `STARGAZERS`, `FORKS`, `RELEASES`,
  `VERSION`) read `data.user` and `data.computed` and are always present.
- `template.mjs` dereferences `user.*` without optional chaining, so it assumes `core` populated
  `data.user`; the README warns users that data shapes may change between versions without notice.
- `markdown-pdf` output is produced by `imports.svg.pdf(rendered, {paddings, style, twemojis, gemojis, octicons, rest, errors})`,
  driven by `config_padding`, `config_twemoji`, `config_gemoji` and `config_octicon`.

### Testing Requirements
- Backing case file: `tests/cases/markdown.template.yml`, three cases generated from `examples.yml`. They
  fetch their markdown sources over HTTPS from `raw.githubusercontent.com`, including
  `source/templates/markdown/example.md` and `example.pdf.md` on `master`.
- `markdown` is not one of the templates in the `tests/metrics.test.js` matrices (which cover `classic`,
  `terminal` and `repository`), and template-level cases are skipped by the compatibility check anyway.
- Local run: `npm run test-metrics`, or a mocked action run with
  `INPUT_TEMPLATE=markdown INPUT_MARKDOWN=<url> INPUT_CONFIG_OUTPUT=markdown`.

### Common Patterns
- Markdown partials use whitespace-slurping tags (`<%_`, `_%>`) so generated lists do not pick up stray
  indentation, unlike the HTML partials of the other templates.
- User templates mix both syntaxes: `{{ f.date(REGISTRATION_DATE, {date:true}) }}` for values and
  `<%- await include("partials/rss.ejs") %>` or `<%- await embed("name", {...}) %>` for blocks.

## Dependencies
### Internal
`source/app/metrics/index.mjs` (markdown branch, `embed()`, PDF conversion), `source/plugins/core`
(`markdown`, `config_output`, `markdown_cache`, `config_padding`, `config_twemoji` inputs),
`source/app/metrics/metadata.mjs` (`embed` marking in the compatibility row), `../classic` (fallback for
`style.css`, `fonts.css`).

### External
`ejs`, `axios` (fetching the remote markdown source), `puppeteer` (PDF rendering and embedded SVG
conversion), GitHub REST `repos.get` (default branch resolution).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
