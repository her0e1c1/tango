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

if ! git fetch --prune origin; then
  printf 'Failed to refresh remote branches\n' >&2
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  printf 'origin/main does not exist\n' >&2
  exit 1
fi

if ! repository=$(gh repo view --json nameWithOwner --jq .nameWithOwner); then
  printf 'Failed to identify the GitHub repository\n' >&2
  exit 1
fi

temp_dir=$(mktemp -d /tmp/cleanup-branches.XXXXXX)
remove_temp_dir() {
  rm -rf -- "$temp_dir"
}
trap remove_temp_dir EXIT

pr_list_file=$temp_dir/pulls.tsv
worktree_list_file=$temp_dir/worktrees
branch_list_file=$temp_dir/branches

# Keep the repository field non-empty so Bash preserves every TSV column.
if ! gh api --paginate "repos/$repository/pulls?state=all&per_page=100" \
  --jq '.[] | [(.head.repo.full_name // "-"), .head.ref, .head.sha, .state] | @tsv' >"$pr_list_file"; then
  printf 'Failed to list pull requests\n' >&2
  exit 1
fi

tip_is_on_remote() {
  local tip=$1
  local remote_refs

  if ! remote_refs=$(git for-each-ref --contains="$tip" --format='%(refname)' refs/remotes); then
    return 2
  fi

  [[ -n "$remote_refs" ]]
}

find_cleanup_reason() {
  local branch=$1
  local tip=$2
  local status

  if [[ -z "$branch" ]]; then
    if tip_is_on_remote "$tip"; then
      return 1
    else
      status=$?
      if ((status != 1)); then
        return 2
      fi
    fi

    printf 'detached tip unreachable from remote branches'
    return 0
  fi

  if git merge-base --is-ancestor "$tip" origin/main; then
    printf 'merged'
    return 0
  else
    status=$?
    if ((status != 1)); then
      return 2
    fi
  fi

  if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
    return 1
  else
    status=$?
    if ((status != 1)); then
      return 2
    fi
  fi

  local head_repository
  local pr_branch
  local pr_oid
  local pr_state
  local matches_closed_pr=0

  # A reused branch name is safe only when no open PR exists and a closed PR records this exact tip.
  while IFS=$'\t' read -r head_repository pr_branch pr_oid pr_state; do
    if [[ "$head_repository" != "$repository" || "$pr_branch" != "$branch" ]]; then
      continue
    fi

    if [[ "$pr_state" == open ]]; then
      return 1
    fi

    if [[ "$pr_oid" == "$tip" ]]; then
      matches_closed_pr=1
    fi
  done <"$pr_list_file"

  if ((matches_closed_pr)); then
    printf 'closed PR without remote branch'
    return 0
  fi

  return 1
}

worktree_paths=()
worktree_branches=()
worktree_locked=()
main_worktree=""
record_path=""
record_branch=""
record_locked=0

if ! git worktree list --porcelain -z >"$worktree_list_file"; then
  printf 'Failed to list worktrees\n' >&2
  exit 1
fi

