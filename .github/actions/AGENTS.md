<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-13 | Updated: 2026-09-13 -->

# .github/actions

## Purpose
Container for repository automation assets that are invoked by workflows but are not themselves GitHub
composite actions (there is no `action.yml` here). It holds the housekeeping shell scripts run by
`clean.yml` and `stale.yml`, and the configuration directory that `check-spelling/check-spelling`
reads by convention from `.github/actions/spelling`.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `ghcr-clean/` | Bash scripts that prune untagged GHCR images and expired workflow runs via the `gh` CLI (see `ghcr-clean/AGENTS.md`) |
| `spelling/` | check-spelling dictionaries, allow/reject lists, exclude and ignore patterns (see `spelling/AGENTS.md`) |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
