# DeckActionsMenu

デッキの操作メニューとキーボード操作。選択先への要求を対象にし、保存・遷移・ダウンロードの成功は扱わない。

Storybook: `Pages/Deck List/DeckActionsMenu`。

[コンポーネント](../../../src/pages/deck-list/ui/DeckActionsMenu.tsx) / [Story](../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | デッキ名と閉じた状態を渡す。 | 対象の名前を含む起点を表示する。 |
| `Open` | 通常のメニューを開く。 | 閲覧・ダウンロード・編集・学習履歴・削除を表示する。 |
| `WithStudySession` | 最初から学習する操作を渡して開く。 | Restart を追加したメニューを表示する。 |
| `Disabled` | 開いた状態と無効状態を渡す。 | 起点を無効にし、操作可能なメニューを出さない。 |
| `LongDeckName` | 長いデッキ名を渡して開く。 | 行を広げず、操作の読み上げ名に対象を保持する。 |
| `Interaction` | メニューを開いてDownloadを選ぶ。 | 要求を通知し、メニューを閉じる。 |
| `Mobile` | モバイル幅で開く。 | メニュー項目を確認できる。 |
| `Dark` | 暗いテーマで開く。 | 項目と破壊的な操作を判別できる。 |
| `History` | 学習履歴を選ぶ。 | 学習履歴の要求を通知する。 |
| `UnstartedMenu` | セッションの再開操作を渡さず開く。 | 通常の5項目を表示し、Restartを表示しない。 |
| `KeyboardMenu` | 開いて矢印キーとEscapeを操作する。 | 先頭から項目を移動でき、閉じると起点にフォーカスを戻す。 |
| `OutsideFocus` | 開いた状態でメニュー外へフォーカスを移す。 | メニューを閉じ、移動先のフォーカスを奪わない。 |
| `RefocusDownload` | 一時的なフォーカス解除後にDownloadへ移動してEnterを押す。 | ダウンロード要求を通知する。 |
| `RefocusEdit` | 一時的なフォーカス解除後にEditへ移動してEnterを押す。 | 編集要求を通知する。 |
| `RefocusDelete` | 一時的なフォーカス解除後にDeleteへ移動してEnterを押す。 | 削除要求を通知する。 |
| `PendingCycle` | メニューを開いて処理中にし、その後解除する。 | 処理中は閉じて起点を無効にし、解除後もメニューを勝手に開かない。 |
