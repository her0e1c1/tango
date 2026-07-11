# Configuration

## Environment Variables

`.env.example`、`.env.e2e`、`compose.yaml`、`compose.e2e.yaml` と `src/vite-env.d.ts` から確認できる環境変数です。

| Name | Source | Used By | Purpose / Requiredness |
| --- | --- | --- | --- |
| `VITE_PROJECT_ID` | `.env.example`, `.env.e2e`, GitHub secrets | `src/firebase.ts` | Firebase project id。production Firebase へ接続する場合は必要です。 |
| `VITE_WEB_API_KEY` | `.env.example`, `.env.e2e`, GitHub secrets | `src/firebase.ts` | Firebase web API key。production Firebase へ接続する場合は必要です。 |
| `VITE_DB_HOST` | `.env.example`, `compose.yaml` | `src/firebase.ts`, compose services, tests | Firestore emulator host。ホスト実行では `localhost`、compose 内では `db` を使います。 |
| `VITE_DB_PORT` | `.env.example`, `compose.yaml` | `src/firebase.ts`, compose services, tests | Firestore emulator port。既定値は `8080` です。 |
| `PLAYWRIGHT_BASE_URL` | `.env.e2e` | `playwright.config.ts` | compose e2e で app service を参照する URL です。 |
| `PW_TEST_CONNECT_WS_ENDPOINT` | `.env.e2e` | Playwright | compose e2e で browser service の Playwright server に接続する URL です。 |

`.env.example` はホスト上での Vite/Firebase 実行用、`compose.yaml` は compose container に渡す Firestore emulator 接続先、`.env.e2e` と `compose.e2e.yaml` は e2e 固有の Firebase/Playwright 設定です。

## Build-Time Constants

| Name | Source | Purpose |
| --- | --- | --- |
| `__APP_VERSION__` | `vite.config.ts`, `vitest.config.ts` | `package.json` の version を Config 画面に表示します。 |

## Firebase Config

`src/firebase.ts` は `VITE_PROJECT_ID` と `VITE_WEB_API_KEY` から Firebase app を初期化します。

- `authDomain`: `${projectId}.firebaseapp.com`
- `databaseURL`: `https://${projectId}.firebaseio.com`
- `storageBucket`: `${projectId}.appspot.com`

開発時のみ `connectFirestoreEmulator()` を呼びます。

## Redux ConfigState

`src/store/reducer.ts` と `src/vite-env.d.ts` で定義され、`redux-persist` により LocalStorage に保存されます。

| Group | Fields | Notes |
| --- | --- | --- |
| Layout | `showHeader`, `showSwipeButtonList`, `showSwipeFeedback`, `fullscreen`, `darkMode` | Config 画面や Header から変更されます。 |
| Study behavior | `shuffled`, `maxNumberOfCardsToLearn`, `hideBodyWhenCardChanged`, `showBackText`, `keepBackTextViewed`, `autoPlay`, `defaultAutoPlay`, `cardInterval`, `useCardInterval` | 学習開始・カード表示・自動再生・カード interval filter に影響します。 |
| Swipe mapping | `cardSwipeUp`, `cardSwipeDown`, `cardSwipeLeft`, `cardSwipeRight`, `lastSwipe` | `src/action/deck.ts` の `swipe()` が読みます。 |
| Auth / sync | `uid`, `isAnonymous`, `displayName`, `lastUpdatedAt`, `localMode` | Firebase Auth と Firestore snapshot 同期に使われます。 |
| Import / metadata | `githubAccessToken`, `loadSample`, `selectedTags` | GitHub raw fetch の Authorization、初期 sample load などに使われます。 |
| Display tuning | `showScoreSlider`, `sizeBackText` | 型と reducer default に存在します。UI で使われている範囲は限定的です。 |

## Security Rules

`firestore.rules` は `deck` と `card` collection の read/create/update/delete を制御します。

- deck は owner または public deck を read できます。
- deck create/update は request auth uid と document uid の一致を要求します。
- card create/update は card owner の検証に加えて、参照先 deck の owner が request auth uid と一致することを要求します。

## GitHub Actions Secrets

Deploy workflow は以下の secrets を参照します。

- `VITE_PROJECT_ID`
- `VITE_WEB_API_KEY`
- `FIREBASE_TOKEN`

値は repository に含まれていないため、この summary では名前のみ扱います。
