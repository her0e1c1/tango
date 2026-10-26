<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">
    <img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">
  </picture>
</h1>

## Demo

You can access to the page for **demo** here: https://tango-ts.web.app

Demo data is stored in Firestore and may be **deleted** without notice.

## Storybook

Browse the latest Storybook at https://her0e1c1.github.io/tango/. Updates are published automatically from `main`.

Run Storybook locally with:

```bash
mise run storybook
```

The `Page` stories render every application route with deterministic authentication, remote collections, configuration,
and study progress. They do not require a Firebase project or emulator.

## Development

### Setup for development

```bash
mise install
mise run init
```

This installs the pinned Node.js and npm versions, creates `.env` from `.env.example` if it does not already exist,
and installs npm packages.

### Start Server

```bash
mise run dev
```

You can go to web UI and see data in firestore: http://localhost:4000/

## Test

The test task runs the application unit tests and sample Python tests:

```bash
mise run test
# You can also pass a specified file
mise run test-unit -- ./src/entities/card/model/card.spec.ts
```

Run a specific suite with the commands below. The integration task starts the Firestore emulator automatically:

```bash
mise run test-unit
mise run test-integration
mise run test-sample
```

Firestore persistence, subscription, and security-rule contracts and case IDs are documented in the
[Firestore integration test specifications](./docs/test/integration/firestore/README.md).

### Vitest Coverage

Run the TypeScript and React unit specs in one Vitest invocation:

```bash
mise run coverage
```

Coverage includes `src/**/*.{ts,tsx}`, including files that no test imports. Specs, stories, and declaration files
are excluded. The committed global thresholds are 86% statements, 78% branches,
85% functions, and 92% lines. When the full-suite result improves, raise the relevant integer threshold manually
in `vitest.config.ts`; do not auto-update thresholds.

The terminal summary, HTML report, LCOV data, and JSON summary are written to `coverage/`. Open
`coverage/index.html` for details after a failure. These percentages cover Vitest only: sample Python tests use
pytest, and browser behavior is tested separately with Playwright.

### Mutation Testing

