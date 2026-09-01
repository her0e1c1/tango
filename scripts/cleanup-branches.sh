#!/usr/bin/env bash
set -euo pipefail

cutoff=$(($(date +%s) - 7 * 24 * 60 * 60))
current_worktree=$(git rev-parse --show-toplevel)
open_pr_branches=$(gh api --paginate 'repos/{owner}/{repo}/pulls?state=open&per_page=100' --jq '.[].head.ref')

has_open_pr() {
  grep -Fqx -- "$1" <<<"$open_pr_branches"
}

is_stale() {
  local timestamp
  timestamp=$(git -C "$1" log -1 --format=%ct "${2:-HEAD}") || return 1
  ((timestamp <= cutoff))
}

failed=0
primary_worktree=""
worktree=""
branch=""
locked=0

remove_worktree() {
  local status

  [[ -n "$worktree" ]] || return 0
  [[ -n "$primary_worktree" ]] || primary_worktree=$worktree
  status=$(git -C "$worktree" status --porcelain --untracked-files=all) || return 0

  if [[ "$worktree" == "$primary_worktree" || "$worktree" == "$current_worktree" || "$branch" == main ]] ||
    ((locked)) || { [[ -n "$branch" ]] && has_open_pr "$branch"; } ||
    ! is_stale "$worktree" || [[ -n "$status" ]]; then
    return
  fi

  if git worktree remove -- "$worktree"; then
    printf 'Removed stale worktree: %s\n' "$worktree"
  else
    failed=1
  fi
}

while IFS= read -r line; do
  case $line in
    "")
      remove_worktree
      worktree=""
      branch=""
      locked=0
      ;;
    "worktree "*) worktree=${line#worktree } ;;
    "branch refs/heads/"*) branch=${line#branch refs/heads/} ;;
    locked*) locked=1 ;;
  esac
done < <(git worktree list --porcelain; printf '\n')

checked_out_branches=$(git worktree list --porcelain | sed -n 's|^branch refs/heads/||p')

is_checked_out() {
  grep -Fqx -- "$1" <<<"$checked_out_branches"
}

while IFS=$'\t' read -r timestamp branch; do
  if [[ "$branch" == main ]] || has_open_pr "$branch" || is_checked_out "$branch" || ((timestamp > cutoff)); then
    continue
  fi

  if git branch -D -- "$branch"; then
    printf 'Removed stale local branch: %s\n' "$branch"
  else
    failed=1
  fi
done < <(git for-each-ref --format='%(committerdate:unix)%09%(refname:lstrip=2)' refs/heads)

exit "$failed"
