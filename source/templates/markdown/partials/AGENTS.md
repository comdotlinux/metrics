<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/markdown/partials

## Purpose
Markdown-flavoured versions of five plugin renderers, available to user markdown templates through
`<%- await include("partials/<name>.ejs") %>`. Unlike every other template, nothing here is rendered
automatically: `_.json` is an empty array, so the markdown branch of `source/app/metrics/index.mjs` renders
only the user-supplied source file and the author decides which partials to pull in and where. The `_.json`
file still has to exist, because its presence is what makes `source/app/metrics/setup.mjs` treat
`source/templates/markdown` as a loadable template.

## Key Files
| File | Description |
|------|-------------|
| `_.json` | Empty JSON array `[]`. No automatic render order; required only for template discovery. |
| `activity.ejs` | Activity plugin as a markdown bullet list, one line per event in `plugins.activity.events`, with emoji prefixes and links per type (comment, member, star, release, fork, push with nested commit links, and the remaining event types). |
| `posts.ejs` | Posts plugin: bold linked heading for `plugins.posts.source`, then either a plain link list or an HTML `<table>` card per entry when `descriptions` or `covers` are enabled. |
| `rss.ejs` | RSS plugin: bold linked heading for `plugins.rss.source`, then a bullet per `feed` entry with a formatted publication date, or "Empty RSS feed". |
| `topics.ejs` | Topics plugin: shields.io badges built from each topic `name` and `icon24`, linking to `github.com/topics/<name>`, with a heading that depends on `plugins.topics.mode` (`starred` or `mastered`). |
| `tweets.ejs` | Tweets plugin (deprecated upstream): blockquote per tweet in `plugins.tweets.list`, with linked attachment images and the creation timestamp. |

## For AI Agents
### Working In This Directory
- These file names also feed the compatibility matrix. `metadata.plugin` sees `activity.ejs`, `posts.ejs`,
  `rss.ejs`, `topics.ejs` and `tweets.ejs` and marks those plugins as markdown-compatible; every other
  plugin is shown as `embed` in the markdown template README because `metadata.yml` lists the `markdown`
  format.
- The plugin still has to be enabled in the workflow (`plugin_rss: yes` and so on). Including a partial for
  a disabled plugin renders nothing, because each file starts with `<%_ if (plugins.<name>) { _%>`.
- `include()` resolves against the EJS `views` array, which `setup.mjs` sets to this template directory, so
  the path in a user template is always `partials/<name>.ejs` no matter where the markdown file is hosted.
- Output is markdown, so indentation matters. Use the whitespace-slurping tags (`<%_ ... _%>`) already used
  throughout these files, otherwise EJS control-flow indentation leaks into the rendered document and turns
  lists into code blocks.
- Raw HTML is allowed and used (`posts.ejs` and `tweets.ejs` emit tables and blockquotes with `<img>`),
  since GitHub renders inline HTML in markdown.

### Testing Requirements
- Exercised indirectly by `tests/cases/markdown.template.yml`, whose second case renders
  `source/templates/markdown/example.md` (which includes `activity`, `posts`, `rss` and `topics`) with the
  matching plugins enabled, and whose third case renders `example.pdf.md` (which includes `rss`).
- Run with `npm run test-metrics`. The `tweets` partial is only covered by the commented-out block in
  `example.md`, since the upstream plugin is deprecated.
- Plugin data comes from the mocks under `tests/mocks/api/` (axios for RSS and posts, GraphQL and REST for
  activity and topics).

### Common Patterns
- Guard and error handling identical to the other templates but with slurping tags:
  `<%_ if (plugins.x) { _%>` ... `<%_ if (plugins.x.error) { _%><%= plugins.x.error.message _%>`.
- Headings are bold links rather than `<h2>`: `**[icon Title](<url>)**`.
- Dates go through the shared formatter, for example `f.date(new Date(date), {date:true})`.
- Every partial ends with an explicit empty-state string ("Empty RSS feed", "No starred topics",
  "No recent tweets") instead of rendering nothing.

## Dependencies
### Internal
`source/plugins/activity`, `source/plugins/posts`, `source/plugins/rss`, `source/plugins/topics`,
`source/plugins/tweets` (data shapes), `../template.mjs` and `source/app/metrics/index.mjs` (render
context and `views` resolution).

### External
`ejs`, `img.shields.io` (badge images used by `topics.ejs`).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
