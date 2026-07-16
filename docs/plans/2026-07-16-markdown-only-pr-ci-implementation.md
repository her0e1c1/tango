# Markdown-Only Pull Request CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing `Test` check while running only Markdownlint for Markdown-only pull requests and retaining full CI everywhere else.

**Architecture:** A small Bash classifier will inspect the complete pull request diff with NUL-delimited, rename-disabled Git output. The existing single `Test` job will consume its Boolean outputs to select full CI and/or a version-pinned Markdownlint CLI; detection failure will select full CI and then fail the job.

**Tech Stack:** GitHub Actions, Bash, Git, Node.js 24.15.0, markdownlint-cli2 0.23.0

---

**Design reference:** `docs/plans/2026-07-16-markdown-only-pr-ci-design.md`

## File Map

- Create `.markdownlint.jsonc`: enable only the four approved whitespace rules.
- Create `.github/scripts/classify-markdown-diff.sh`: classify a base/head Git diff without depending on a community Action.
- Modify `.github/workflows/test.yml`: consume classifier outputs and conditionally run Markdownlint or full CI inside the existing `Test` job.
- Modify `docs/test-spec.md`: remove the existing MD009 trailing-space violation required for the new baseline.

### Task 1: Add the minimal Markdownlint configuration

**Files:**

- Create: `.markdownlint.jsonc`

- [ ] **Step 1: Verify the approved configuration is absent**

Run `test -f .markdownlint.jsonc`.

Expected: exit code `1`.

- [ ] **Step 2: Add only the approved whitespace rules**

Create `.markdownlint.jsonc`:

```jsonc
{
  "default": false,
  "MD009": {
    "br_spaces": 0
  },
  "MD010": true,
  "MD012": true,
  "MD047": true
}
```

Do not enable heading, line-length, list, link, table, or prose rules.

- [ ] **Step 3: Verify each invalid whitespace form fails**

Run each command separately:

```bash
printf '# Trailing space \n' | npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc -
printf '# Hard\ttab\n' | npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc -
printf '# Repeated blanks\n\n\nText\n' | npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc -
printf '# Missing final newline' | npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc -
```

Expected: each command exits `1` and reports `MD009`, `MD010`, `MD012`, and `MD047`, respectively.

- [ ] **Step 4: Verify the current Markdown baseline**

Run:

```bash
npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc "**/*.md" "#node_modules"
```

Expected initially: one `MD009` violation at `docs/test-spec.md:5`. Remove only those two trailing spaces, rerun the command, and expect exit code `0` with `0 error(s)`. If any other existing file fails, change only violations of the four approved rules.

- [ ] **Step 5: Commit the configuration**

```bash
git add .markdownlint.jsonc docs/test-spec.md
git commit -m "Add basic Markdown formatting checks"
```

### Task 2: Add and test the native Git classifier

**Files:**

- Create: `.github/scripts/classify-markdown-diff.sh`

- [ ] **Step 1: Verify the classifier is absent**

Run `test -f .github/scripts/classify-markdown-diff.sh`.

Expected: exit code `1`.

- [ ] **Step 2: Add the classifier**

Create `.github/scripts/classify-markdown-diff.sh` and make it executable:

```bash
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
```

Run `chmod +x .github/scripts/classify-markdown-diff.sh`.

The temporary diff file guarantees that Git failure occurs before outputs are emitted. `--no-renames` classifies both old and new paths, so a non-Markdown-to-Markdown rename cannot incorrectly select Markdown-only CI.

- [ ] **Step 3: Execute the classification matrix**

Run this temporary-repository test from the worktree root:

