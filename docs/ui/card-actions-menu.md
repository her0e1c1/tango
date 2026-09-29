# CardActionsMenu

カードを対象とする編集・削除メニュー。要求の通知までを対象にする。

Storybook: `Pages/Card List/CardActionsMenu`。

[コンポーネント](../../src/pages/card-list/ui/CardActionsMenu.tsx) / [Story](../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | カード表面と閉じた状態を渡す。 | 対象を含む名前でメニューを開く操作を表示する。 |
| `Open` | メニューを開く。 | Edit・Delete を表示する。 |
| `Disabled` | 開いた状態と無効状態を渡す。 | 起点を無効にし、操作可能なメニューを出さない。 |
| `LongCardText` | 長いカード表面を渡して開く。 | 行幅を広げず、操作の読み上げ名に対象を保持する。 |
| `Interaction` | メニューを開いてEditを選ぶ。 | 編集要求を通知し、メニューを閉じる。 |
| `Mobile` | 狭い画面で開く。 | 編集と削除を確認できる。 |
| `Dark` | 暗いテーマで開く。 | 編集と削除を判別できる。 |
| `DeleteRequest` | Binary search のメニューでDeleteを選ぶ。 | 対象付きのメニューから削除要求を通知する。 |
| `DisabledMenuContract` | 無効状態で開く指定をする。 | 起点は無効で、メニューは表示しない。 |
