# 文書化した E2E ケースをテスト仕様の基準にする

Status: Accepted

## Decision

`docs/test/e2e/**` を、E2E・単体・結合テストが保証するアプリの実行時の振る舞いの基準にする。

- 文書のケース ID と Playwright テストは 1 対 1 に対応させる。未記載の E2E テストは追加しない。
- 単体・結合テストの追加・変更でも既存の E2E ケース ID を参照する。期待する振る舞いが未記載なら、先に仕様を追加・更新する。
- パラメーター化テストの追加ケースは、参照する振る舞いと不変条件を保つ境界値・同値クラスに限る。
- 各テストは対象レベルの公開境界から、観測できる結果を検証する。依存方向や型の正しさは lint・型検査で保証し、E2E ケース ID を作らない。
- 各 E2E テストは同じカテゴリの YAML fixture を一つ使う。seed 前にスキーマと参照整合性を検証し、UID・ドキュメント ID・セッション ID はケースと再試行ごとに分離する。

fixture・テスト配置・mock の詳細は `docs/test/e2e/AGENTS.md`、`test/e2e/AGENTS.md`、ルートの `AGENTS.md` に置く。

## Context

テストコードだけでは、期待する振る舞いの欠落や不要なテストを判断しにくい。共有データの並列利用も ID 衝突による不安定さを生む。

2026-08-30 の PR #1397 で、E2E 向けの仕様を単体・結合テストにも拡張した。テストレベルによる仕様の分岐を避け、既存の E2E と文書 ID の対応は維持する。

関連PR: [#1256](https://github.com/her0e1c1/tango/pull/1256)、[#1260](https://github.com/her0e1c1/tango/pull/1260)、[#1299](https://github.com/her0e1c1/tango/pull/1299)、[#1397](https://github.com/her0e1c1/tango/pull/1397)
