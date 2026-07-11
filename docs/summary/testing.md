# Testing

## Test Commands

| Command | Source | What It Runs |
| --- | --- | --- |
| `npm run test` | `package.json` | `vitest run --no-file-parallelism` |
| `make test` | `Makefile` | 通常 Vitest、Firestore specs、sample pytest |
| `make test` | `README.md`, `Makefile`, `.devcontainer/compose.yaml` | Firestore emulator 付きの Vitest |
| `make lint` | `Makefile` | `tsc` と ESLint |
| `make build` | `Makefile` | sample build、Vite build、Storybook build |

## Vitest Configuration

`vitest.config.ts` は `globals: true`、`environment: "jsdom"`、`vite-tsconfig-paths` plugin を設定しています。Firestore integration tests は `src/action/firestore/init.ts` で emulator に接続し、mock user token を使います。

## Test Suites

| Area | Files | Notes |
| --- | --- | --- |
| Action unit tests | `src/action/*.spec.ts` | deck/card/event/config actions。Firestore や file-saver などは mock される箇所があります。 |
| Firestore integration | `src/action/firestore/*.spec.ts` | Firestore emulator を使う deck/card tests と rule tests。 |
| Selectors | `src/selector/*.spec.ts` | deck/card selector の derived state を確認します。 |
| Component tests | `src/component/Organism/*.spec.tsx` | react-testing-library で form/controller/front text などを検証します。 |
| Storybook | `src/**/*.stories.tsx`, `.storybook/*` | component catalog と static build の対象です。 |
| Sample tests | `sample/test/**/*.py` | Python sample source の pytest。sample build 入力にもなります。 |

## Skipped Or Missing Tests Visible In Code

`rg` で確認できる skip は以下です。

- `src/action/firestore/event.spec.ts`: `describe.skip("firestore/event", ...)`
- `src/action/deck.spec.ts`: `it.skip("should parse file", ...)`
- `src/component/Organism/Controller.spec.tsx`: `describe.skip("Controller", ...)`
- `src/component/Organism/DeckStartForm.spec.tsx`: `describe.skip("DeckStartForm", ...)`
- `src/component/Organism/ConfigForm.spec.tsx`: `it.skip("should update cardInterval", ...)`
- `src/component/Organism/DeckForm.spec.tsx`: `it.skip("should update isPublic", ...)`

既存の `docs/test/missing-test-spec.md` は、`parseFile`、`spliteCreate` の deck 新規作成分岐、event subscribe/unsubscribe、config update の追加テストを優先候補として整理しています。

## Coverage Boundaries From Local Evidence

- Unit/integration/component/Firestore rules/sample tests は存在します。
- Browser E2E test framework は見当たりません。
- Coverage collection や threshold 設定は見当たりません。
- GitHub Actions は test だけでなく build、format、lint も PR で実行します。
