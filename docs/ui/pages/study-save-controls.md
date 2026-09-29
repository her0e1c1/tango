# StudySaveControls

スキップの操作と処理中の表示。評価記録やカード位置の更新は扱わない。

Storybook: `Pages/Study Session/StudySaveControls`。

[コンポーネント](../../../src/pages/study-session/ui/StudySaveControls.tsx) / [Story](../../../src/pages/study-session/ui/StudySaveControls.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 処理中でない状態でSkipを操作する。 | スキップ要求を通知する。 |
| `Saving` | 処理中の状態を渡す。 | 処理中にスキップを繰り返し操作できない。 |
