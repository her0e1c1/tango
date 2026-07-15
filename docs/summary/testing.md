# Testing

## Test Commands

| Command | Source | What It Runs |
| --- | --- | --- |
| `npm run test` | `package.json` | `vitest run --no-file-parallelism` |
| `make test` | `Makefile` | 通常 Vitest、Firestore specs、sample pytest |
| `make test` | `README.md`, `Makefile`, `.devcontainer/compose.yaml` | Firestore emulator 付きの Vitest |
| `make lint` | `Makefile` | `tsc` と Biome |
| `make build` | `Makefile` | sample build、Vite build、Storybook build |

## Vitest Configuration

`vitest.config.ts` は `globals: true`、`environment: "jsdom"`、`vite-tsconfig-paths` plugin を設定しています。Firestore integration tests は `src/action/firestore/init.ts` で emulator に接続し、mock user token を使います。

## Test Suites

| Area | Files | Notes |
| --- | --- | --- |
| Action unit tests | `src/action/*.spec.ts` | deck/card/event/config actions。Firestore や file-saver などは mock される箇所があります。 |
| Firestore integration | `src/action/firestore/*.spec.ts` | Firestore emulator を使う deck/card tests と rule tests。 |
| Selectors | `src/selector/*.spec.ts` | deck/card selector の derived state を確認します。 |
| Feature container tests | `src/features/*/containers/*.spec.tsx` | state/form hook、Redux/router 接続、template への props/slot 配線を react-testing-library で検証します。 |
| Presentation tests | `src/features/*/components/**/*.spec.tsx` | stateless component の rendering と callback を検証します。 |
| Architecture tests | `src/lib/componentArchitecture.spec.ts` | Page/Container/Template/Component と feature/shared の依存境界を検証します。 |
| Storybook | `src/{features,shared}/**/*.stories.tsx`, `.storybook/*` | component/template catalog と static build の対象です。 |
| Browser E2E | `e2e/*.e2e.ts` | Playwright で smoke、deck/card、swipe の主要導線を検証します。 |
| Sample tests | `sample/test/**/*.py` | Python sample source の pytest。sample build 入力にもなります。 |

## Skipped Or Missing Tests Visible In Code

`rg` で確認できる skip は以下です。

- `src/action/firestore/event.spec.ts`: `describe.skip("firestore/event", ...)`
- `src/action/deck.spec.ts`: `it.skip("should parse file", ...)`

Controller、deck filter、config form の旧 skip は解消され、対応する specs は feature 配下で実行されます。既存の `docs/test/missing-test-spec.md` は、`parseFile`、`spliteCreate` の deck 新規作成分岐、event subscribe/unsubscribe、config update の追加テストを優先候補として整理しています。

## Coverage Boundaries From Local Evidence

- Unit/integration/component/Firestore rules/sample tests は存在します。
- Playwright の browser E2E tests は `e2e` 配下にあります。
- Coverage collection や threshold 設定は見当たりません。
- ローカルの `make check` と GitHub Actions の PR CI は、いずれも format と lint を検証します。PR CI は test と build も実行します。
