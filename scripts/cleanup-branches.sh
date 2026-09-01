#!/usr/bin/env bash
set -euo pipefail

run_branch_delete_guard() {
  local state=${1:-}
  local old_oid=""
  local new_oid=""
  local ref_name=""
  local extra=""
  local unexpected=""
  local actual_tip

  case $state in
    preparing | prepared) ;;
    *) return 0 ;;
  esac

  : >"${CLEANUP_GUARD_INVOKED_MARKER:?}"
  if ! IFS=' ' read -r old_oid new_oid ref_name extra || IFS= read -r unexpected; then
    return 1
  fi
  if [[ -n "$extra" || "$ref_name" != "${CLEANUP_EXPECTED_REF:?}" ]] ||
    [[ -z "$new_oid" || "$new_oid" == *[!0]* ]]; then
    return 1
  fi

  if [[ "$state" == prepared ]]; then
    if ! actual_tip=$(git rev-parse --verify "$CLEANUP_EXPECTED_REF" 2>/dev/null) ||
      [[ "$actual_tip" != "${CLEANUP_EXPECTED_TIP:?}" ]]; then
      : >"${CLEANUP_REJECTED_MARKER:?}"
      return 1
    fi
  fi
}

if [[ ${CLEANUP_BRANCH_DELETE_GUARD:-} == 1 ]]; then
  run_branch_delete_guard "${1:-}"
  exit
fi

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

if ! current_time=$(date +%s); then
  printf 'Failed to read the current time\n' >&2
  exit 1
fi
case $current_time in
  '' | *[!0-9]*)
    printf 'Failed to read the current time\n' >&2
    exit 1
    ;;
esac
stale_cutoff=$((current_time - 7 * 24 * 60 * 60))

temp_dir=$(mktemp -d /tmp/cleanup-branches.XXXXXX)
remove_temp_dir() {
  rm -rf -- "$temp_dir"
}
trap remove_temp_dir EXIT

open_pr_file=$temp_dir/open-prs
worktree_list_file=$temp_dir/worktrees
branch_list_file=$temp_dir/branches
git_config_names_file=$temp_dir/git-config-names
branch_delete_error_file=$temp_dir/branch-delete-error
branch_delete_rejected_marker=$temp_dir/branch-delete-rejected
branch_delete_guard_invoked_marker=$temp_dir/branch-delete-guard-invoked
branch_delete_guard_path=$temp_dir/branch-delete-guard
branch_delete_guard_name=cleanup-branch-guard-$$-$RANDOM

if ! gh api --paginate 'repos/{owner}/{repo}/pulls?state=open&per_page=100' \
  --jq '.[] | [.head.ref, .head.sha] | @tsv' >"$open_pr_file"; then
  printf 'Failed to list open pull requests\n' >&2
  exit 1
fi

script_source=$0
if [[ "$script_source" != */* ]]; then
  if ! script_source=$(command -v "$script_source"); then
    printf 'Failed to locate the cleanup script\n' >&2
    exit 1
  fi
fi
script_directory=${script_source%/*}
script_name=${script_source##*/}
if ! script_directory=$(cd -- "$script_directory" && pwd -P); then
  printf 'Failed to locate the cleanup script\n' >&2
  exit 1
fi
if ! ln -s -- "$script_directory/$script_name" "$branch_delete_guard_path"; then
  printf 'Failed to prepare guarded branch deletion\n' >&2
  exit 1
fi

branch_delete_guard_supported=1
if ! git help --config >"$git_config_names_file" ||
  ! grep -Fqx 'hook.<friendly-name>.event' "$git_config_names_file"; then
  branch_delete_guard_supported=0
fi

branch_has_open_pr() {
  local branch=$1
  local pr_branch
  local pr_tip

  while IFS=$'\t' read -r pr_branch pr_tip; do
    [[ "$pr_branch" == "$branch" ]] && return 0
  done <"$open_pr_file"
  return 1
}

tip_has_open_pr() {
  local tip=$1
  local pr_branch
  local pr_tip

  while IFS=$'\t' read -r pr_branch pr_tip; do
    [[ "$pr_tip" == "$tip" ]] && return 0
  done <"$open_pr_file"
  return 1
}

commit_time() {
  local repository_path=$1
  local ref=$2
  local timestamp

  if ! timestamp=$(git -C "$repository_path" log -1 --format=%ct "$ref" 2>/dev/null); then
    return 1
  fi
  case $timestamp in
    '' | *[!0-9]*) return 1 ;;
  esac

  printf '%s\n' "$timestamp"
}

timestamp_is_stale() {
  local timestamp=$1

  ((timestamp <= stale_cutoff))
}

branch_is_checked_out() {
  local branch=$1
  local worktrees

  if ! worktrees=$(git worktree list --porcelain); then
    return 2
  fi

  grep -Fqx "branch refs/heads/$branch" <<<"$worktrees"
}

