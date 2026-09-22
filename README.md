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
[Firestore integration test specifications](./docs/integration/firestore/README.md).

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

### E2E Test

Playwright runs the browser-level acceptance suite documented in `docs/e2e/`. `mise run e2e` starts isolated
Firestore and Firebase Auth emulators, a healthy Vite dev server from the project image, and the official Playwright
Docker image as a remote browser server before running the complete suite. The tests use emulator-backed remote data,
local-only browser data, offline cache behavior, and the Auth emulator's local identity-provider flow; they do not
connect to a real Firebase project or external identity provider.

```bash
mise run e2e
```

`npm run e2e:ui` only opens Playwright's UI and does not start the required app and emulators. Use the
compose-backed `mise run e2e` task for the acceptance suite. Failed local runs retain screenshots under
`test-results/`; CI also writes an HTML report and captures a trace on the first retry.

Each test and retry uses isolated identifiers and storage, so the suite can run fully in parallel locally. CI runs the
same acceptance suite with its configured worker and retry limits.

### Card study state cutover (#1702)

This release resets personal scheduling. It does not migrate, backfill, or recover legacy progress, including valid
`Card.studySchedule` values. Cards without `cardStudyState` are unrated; only a new rating creates their state.

Before reopening the application for this release:

1. Stop old clients and writes during the maintenance window.
2. Remove `difficulty`, `numberOfSeen`, `firstSeenAt`, `lastSeenAt`, `nextSeeingAt`, `interval`, and `studySchedule`
   from every Firestore `card` document, including cards in public decks. Do not copy these values into the new
   collection. Remove obsolete `difficultyMin` and `difficultyMax` from saved deck filters as well.
3. Deploy the content-only Card rules, private `cardStudyState` rules, and matching application together. Verify
   that public Card reads expose no personal study fields and old clients cannot write those fields back.
4. Clear the incompatible Firestore IndexedDB cache and old pending writes on affected clients before reopening
   them. This intentionally discards local-only legacy progress and any unsynchronized edits; communicate that
   impact before the cutover. Do not reset caches on ordinary application startup.

The repository change does not execute production cleanup or deploy rules. The operator must complete and verify
the maintenance steps before release. Session and answer history is retained; it is not replayed into new state.

State cleanup uses deterministic IDs for a deleted Card and the known Card/State IDs for a deleted Deck, so an
uncached State for a known Card is still deleted. A Deck deletion from an incomplete offline cache cannot enumerate
children absent from both snapshots; this release does not add a server synchronization barrier or orphan sweep.
Such orphan states are never study candidates without an active Card.
