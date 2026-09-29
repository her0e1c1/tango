# SwipeButtonList

方向別ボタン、説明、無効状態。方向の要求を通知し、評価の保存は扱わない。

Storybook: `Features/Card Player/SwipeButtonList`。

[コンポーネント](../../../src/features/card-player/ui/SwipeButtonList.tsx) / [Story](../../../src/features/card-player/ui/SwipeButtonList.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の方向ボタンを表示する。 | 各方向を識別して操作できる。 |
| `PreviousDisabled` | 左方向だけを無効にする。 | 左方向を無効として表示する。 |
| `RemappedPreviousDisabled` | 右方向だけを無効にする。 | 無効な方向が右に変わる。割当の計算はこの部品の対象外。 |
| `Disabled` | 全方向を無効にする。 | どの方向も操作できない。 |
| `Dark` | 暗いテーマで表示する。 | 各方向のアイコン・ボタン面・フォーカスを判別できる。 |
| `Ratings` | 左Again・下Hard・右Good・上Easy の説明を渡す。 | 渡された評価ラベルを方向に対応付けて表示する。 |
| `KeyboardDirection` | 左ボタンにフォーカスして Enter を押す。 | 左方向を通知する。 |
| `DisabledDirectionKeyboard` | 左だけ無効にし、クリックとTab移動を行う。 | 左の要求を通知せず、Tabで無効ボタンを飛ばす。 |
| [TODO] `Mobile` | 320×568の明るい画面で4方向と評価ラベルを表示する。 | ボタン同士とラベルが重ならず、各方向を操作できる。 |
| [TODO] `Tablet` | 768×1024の画面で評価ラベル付きの4方向を表示する。 | 方向と評価の対応を保ち、親幅内で操作できる。 |
| [TODO] `Desktop` | 1280×800の画面で方向の一部を無効にする。 | 有効・無効な方向を区別し、有効な方向へキーボードで移動できる。 |
| [TODO] `MobileDark` | 320×568の暗い画面で評価ラベルを表示し、左方向だけ無効にする。 | 各方向・評価・無効状態・フォーカスを判別でき、ボタンが画面外に欠けない。 |
