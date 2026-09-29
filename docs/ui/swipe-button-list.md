# SwipeButtonList

方向別ボタン、説明、無効状態。方向の要求を通知し、評価の保存は扱わない。

Storybook: `Features/Card Player/SwipeButtonList`。

[コンポーネント](../../src/features/card-player/ui/SwipeButtonList.tsx) / [Story](../../src/features/card-player/ui/SwipeButtonList.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の方向ボタンを表示する。 | 各方向を識別して操作できる。 |
| `PreviousDisabled` | 左方向だけを無効にする。 | 左方向を無効として表示する。 |
| `RemappedPreviousDisabled` | 右方向だけを無効にする。 | 無効な方向が右に変わる。割当の計算はこの部品の対象外。 |
| `Disabled` | 全方向を無効にする。 | どの方向も操作できない。 |
| `Dark` | 暗いテーマで表示する。 | 方向と操作可否を判別できる。 |
| `Ratings` | 左Again・下Hard・右Good・上Easy の説明を渡す。 | 渡された評価ラベルを方向に対応付けて表示する。 |
| `KeyboardDirection` | 左ボタンにフォーカスして Enter を押す。 | 左方向を通知する。 |
| `DisabledDirectionKeyboard` | 左だけ無効にし、クリックとTab移動を行う。 | 左の要求を通知せず、Tabで無効ボタンを飛ばす。 |
