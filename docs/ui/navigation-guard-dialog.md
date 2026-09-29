# NavigationGuardDialog

未保存の変更を破棄するか編集を続けるかの確認表示。実際の離脱制御は扱わない。

Storybook: `Shared/Router/NavigationGuardDialog`。

[コンポーネント](../../src/shared/ui/navigation-guard-dialog/NavigationGuardDialog.tsx) / [Story](../../src/shared/ui/navigation-guard-dialog/NavigationGuardDialog.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 変更の破棄と編集継続の通知先を渡す。 | 未保存の変更に関する警告と、破棄・編集継続の選択肢を表示する。 |
| `Pending` | 処理中の状態を渡す。 | 破棄操作を無効にして処理中の説明を表示する。編集継続は操作できる。 |
