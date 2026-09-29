# RemovableTag

タグラベルと削除要求の通知。条件の解除・保存は呼び出し側の責務。

Storybook: `Shared/Content/RemovableTag`。

[コンポーネント](../../../src/shared/ui/content/RemovableTag.tsx) / [Story](../../../src/shared/ui/content/RemovableTag.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | TypeScriptのラベルと削除通知先を渡す。 | ラベルと対象を識別できる削除ボタンを表示する。 |
| `Remove` | TypeScriptの削除ボタンをクリックする。 | 公開callbackへ対象のラベルを通知する。表示の除去そのものは要求しない。 |
| `LongLabel` | 幅を制限した領域に長いラベルを渡す。 | 長いラベルが領域内に省略表示され、削除操作を確認できる。 |
| `Mobile` | 長いラベルを狭いモバイル画面に表示する。 | タグと削除ボタンが画面幅に収まる。 |
| `Dark` | 暗いテーマで表示する。 | ラベルと削除ボタンを判別できる。 |
