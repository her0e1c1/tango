# StudySaveControls

スキップの操作と処理中の表示。評価記録やカード位置の更新は扱わない。

Storybook: `Pages/Study Session/StudySaveControls`。

[コンポーネント](../../../src/pages/study-session/ui/StudySaveControls.tsx) / [Story](../../../src/pages/study-session/ui/StudySaveControls.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 処理中でない状態でSkipを操作する。 | スキップ要求を通知する。 |
| `Saving` | 処理中の状態を渡す。 | 処理中にスキップを繰り返し操作できない。 |
| `Mobile` | 320×568の明るい画面でスキップ操作を表示する。 | ラベルが欠けず、操作領域が画面幅内に収まる。 |
| `Tablet` | 768×1024の画面でスキップ操作を表示する。 | 指定された親領域内で操作の大きさと配置を保つ。 |
| `Desktop` | 1280×800の画面でスキップ操作を表示する。 | ボタンが不自然に伸びず、キーボードで操作できる。 |
| `Dark` | 暗いテーマで通常と処理中を切り替える。 | ラベル・操作面・フォーカスと操作可否を判別できる。 |
| `MobileDark` | 320×568の暗い画面で日本語のスキップ操作と処理中を表示する。 | ラベルと無効状態を読め、操作領域が横にはみ出さない。 |
