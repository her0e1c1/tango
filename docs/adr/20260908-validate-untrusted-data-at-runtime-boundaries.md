# 外部データは取り込む境界で検証する

Status: Accepted

## Decision

外部入力や保存先からドメイン処理・Store に入る構造化データは、Zod スキーマを標準として実行時に検証する。形式専用の構文解析や単純な存在確認も、境界の要件に応じて使える。型アサーションだけで `unknown` を信頼済みデータにしない。

- Entity は入力とドメインの不変条件、永続化の境界は保存ドキュメントのスキーマを持つ。CSV などの構文とエラー情報はインポートの境界が担う。
- 型はスキーマから推論し、同じ検証を Page・Feature・Entity に複製しない。
- Firestore の snapshot の検証と公開は、[購読をリモート状態の正とする決定](./20260830-use-firestore-subscriptions-as-remote-state-source.md)に従う。
- 旧形式を受け入れる場合は互換性要件を明示し、現行形式に正規化する。互換性のない Store 状態は、[永続 Store の決定](./20260830-discard-incompatible-persisted-store-state.md)に従って破棄する。

## Context

TypeScript の型だけでは、Firestore・ブラウザー保存・CSV・Form などの実データを検証できない。境界で検証しないと、不正なデータが内部の処理や UI を壊し、部分的な状態や分かりにくいエラーを生む。

関連PR: [#394](https://github.com/her0e1c1/tango/pull/394)、[#798](https://github.com/her0e1c1/tango/pull/798)、[#1047](https://github.com/her0e1c1/tango/pull/1047)、[#1048](https://github.com/her0e1c1/tango/pull/1048)、[#1150](https://github.com/her0e1c1/tango/pull/1150)