```bash
set -euo pipefail

script="$PWD/.github/scripts/classify-markdown-diff.sh"
repo=$(mktemp -d)
trap 'rm -rf "${repo}"' EXIT

git -C "${repo}" init -q
git -C "${repo}" config user.name Test
git -C "${repo}" config user.email test@example.com
printf '# Base\n' > "${repo}/README.md"
printf 'base\n' > "${repo}/app.ts"
git -C "${repo}" add README.md app.ts
git -C "${repo}" commit -qm base
base=$(git -C "${repo}" rev-parse HEAD)

printf '# Markdown\n' > "${repo}/README.md"
git -C "${repo}" commit -qam markdown
markdown=$(git -C "${repo}" rev-parse HEAD)

printf 'code\n' > "${repo}/app.ts"
git -C "${repo}" commit -qam code
code=$(git -C "${repo}" rev-parse HEAD)

printf '# Mixed\n' > "${repo}/README.md"
printf 'mixed\n' > "${repo}/app.ts"
git -C "${repo}" commit -qam mixed
mixed=$(git -C "${repo}" rev-parse HEAD)

assert_case() {
  output=$(cd "${repo}" && RUNNER_TEMP="${repo}" "${script}" "$1" "$2")
  grep -qx "markdown_changed=$3" <<< "${output}"
  grep -qx "markdown_only=$4" <<< "${output}"
}

assert_case "${base}" "${markdown}" true true
assert_case "${markdown}" "${code}" false false
assert_case "${code}" "${mixed}" true false
assert_case "${mixed}" "${mixed}" false false

git -C "${repo}" mv app.ts app.md
git -C "${repo}" commit -qm rename
rename=$(git -C "${repo}" rev-parse HEAD)
assert_case "${mixed}" "${rename}" true false

if (cd "${repo}" && RUNNER_TEMP="${repo}" "${script}" invalid "${rename}"); then
  echo "expected invalid base to fail" >&2
  exit 1
fi
```

Expected: exit code `0`. The cases cover Markdown-only, code-only, mixed, empty, non-Markdown-to-Markdown rename, and diff failure.

- [ ] **Step 4: Check and commit the classifier**

```bash
bash -n .github/scripts/classify-markdown-diff.sh
git diff --check
git add .github/scripts/classify-markdown-diff.sh
git commit -m "Classify Markdown pull request changes"
```

Expected: syntax and whitespace checks pass; one commit adds the executable classifier.

### Task 3: Gate full CI inside the existing Test job

**Files:**

- Modify: `.github/workflows/test.yml:18-55`

- [ ] **Step 1: Verify the workflow does not consume classifier outputs yet**

Run:

```bash
rg -n "markdown_changed|markdown_only|classify-markdown-diff" .github/workflows/test.yml
```

Expected: exit code `1` with no matches.

- [ ] **Step 2: Replace the existing steps with the conditional flow**

Keep the workflow name, triggers, environment, job id, and `name: Test` unchanged. Replace `jobs.test.steps` with:

```yaml
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Detect Markdown-only pull request
        id: changes
        if: ${{ github.event_name == 'pull_request' }}
        continue-on-error: true
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: .github/scripts/classify-markdown-diff.sh "${BASE_SHA}" "${HEAD_SHA}" >> "${GITHUB_OUTPUT}"

      - name: Log into registry
        if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        uses: docker/setup-buildx-action@v4

      - name: Build test image
        if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        uses: docker/build-push-action@v7
        with:
          context: .
          load: true
          tags: ghcr.io/her0e1c1/tango:latest
          cache-from: type=gha,scope=tango-test
          cache-to: type=gha,mode=max,scope=tango-test

      - if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        uses: jdx/mise-action@v4

      - if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        run: mise run ci

      # mise sets COMPOSE_FILE for local development; make ci needs the Makefile defaults.
      - if: ${{ github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true' }}
        run: env -u COMPOSE_FILE make ci

      - name: Set up Node for Markdownlint
        id: markdown-node
        if: ${{ !cancelled() && github.event_name == 'pull_request' && steps.changes.outcome == 'success' && steps.changes.outputs.markdown_changed == 'true' }}
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 24.15.0
          package-manager-cache: false

      - name: Check Markdown formatting
        if: ${{ !cancelled() && github.event_name == 'pull_request' && steps.changes.outcome == 'success' && steps.changes.outputs.markdown_changed == 'true' && steps.markdown-node.outcome == 'success' }}
        run: npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc "**/*.md" "#node_modules"

      - name: Fail when change detection fails
        if: ${{ !cancelled() && github.event_name == 'pull_request' && steps.changes.outcome == 'failure' }}
        run: exit 1

      - name: Upload Playwright report
        if: ${{ always() && (github.event_name != 'pull_request' || steps.changes.outcome != 'success' || steps.changes.outputs.markdown_only != 'true') }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          if-no-files-found: ignore
```

