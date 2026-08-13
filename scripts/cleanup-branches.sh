#!/usr/bin/env bash
set -euo pipefail

current=$(git branch --show-current)

gh pr list --state all --limit 1000 \
  --json headRefName,state,isCrossRepository \
  --jq '.[] | select(.state != "OPEN" and .isCrossRepository == false) | .headRefName' |
  sort -u |
  while IFS= read -r branch; do
    [[ "$branch" == "$current" ]] && continue

    if git show-ref --verify --quiet "refs/heads/$branch"; then
      git branch -D "$branch"
    fi
  done
