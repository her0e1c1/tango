# DeckDeletionDialog

デッキとそのカードを削除する確認表示。実際の削除ではなく、確認・取消の通知を対象にする。

Storybook: `Features/Deck Deletion/DeckDeletionDialog`。

[コンポーネント](../../../src/features/deck-deletion/ui/DeckDeletionDialog.tsx) / [Story](../../../src/features/deck-deletion/ui/DeckDeletionDialog.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | デッキ名とカード数24を渡す。 | 対象と削除の影響、確認・取消操作を表示する。 |
| `SingleCard` | カード数1を渡す。 | 1枚に対応した削除説明を表示する。 |
| `LongDeckName` | 長いデッキ名とカード数128を渡す。 | 対象名を確認でき、操作を押し出さない。 |
| `Confirm` | 削除確認を操作する。 | 確認を通知する。データの削除成功は含めない。 |
| `Pending` | 削除処理中の状態を渡す。 | 処理中と分かる表示になり、重複した確認を受け付けない。 |
| `Mobile` | 狭い画面で長いデッキ名を表示する。 | 対象と操作を確認できる。 |
| `Dark` | 暗いテーマで長いデッキ名を表示する。 | 警告と操作を判別できる。 |
