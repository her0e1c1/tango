# Testing

## Test Commands

| Command | Source | What It Runs |
| --- | --- | --- |
| `npm run test` | `package.json` | `vitest run --no-file-parallelism` |
| `make test` | `Makefile` | 通常 Vitest、Firestore specs、sample pytest |
| `make test` | `README.md`, `Makefile`, `.devcontainer/compose.yaml` | Firestore emulator 付きの Vitest |
| `make lint` | `Makefile` | `tsc` と Biome |
| `make build` | `Makefile` | sample build、Vite build、Storybook build |

実際の設定は `biome.json`、`tsconfig.base.json` と各 project の `tsconfig`、`package.json` と lockfile を source of truth とします。この文書は policy と理由を説明するもので、これらの設定を変更するときは同時に更新します。

## TypeScript Coverage And Policy

`npm run lint:tsc` は `tsconfig.json` と `tsconfig.node.json` のそれぞれに対して `tsc --noEmit` を実行します。`tsconfig.json` は `src`、`tsconfig.node.json` は root の config、`.storybook`、`e2e` を担当します。TypeScript file の対象範囲は各 config の標準的な `include`、`exclude`、project references などで管理します。

共通の `tsconfig.base.json` は `strict` に加え、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noImplicitReturns`、`noUncheckedIndexedAccess`、`noUncheckedSideEffectImports`、`noUnusedLocals`、`noUnusedParameters`、`verbatimModuleSyntax` の 8 flags を有効にしています。`skipLibCheck` は有効のままにし、application code の厳格さを維持しつつ外部 declaration file の互換性問題で CI を不安定にしない方針です。内部 import alias は `@/*` で、`src/*` を指します。

## Biome Policy

Biome は pin した version と stable な `recommended` preset を基準にし、`project`、`react`、`test` domains も `recommended` で有効にしています。加えて、project の契約として stable rules を明示設定しています。今回強化したものは `noUndeclaredDependencies`、`noUnusedFunctionParameters`、`noUnusedImports`、`noNonNullAssertion`、`useExportType`、`useImportType`、`noDeprecatedImports`、`noExplicitAny`、`noImportCycles` です。`noUndeclaredDependencies` は runtime dependency と development-only file の dependency 境界を検証し、spec、story、E2E、Storybook、config file では devDependencies を許可します。

Type-aware lint は `noFloatingPromises`、`noMisusedPromises`、`useAwaitThenable`、`useExhaustiveSwitchCases`、`noUnnecessaryConditions` の 5 rules だけを選択して error にします。`nursery: all` は使いません。Biome upgrade 時は version を意図的に更新し、schema、stable preset、include glob、各 rule の stable / nursery / deprecated status を再監査してから、必要な migration と code change を同じ upgrade として扱います。

Suppression は原則 0 件です。検証済みの false positive だけに、対象を最小化した suppression、理由、tracking issue を付けて認めます。file 全体を抑制する `biome-ignore-all` と unsafe な bulk fix は使いません。`biome.json` で互換性や重複を理由に rule を意図的に `off` にすることは、code 上の suppression とは区別します。

## Router Navigation Invariant

現在は宣言的な `BrowserRouter` を使っているため、`void navigate(...)` の各 call site は同期的な navigation mode に依存しています。`RouterProvider` / Data Router へ移行する場合は `navigate` が Promise を返し得るため、すべての `void navigate(...)` call site を監査し、error handling と待機の要否を見直す必要があります。

## Vitest Configuration

`vitest.config.ts` は `globals: true`、`environment: "jsdom"`、`vite-tsconfig-paths` plugin を設定しています。Firestore integration tests は `src/action/firestore/init.ts` で emulator に接続し、mock user token を使います。

## Test Suites

| Area | Files | Notes |
| --- | --- | --- |
| Action unit tests | `src/action/*.spec.ts` | deck/card/event/config actions。Firestore や file-saver などは mock される箇所があります。 |
| Firestore integration | `src/action/firestore/*.spec.ts` | Firestore emulator を使う deck/card tests と rule tests。 |
| Feature container tests | `src/features/*/containers/*.spec.tsx` | route/store data の接続と template への props/slot 配線を `@testing-library/react` で検証します。 |
| Feature hook tests | `src/features/*/hooks/*.spec.tsx` | form/UI state、Redux/router/Zustand 接続などの hook behavior を `@testing-library/react` で検証します。 |
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
