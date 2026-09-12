<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# source/app/web/statics/oauth

## Purpose
The GitHub OAuth pages for a hosted instance. Signing in lets a visitor spend their own API quota instead of
the instance owner's, and unlocks the extra features listed in `settings.extras.logged`. These pages only
exist when `settings.oauth` is configured; otherwise `instance.mjs` registers nothing but
`/.oauth/enabled` returning `false`.

## Key Files
| File | Description |
|------|-------------|
| `index.html` | Vue 2 sign-in page mounted on `<main>`. Shows the scope checkboxes and the authorize button when signed out, and the session id plus a revoke button when signed in. Loads `/.css/style.vars.css`, `/.css/style.css` and `/insights/.statics/style.css`, then axios, Vue and `/.oauth/script.js`. |
| `script.js` | The Vue app. Restores `session.metrics` from localStorage into both `this.session` and the `x-metrics-session` axios header, fetches `/.requests`, `/.version`, `/.hosted`, `/.oauth/enabled` and `/.extras.logged`, and builds the `params` query string (`from` plus the space-joined `scopes`) for the authorize link. A `supported` data property probes localStorage with a write-read-delete round trip so the page can tell the user when storage is unavailable. |
| `redirect.html` | The landing page of the OAuth round trip. Contains no Vue, just an inline script that reads `session` out of the query string into `localStorage["session.metrics"]` and then navigates to `to`, falling back to `/.oauth`. |

## For AI Agents
### Working In This Directory
The flow, implemented in `../../instance.mjs`:

1. A page links to `/.oauth?from=<current url>`; `index.html` reads that `from` and the chosen scopes into its
   authorize link.
2. `/.oauth/authenticate` mints a 64-byte random CSRF state, stores `{from, scopes}` against it, and redirects
   to `github.com/login/oauth/authorize` with `client_id`, `state`, `redirect_uri` of
   `<settings.oauth.url>/.oauth/authorize`, `allow_signup: false` and the scopes.
3. `/.oauth/authorize` validates the state, posts the code to `github.com/login/oauth/access_token`, reads the
   login from `api.github.com/user`, stores a 128-byte session id in an in-memory map alongside the token, and
   redirects to `/.oauth/redirect?to=<from>&session=<id>`.
4. `redirect.html` persists the session and returns the visitor to where they started.
5. `/.oauth/revoke/:session` deletes the grant through the applications API and drops the session.

Sessions live in a `Map` inside the running process, so they do not survive a restart and are not shared
across instances. Every page treats a `/.requests` response without a `login` as proof the session is stale
and clears it.

The `x-metrics-session` header is what the server reads to pick a per-user octokit, to widen extras with
`settings.extras.logged`, and to report that user's own rate limit on `/.requests`.

Known quirk worth keeping in mind: in `/.oauth/authenticate` the `from` value is read from the `scopes` query
parameter rather than from `from`, so the post-login redirect target is not what the link intends. Fixing it
means changing `instance.mjs`, not these files.

`settings.oauth.url` must equal the instance's public origin, since GitHub validates the callback against the
registered application URL.

### Testing Requirements
No jest coverage, and it cannot be exercised with mocked data because the token exchange talks to real GitHub.
To try it, register an OAuth app, put its `id`, `secret` and `url` in `settings.json`, run `npm start`, and
walk `/` to `/.oauth` to authorize and back.

### Common Patterns
Same shape as the other statics apps: Vue 2 `new Vue({el: "main"})` with no build step, palette from
`prefers-color-scheme` watched onto the `<body>` class, all localStorage access wrapped in `try/catch`, and
session ids truncated to their first characters whenever they are displayed or logged.

## Dependencies
### Internal
Served by `../../instance.mjs` at `/.oauth/`, `/.oauth/index.html`, `/.oauth/script.js` and
`/.oauth/redirect`; reuses `../style.css`, `../style.vars.css` and `../insights/style.css`. Not copied into
the preview build by `.github/scripts/preview.mjs`.

### External
Vue 2 and axios from `node_modules`; `github.com/login/oauth/*` and `api.github.com` at runtime.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
