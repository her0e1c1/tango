# CardCreator

カード作成の表示と入力値の送信要求。フォームとプレビューはStory側で準備する。

Storybook: `Pages/Card Create/CardCreator`。

[コンポーネント](../../../src/pages/card-create/ui/CardCreator.tsx) / [Story](../../../src/pages/card-create/ui/CardCreator.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | デッキ名と空の表裏・タグを渡す。 | 作成用の入力、プレビュー、作成・取消の操作を表示する。 |
| `Saving` | フォームの送信を待機させる。 | 作成中の表示になり、再送信できない。 |
| `Interaction` | 表面Hello・裏面Holaを入力して作成を操作する。 | フォーム送信を通知する。カードが保存されたとはみなさない。 |
| `Mobile` | モバイル幅で空のフォームを表示する。 | 入力と操作を画面幅内で確認できる。 |
| `Dark` | 暗いテーマで空のフォームを表示する。 | 入力と操作を判別できる。 |

## 同じファイルにある結合Story

次のStoryは部品単体の表示仕様とは分け、[結合テスト仕様](../../test/integration/storybook/README.md)で扱う。ここでは対応先だけを示し、保存・通知などの結合契約を重複定義しない。

| Story | 対象外となる境界 |
| --- | --- |
| `CreateSuccess` | 作成actionと保存境界を組み合わせるStory。 |
| `CreateRetry` | 作成失敗、通知、再試行を組み合わせるStory。 |
| `ImmediateRepeatedCreation` | 作成actionへの直後の重複送信を確認するStory。 |
| `PendingCreationValidation` | 非同期検証と作成処理を組み合わせるStory。 |
| `PendingCreationSave` | 保存境界の待機と重複作成を確認するStory。 |
