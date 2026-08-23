#!/usr/bin/env bash
set -euo pipefail

current_worktree=$(git rev-parse --show-toplevel)
worktrees=$(git worktree list --porcelain)

worktree_for_branch() {
  awk -v target="refs/heads/$1" '
    /^worktree / { path = substr($0, 10) }
    $1 == "branch" && $2 == target { matched_path = path }
    END { if (matched_path != "") print matched_path }
  ' <<<"$worktrees"
}

worktree_is_locked() {
  awk -v target="refs/heads/$1" '
    /^worktree / { branch = "" }
    $1 == "branch" { branch = $2 }
    $1 == "locked" && branch == target { found = 1 }
    END { exit !found }
  ' <<<"$worktrees"
}

gh pr list --state all --limit 1000 \
  --json headRefName,state,isCrossRepository \
  --jq '[.[] | select(.isCrossRepository == false)] | group_by(.headRefName)[] | select(all(.state != "OPEN")) | .[0].headRefName' |
  while IFS= read -r branch; do
    if git show-ref --verify --quiet "refs/heads/$branch"; then
      worktree=$(worktree_for_branch "$branch")

      if [[ "$worktree" == "$current_worktree" ]]; then
        printf 'Skipping %s: checked out in the current worktree\n' "$branch" >&2
        continue
      fi

      if [[ -n "$worktree" ]]; then
        if worktree_is_locked "$branch"; then
          printf 'Skipping %s: worktree is locked (%s)\n' "$branch" "$worktree" >&2
          continue
        fi

        if ! worktree_status=$(git -C "$worktree" status --porcelain --untracked-files=all); then
          printf 'Skipping %s: worktree status could not be read (%s)\n' "$branch" "$worktree" >&2
          continue
        fi

        if [[ -n "$worktree_status" ]]; then
          printf 'Skipping %s: worktree contains uncommitted changes (%s)\n' "$branch" "$worktree" >&2
          continue
        fi

        # Detaching preserves the worktree and ignored local files while releasing the branch.
        if ! git -C "$worktree" switch --detach --quiet; then
          printf 'Skipping %s: worktree could not be detached (%s)\n' "$branch" "$worktree" >&2
          continue
        fi
      fi

      git branch -D -- "$branch"
    fi
  done
