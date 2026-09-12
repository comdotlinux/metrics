<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# 16personalities

## Purpose
Community plugin that renders a Myers-Briggs style personality profile by scraping a published
16personalities profile page with puppeteer. There is no 16personalities API, so the plugin opens the
user-supplied profile URL in a headless browser, reads a fixed set of CSS selectors out of the rendered
DOM, inlines the card illustrations as base64 data URIs, and returns type, personality cards and trait
cards to the template.

## Key Files
| File | Description |
|------|-------------|
| `index.mjs` | Launches `imports.puppeteer`, navigates to `url` with `waitUntil: imports.puppeteer.events`, then `page.evaluate`s a scraper reading `.card__bg` background color, `.type__code` for the four-letter type, `.personality-cards .sp-personality-card` (title, subtitle, image, text) and `#traits .card__body` (title, subtitle, `.center__num` score, first `<p>`). Post-processing strips the parenthesised type from card subtitles, converts each image through `imports.imgb64`, title-cases trait values, and converts the `NN%` score to a 0-1 number (or `NaN` when `scores` is off). Returns `{sections, color, type, personality, traits}`. |
| `metadata.yml` | `category: community`, `authors: [lowlighter]`, `supports: [user]`, `scopes: []`. Declares the four `plugin_16personalities*` inputs and the disclaimer of non-affiliation. |
| `examples.yml` | One example, "MBTI Personality profile", with `sections: personality, traits` and `scores: no`, reading the URL from a `SIXTEEN_PERSONALITIES_URL` secret. |
| `README.md` | GENERATED (`<!--header-->` / `<!--options-->` / `<!--examples-->` blocks). Rebuild with `npm run build`. |

## For AI Agents
### Working In This Directory
- Options: `plugin_16personalities` (boolean, gated by extras feature `metrics.run.puppeteer.scrapping`),
  `plugin_16personalities_url` (string, required, the plugin throws `URL is not set` when empty),
  `plugin_16personalities_sections` (comma-separated array of `personality`, `profile`, `traits`,
  default `personality`), `plugin_16personalities_scores` (boolean, default yes).
- The plugin name starts with a digit, so it is always addressed with bracket notation:
  `q["16personalities"]` and `imports.metadata.plugins["16personalities"]`. Do not "clean this up"
  into dot notation.
- `sections` is passed straight through to the partial. The plugin itself always scrapes everything and
  the EJS decides what to draw, so adding a section means editing
  `source/templates/classic/partials/16personalities.ejs`, not this file.
- Bug worth knowing: unlike `screenshot/index.mjs`, this file never calls `browser.close()`. A failed or
  slow render leaves a Chrome process behind on long-lived web instances.
- The scraper is bound to 16personalities' current markup. Any class rename upstream surfaces as a
  `Cannot read properties of null` thrown out of `page.evaluate`, wrapped by `imports.format.error`.
- The profile URL is a shareable secret link obtained after taking the free test and registering an
  email. It is meant to be stored as a repository secret, not committed.

### Testing Requirements
- Case file: `tests/cases/16personalities.plugin.yml` (generated from `examples.yml`). It pins
  `plugin_16personalities_url: https://www.16personalities.com/profiles/b7d9f29453ea5`.
- There is no mock. `tests/mocks/api/` only proxies axios and the GitHub APIs, so this case performs a
  real network fetch and a real Chrome launch even with `use_mocked_data: yes`. Expect it to be slow and
  to fail offline or when the upstream page changes.
- Local run: `npm start` with `plugins.16personalities.enabled` (or `plugins.default`) set in
  `settings.json`, then `http://localhost:3000/<user>?base=0&16personalities=1&16personalities.url=<url>`.
- `npm run linter` before committing.

### Common Patterns
- Standard community-plugin skeleton: early `return null` on `!q["16personalities"]` or a false
  `enabled(...)`, `inputs({data, account, q})` for typed options, everything wrapped in
  `try {} catch (error) { throw imports.format.error(error) }`.
- `imports.imgb64(url)` is used to inline remote images so the SVG stays self-contained.
- Progress is reported through `console.debug` lines prefixed
  `metrics/compute/<login>/plugins > 16personalities >`.

## Dependencies
### Internal
- `imports.puppeteer`, `imports.imgb64`, `imports.format.error`, `imports.metadata` from
  `source/app/metrics/utils.mjs`.
- Rendered by `source/templates/classic/partials/16personalities.ejs` (classic template only).

### External
- `puppeteer` plus a Chrome binary (`PUPPETEER_BROWSER_PATH`, `google-chrome-stable` in the Dockerfile).
- `https://www.16personalities.com/profiles/<id>` and the image CDN it links to. No token, no OAuth.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