`continue-on-error` lets every full-CI predicate treat detection failure as a safe fallback. The later failure step restores the failed `Test` result. The Markdown steps use `!cancelled()` so they still run for a mixed pull request after an earlier full-CI failure; lint also requires successful Node setup.

- [ ] **Step 3: Parse and inspect the workflow**

Run:

```bash
ruby -e 'require "yaml"; YAML.parse_file(".github/workflows/test.yml")'
rg -n "fetch-depth|classify-markdown-diff|markdown_changed|markdown_only|continue-on-error|steps.changes.outcome|markdownlint-cli2|Fail when|Upload Playwright" .github/workflows/test.yml
```

Expected: YAML parsing succeeds; one PR-only detection step; every Docker/application step guarded by the full-CI condition; Markdown setup and lint guarded by successful detection and Markdown presence; one detection-failure step; artifact upload guarded by the full-CI decision.

- [ ] **Step 4: Verify the decision matrix**

Confirm the conditions line by line:

| Event / diff | `markdown_changed` | `markdown_only` | Markdownlint | Full CI |
| --- | --- | --- | --- | --- |
| Markdown-only PR | `true` | `true` | run | skip |
| code-only PR | `false` | `false` | skip | run |
| mixed PR | `true` | `false` | run | run |
| empty PR diff | `false` | `false` | skip | run |
| `workflow_dispatch` | step skipped | unavailable | skip | run |
| `workflow_call` | step skipped | unavailable | skip | run |
| detection failure | unavailable | unavailable | skip | run, then fail `Test` |

- [ ] **Step 5: Check and commit the workflow patch**

Run:

```bash
git diff --check
git diff -- .github/workflows/test.yml
```

Expected: no changes to triggers, `jobs.test`, or `name: Test`; no workflow-level path filter; no community change-detection or Markdownlint Action.

Commit:

```bash
git add .github/workflows/test.yml
git commit -m "Skip full CI for Markdown-only pull requests"
```

### Task 4: Run final verification and publish

**Files:**

- Verify: `.markdownlint.jsonc`
- Verify: `.github/scripts/classify-markdown-diff.sh`
- Verify: `.github/workflows/test.yml`
- Verify: `docs/test-spec.md`
- Verify: `docs/plans/2026-07-16-markdown-only-pr-ci-design.md`
- Verify: `docs/plans/2026-07-16-markdown-only-pr-ci-implementation.md`

- [ ] **Step 1: Re-run focused checks**

Run the Task 2 classification matrix again, then:

```bash
bash -n .github/scripts/classify-markdown-diff.sh
npx --yes markdownlint-cli2@0.23.0 --config .markdownlint.jsonc "**/*.md" "#node_modules"
ruby -e 'require "yaml"; YAML.parse_file(".github/workflows/test.yml")'
git diff --check origin/main...HEAD
```

Expected: all commands exit `0`; Markdownlint reports `0 error(s)`.

- [ ] **Step 2: Run the repository-required check**

Run `make check`.

Expected: exit code `0`; sample build, formatting, lint, TypeScript checks, and unit tests pass.

- [ ] **Step 3: Review the complete branch**

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- .github/workflows/test.yml .github/scripts/classify-markdown-diff.sh .markdownlint.jsonc docs/test-spec.md docs/plans
```

Expected: a clean worktree and only the approved classifier, configuration, workflow, design, and plan changes.

- [ ] **Step 4: Push and create a ready-for-review pull request**

Push `codex/issue-247-markdown-only-ci` and create a non-draft pull request targeting `main` with an English title and description. Include `Closes #247`, summarize the native Git classification and Markdownlint behavior, and report verification commands.

- [ ] **Step 5: Verify the implementation pull request checks**

This implementation PR is mixed because it changes workflow/script/configuration files and Markdown plans. Confirm the visible check remains named `Test`, full CI runs, and Markdownlint runs. Report any GitHub-only failure rather than weakening the safe fallback.
