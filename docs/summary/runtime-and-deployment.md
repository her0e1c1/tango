# Runtime And Deployment

## Local Development

| Command | Source | Purpose |
| --- | --- | --- |
| `cp .env.example .env` | `README.md`, `.env.example` | Vite/Firebase 用の環境変数を用意します。 |
| `npm install` | `README.md`, `package.json` | Node dependencies を install します。 |
| `npm run db` | `package.json` | `firebase emulators:start` を起動します。 |
| `npm start` | `package.json` | `vite dev` を起動します。 |
| `npm run storybook` | `package.json`, `.storybook/main.ts` | Storybook dev server を起動します。 |

開発時は `src/firebase.ts` が `import.meta.env.DEV` を見て Firestore emulator に接続します。接続先は `VITE_DB_HOST` と `VITE_DB_PORT` です。
ホスト実行では `.env`、Docker Compose 実行では `compose.yaml` の environment から接続先を渡します。

## Docker Compose

`compose.yaml` は通常の開発・テスト・e2e 用 service を定義し、`compose.e2e.yaml` は `app` service に e2e 用 env file だけを追加します。

| Service | Image / Build | Purpose |
| --- | --- | --- |
| `db` | `google/cloud-sdk` | `gcloud emulators firestore start` で Firestore emulator を起動します。 |
| `dev` | `ghcr.io/her0e1c1/tango`, build `Dockerfile` | Node/Vitest/開発コマンドの実行環境です。 |
| `app` | `ghcr.io/her0e1c1/tango`, build `Dockerfile` | Vite dev server を起動します。 |
| `browser` | `mcr.microsoft.com/playwright` | e2e 用の Playwright browser server です。 |

`Dockerfile` は `node:24-bookworm` を使い、BuildKit cache 付きの `npm ci` で dependencies を `/workspace/node_modules` にインストールします。`compose.yaml` では workspace の `node_modules` を named volume にして、ホスト側の `node_modules` mount を避けています。
Compose container の Firestore emulator 接続先は `compose.yaml` に明示し、e2e 固有の Firebase/Playwright 設定は `compose.e2e.yaml` 経由で `.env.e2e` から読みます。

## Build

`make build` は次を実行します。

1. `make -C sample build`: Python script で `sample/build/output.json` を生成します。
2. `vite build`: `build` directory に SPA を出力します。
3. `storybook build`: Storybook static build を実行します。

`vite.config.ts` は `build.outDir` を `build` に設定し、`__APP_VERSION__` に `npm_package_version` を埋め込みます。

## Firebase Hosting

`firebase.json` は Hosting の public directory を `build` に設定し、すべての path を `/index.html` に rewrite します。これにより React Router の SPA route が Hosting 上でも解決されます。

## GitHub Actions

| Workflow | Trigger | Actions |
| --- | --- | --- |
| `Test` | pull request, workflow dispatch, workflow call | checkout、GHCR login、必要に応じて Docker build、`make build`、`make fmt`、`make lint`、`make test` |
| `Deploy` | `main` push | `Test` workflow、Docker image 更新、Firebase Hosting と Firestore rules deploy |
| `Update Docker Image` | workflow dispatch, workflow call | `docker/build-push-action` で `ghcr.io/${{ github.actor }}/tango:latest` を push |

Deploy workflow は secrets から `VITE_PROJECT_ID`、`VITE_WEB_API_KEY`、`FIREBASE_TOKEN` を使います。secret values はこの summary には含めません。

## Sample Subproject

`sample/` は Python 3.13 のサブプロジェクトです。`sample/generate.py` は `test_*.py` を読み、区切り文字 `### __FRONT_TEXT_END__` で front/back text を分割して card JSON を作ります。生成物は React reducer の初期 sample deck に取り込まれます。
