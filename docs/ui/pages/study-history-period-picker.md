# StudyHistoryPeriodPicker

集計期間の選択と日付入力、入力エラーの表示。期間の検証結果や集計は利用側から受け取る。

Storybook: `Pages/Study History/Period picker`。

[コンポーネント](../../../src/pages/study-history/ui/StudyHistoryPeriodPicker.tsx) / [Story](../../../src/pages/study-history/ui/StudyHistoryPeriodPicker.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 30日を選択し、日付入力に固定範囲を用意する。 | 30日の選択を表示し、7日への選択要求を通知でき、任意期間の入力を開ける。 |
| `Custom` | 任意期間を選択し、2026-09-01〜2026-09-22を用意する。 | 開始・終了日と期間適用の操作を表示する。 |
| `Invalid` | 任意期間に終了日の範囲エラーを渡す。 | 対象の日付に関連付いたエラーを表示する。 |
| `MobileJapanese` | 任意期間を日本語かつモバイル幅で表示する。 | 日付入力と操作を日本語で確認できる。 |
| `Dark` | 任意期間を暗いテーマで表示する。 | 日付入力、現在値、操作を判別できる。 |