delete_branch_with_expected_tip() {
  local branch=$1
  local expected_tip=$2

  if ! rm -f -- "$branch_delete_error_file" "$branch_delete_rejected_marker" "$branch_delete_guard_invoked_marker"; then
    return 2
  fi
  if CLEANUP_BRANCH_DELETE_GUARD=1 \
    CLEANUP_EXPECTED_REF="refs/heads/$branch" \
    CLEANUP_EXPECTED_TIP="$expected_tip" \
    CLEANUP_REJECTED_MARKER="$branch_delete_rejected_marker" \
    CLEANUP_GUARD_INVOKED_MARKER="$branch_delete_guard_invoked_marker" \
    git \
      -c "hook.$branch_delete_guard_name.event=reference-transaction" \
      -c "hook.$branch_delete_guard_name.command=$branch_delete_guard_path" \
      branch -D -- "$branch" 2>"$branch_delete_error_file"; then
    [[ -f "$branch_delete_guard_invoked_marker" ]] || return 2
    return 0
  fi

  [[ -f "$branch_delete_rejected_marker" ]] && return 10
  return 2
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

removed_worktrees=0
removed_branches=0
failed=0

for ((index = 0; index < ${#worktree_paths[@]}; index++)); do
  worktree=${worktree_paths[index]}
  branch=${worktree_branches[index]}

  if [[ "$worktree" == "$main_worktree" || "$worktree" == "$current_worktree" || "$branch" == main ]]; then
    continue
  fi

  if ((worktree_locked[index])); then
    printf 'Skipping locked worktree: %s\n' "$worktree" >&2
    continue
  fi

  if ! head_before=$(git -C "$worktree" rev-parse HEAD 2>/dev/null) ||
    ! commit_time_before=$(commit_time "$worktree" HEAD); then
    printf 'Skipping unreadable worktree: %s\n' "$worktree" >&2
    failed=1
    continue
  fi

  if { [[ -n "$branch" ]] && branch_has_open_pr "$branch"; } ||
    { [[ -z "$branch" ]] && tip_has_open_pr "$head_before"; }; then
    printf 'Skipping worktree for open pull request: %s\n' "$worktree" >&2
    continue
  fi

  if ! timestamp_is_stale "$commit_time_before"; then
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

  # Recheck immediately before removal so a concurrent commit or file edit is preserved.
  if ! head_after=$(git -C "$worktree" rev-parse HEAD 2>/dev/null) ||
    ! commit_time_after=$(commit_time "$worktree" HEAD) ||
    ! worktree_status=$(git -C "$worktree" status --porcelain --untracked-files=all); then
    printf 'Skipping worktree whose cleanup state could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi
  if [[ "$head_after" != "$head_before" || -n "$worktree_status" ]] ||
    ! timestamp_is_stale "$commit_time_after"; then
    printf 'Skipping worktree updated during cleanup: %s\n' "$worktree" >&2
    continue
  fi

  if git worktree remove -- "$worktree"; then
    printf 'Removed stale worktree: %s\n' "$worktree"
    removed_worktrees=$((removed_worktrees + 1))
  else
    printf 'Failed to remove stale worktree: %s\n' "$worktree" >&2
    failed=1
  fi
done

if ((branch_delete_guard_supported == 0)); then
  printf 'Skipping local branch cleanup because Git does not support guarded branch deletion\n' >&2
  printf 'Removed %d worktree(s) and %d local branch(es)\n' "$removed_worktrees" "$removed_branches"
  exit 1
fi

if ! git for-each-ref --format='%(committerdate:unix)%09%(refname:lstrip=2)' refs/heads >"$branch_list_file"; then
  printf 'Failed to list local branches\n' >&2
  exit 1
fi

while IFS=$'\t' read -r branch_time branch; do
  if [[ -z "$branch" || "$branch" == main ]] || branch_has_open_pr "$branch"; then
    continue
  fi
  case $branch_time in
    '' | *[!0-9]*)
      printf 'Skipping branch whose commit time could not be read: %s\n' "$branch" >&2
      failed=1
      continue
      ;;
  esac
  if ! timestamp_is_stale "$branch_time"; then
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
    printf 'Skipping branch whose tip could not be read: %s\n' "$branch" >&2
    failed=1
    continue
  fi

  # Git branch deletion retains its checked-out protection and removes branch-specific config.
  if branch_is_checked_out "$branch"; then
    printf 'Skipping branch checked out during cleanup: %s\n' "$branch" >&2
    continue
  elif (( $? == 2 )); then
    printf 'Failed to verify whether branch is checked out: %s\n' "$branch" >&2
    failed=1
    continue
  fi
  if ! confirmed_tip=$(git rev-parse "refs/heads/$branch" 2>/dev/null) ||
    ! confirmed_time=$(commit_time "$current_worktree" "refs/heads/$branch"); then
    printf 'Skipping branch whose cleanup state could not be read: %s\n' "$branch" >&2
    failed=1
    continue
  fi
  if [[ "$confirmed_tip" != "$expected_tip" ]] || ! timestamp_is_stale "$confirmed_time"; then
    printf 'Skipping branch updated during cleanup: %s\n' "$branch" >&2
    continue
  fi

  if delete_branch_with_expected_tip "$branch" "$expected_tip"; then
    printf 'Removed stale local branch: %s\n' "$branch"
    removed_branches=$((removed_branches + 1))
  else
    delete_status=$?
    if ((delete_status == 10)); then
      printf 'Skipping branch updated during cleanup: %s\n' "$branch" >&2
    else
      if [[ -s "$branch_delete_error_file" ]]; then
        sed -n 'p' "$branch_delete_error_file" >&2
      fi
      printf 'Failed to remove stale local branch: %s\n' "$branch" >&2
      failed=1
    fi
  fi
done <"$branch_list_file"

printf 'Removed %d worktree(s) and %d local branch(es)\n' "$removed_worktrees" "$removed_branches"

exit "$failed"
