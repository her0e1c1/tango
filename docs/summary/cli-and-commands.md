# CLI And Commands

## npm Scripts

| Command | Source | Purpose |
| --- | --- | --- |
| `npm start` | `package.json` | `vite dev` を起動します。 |
| `npm run build` | `package.json` | `vite build` を実行します。 |
| `npm run db` | `package.json` | Firebase emulator を起動します。 |
| `npm run test` | `package.json` | `vitest run --no-file-parallelism` を実行します。Firestore emulator は別途必要です。 |
| `npm run storybook` | `package.json` | Storybook dev server を起動します。 |
| `npm run build-storybook` | `package.json` | Storybook static build を実行します。 |

## Make Targets

| Target | Source | Purpose |
| --- | --- | --- |
| `make test` | `Makefile` | 通常 Vitest、Firestore specs、sample pytest を順に実行します。 |
| `make fmt` | `Makefile` | Prettier、ESLint fix、sample ruff format を実行します。 |
| `make lint` | `Makefile` | TypeScript compile check と ESLint を実行します。 |
| `make build` | `Makefile` | sample build、Vite build、Storybook build を実行します。 |
| `make image` | `Makefile` | `docker compose build base` を実行します。 |
| `make log` | `Makefile` | `docker compose logs -f db` を実行します。 |
| `make start` | `Makefile` | Firebase emulator、Storybook、Vite dev server を並行起動します。 |

`common.mk` は `docker compose run --rm --remove-orphans` を共通化し、`make npx ARG="..."` のような実行形式を提供します。

## Docker Compose Commands

| Command | Purpose |
| --- | --- |
| `docker compose run test` | Firestore emulator healthcheck 後に Vitest を実行します。README では特定 spec file を渡せる例も示されています。 |
| `docker compose build base` | Node 実行 image を build します。 |
| `docker compose logs -f db` | Firestore emulator logs を追跡します。 |

## Firebase Commands

| Command | Source | Purpose |
| --- | --- | --- |
| `npx firebase login:ci` | `README.md` | CI deploy 用 token を取得します。 |
| `npx firebase deploy --token ... --only hosting,firestore:rules` | `.github/workflows/deploy.yml` | Firebase Hosting と Firestore rules を deploy します。 |

## Sample Commands

| Command | Source | Purpose |
| --- | --- | --- |
| `make -C sample build` | `sample/Makefile` | `python generate.py ./test -o build/output.json` を Docker 経由で実行します。 |
| `make -C sample test` | `sample/Makefile` | sample 側 pytest を実行します。 |
| `make -C sample fmt` | `sample/Makefile` | ruff format を実行します。 |
