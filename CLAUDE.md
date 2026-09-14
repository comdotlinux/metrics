# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start with the AGENTS.md hierarchy

Per-directory documentation lives in `AGENTS.md` files (one in every directory that is safe to hold one, each with a `<!-- Parent: ../AGENTS.md -->` tag). The root one is imported below. Before editing in a directory, read that directory's `AGENTS.md`; the hubs are:

| Question | Read |
|----------|------|
| Plugin contract, `q`/inputs naming, adding a plugin | `source/plugins/AGENTS.md` |
| Template contract, `partials/_.json`, plugin/template compatibility | `source/templates/AGENTS.md` |
| Engine pipeline, `metadata.mjs`, `setup.mjs`, `utils.mjs` helpers, multi-account `merge.mjs` | `source/app/metrics/AGENTS.md` |
| Express routes, sandbox mode, web UI statics | `source/app/web/AGENTS.md` |
| Action inputs, output modes, `run.sh` docker wrapper | `source/app/action/AGENTS.md` |
| How mocks are matched, every mock file, known mock gaps | `tests/mocks/AGENTS.md` |
| CI pipeline order, build/release scripts, README generation | `.github/AGENTS.md` |

Regenerate with `/deepinit`; text below each file's `<!-- MANUAL: -->` marker survives regeneration. Some directories intentionally have no `AGENTS.md` because code loads every file in them (listed in the root file); do not add one there.

@AGENTS.md

## Commands

Node 22 is pinned in `.tool-versions` (mise and asdf both honor it) and matches the `node:22-bookworm-slim` base image in the `Dockerfile`. Install with Node 22 first on `PATH`: the native optional packages compile against whatever `node` the install scripts find.

```bash
asdf install nodejs 22.23.2                                    # then put it first on PATH
PUPPETEER_SKIP_DOWNLOAD=true SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci
```

There is no `postinstall` script any more (puppeteer 25 ships no `install.js` and `npm ci` died on it), so no browser is ever downloaded: point `PUPPETEER_BROWSER_PATH` at a local Chrome for anything that renders.

```bash
npm run linter                           # ESLint over source/**/*.mjs (dprint reformats in CI; lint errors matter, formatting does not)
npm run build                            # regenerate action.yml, READMEs, settings.example.json, tests/cases, examples workflow (needs network)
npm run quickstart -- plugin <name>      # scaffold a community plugin (or: -- template <name>)
npm start                                # web instance on :3000, needs settings.json (cp settings.example.json settings.json)
```

Tests are jest with mocked APIs and need a browser for puppeteer:

```bash
export PUPPETEER_BROWSER_PATH=/usr/bin/google-chrome-stable   # required: puppeteer 25 does not resolve a bare executable name
npm run test-metrics                                          # full matrix, 744 declared cases, very slow
npm run test-merge                                            # multi-account merge unit tests, no Chrome, no network, ~1s
npx jest --runInBand metrics.test.js -t "GitHub Action Template : classic .*Recent activity"   # one plugin's cases
```

Test names are `<mode> Template : <template> <plugin display name> - <example name>`; modes are `GitHub Action`, `Web instance`, `Web instance (placeholder)`; templates `classic`, `terminal`, `repository`. Example names come from `tests/cases/*.yml`. `npm run test-contrib` only makes sense on a PR branch (it diffs against `origin/master`), and on this fork never: `tests/ci.test.js` diffs generated files against upstream's `origin/master`. The gate actually used is the whole suite inside the image with that one file excluded: `docker run --rm --entrypoint="" <image> npx jest --runInBand --testPathIgnorePatterns tests/ci.test.js`. Two cases fail in every mode without live web access — Music `Spotify - Random track from playlist` and 16personalities `MBTI Personality profile` — because puppeteer is not mocked and those plugins scrape the web. That gate run declares 778 tests across the three suites, of which jest skips 411 as incompatible template/mode combinations, so 363 actually execute and pass.

Fastest single-plugin check, no jest:

