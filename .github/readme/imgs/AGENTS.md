<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/readme/imgs

## Purpose
53 screenshots and GIFs embedded by the documentation partials and by `ARCHITECTURE.md`. Referenced by
repository-absolute paths such as `/.github/readme/imgs/setup_personal_token.light.png`, so the links
survive the partial being inlined into the root `README.md`.

## Key Files
| Group | Description |
|-------|-------------|
| `setup_*.{light,dark}.png` (20 files, 10 pairs) | GitHub UI screenshots for the setup guides: `setup_personal_repository`, `setup_personal_token`, `setup_repository_secret`, `setup_workflow_permissions`, `setup_private_contributions`, `setup_public_membership_org`, `setup_token_org_read_scope`, `setup_token_repo_scope`, `setup_selfhosted_create`, `setup_shared`. |
| `example_*.{light,dark}.png` (4 files, 2 pairs) | `example_github_profile` and `example_action_update`, showing a rendered profile and a workflow run. |
| `plugin_*.png` (25 files) | Per-plugin credential and setup walkthroughs: `plugin_16personalities_profile`, `plugin_achievements_ranks`, `plugin_chess_lichess_token_{0,1,2}`, `plugin_music_playlist_{apple,spotify}`, `plugin_music_recent_spotify_token_{0,1,2}`, `plugin_music_recent_youtube_cookie_{1,2}`, `plugin_projects_{create,repositories,setup,track_progress}`, `plugin_splatoon_{auth,script,statink}`, `plugin_stackoverflow_user_id`, `plugin_steam_{userid,webtoken}`, `plugin_stock_token`, `plugin_tweets_secrets`, `plugin_wakatime_token`. |
| `about_metrics_are_html.png`, `about_metrics_marker.png` | The two illustrations used by `ARCHITECTURE.md` for the SVG-as-HTML rendering model and the height marker. |
| `features_embed.gif`, `features_insights.gif` | Animated demos of the embed and insights web modes. |

## For AI Agents
- Files ending in `.light.png` / `.dark.png` come in pairs and are always referenced together with
  GitHub's theme anchors: `![alt](/path/x.light.png#gh-light-mode-only)` immediately followed by
  `![alt](/path/x.dark.png#gh-dark-mode-only)`. Add both halves or neither.
- The 53 files cover 41 distinct base names: 12 light/dark pairs (the 10 `setup_*` and the 2
  `example_*` images) and 29 single-theme files.
- Consumers, with their reference counts: `partials/documentation/setup/action.md` (12),
  `partials/documentation/setup/shared.md` (6), `partials/documentation/organizations.md` (4),
  `partials/documentation/setup/web.md` (2), `partials/documentation/selfhosted.md` (2),
  `ARCHITECTURE.md` (2), plus `partials/templated/introduction.md`. Plugin screenshots are linked from
  the plugin READMEs under `source/plugins/`.
- `excludes.txt` skips `\.png$` and `ignore$`, so images are never spell-checked, but the `alt` text in
  the referencing Markdown is.
- Rendered metrics examples are **not** stored here; they live on the `examples` branch and are linked
  as `https://github.com/lowlighter/metrics/blob/examples/metrics.*.svg`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
