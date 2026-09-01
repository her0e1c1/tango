#!/usr/bin/env bash
set -euo pipefail

run_branch_delete_guard() {
  local transaction_state=${1:-}
  local expected_ref=${CLEANUP_EXPECTED_REF:?}
  local expected_tip=${CLEANUP_EXPECTED_TIP:?}
  local rejected_marker=${CLEANUP_REJECTED_MARKER:?}
  local invoked_marker=${CLEANUP_GUARD_INVOKED_MARKER:?}
  local old_oid=""
  local new_oid=""
  local ref_name=""
  local extra=""
  local unexpected=""
  local actual_tip

  case $transaction_state in
    preparing | prepared) ;;
    *) return 0 ;;
  esac

  if ! : >"$invoked_marker"; then
    printf 'Failed to record branch deletion guard state\n' >&2
    return 1
  fi

  if ! IFS=' ' read -r old_oid new_oid ref_name extra || IFS= read -r unexpected; then
    printf 'Unexpected branch deletion transaction for %s\n' "$expected_ref" >&2
    return 1
  fi
  if [[ -n "$extra" || "$ref_name" != "$expected_ref" ]] ||
    [[ ${#old_oid} -ne ${#expected_tip} || ${#new_oid} -ne ${#expected_tip} ]]; then
    printf 'Unexpected branch deletion transaction for %s\n' "$expected_ref" >&2
    return 1
  fi
  case $old_oid in
    '' | *[!0]*)
      printf 'Unexpected branch deletion transaction for %s\n' "$expected_ref" >&2
      return 1
      ;;
  esac
  case $new_oid in
    '' | *[!0]*)
      printf 'Unexpected branch deletion transaction for %s\n' "$expected_ref" >&2
      return 1
      ;;
  esac

  if [[ "$transaction_state" == prepared ]]; then
    if ! actual_tip=$(git rev-parse --verify "$expected_ref" 2>/dev/null) || [[ "$actual_tip" != "$expected_tip" ]]; then
      if ! : >"$rejected_marker"; then
        printf 'Failed to record a concurrent branch update for %s\n' "$expected_ref" >&2
      fi
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

stale_after_seconds=$((7 * 24 * 60 * 60))
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
stale_cutoff=$((current_time - stale_after_seconds))

temp_dir=$(mktemp -d /tmp/cleanup-branches.XXXXXX)
remove_temp_dir() {
  rm -rf -- "$temp_dir"
}
trap remove_temp_dir EXIT

worktree_list_file=$temp_dir/worktrees
branch_list_file=$temp_dir/branches
checkout_activity_file=$temp_dir/checkout-activity
live_checkout_activity_file=$temp_dir/live-checkout-activity
checkout_worktree_list_file=$temp_dir/checkout-worktrees
head_reflog_file=$temp_dir/head-reflog
git_config_names_file=$temp_dir/git-config-names
branch_delete_error_file=$temp_dir/branch-delete-error
branch_delete_rejected_marker=$temp_dir/branch-delete-rejected
branch_delete_guard_invoked_marker=$temp_dir/branch-delete-guard-invoked
branch_delete_guard_path=$temp_dir/branch-delete-guard
branch_delete_guard_name=cleanup-branch-guard-$$-$RANDOM
: >"$live_checkout_activity_file"

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
script_path=$script_directory/$script_name
if [[ ! -x "$script_path" ]] || ! ln -s -- "$script_path" "$branch_delete_guard_path"; then
  printf 'Failed to prepare the branch deletion guard\n' >&2
  exit 1
fi

branch_delete_guard_supported=1
if ! git help --config >"$git_config_names_file" ||
  ! grep -Fqx 'hook.<friendly-name>.event' "$git_config_names_file"; then
  branch_delete_guard_supported=0
fi

# Reflog time records local ref movement, unlike a commit date that may predate a newly created branch.
reflog_selector_timestamp() {
  local selector=$1
  local timestamp

  timestamp=${selector##*@\{}
  if [[ "$timestamp" == "$selector" || "$timestamp" != *\} ]]; then
    return 1
  fi
  timestamp=${timestamp%\}}
  case $timestamp in
    '' | *[!0-9]*) return 1 ;;
  esac

  printf '%s\n' "$timestamp"
}

last_reflog_update() {
  local repository_path=$1
  local ref=$2
  local selector

  if ! selector=$(git -C "$repository_path" reflog show -1 --date=unix --format='%gD' "$ref" 2>/dev/null); then
    return 1
  fi

  reflog_selector_timestamp "$selector"
}

reflog_metadata_timestamp() {
  local metadata=$1
  local without_timezone
  local timestamp

  without_timezone=${metadata% *}
  if [[ "$without_timezone" == "$metadata" ]]; then
    return 1
  fi
  timestamp=${without_timezone##* }
  case $timestamp in
    '' | *[!0-9]*) return 1 ;;
  esac

  printf '%s\n' "$timestamp"
}

