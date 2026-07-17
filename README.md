<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">
    <img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">
  </picture>
</h1>

## Demo

You can access to the page for **demo** here: https://tango-ts.web.app

Please keep using `localMode`. (note that any data uploaded to database are to be **deleted** without noticing)

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
