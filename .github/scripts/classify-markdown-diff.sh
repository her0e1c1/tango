#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 2 ]]; then
  echo "usage: $0 BASE_SHA HEAD_SHA" >&2
  exit 2
fi

changed_files=$(mktemp "${RUNNER_TEMP:-/tmp}/changed-files.XXXXXX")
trap 'rm -f "${changed_files}"' EXIT

# Disable rename detection so both sides of a rename are classified.
git diff --no-renames --name-only -z "$1...$2" > "${changed_files}"

markdown_changed=false
non_markdown_changed=false
while IFS= read -r -d '' file; do
  case "${file}" in
    *.md) markdown_changed=true ;;
    *) non_markdown_changed=true ;;
  esac
done < "${changed_files}"

markdown_only=false
if [[ "${markdown_changed}" == "true" && "${non_markdown_changed}" == "false" ]]; then
  markdown_only=true
fi

printf 'markdown_changed=%s\n' "${markdown_changed}"
printf 'markdown_only=%s\n' "${markdown_only}"
