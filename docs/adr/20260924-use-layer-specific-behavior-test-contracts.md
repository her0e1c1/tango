# テスト層ごとの振る舞いを仕様化し、Test ID で対応付ける

Status: Accepted

## Decision

`docs/test` を振る舞いの仕様の置き場とし、対象の公開境界で観測できる状態・操作・結果を Given / When / Then で記述する。内部の実装構造やカバレッジの不足だけからケースを増やさない。

- 利用者の操作は E2E、保存・購読・認可は Firestore、UI の契約は Storybook の仕様に置く。明示的に設けた Store・FSRS の単体仕様を使い、専用仕様のない単体・結合テストは E2E 仕様を参照する。
- 仕様と実装は Test ID で対応付ける。仕様書にテストファイル・関数名・Story export の対応表を持たせない。正常系・異常系の区分は、カテゴリや検証結果と分ける。
- E2E は仕様書と同名のテストファイルを一対一にする。ケースとテストは一対一に限定せず、同じ仕様書内で複数のテストや ID を対応付けてよい。
- 実行方法・共通前提・検証境界は各階層の `AGENTS.md` に集約し、`README.md` はケース索引とする。ケース本文に実装手順を持ち込まない。
- 未実装ケースは見出しの ID 直後に `[TODO]` を付け、対応テストを実装したら外す。`done` などの状態欄や、参照チェックを通すだけの空・skip テストは作らない。
- `lint:test-specs` は E2E・Firestore・Storybook の ID 参照を調べる簡易チェックとする。AST 解析や厳密な対応検証には広げず、参照の存在や `[TODO]` の不在を、実行・assertion・合格の証拠としない。

## Context

[E2E 仕様を全テストの基準にする旧方針](./20260830-treat-documented-e2e-cases-as-the-test-contract.md)だけでは、保存・認可・UI 固有の契約を適切な境界で記述しにくい。層ごとに仕様を分け、実装の配置変更で仕様まで書き直さずに済むよう Test ID を共通の接点にする。仕様の追加と、検証済みの振る舞いは区別する。

関連PR: [#1713](https://github.com/her0e1c1/tango/pull/1713)、[#1740](https://github.com/her0e1c1/tango/pull/1740)、[#1747](https://github.com/her0e1c1/tango/pull/1747)、[#1749](https://github.com/her0e1c1/tango/pull/1749)、[#1755](https://github.com/her0e1c1/tango/pull/1755)、[#1756](https://github.com/her0e1c1/tango/pull/1756)、[#1765](https://github.com/her0e1c1/tango/pull/1765)、[#1767](https://github.com/her0e1c1/tango/pull/1767)、[#1771](https://github.com/her0e1c1/tango/pull/1771)
