# RouteFeedback

読み込み中、起動失敗、対象なしの案内表示。ボタンの通知先による再読込・遷移は対象外。

Storybook: `Shared/Feedback/RouteFeedback`。

[コンポーネント](../../../src/shared/ui/route-feedback/RouteFeedback.tsx) / [Story](../../../src/shared/ui/route-feedback/RouteFeedback.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Loading` | 起動中の見出しと読み込み中の種別を渡す。 | 起動待ちの状態を表示する。 |
| `ErrorState` | 起動失敗の見出し、認証初期化の説明、Reload 操作を渡す。 | エラーの説明と再試行の操作を表示する。 |
| `NotFound` | 対象なしの種別と Go home・Go back 操作を渡す。 | 対象が見つからないことと2つの移動要求を表示する。 |
| `Dark` | 暗いテーマで読み込み中を表示する。 | 起動待ちの案内を暗い背景でも判別できる。 |
