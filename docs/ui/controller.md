# Controller

再生・一時停止とカード位置の操作。指定した状態の表示と要求の通知を対象にする。

Storybook: `Features/Card Player/Controller`。

[コンポーネント](../../src/features/card-player/ui/Controller.tsx) / [Story](../../src/features/card-player/ui/Controller.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 24枚、位置3、自動再生なし。 | 再生操作と受け取った位置を表示する。 |
| `Interaction` | 再生を操作し、Story側で再生状態を更新する。 | 切替を通知し、一時停止の操作と再生中の状態を表示する。 |
| `AutoPlay` | 自動再生中の状態を渡す。 | 一時停止の操作を表示する。 |
| `Complete` | 24枚に対して位置24を渡す。 | 終端の位置を表示する。 |
| `Saving` | 操作を無効にする。 | 再生と位置変更を操作できない。 |
| `KeyboardPlayback` | 再生操作にフォーカスし Enter を押す。 | 再生の切替を通知する。 |
| `ChangePosition` | 5枚、位置0から位置3を指定する。 | 数値3として位置変更を通知する。 |