# NUL-delimited parsing keeps destructive cleanup safe for every valid worktree path.
while IFS= read -r -d '' field; do
  if [[ -z "$field" ]]; then
    if [[ -n "$record_path" ]]; then
      worktree_paths+=("$record_path")
      worktree_branches+=("$record_branch")
      worktree_locked+=("$record_locked")
    fi
    record_path=""
    record_branch=""
    record_locked=0
  elif [[ "$field" == "worktree "* ]]; then
    record_path=${field#worktree }
    [[ -z "$main_worktree" ]] && main_worktree=$record_path
  elif [[ "$field" == "branch refs/heads/"* ]]; then
    record_branch=${field#branch refs/heads/}
  elif [[ "$field" == "locked" || "$field" == "locked "* ]]; then
    record_locked=1
  fi
done <"$worktree_list_file"

branch_is_checked_out() {
  local branch=$1
  local worktrees

  if ! worktrees=$(git worktree list --porcelain); then
    return 2
  fi

  grep -Fqx "branch refs/heads/$branch" <<<"$worktrees"
}

removed_worktrees=0
removed_branches=0
failed=0

for ((index = 0; index < ${#worktree_paths[@]}; index++)); do
  worktree=${worktree_paths[index]}
  branch=${worktree_branches[index]}

  if [[ "$worktree" == "$main_worktree" || "$worktree" == "$current_worktree" ]]; then
    continue
  fi

  if ((worktree_locked[index])); then
    printf 'Skipping locked worktree: %s\n' "$worktree" >&2
    continue
  fi

  if ! head_before=$(git -C "$worktree" rev-parse HEAD 2>/dev/null); then
    printf 'Skipping unreadable worktree: %s\n' "$worktree" >&2
    failed=1
    continue
  fi

  if cleanup_reason=$(find_cleanup_reason "$branch" "$head_before"); then
    :
  else
    reason_status=$?
    if ((reason_status == 2)); then
      printf 'Skipping worktree whose cleanup state could not be read: %s\n' "$worktree" >&2
      failed=1
    fi
    continue
  fi

  if ! worktree_status=$(git -C "$worktree" status --porcelain --untracked-files=all); then
    printf 'Skipping worktree whose status could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi

  if [[ -n "$worktree_status" ]]; then
    printf 'Skipping worktree with uncommitted changes: %s\n' "$worktree" >&2
    continue
  fi

  # Re-evaluation prevents a fetch or checkout during cleanup from invalidating the deletion reason.
  if [[ "$(git -C "$worktree" rev-parse HEAD)" != "$head_before" ]] ||
    ! confirmed_reason=$(find_cleanup_reason "$branch" "$head_before"); then
    printf 'Skipping worktree updated during cleanup: %s\n' "$worktree" >&2
    continue
  fi

  if git worktree remove -- "$worktree"; then
    printf 'Removed %s worktree: %s\n' "$confirmed_reason" "$worktree"
    removed_worktrees=$((removed_worktrees + 1))
  else
    printf 'Failed to remove %s worktree: %s\n' "$cleanup_reason" "$worktree" >&2
    failed=1
  fi
done

if ! git for-each-ref --format='%(refname:short)' refs/heads >"$branch_list_file"; then
  printf 'Failed to list local branches\n' >&2
  exit 1
fi

while IFS= read -r branch; do
  if [[ -z "$branch" || "$branch" == main ]]; then
    continue
  fi

  if branch_is_checked_out "$branch"; then
    continue
  elif (( $? == 2 )); then
    printf 'Failed to verify whether branch is checked out: %s\n' "$branch" >&2
    failed=1
    continue
  fi

  if ! expected_tip=$(git rev-parse "refs/heads/$branch" 2>/dev/null); then
    continue
  fi

  if cleanup_reason=$(find_cleanup_reason "$branch" "$expected_tip"); then
    :
  else
    reason_status=$?
    if ((reason_status == 2)); then
      printf 'Skipping branch whose cleanup state could not be read: %s\n' "$branch" >&2
      failed=1
    fi
    continue
  fi

  # Git's branch deletion preserves checked-out protection and removes branch-specific config.
  if branch_is_checked_out "$branch"; then
    printf 'Skipping branch checked out during cleanup: %s\n' "$branch" >&2
    continue
  elif (( $? == 2 )); then
    printf 'Failed to verify whether branch is checked out: %s\n' "$branch" >&2
    failed=1
    continue
  fi
  if [[ "$(git rev-parse "refs/heads/$branch")" != "$expected_tip" ]] ||
    ! confirmed_reason=$(find_cleanup_reason "$branch" "$expected_tip"); then
    printf 'Skipping branch updated during cleanup: %s\n' "$branch" >&2
    continue
  fi

  if git branch -D -- "$branch"; then
    printf 'Removed %s local branch: %s\n' "$confirmed_reason" "$branch"
    removed_branches=$((removed_branches + 1))
  else
    printf 'Failed to remove %s local branch: %s\n' "$cleanup_reason" "$branch" >&2
    failed=1
  fi
done <"$branch_list_file"

printf 'Removed %d worktree(s) and %d local branch(es)\n' "$removed_worktrees" "$removed_branches"

exit "$failed"
