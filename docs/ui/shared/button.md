# Button

ラベル付きボタンの見た目と操作可否。実際の処理結果は扱わない。

Storybook: `Shared/Forms/Button`。

[コンポーネント](../../../src/shared/ui/button/Button.tsx) / [Story](../../../src/shared/ui/button/Button.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `VariantAndSize` | primary・secondary・quiet・destructive と sm・md・lg の全組み合わせ。 | 用途による強調の違いとサイズの違いを比較でき、ラベルが読める。 |
| `Disabled` | 主操作のボタンを無効にする。 | ラベルを表示したまま、操作できない状態を区別できる。 |
| `Loading` | 主操作のボタンを処理中にする。 | 処理中であることを示す表示を確認できる。 |
| `LightAndDark` | quiet のボタンを明暗それぞれの背景に置く。 | 両方の背景でラベルを読め、フォーカスしたボタンを識別できる。 |
| `NarrowViewport` | 狭いモバイル画面で横幅いっぱいに表示する。 | ラベルを読め、ボタンが画面幅に収まる。 |
| [TODO] `Tablet` | 768×1024の画面で各variantとsm・md・lgを並べる。 | サイズと強調の違いを保ち、ボタン同士やラベルが重ならない。 |
| [TODO] `Desktop` | 1280×800の画面で長いラベルのボタンと横幅いっぱいのボタンを表示する。 | ラベルが欠けず、指定した幅の中に操作領域が収まる。 |
| [TODO] `MobileDark` | 320×568の暗い画面で各variant、無効、処理中を並べる。 | ラベル・破壊的操作・無効・処理中を区別でき、フォーカスが見え、横にはみ出さない。 |
