<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/terminal

## Purpose
A template that renders metrics as a fake SSH session (`index: 2`): a window title bar, a `<pre>` body where
each block is a shell prompt line (`stdin`) followed by its output (`stdout`), and a "Connection reset by"
footer. Plugins are mapped onto plausible commands, so the languages plugin prints as `locale`, gists as
`ls -lh github/gists`, and pagespeed as `curl -I`. It is the only built-in template that ships embedded
fonts and the only one that forces raw output to preserve whitespace.

## Key Files
| File | Description |
|------|-------------|
| `metadata.yml` | `name: 📙 Terminal template`, `index: 2`, `supports: [user, organization]`, `formats: [svg, png, jpeg, json]`. |
| `template.mjs` | Calls `imports.plugins.core(...arguments)`, then sets `q.raw = true` so the SVG optimizer does not collapse the whitespace that the monospace layout depends on. |
| `image.svg` | Computes `meta.$`, the PS1 prompt string (`<login>@metrics:~` followed by `#` when the token has the `repo` scope, else `$`), and `meta.animations` (`stdin: .16s`, `stdout: .28s`, `length: 2 + base parts + plugins`, all zeroed for placeholder renders). It then emits per-element `animation-delay` rules in an EJS loop so prompts appear to be typed in sequence, draws the title bar, and wraps the banner, warnings, partial loop and footer in a single `<pre>`. Ends with `#metrics-end`. |
| `style.css` | 3.5 KB, sections: SVG global context (Courier Prime 14px, `#777` on the terminal background), title bar and window buttons, terminal body, isocalendar, images, autosize, prompt, diff, error, animations, calendar, end delimiter. |
| `fonts.css` | 44 KB of base64 `@font-face` declarations: Courier Prime regular and bold, embedded as `application/font-woff` data URLs. The only template shipping fonts, which is why it is also the heaviest output. |
| `examples.yml` | One example: `template: terminal`, `base: header, metadata`. |
| `README.md` | GENERATED header and examples. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `partials/` | 10 `.ejs` partials and the 8-entry `_.json` (see `partials/AGENTS.md`) |

## For AI Agents
### Working In This Directory
- Whitespace is significant. Partials use the EJS trim tags (`<%# -%>`, `-%>`) aggressively, and
  `template.mjs` sets `q.raw = true`; removing either turns the aligned columns into a single collapsed
  line.
- The animation sequence is index-based: `image.svg` emits `.stdin:nth-of-type(n)` and
  `.stdout:nth-of-type(n+1)` delays for `meta.animations.length` steps, so every partial must emit exactly
  one `div.stdin` and one `div.stdout` pair or the delays drift out of sync with the content.
- `meta.animations` is zeroed when `meta.placeholder` is set, which is what the web placeholder mode
  (third matrix in `tests/metrics.test.js`) renders.
- Adding a font to `fonts.css` materially increases every rendered file; the community template README
  documents the base64 subsetting procedure.
- `image.svg` uses `computed.token.scopes` to pick the prompt character, so the rendered prompt reveals
  whether the run had the `repo` scope.

### Testing Requirements
- Backing case file: `tests/cases/terminal.template.yml` (generated from `examples.yml`).
- `terminal` is the second column of all three matrices in `tests/metrics.test.js`, including the web
  placeholder matrix, so only the eight plugins with a partial here are exercised; every other plugin case
  is skipped for this template by the compatibility check.
- Mocked render:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=terminal node source/app/action/index.mjs`.

### Common Patterns
- Each partial is a command and its output:
  `<div class="stdin"><%- meta.$ %> git status</div><div class="stdout">…</div>`.
- Values are right-aligned with `padStart`, for example
  `<%= f(plugins.traffic.views.count).padStart(5) %>`, instead of CSS tables.
- Errors are inline `<span class="error">` fragments rather than dedicated error boxes.

## Dependencies
### Internal
`source/plugins/core` (`imports.plugins.core`, `config_animations`, `raw` handling),
`source/app/metrics/index.mjs` (render and optimizer), `source/app/web` placeholder mode,
`source/plugins/base` (header, activity, community, repositories parts).

### External
`ejs`, `puppeteer`, Courier Prime (embedded, from Google Fonts).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