```bash
INPUT_TOKEN=MOCKED_TOKEN INPUT_USE_MOCKED_DATA=yes INPUT_DRYRUN=yes INPUT_PLUGINS_ERRORS_FATAL=yes INPUT_PLUGIN_ACTIVITY=yes node source/app/action/index.mjs
# or with the web instance running: http://localhost:3000/<user>?base=0&activity=1&activity.limit=3
# two accounts (action only: the web instance never sets conf.accounts):
INPUT_TOKEN=$'MOCKED_TOKEN\nMOCKED_TOKEN_WORK' INPUT_USE_MOCKED_DATA=yes INPUT_DRYRUN=yes INPUT_PLUGINS_ERRORS_FATAL=yes INPUT_DEBUG=yes INPUT_PLUGIN_ISOCALENDAR=yes INPUT_RETRIES=1 INPUT_RETRIES_DELAY=0 node source/app/action/index.mjs
```

Native-dependency pitfalls seen on a dev box:
- `sharp` fails with a libvips/glib symbol error when it built against a system libvips: `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm rebuild sharp`.
- `libxmljs2` is optional and silently dropped if its install fails; without it any run with `verify: yes` (every generated test case) crashes on `parseXml` because the guard in `source/app/metrics/index.mjs` is inverted. `npm install --no-save libxmljs2` fixes the run; note that with it present, verification is skipped.
- `npm audit --audit-level=high` exits 1 on exactly one advisory, `@faker-js/faker` `helpers.fake`: mocks only, never called in this repo, and the fix is a major with ~130 call sites. Accepted and expected, not a regression.

## Architecture in one pass

One engine, two front-ends, same query object. The GitHub Action (`source/app/action/index.mjs`, run inside the Docker image by `run.sh`) turns `INPUT_*` env vars into a flat `q` object; the Express instance (`source/app/web/instance.mjs`) turns URL params into the same `q` (`plugin_languages_limit` in the action is `languages.limit` on the web; `metadata.to.query` and `metadata.to.yaml` convert between the two). Both call `metrics()` in `source/app/metrics/index.mjs`, which:

1. picks the template (`conf.templates[q.template]`, default `classic`),
2. runs the template's `template.mjs`, which must call the `core` pseudo-plugin,
3. `core` applies global config, then fans out every enabled plugin in parallel, storing each result or error in `data.plugins.<name>`; `base` has already populated `data.user` from GraphQL,
4. if several tokens were given (`conf.accounts` has more than one entry), each secondary account is recomputed by a recursive `metrics()` call with `convert: "json"` and every plugin disabled except `base`/`core` and the merged whitelist, then folded into the primary's live data by `source/app/metrics/merge.mjs` (fail-closed: a secondary error aborts the render; skipped entirely in repository mode),
5. renders `image.svg` with EJS, including each partial listed in `partials/_.json` whose plugin has data,
6. optimizes CSS/XML, then loads the SVG in puppeteer to measure height with a hidden marker (and screenshot for PNG/JPEG), or emits JSON/Markdown/PDF.

`metadata.yml` in each plugin directory is the single source of truth for options: it generates `action.yml`, the README option tables, `settings.example.json`, input validation, and the web UI. Change options there, then `npm run build`.

Everything is discovered from the filesystem by `source/app/metrics/setup.mjs`: every directory in `source/plugins/` and `source/plugins/community/` is a plugin (`index.mjs` required, `queries/*.graphql` auto-registered as `queries.<plugin>.<file>()`), every directory in `source/templates/` with `partials/_.json` is a template. `metadata.mjs` derives plugin/template compatibility from `partials/<plugin>*.ejs` file names.

Tests never hit real APIs: `tests/mocks/index.mjs` proxies octokit GraphQL (matched by operation name derived from the mock file name), octokit REST (by `section.method` path), axios GET/POST (by service), rss-parser, and Google Maps with faker data. Puppeteer is not mocked, so scraping plugins reach the live web even in mocked runs. Test cases are generated from each plugin's `examples.yml`; edit that, not `tests/cases/`.

Contribution boundaries (`CONTRIBUTING.md`, enforced by `tests/ci.test.js`): plugins are open; core and built-in templates need discussion and no new dependencies; workflows, scripts, configs and generated files are maintainer-only.

## Code style the linter enforces

No semicolons, double quotes, `{a, b}` without inner spaces, `//Comment` with no space after the slashes, stroustrup braces (`}\nelse {`), `prefer-template`, arrow parens only when needed, at most 4 parameters. Debug logging follows `console.debug(\`metrics/compute/${login}/plugins > <name> > <step>\`)`. Plugin `index.mjs` files return `null` when disabled and wrap the body in `try {} catch (error) { throw imports.format.error(error) }`.
