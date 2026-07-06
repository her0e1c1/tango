# Repository Overview

このドキュメントは 2026-06-12 時点のリポジトリ内容から作成した snapshot です。

## 目的

Tango は、デッキとカードを管理し、スワイプ UI で学習する React/Vite 製の Web アプリです。初期状態では `localMode` が有効で、Redux state と `redux-persist` による LocalStorage 保存を中心に動きます。`localMode` を無効にし、Google ログインした場合は Firebase Auth と Firestore を使って `deck` / `card` データを同期します。

## 主要構成

| 領域 | 主なファイル | 役割 |
| --- | --- | --- |
| エントリポイント | `src/main.tsx`, `src/App.tsx` | React root、Redux Provider、PersistGate、BrowserRouter、画面ルーティング |
| 画面 | `src/page/*` | ルートごとの container。selector で状態を読み、hook 経由で action を呼ぶ |
| UI | `src/component/{Template,Organism,Molecule,Atom}` | 画面テンプレート、フォーム、カード表示、入力部品、Storybook stories |
| 状態管理 | `src/store/*`, `src/selector/*` | Redux reducer、永続化設定、deck/card/config の参照ロジック |
| 操作ロジック | `src/action/*` | deck/card/config/event の thunk、CSV import/export、学習スワイプ処理 |
| Firestore 境界 | `src/action/firestore/*`, `firestore.rules` | Firestore CRUD、snapshot 購読、セキュリティルール、テスト用初期化 |
| Firebase 初期化 | `src/firebase.ts`, `.env.example` | Firebase app 初期化、開発時 Firestore emulator 接続 |
| sample 生成 | `sample/*` | Python テストファイルから初期カード JSON を生成し、`sample/build/output.json` をアプリ初期データに使う |
| 実行・CI | `package.json`, `Makefile`, `docker-compose.yml`, `.github/workflows/*` | dev server、build、lint、test、Firebase Hosting deploy、Docker image 更新 |

## 実行形態

- ローカル開発は `npm run db` で Firestore emulator、`npm start` で Vite dev server を起動する形です。
- Docker Compose では `db` service が Firestore emulator、`base` / `test` service が Node/Vitest 実行環境を提供します。
- 本番配信は `vite build` の出力先 `build` を Firebase Hosting に deploy する構成です。
- `firebase.json` は SPA fallback として全パスを `/index.html` に rewrite します。

## 開発ワークフロー

- `npm install` 後、`.env.example` を `.env` にコピーして環境変数を用意します。
- `npm start` は Vite dev server、`npm run db` は Firebase emulator、`npm run storybook` は Storybook を起動します。
- `make build` は sample 生成、Vite build、Storybook build を実行します。
- `make test` は通常の Vitest、Firestore integration test、sample 側 pytest を順に実行します。
- GitHub Actions の `Test` workflow は `make build`、`make fmt`、`make lint`、`make test` を実行します。

## 意図的に省略したもの

- HTTP API server は見当たらないため、OpenAPI 仕様は生成していません。
- 明示的な event topic、message broker、webhook contract は見当たらないため、AsyncAPI は生成していません。
- schema migration や RDBMS schema は見当たらないため、ER は Firestore collection と TypeScript 型に限定しています。
