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
