#!/usr/bin/env bash
set -euo pipefail

# The sentinel preserves trailing newlines that may be part of the worktree path.
if ! current_worktree=$(
  set +e
  git rev-parse --show-toplevel
  status=$?
  printf x
  exit "$status"
); then
  printf 'Failed to identify the current worktree\n' >&2
  exit 1
fi
current_worktree=${current_worktree%x}
current_worktree=${current_worktree%$'\n'}

worktree_paths=()
worktree_branches=()
main_worktree=""
record_path=""
record_branch=""
# A file preserves NUL delimiters and confirms inventory succeeded before any deletion begins.
worktree_list_file=$(mktemp /tmp/cleanup-branches.XXXXXX)

cleanup_worktree_list() {
  rm -f -- "$worktree_list_file"
}

trap cleanup_worktree_list EXIT

if ! git worktree list --porcelain -z >"$worktree_list_file"; then
  printf 'Failed to list worktrees\n' >&2
  exit 1
fi

# NUL-delimited parsing keeps destructive cleanup safe for every valid worktree path.
while IFS= read -r -d '' field; do
  if [[ -z "$field" ]]; then
    if [[ -n "$record_branch" ]]; then
      worktree_paths+=("$record_path")
      worktree_branches+=("$record_branch")
    fi
    record_path=""
    record_branch=""
  elif [[ "$field" == "worktree "* ]]; then
    record_path=${field#worktree }
    [[ -z "$main_worktree" ]] && main_worktree=$record_path
  elif [[ "$field" == "branch refs/heads/"* ]]; then
    record_branch=${field#branch refs/heads/}
  fi
done <"$worktree_list_file"

cleanup_worktree_list
trap - EXIT

branches=$(gh pr list --state all --limit 1000 \
  --json headRefName,state,isCrossRepository \
  --jq '[.[] | select(.isCrossRepository == false)] | group_by(.headRefName)[] | select(all(.state != "OPEN")) | .[0].headRefName')

failed=0

while IFS= read -r branch; do
  if [[ -z "$branch" ]] || ! git show-ref --verify --quiet "refs/heads/$branch"; then
    continue
  fi

  branch_worktrees=()
  protected_worktree=""

  for ((index = 0; index < ${#worktree_paths[@]}; index++)); do
    if [[ "${worktree_branches[index]}" == "$branch" ]]; then
      branch_worktrees+=("${worktree_paths[index]}")
    fi
  done

  for ((index = 0; index < ${#branch_worktrees[@]}; index++)); do
    worktree=${branch_worktrees[index]}
    if [[ "$worktree" == "$current_worktree" || "$worktree" == "$main_worktree" ]]; then
      protected_worktree=$worktree
      break
    fi
  done

  if [[ -n "$protected_worktree" ]]; then
    printf 'Skipping %s: cannot remove the main or current worktree (%s)\n' "$branch" "$protected_worktree" >&2
    failed=1
    continue
  fi

  branch_failed=0
  for ((index = 0; index < ${#branch_worktrees[@]}; index++)); do
    worktree=${branch_worktrees[index]}
    # Locked worktrees require two force flags; closed PR cleanup intentionally discards all local changes.
    if ! git worktree remove --force --force -- "$worktree"; then
      printf 'Failed to remove worktree for %s (%s)\n' "$branch" "$worktree" >&2
      branch_failed=1
    fi
  done

  if ((branch_failed)); then
    failed=1
    continue
  fi

  if ! git branch -D -- "$branch"; then
    printf 'Failed to delete branch %s\n' "$branch" >&2
    failed=1
  fi
done <<<"$branches"

exit "$failed"
