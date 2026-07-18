<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">
    <img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">
  </picture>
</h1>

## Demo

You can access to the page for **demo** here: https://tango-ts.web.app

Demo data is stored in Firestore and may be **deleted** without notice.

## Development

### Setup for development

```bash
make init
```

This runs the `.env`, `image`, and `npm-install` Makefile targets. It creates `.env` from `.env.example` if it does
not already exist, builds the development container image, and installs npm packages into the container volume used by
the Makefile targets.

To start the development containers configured by Compose:

```bash
make up
```

If you want to run the app directly on your host machine instead of through Docker, install the local toolchain and
packages:

```bash
mise install
npm ci
```

### Start Server

```bash
npm run db  # setup for firestore in local
npm start  # start react web app
```

You can go to web UI and see data in firestore: http://localhost:4000/

## Test

Some test cases need firestore as backend, so easy to test in docker container.

```bash
make test
# You can also pass a specified file
docker compose run --rm --entrypoint npm dev run test -- ./src/action/xxx.spec.ts
```

If you use local emulator, run these commands

```bash
npm run test  # need to start firestore before running
make test     # test in docker
```

### Vitest Coverage

Run every TypeScript and React spec, including the Firestore emulator specs, in one Vitest invocation:

```bash
mise run coverage
# Or run the same coverage command in Docker
env -u COMPOSE_FILE make coverage
```

Coverage includes `src/**/*.{ts,tsx}`, including files that no test imports. Specs, stories, declaration files,
and `src/shared/storybook/**` are excluded. The committed global thresholds are 86% statements, 78% branches,
85% functions, and 92% lines. When the full-suite result improves, raise the relevant integer threshold manually
in `vitest.config.ts`; do not auto-update thresholds.

The terminal summary, HTML report, LCOV data, and JSON summary are written to `coverage/`. Open
`coverage/index.html` for details after a failure. These percentages cover Vitest only: sample Python tests use
pytest, and browser behavior is tested separately with Playwright.

### E2E Test

Playwright is used for browser-level smoke tests. `make e2e` starts the official Playwright Docker image as a
remote browser server, starts a healthy Vite dev server service from the project image, and runs the tests
against it.

```bash
make e2e
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
