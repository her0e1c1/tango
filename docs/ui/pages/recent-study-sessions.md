# RecentStudySessions

最近のセッション一覧、状態、日時と件数の表示。

Storybook: `Pages/Study History/Recent sessions`。

[コンポーネント](../../../src/pages/study-history/ui/RecentStudySessions.tsx) / [Story](../../../src/pages/study-history/ui/RecentStudySessions.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 完了・中止・未完了の3件に長いデッキ名とカード数1234を渡す。 | 3つの状態を区別し、未完了の終了日時をダッシュで表示する。 |
| `MobileJapanese` | 同じ3件を日本語かつモバイル幅で表示する。 | 状態と見出しを日本語にし、長い名前を画面幅内で確認できる。 |
| `Dark` | 暗いテーマで同じ3件を表示する。 | 状態、日時、名前を判別できる。 |
| `Empty` | セッションを空配列で渡す。 | セッションがない状態を表示する。 |
| `MoreSessions` | 完了済み10件を渡して全件表示を操作する。 | 初期3件から10件へ展開し、折り畳み操作を表示する。 |
