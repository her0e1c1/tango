#!/usr/bin/env bash
set -euo pipefail

checked_out=$(git worktree list --porcelain | sed -n 's|^branch refs/heads/||p')

gh pr list --state all --limit 1000 \
  --json headRefName,state,isCrossRepository \
  --jq '[.[] | select(.isCrossRepository == false)] | group_by(.headRefName)[] | select(all(.state != "OPEN")) | .[0].headRefName' |
  while IFS= read -r branch; do
    grep -Fxq "$branch" <<<"$checked_out" && continue

    if git show-ref --verify --quiet "refs/heads/$branch"; then
      git branch -D "$branch"
    fi
  done
