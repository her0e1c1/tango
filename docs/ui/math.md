# MathContent

数式を含む本文の読み取り表示。数式の計算結果は扱わない。

Storybook: `Shared/Content/Math`。

[コンポーネント](../../src/shared/ui/content/Math.tsx) / [Story](../../src/shared/ui/content/Math.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Inline` | 文中に数式を含む本文を渡す。 | 数式を文章と同じ流れで表示する。 |
| `Block` | 独立した数式を渡す。 | 数式を独立したブロックとして表示する。 |
| `Markdown` | Markdownと数式を組み合わせた本文を渡す。 | Markdownの構造と数式を併せて表示する。 |
| `WideMobile` | 狭いモバイル画面に横長の数式を渡す。 | 数式を確認でき、本文が画面全体を横に押し広げない。 |
| `Dark` | Markdownと数式を暗いテーマで表示する。 | 暗い背景でも本文と数式を読める。 |
