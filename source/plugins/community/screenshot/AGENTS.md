<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# screenshot

## Purpose
Community plugin that embeds a screenshot, or the plain text, of an arbitrary website into the rendered
metrics image. A headless Chrome loads the user-supplied URL, waits for a CSS selector, and either clips
that element to a PNG or extracts its `innerText`. It is the most general-purpose plugin here and the
one with the widest template support.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Launches `imports.puppeteer`, applies `page.setViewport(viewport)`, navigates with `waitUntil: ["domcontentloaded", "networkidle2"]`, optionally sleeps `wait` milliseconds, then `page.waitForSelector(selector)`. In `image` mode it reads the element's `getBoundingClientRect()` inside `page.evaluate`, passes the clip to `imports.record({page, x, y, width, height, frames: 1, background})`, resizes the returned base64 frame with `imports.sharp` to `min(454 * (1 + data.large), clip.width)` and emits a `data:image/png;base64,...` string. In `text` mode it returns `innerText` (or `""`). Always calls `browser.close()`. Returns `{mode, image, content, title, height, width, url}`. Errors are wrapped with `imports.format.error(error, {title: "Screenshot error"})`. |
| `metadata.yml` | `category: community`, `authors: [lowlighter]`, `supports: [user, organization, repository]`, `scopes: []`. Eight inputs. |
| `examples.yml` | One example, "XKCD of the day", selecting `#comic img` on `https://xkcd.com`, with `test.timeout: 1800000` and `test.modes: [action]`. |
| `README.md` | GENERATED. Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_screenshot` (boolean), `plugin_screenshot_url` (required, throws `URL is not set`),
  `plugin_screenshot_selector` (CSS selector, default `body`), `plugin_screenshot_mode`
  (`image` or `text`, default `image`, anything else throws `Unsupported mode "<x>"`),
  `plugin_screenshot_title` (caption, default `Screenshot`), `plugin_screenshot_viewport`
  (JSON, default `{width: 1280, height: 1280}`), `plugin_screenshot_wait` (ms, default 0),
  `plugin_screenshot_background` (boolean, default yes).
- Security: `plugin_screenshot` declares the extras feature `metrics.run.puppeteer.scrapping`. On a web
  instance, `metadata.mjs` checks that string against `settings.json` `extras.features` and otherwise
  throws `Option "plugin_screenshot" is disabled on this server`. That gate is load-bearing. The plugin
  fetches an operator-unvalidated URL from inside the server, so an ungated public instance is a
  server-side request forgery surface reaching localhost and private network ranges. Do not add a code
  path that bypasses `enabled(enabled, {extras})`, and do not relax the gate to make a test pass.
  The GitHub Action runs in the user's own container, where this concern does not apply.
- `text` mode drops all styling. That is documented in `metadata.yml` and is not a bug to fix in the
  plugin; the partial renders the text with the template's own typography.
- `imports.record` is the same helper the animated-output path uses; requesting `frames: 1` makes it a
  single-frame capture. It returns an array of data URIs, hence the `buffer.split(",").pop()` before
  handing the base64 to `sharp`.
- `wait` is applied before `waitForSelector`, so a slow-hydrating page needs `wait` rather than a longer
  selector timeout.
- Sibling comparison: `16personalities/index.mjs` performs the same puppeteer dance but never closes the
  browser. This file does; keep it that way.

### Testing Requirements
- Case file: `tests/cases/screenshot.plugin.yml`. It restricts to `modes: [action]` and sets a 30-minute
  timeout because a real Chrome launch is slow in CI.
- There is no puppeteer mock. `tests/mocks/api/` proxies only axios and the GitHub APIs, so the case
  really loads `https://xkcd.com` even under `use_mocked_data: yes`. It fails offline.
- Local check: `npm start`, then
  `http://localhost:3000/<user>?base=0&screenshot=1&screenshot.url=https://example.com&screenshot.selector=body`.
  The web instance must have `metrics.run.puppeteer.scrapping` in `settings.json` `extras.features`.
- `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: `return null` on `!q.screenshot` or a false `enabled(...)`, typed
  options from `imports.metadata.plugins.screenshot.inputs({data, account, q})`, everything wrapped in
  `try {} catch (error) { throw imports.format.error(error, {title: "Screenshot error"}) }`.
- Passing a `{title}` second argument to `imports.format.error` to relabel the error box is unusual in
  this repo; most plugins call it with one argument.
- Output width scales with the shared `data.large` flag, as in `crypto` and `stock`.

## Dependencies
### Internal
- `imports.puppeteer`, `imports.record`, `imports.sharp`, `imports.format.error`, `imports.metadata`
  from `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/screenshot.ejs`,
  `source/templates/repository/partials/screenshot.ejs` and
  `source/templates/terminal/partials/screenshot.ejs`. It is the only community plugin the `terminal`
  template supports.

### External
- `puppeteer` plus a Chrome binary (`PUPPETEER_BROWSER_PATH`, `google-chrome-stable` in the Dockerfile),
  and `sharp` for the resize. Any user-supplied URL is the data source; no token.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