[StrykerJS](https://stryker-mutator.io/docs/stryker-js/) changes application code and checks whether the existing
Vitest unit tests detect each change:

```bash
mise run test-mutation
# Reuse a previous local report.
mise run test-mutation -- --incremental
```

Mutation testing uses the unit suite and covers application TypeScript files, excluding specs, stories, and
declarations. It runs separately from `mise run check`. Scores below 80% are reported without failing the command
(`thresholds.break: 0`). Actions emits a warning below 80%; execution and configuration errors still fail.

The **Mutation testing** workflow runs only by manual dispatch on `main`. It forces a full run and saves a baseline.
The **PR mutation testing** workflow uses StrykerJS's standard [incremental mode](https://stryker-mutator.io/docs/stryker-js/incremental/).
It restores only a retained baseline from a successful manual `main` run at the PR's exact base SHA. Without that
baseline, or without application/unit-test file changes, it skips with a reason before installing dependencies.
PR reports are saved for inspection and never used as trusted baselines. Both workflows use read-only permissions
and do not persist checkout credentials.

Incremental mode reuses previous mutant results and detects code/test changes; it is not a strict changed-line
selection and still needs the initial unit-test run. Dependency, configuration, and environment changes are not
automatically detected; refresh the baseline manually when needed. A local incremental run without a report starts
a full run. HTML, JSON, and incremental reports live under the Git-ignored `coverage/mutation/` and are saved in
Actions artifacts.

### E2E Test

Playwright runs the browser-level acceptance suite documented in `docs/test/e2e/`. `mise run e2e` starts isolated
Firestore and Firebase Auth emulators, a healthy Vite dev server from the project image, and the official Playwright
Docker image as a remote browser server before running the complete suite. The tests use emulator-backed remote data,
local-only browser data, offline cache behavior, and the Auth emulator's local identity-provider flow; they do not
connect to a real Firebase project or external identity provider.

```bash
mise run e2e
```

`npm run e2e:ui` only opens Playwright's UI and does not start the required app and emulators. Use the
compose-backed `mise run e2e` task for the acceptance suite. Failed local runs retain screenshots under
`test-results/`. PR CI writes an HTML report and captures a trace on the first retry. Trusted `main` CI records
traces for every attempt, including tests passing the first time, and retains the complete `playwright-report`
Actions artifact (HTML, attachments, and traces) using the repository's default retention period,
for both main and PR runs.

To inspect a main-like run privately, explicitly record successful attempts and open the standard HTML report:

```bash
CI=true PLAYWRIGHT_MAIN_TRACE=true mise run e2e
npx playwright show-report playwright-report --host 127.0.0.1
```

The report opens individual traces in the browser without downloading a report ZIP. Keep generated reports private
until their contents and attachments have been reviewed; this opt-in does not enable Pages publication.

The existing Storybook Pages workflow runs E2E once for its source SHA and selects that run's exact artifact ID.
After verification, it copies the complete standard HTML report under
[`e2e/`](https://her0e1c1.github.io/tango/e2e/), preserving attachments and trace-viewer assets alongside Storybook at
the site root. Failed tests keep their artifacts and red CI status; unsuccessful, missing, or unverified reports are
excluded while Storybook delivery continues. Stale deployment candidates are skipped. Test/build jobs have no production
credentials, and one combined Pages artifact is deployed.

**Public E2E publication is currently disabled** by `E2E_PUBLICATION_VERIFIED: "false"` in the Pages workflow;
Storybook continues to publish without `e2e/`. The summary reports exclusions and never links an old report. Before
enabling it, inspect generated DOM snapshots, screenshots, request/response headers and bodies, and attachments for
test-only data, measure trace overhead and combined size, and check report/trace viewing under `/tango/e2e/` in a browser.
Real tokens, sessions, secrets, and personal data must never be published.

CI checks the generated HTML list, a test detail, and any recorded trace in an isolated browser before stopping the
E2E services. It compares counts and trace bytes with that run's JSON report, blocks external requests, and saves no
verification screenshots or traces. Successful PR runs can have no traces; main requires them. A separate fixed-DOM
fixture then exercises the trace-viewer checks even on trace-free PRs, with its own report and results under
`test-results/report-fixture/`; it does not validate the real main trace payload. These checks verify browser display,
not the safety of recorded content, and do not enable publication.

**Pages keeps only the latest published snapshot**, replaced on the next eligible publication. Artifact history uses
the repository's default retention period; expiring Actions artifacts does not remove an idle Pages snapshot. The build summary
records the source SHA, publication run, and any report candidate URL; the deployment job confirms publication.

Each test and retry uses isolated identifiers and storage, so the suite can run fully in parallel locally. CI runs the
same acceptance suite with its configured worker and retry limits.

### Card FSRS

`Card.fsrs` is the sole scheduling state. New and copied Cards start at `null`; content edits and update imports
preserve it. Ratings partially update only `fsrs` and `updatedAt`. Card, Answer, and Session progress are saved
independently; successful writes remain even if another write fails. Session creation and restart use a batch.
`createdAt` remains Card creation time; `updatedAt` is the last document update, including ratings.
The last rating time remains `fsrs.lastReviewedAt`. Content comparison in imports uses editable fields, and
Card ordering uses creation time or FSRS deadlines, so a rating is not treated as a content edit.

**Anyone allowed to read a public Card can also read its FSRS, including review timestamps and difficulty.**
UI visibility is not access control. Private Cards remain private; FSRS writes require the Card and Deck owner.
Rules validate the outer Card shape and nullable FSRS map; the application validates all FSRS fields and ranges.
Malformed or missing FSRS fails parsing instead of becoming an unrated Card. Card/Deck tombstones hide the Card
and its embedded state together; physically removing a Card cannot leave a separate state document.
