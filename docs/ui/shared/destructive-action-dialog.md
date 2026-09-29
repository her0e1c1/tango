# DestructiveActionDialog

削除など取り消せない操作の確認表示。対象と影響を示し、確認・取消を通知する。

Storybook: `Shared/Feedback/DestructiveActionDialog`。

[コンポーネント](../../../src/shared/ui/destructive-action-dialog/DestructiveActionDialog.tsx) / [Story](../../../src/shared/ui/destructive-action-dialog/DestructiveActionDialog.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Deck` | デッキ名、24枚のカードと学習セッションへの影響を渡す。 | 削除対象、取り消せないこと、確認と取消の操作を表示する。 |
| `Card` | 長いカード表面とカード削除の説明を渡す。 | カードを対象とした確認文を表示し、対象の全文を確認できる。 |
| `Pending` | 処理中の状態を渡す。 | 確認と取消を無効にして処理中を伝え、対象名にフォーカスを移す。 |
| `Mobile` | 狭い画面で長いカード表面を表示する。 | 対象と説明を読め、確認・取消の操作領域を確認できる。 |
| `Dark` | 暗いテーマでデッキ削除を表示する。 | 警告と操作の違いを判別できる。 |