worktree_head_log_path() {
  local worktree=$1
  local head_log

  if ! head_log=$(git -C "$worktree" rev-parse --path-format=absolute --git-path logs/HEAD 2>/dev/null); then
    return 1
  fi
  if [[ -z "$head_log" || ! -f "$head_log" || ! -r "$head_log" || ! -s "$head_log" ]]; then
    return 1
  fi

  printf '%s\n' "$head_log"
}

worktree_head_last_update() {
  local worktree=$1
  local head_log
  local last_entry
  local metadata

  if ! head_log=$(worktree_head_log_path "$worktree") || ! last_entry=$(tail -n 1 -- "$head_log"); then
    return 1
  fi
  metadata=${last_entry%%$'\t'*}

  reflog_metadata_timestamp "$metadata"
}

append_worktree_checkout_activity() {
  local worktree=$1
  local output_file=$2
  local head_log
  local metadata
  local subject
  local timestamp
  local transition
  local checkout_from
  local checkout_to

  if ! head_log=$(worktree_head_log_path "$worktree") || ! cp -- "$head_log" "$head_reflog_file"; then
    printf 'Failed to read worktree checkout history: %s\n' "$worktree" >&2
    return 1
  fi

  while IFS=$'\t' read -r metadata subject; do
    case $subject in
      checkout:\ moving\ from\ *\ to\ *)
        if ! timestamp=$(reflog_metadata_timestamp "$metadata"); then
          printf 'Failed to read worktree checkout history: %s\n' "$worktree" >&2
          return 1
        fi
        transition=${subject#checkout: moving from }
        checkout_from=${transition%% to *}
        checkout_to=${transition#* to }
        if [[ -n "$checkout_from" ]] && ! printf '%s\t%s\n' "$timestamp" "$checkout_from" >>"$output_file"; then
          printf 'Failed to record worktree checkout history: %s\n' "$worktree" >&2
          return 1
        fi
        if [[ -n "$checkout_to" ]] && ! printf '%s\t%s\n' "$timestamp" "$checkout_to" >>"$output_file"; then
          printf 'Failed to record worktree checkout history: %s\n' "$worktree" >&2
          return 1
        fi
        ;;
    esac
  done <"$head_reflog_file"
}

snapshot_checkout_activity() {
  local output_file=$1
  local field
  local record_path=""
  local snapshot_failed=0

  if ! : >"$output_file"; then
    printf 'Failed to prepare worktree checkout history\n' >&2
    return 1
  fi
  if ! git worktree list --porcelain -z >"$checkout_worktree_list_file"; then
    printf 'Failed to list worktrees while reading checkout history\n' >&2
    return 1
  fi

  while IFS= read -r -d '' field; do
    if [[ -z "$field" ]]; then
      if [[ -n "$record_path" ]] && ! append_worktree_checkout_activity "$record_path" "$output_file"; then
        snapshot_failed=1
      fi
      record_path=""
    elif [[ "$field" == "worktree "* ]]; then
      record_path=${field#worktree }
    fi
  done <"$checkout_worktree_list_file"

  if [[ -n "$record_path" ]] && ! append_worktree_checkout_activity "$record_path" "$output_file"; then
    snapshot_failed=1
  fi

  ((snapshot_failed == 0))
}

branch_last_update() {
  local branch=$1
  local branch_timestamp
  local checkout_timestamp
  local checkout_branch

  if ! branch_timestamp=$(last_reflog_update "$current_worktree" "refs/heads/$branch"); then
    return 1
  fi

  while IFS=$'\t' read -r checkout_timestamp checkout_branch; do
    if [[ "$checkout_branch" == "$branch" ]] && ((checkout_timestamp > branch_timestamp)); then
      branch_timestamp=$checkout_timestamp
    fi
  done <"$checkout_activity_file"
  while IFS=$'\t' read -r checkout_timestamp checkout_branch; do
    if [[ "$checkout_branch" == "$branch" ]] && ((checkout_timestamp > branch_timestamp)); then
      branch_timestamp=$checkout_timestamp
    fi
  done <"$live_checkout_activity_file"

  printf '%s\n' "$branch_timestamp"
}

worktree_last_update() {
  local worktree=$1
  local branch=$2
  local head_timestamp
  local branch_timestamp

  if ! head_timestamp=$(worktree_head_last_update "$worktree"); then
    return 1
  fi

  # A recent checkout only updates the worktree HEAD, while a branch update may not touch that HEAD log.
  if [[ -n "$branch" ]]; then
    if ! branch_timestamp=$(last_reflog_update "$current_worktree" "refs/heads/$branch"); then
      return 1
    fi
    if ((branch_timestamp > head_timestamp)); then
      head_timestamp=$branch_timestamp
    fi
  fi

  printf '%s\n' "$head_timestamp"
}

timestamp_is_stale() {
  local timestamp=$1

  ((timestamp <= stale_cutoff))
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
checkout_activity_complete=1

# Checkout does not move a branch ref, so preserve HEAD history before removing worktrees that own it.
if ! snapshot_checkout_activity "$checkout_activity_file"; then
  checkout_activity_complete=0
  failed=1
fi

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
    printf 'Failed to prepare guarded branch deletion: %s\n' "$branch" >&2
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
    if [[ ! -f "$branch_delete_guard_invoked_marker" ]]; then
      printf 'Branch deletion guard did not run for %s\n' "$branch" >"$branch_delete_error_file"
      return 2
    fi
    return 0
  fi

  if [[ -f "$branch_delete_rejected_marker" ]]; then
    return 10
  fi
  return 2
}

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

  if ! head_before=$(git -C "$worktree" rev-parse HEAD 2>/dev/null); then
    printf 'Skipping unreadable worktree: %s\n' "$worktree" >&2
    failed=1
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

  if ! last_update=$(worktree_last_update "$worktree" "$branch"); then
    printf 'Skipping worktree whose reflog state could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi

  if ! timestamp_is_stale "$last_update"; then
    continue
  fi

  # Re-evaluation prevents a checkout, reset, or file edit during cleanup from becoming stale deletion.
  if ! head_after=$(git -C "$worktree" rev-parse HEAD 2>/dev/null); then
    printf 'Skipping worktree whose cleanup state could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi
  if ! worktree_status=$(git -C "$worktree" status --porcelain --untracked-files=all); then
    printf 'Skipping worktree whose status could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi
  if [[ -n "$worktree_status" ]]; then
    printf 'Skipping worktree updated during cleanup: %s\n' "$worktree" >&2
    continue
  fi
  if ! confirmed_last_update=$(worktree_last_update "$worktree" "$branch"); then
    printf 'Skipping worktree whose reflog state could not be read: %s\n' "$worktree" >&2
    failed=1
    continue
  fi
  if [[ "$head_after" != "$head_before" ]] || ! timestamp_is_stale "$confirmed_last_update"; then
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

if ((checkout_activity_complete)) && ! snapshot_checkout_activity "$live_checkout_activity_file"; then
  checkout_activity_complete=0
  failed=1
fi

if ((checkout_activity_complete && branch_delete_guard_supported)); then
  if ! git for-each-ref --format='%(refname:lstrip=2)' refs/heads >"$branch_list_file"; then
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
      printf 'Skipping branch whose tip could not be read: %s\n' "$branch" >&2
      failed=1
      continue
    fi

    if ! last_update=$(branch_last_update "$branch"); then
      printf 'Skipping branch whose reflog state could not be read: %s\n' "$branch" >&2
      failed=1
      continue
    fi

    if ! timestamp_is_stale "$last_update"; then
      continue
    fi

    if ! snapshot_checkout_activity "$live_checkout_activity_file"; then
      printf 'Skipping remaining local branches because checkout history could not be refreshed\n' >&2
      checkout_activity_complete=0
      failed=1
      break
    fi

    # The transaction guard checks the expected tip after Git locks the ref. This preserves branch
    # porcelain's checked-out protection and config cleanup without deleting a concurrently updated tip.
    if branch_is_checked_out "$branch"; then
      printf 'Skipping branch checked out during cleanup: %s\n' "$branch" >&2
      continue
    elif (( $? == 2 )); then
      printf 'Failed to verify whether branch is checked out: %s\n' "$branch" >&2
      failed=1
      continue
    fi
    if ! confirmed_tip=$(git rev-parse "refs/heads/$branch" 2>/dev/null); then
      printf 'Skipping branch whose cleanup state could not be read: %s\n' "$branch" >&2
      failed=1
      continue
    fi
    if ! confirmed_last_update=$(branch_last_update "$branch"); then
      printf 'Skipping branch whose reflog state could not be read: %s\n' "$branch" >&2
      failed=1
      continue
    fi
    if [[ "$confirmed_tip" != "$expected_tip" ]] || ! timestamp_is_stale "$confirmed_last_update"; then
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
      elif branch_is_checked_out "$branch"; then
        printf 'Skipping branch checked out during cleanup: %s\n' "$branch" >&2
      elif (( $? == 2 )); then
        printf 'Failed to verify whether branch is checked out: %s\n' "$branch" >&2
        failed=1
      else
        if [[ -s "$branch_delete_error_file" ]]; then
          sed -n 'p' "$branch_delete_error_file" >&2
        fi
        printf 'Failed to remove stale local branch: %s\n' "$branch" >&2
        failed=1
      fi
    fi
  done <"$branch_list_file"
elif ((checkout_activity_complete == 0)); then
  printf 'Skipping local branch cleanup because worktree checkout history could not be read\n' >&2
  if ((failed == 0)); then
    failed=1
  fi
else
  printf 'Skipping local branch cleanup because Git does not support guarded branch deletion\n' >&2
  failed=1
fi

printf 'Removed %d worktree(s) and %d local branch(es)\n' "$removed_worktrees" "$removed_branches"

exit "$failed"
