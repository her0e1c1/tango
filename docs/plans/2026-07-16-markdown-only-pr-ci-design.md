# Markdown-Only Pull Request CI Design

## Goal

Keep the existing `Test` workflow and job identity while replacing full CI with
a lightweight Markdownlint check only when a pull request changes Markdown
files exclusively.

## Decision

Use the checked-out Git repository to classify the complete pull request diff.
Do not add a community change-detection or Markdownlint Action. A shell step
will compare the pull request base and head commits, and a version-pinned
`markdownlint-cli2` command will perform the Markdown check.

This keeps the workflow dependency surface small and avoids adding a community
Action. It is preferred over splitting the workflow into multiple jobs because
the existing `Test` check identity remains unambiguous, and over a GitHub API
script because the required base and head commits are already available to the
workflow.

## Workflow Structure

The existing `test` job remains named `Test`. Checkout fetches enough history
to compare `${{ github.event.pull_request.base.sha }}` and
`${{ github.event.pull_request.head.sha }}` for pull request events.

A pull-request-only shell step writes the complete, NUL-delimited three-dot Git
diff to a temporary file before classifying each path. It exposes two Boolean
outputs:

- `markdown_changed`: at least one changed path ends in `.md`.
- `markdown_only`: at least one Markdown path changed and no changed path is
  outside `*.md`.

The temporary file makes a failed `git diff` fail the detection step before any
classification output is trusted. NUL delimiters preserve unusual file names.

Full CI steps run when the event is not a pull request, detection failed, or
`markdown_only` is not true. This preserves full CI for code-only and mixed pull
requests, manual runs, and reusable workflow calls. Docker setup, application
CI, E2E tests, and Playwright artifact upload all share that condition.

The Markdown check runs when detection succeeded and `markdown_changed` is
true. Its condition uses `!cancelled()` so a mixed pull request still runs the
Markdown check if full CI fails first, but a cancelled job does not continue.

## Markdownlint

Add a repository configuration that disables Markdownlint defaults and enables
only these whitespace rules:

- `MD009`: trailing spaces, with no hard-break exception.
- `MD010`: hard tabs.
- `MD012`: repeated blank lines.
- `MD047`: exactly one final newline.

Use GitHub's official Node setup Action, pinned to an immutable commit, only
when Markdown changed. Run an exact `markdownlint-cli2` package version through
the CLI against all `**/*.md` files. Linting all Markdown files avoids passing
untrusted file names from a pull request into a command line and establishes a
consistent repository baseline.

## Failure Handling

Change detection uses `continue-on-error` so a detection failure cannot skip
full CI. After full CI and any eligible Markdown check finish, a `!cancelled()`
guarded step fails the existing `Test` job if detection failed, but does not run
after cancellation.

A Markdownlint failure fails `Test` directly. A full CI failure remains a job
failure even when the later Markdown check succeeds. Artifact upload continues
to use `always()`, but only for executions where full CI was selected.

## Verification

Verify the workflow and configuration with:

- Classification checks covering Markdown-only, code-only, mixed, empty, and
  diff-failure cases.
- Markdownlint against the repository's current Markdown files.
- Workflow syntax validation.
- The repository-required `make check` command.

The pull request will be opened ready for review and will close issue #247.
