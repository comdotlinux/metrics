<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/templates/terminal/partials

## Purpose
The terminal template's partial set: 10 EJS fragments and the `_.json` render order. Each fragment renders
one fake shell command (`div.stdin`, prefixed with the `meta.$` prompt built in `../image.svg`) followed by
its output (`div.stdout`), formatted with `padStart`/`padEnd` so the monospace columns line up. Only a small
set of plugins has a terminal representation, which is what makes the terminal column of the test matrix
much narrower than the classic one.

## Key Files
10 `.ejs` fragments and the ordering file. `_.json` holds 8 names; `lines` and `traffic` are absent because
their output is inlined in `base.repositories.ejs`.

| File | Description |
|------|-------------|
| `_.json` | Render order: `base.header`, `base.activity+community`, `base.repositories`, `gists`, `languages`, `pagespeed`, `isocalendar`, `screenshot`. |
| `base.activity+community.ejs` | `git status` for user accounts: base `activity` and `community` parts rendered as a working-tree listing. |
| `base.header.ejs` | `whoami` for user accounts: bold display name plus `registered=`, `uid=` (last four digits of `user.databaseId`) and `gid=` (organization count). |
| `base.repositories.ejs` | `ls -lh github/repositories`: totals and disk usage, then permission-style rows for traffic views (`plugins.traffic`), stargazers, forks, watchers, packages, the `plugins.followup` issue and pull request tree, the favourite license, and a `@@ -deleted +added @@` diff line from `plugins.lines`. |
| `gists.ejs` | `ls -lh github/gists`: `totalCount`, `stargazers`, `forks`. |
| `isocalendar.ejs` | `ncal -MB5` or `-MB11` depending on `plugins.isocalendar.duration`: the plugin's pre-rendered `svg` plus the current streak. |
| `languages.ejs` | `locale`: one row per entry of `plugins.languages.favorites`, an ASCII bar of `#` characters and the percentage. |
| `lines.ejs` | Stub containing only an EJS comment; the diff line is emitted by `base.repositories.ejs`. Present so the compatibility matrix flags the lines plugin. |
| `pagespeed.ejs` | `curl -I <url>` (`-vI` when `detailed`): Lighthouse `scores` and, when detailed, the `metrics` as header-style lines. |
| `screenshot.ejs` | `wget <url>`: the captured `image` inserted as an autosized `<img>`. |
| `traffic.ejs` | Stub containing only an EJS comment; traffic views are emitted by `base.repositories.ejs`. Present so the compatibility matrix flags the traffic plugin. |

## For AI Agents
### Working In This Directory
- Whitespace control is mandatory. Every fragment uses `<%# -%>` and `-%>` to swallow the newlines EJS
  would otherwise emit, and `../template.mjs` sets `q.raw = true` so the optimizer leaves the result alone.
  A missing trim tag shows up as a blank line or a broken column in the render, not as an error.
- One `div.stdin` plus one `div.stdout` per fragment. `../image.svg` generates
  `.stdin:nth-of-type(n)` / `.stdout:nth-of-type(n+1)` animation delays for
  `2 + base parts + plugins` steps, so extra or missing pairs desynchronize the typing animation.
- Compatibility quirk worth knowing: `base.repositories.ejs` renders `plugins.followup` data, but there is
  no `followup.ejs` here, so `metadata.plugin` does not list the terminal template as supporting the
  followup plugin and `tests/metrics.test.js` skips followup cases in the terminal column.
- `base.header.ejs` and `base.activity+community.ejs` both require `account === "user"`, so organization
  renders silently drop them even though the template declares `organization` support.
- These files are served publicly at `/.templates/terminal/partials` by the web instance.

### Testing Requirements
- The terminal column of all three matrices in `tests/metrics.test.js` (action, web instance, web
  placeholder) exercises these fragments, but only for the plugins with a file here.
- `tests/cases/terminal.template.yml` is the template's own case file, generated from `../examples.yml`
  (`base: header, metadata`).
- Placeholder mode renders with `meta.placeholder` set, which zeroes `meta.animations`; check that path
  when touching animation-dependent markup.
- Mocked render:
  `INPUT_USE_MOCKED_DATA=yes INPUT_TOKEN=MOCKED_TOKEN INPUT_DRYRUN=yes INPUT_TEMPLATE=terminal INPUT_PLUGIN_LANGUAGES=yes node source/app/action/index.mjs`.

### Common Patterns
- Command then output:
  `<div class="stdin"><%- meta.$ %> ls -lh github/gists</div><%# -%><div class="stdout"><%# -%>…</div>`.
- Fixed-width columns via `` `${value}`.padStart(5) `` and `name.toLocaleUpperCase().padEnd(12)`.
- Unix-flavoured decoration: permission prefixes (`-r--`, `dr-x`, `d---`), tree characters for nested
  counts, and `@@ -x +y @@` for diff stats.
- Errors are inline `<span class="error">(message)</span>` fragments that keep the column layout intact.

## Dependencies
### Internal
`../image.svg` (prompt string `meta.$`, animation delays, include loop), `../style.css` (`stdin`, `stdout`,
`diff`, `error`, `isocalendar`, `autosize` classes), `source/plugins/base`, `source/plugins/traffic`,
`source/plugins/lines`, `source/plugins/followup`, `source/plugins/gists`, `source/plugins/languages`,
`source/plugins/isocalendar`, `source/plugins/pagespeed`, `source/plugins/community/screenshot`.

### External
`ejs`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
