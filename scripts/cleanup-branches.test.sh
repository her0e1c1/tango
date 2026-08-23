#!/usr/bin/env bash
set -euo pipefail

fixture=$(mktemp -d "${TMPDIR:-/tmp}/cleanup-branches-test.XXXXXX")
trap 'rm -rf "$fixture"' EXIT

repo="$fixture/repo"
clean_worktree="$fixture/clean worktree"
dirty_worktree="$fixture/dirty-worktree"
locked_worktree="$fixture/locked-worktree"
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

git init -q -b main "$repo"
git -C "$repo" config user.email test@example.com
git -C "$repo" config user.name Test
printf '.env\n' >"$repo/.gitignore"
printf 'initial\n' >"$repo/tracked.txt"
git -C "$repo" add .gitignore tracked.txt
git -C "$repo" commit -q -m init

for branch in closed-local closed-clean closed-dirty closed-locked; do
  git -C "$repo" branch "$branch"
done

git -C "$repo" worktree add -q "$clean_worktree" closed-clean
git -C "$repo" worktree add -q "$dirty_worktree" closed-dirty
git -C "$repo" worktree add -q "$locked_worktree" closed-locked
printf 'local secret\n' >"$clean_worktree/.env"
printf 'changed\n' >>"$dirty_worktree/tracked.txt"
git -C "$repo" worktree lock --reason test "$locked_worktree"

gh() {
  printf '%s\n' closed-local closed-clean closed-dirty closed-locked main missing-branch
}
export -f gh

(
  cd "$repo"
  bash "$script_dir/cleanup-branches.sh"
)

for branch in closed-local closed-clean; do
  if git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; then
    printf 'Expected branch to be deleted: %s\n' "$branch" >&2
    exit 1
  fi
done

for branch in closed-dirty closed-locked main; do
  if ! git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; then
    printf 'Expected branch to be preserved: %s\n' "$branch" >&2
    exit 1
  fi
done

if [[ ! -f "$clean_worktree/.env" ]]; then
  printf 'Expected ignored file to be preserved: %s\n' "$clean_worktree/.env" >&2
  exit 1
fi

if git -C "$clean_worktree" symbolic-ref --quiet HEAD >/dev/null; then
  printf 'Expected clean worktree to be detached: %s\n' "$clean_worktree" >&2
  exit 1
fi

if [[ "$(git -C "$dirty_worktree" symbolic-ref --short HEAD)" != "closed-dirty" ]]; then
  printf 'Expected dirty worktree to remain on its branch\n' >&2
  exit 1
fi

if [[ "$(git -C "$locked_worktree" symbolic-ref --short HEAD)" != "closed-locked" ]]; then
  printf 'Expected locked worktree to remain on its branch\n' >&2
  exit 1
fi

printf 'cleanup-branches behavior test passed\n'
