# TypeScript の変更を基準に CI の検証範囲を切り替える

Status: Accepted

## Decision

PR と push の差分を `dorny/paths-filter` で調べ、`**/*.ts` または `**/*.tsx` に変更がある場合に既存のビルド・テスト・全コードチェックを実行する。

- TypeScript 変更がなければ、Markdown とテスト仕様の参照チェックだけを行う。手動実行と、PR / push 以外の呼び出しはフルチェックとする。
- Dependency Review は差分の種類によらず全 PR で実行する。
- 最後の `Test` は変更判定と必要なチェックの成功を要求する。失敗・キャンセル・想定外のスキップを拒否する[既存の集約方針](./20260908-use-a-fail-closed-aggregate-test-gate.md)は維持する。

## Context

ドキュメント中心の変更でも全テストを走らせる構成を改め、変更判定を標準の Action と既存ワークフローに集約した。

これは Markdown だけの最適化ではない。依存設定・Firestore Rules・CSS・Python・ワークフロー YAML だけの変更でもフルチェックは自動実行されない。この制約を受け入れ、必要な場合は手動で Test を実行する。軽量チェックの成功は、実行時の振る舞いを検証したことを意味しない。

関連PR: [#1758](https://github.com/her0e1c1/tango/pull/1758)、[#1763](https://github.com/her0e1c1/tango/pull/1763)
