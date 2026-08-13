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
and study progress. They do not require a Firebase project or emulator. Storybook initializes Mock Service Worker (MSW)
globally, serves `public/mockServiceWorker.js`, and provides a mocked CSV response for the fixture deck's reimport URL.
Additional network states can be defined per story with `beforeEach(({ msw }) => msw.use(...handlers))`.

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

The test task starts the Firestore emulator and runs the application and sample test suites:

```bash
mise run test
# You can also pass a specified file
mise run test-unit -- ./src/entities/card/model/card.spec.ts
```

Run a specific suite with:

```bash
mise run test-unit
mise run test-integration
mise run test-sample
```

### Vitest Coverage

Run every TypeScript and React spec, including the Firestore emulator specs, in one Vitest invocation:

```bash
mise run coverage
```

Coverage includes `src/**/*.{ts,tsx}`, including files that no test imports. Specs, stories, declaration files,
and `src/storybook/**` are excluded. The committed global thresholds are 86% statements, 78% branches,
85% functions, and 92% lines. When the full-suite result improves, raise the relevant integer threshold manually
in `vitest.config.ts`; do not auto-update thresholds.

The terminal summary, HTML report, LCOV data, and JSON summary are written to `coverage/`. Open
`coverage/index.html` for details after a failure. These percentages cover Vitest only: sample Python tests use
pytest, and browser behavior is tested separately with Playwright.

### E2E Test

Playwright is used for browser-level smoke tests. `mise run e2e` starts the official Playwright Docker image as a
remote browser server, starts a healthy Vite dev server service from the project image, and runs the tests
against it.

```bash
mise run e2e
```

For interactive debugging, run:

```bash
npx playwright install chromium
npm run e2e:ui
```

The initial E2E suite seeds local browser storage and does not require a real Firebase project or emulator.

## Get Firebase Token

get a new token if old one expired

```bash
npx firebase login:ci
```

paste the new token here
https://github.com/her0e1c1/tango/settings/secrets/actions
