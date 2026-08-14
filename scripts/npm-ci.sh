#!/usr/bin/env bash
set -euo pipefail

log_file=$(mktemp)
trap 'rm -f "$log_file"' EXIT

npm ci 2>&1 | tee "$log_file"

if grep -Eiq '(^|[[:space:]])(npm[[:space:]]+)?warn(ing)?([[:space:]]|$)' "$log_file"; then
  echo "npm ci emitted warnings." >&2
  exit 1
fi
