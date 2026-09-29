# Logo

ロゴの文字付き・マークのみの表示。

Storybook: `Shared/Content/Logo`。

[コンポーネント](../../../src/shared/ui/logo/Logo.tsx) / [Story](../../../src/shared/ui/logo/Logo.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Wordmark` | 明るいテーマで通常表示する。 | 文字付きのロゴを表示する。 |
| `MarkOnly` | 明るいテーマでマークのみを指定する。 | 文字部分を伴わないマークを表示する。 |
| `Light` | 明るいテーマの通常表示。 | 明るい背景でロゴを判別できる。 |
| `Dark` | 暗いテーマの通常表示。 | 暗い背景でロゴを判別できる。 |
