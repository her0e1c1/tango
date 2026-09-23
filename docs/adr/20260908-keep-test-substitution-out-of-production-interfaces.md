# テストの都合で本番コードの公開 API を変えない

Status: Accepted

## Decision

関数・hook・コンポーネント・モジュールの公開 API は、本番の要件から設計する。

- テストや mock のためだけに、引数・依存オブジェクト・callback・factory・任意の上書き設定・export を追加、変更しない。
- 本番コードは実際の依存先を直接 import する。テストでは既存の API を変えず、テスト側のモジュール mock や spy で置き換える。
- 複数の実行時 adapter、設定、ライフサイクルの管理など、本番の要件がある場合は抽象化や依存注入を許容する。

テストは既存の公開境界から観測できる振る舞いを検証し、テスト専用の差し替え口を本番コードに作らない。

## Context

テストのためだけの依存注入は、本番では不要な引数や責務を増やし、本番要件として誤解されやすい。

関連PR: [#454](https://github.com/her0e1c1/tango/pull/454)、[#1178](https://github.com/her0e1c1/tango/pull/1178)、[#1471](https://github.com/her0e1c1/tango/pull/1471)
