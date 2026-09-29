# StudyHistoryTable

日別件数の展開とページ切替。渡された日付と件数を表示する。

Storybook: `Pages/Study History/Daily table`。

[コンポーネント](../../../src/pages/study-history/ui/StudyHistoryTable.tsx) / [Story](../../../src/pages/study-history/ui/StudyHistoryTable.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 各日1件の90日分を渡し、表を開いて古い日付へ移動する。 | 初期は表を閉じ、30日ずつ表示して31〜60日目の範囲へ移動できる。 |
| `Empty` | 開始・完了とも0の7日分を渡す。 | 日付は存在する0件の表を表示できる。データなしとは区別する。 |
| `MobileJapanese` | モバイル幅で日本語にし、表を開く。 | 日本語の日別件数とページ操作を確認できる。 |
| `Dark` | 暗いテーマで表示する。 | 展開操作と日別表を判別できる。 |
