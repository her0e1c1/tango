# StudyHistorySummary

学習開始・完了の合計と集計済みグラフの表示。データ取得や集計計算は扱わない。

Storybook: `Pages/Study History/Summary`。

[コンポーネント](../../../src/pages/study-history/ui/StudyHistorySummary.tsx) / [Story](../../../src/pages/study-history/ui/StudyHistorySummary.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 30日分のグラフ、開始2・完了3を渡す。 | 合計と説明付きのグラフを表示する。 |
| `Empty` | 全日の開始・完了が0のグラフと合計0を渡す。 | 0件として表示し、学習があったように見せない。 |
| `NinetyDays` | 90日分のグラフ、開始90・完了45を渡す。 | 7日単位の集計であることを明示する。 |
| `MobileJapanese` | モバイル幅で日本語にする。 | 合計とグラフの説明を日本語で確認できる。 |
| `Dark` | 暗いテーマで表示する。 | 合計とグラフを判別できる。 |
