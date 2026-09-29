# Slider

数値の位置表示と変更通知。数値を利用する業務処理は扱わない。

Storybook: `Shared/Forms/Slider`。

[コンポーネント](../../src/shared/ui/forms/Slider.tsx) / [Story](../../src/shared/ui/forms/Slider.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 値40を渡す。 | 値に対応する位置につまみを表示する。 |
| `Interaction` | 値40から41へ変更し、Story側で変更値を反映する。 | コントロールの値が41になり、公開callbackへ変更を通知する。 |
| `Values` | 値20、値70、無効の値40を並べる。 | 値による位置の違いと、操作できない状態を比較できる。 |
| `LightAndDark` | 明るい背景では値35、暗い背景では値65を表示する。 | 両方の背景でつまみとトラックを判別できる。 |
| `NarrowViewport` | 狭いモバイル画面で値55を表示する。 | トラックとつまみが画面幅に収まる。 |
