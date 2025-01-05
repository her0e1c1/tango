# Tango

## Demo

You can access to the demo page here: https://tango-ts.web.app

Please note that any data uploaded to database are to be **deleted** without noticing.

## Development

### Setup for development

```bash
cp .env.example .env
```

### Install Packages

```bash
npm install
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
docker compose run test
# You can also pass a specified file
docker compose run test ./src/action/xxx.spec.ts
```

If you use local emulator, run these commands

```bash
npm run test  # without firestore
npm run test:db
npm run test:rule  # test for firestore rules
```

## Get Firebase Token

get a new token if old one expired

```bash
npx firebase login:ci
```

paste the new token here
https://github.com/her0e1c1/tango/settings/secrets/actions
