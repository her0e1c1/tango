# テスト対象の境界ごとに振る舞いを仕様化する

Status: Accepted

[すべてのテストを E2E 仕様に結び付ける決定](./20260830-treat-documented-e2e-cases-as-the-test-contract.md)を置き換える。

## Decision

期待する振る舞いを `docs/test` に先に記述し、その境界の公開操作と観測可能な結果をテストする。実装の分岐・内部状態・mock の呼び出し回数から仕様を作らない。

- E2E は利用者の操作、Firestore 結合テストは保存・購読・Rules、Storybook は実際に組み合わせた UI の公開契約を担う。Firestore では検証対象の境界を mock せず、Storybook の callback 検証だけで永続化や認証の成功を主張しない。
- 明示的に設けた FSRS・Store などの単体仕様は `docs/test/unit` に置く。専用仕様のない単体・結合テストは引き続き E2E ケースを参照し、テストのためだけに別の仕様体系を増やさない。
- 仕様と実装は Test ID で結び付ける。仕様書にテストファイル・関数・Story export の対応表は持たず、配置と対応単位の規約は各 `AGENTS.md` に置く。E2E の同名ファイル対応は維持する。
- 参照漏れは単独の TypeScript スクリプトで簡易チェックする。現在の対象は E2E・Firestore・Storybook とし、文字列先頭の ID だけを確認する。AST 解析、対応件数、assertion の網羅、テストの実行成功までは保証しない。
- 未実装で参照チェックを保留するケースは見出しにだけ `[TODO]` を付ける。印がないことや lint の成功は、検証済みを意味しない。

ケースには Given / When / Then を記述し、共通の実行前提と記述規約は `AGENTS.md`、索引は `README.md` に集約する。依存方向・型などの静的な制約は lint・型検査で確認する。

## Context

UI 操作だけでは、保存・権限・純粋な計算の契約を適切に表せない。一方、実装名の対応表や厳密なテスト解析を増やすと、リファクタリングで仕様まで変わる。境界別の振る舞いと ID に絞り、仕様の存在と実行による検証を区別する。

関連PR: [#1681](https://github.com/her0e1c1/tango/pull/1681)、[#1706](https://github.com/her0e1c1/tango/pull/1706)、[#1713](https://github.com/her0e1c1/tango/pull/1713)、[#1740](https://github.com/her0e1c1/tango/pull/1740)、[#1747](https://github.com/her0e1c1/tango/pull/1747)、[#1749](https://github.com/her0e1c1/tango/pull/1749)、[#1756](https://github.com/her0e1c1/tango/pull/1756)、[#1765](https://github.com/her0e1c1/tango/pull/1765)
