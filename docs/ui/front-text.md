# FrontText

カード表面の通常表示、数式、長文と閲覧向け表示。

Storybook: `Entities/Card/FrontText`。

[コンポーネント](../../src/entities/card/ui/FrontText.tsx) / [Story](../../src/entities/card/ui/FrontText.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の問題文を渡す。 | 問題文を表示する。 |
| `TooLong` | 長い問題文を渡す。 | 長文の収まりを確認できる。 |
| `LongMath` | 複数の数式を数式カテゴリで渡す。 | 数式として描画し、長い内容を確認できる。 |
| `Mobile` | 狭い画面で長い問題文を表示する。 | 画面幅に応じた問題文の収まりを確認できる。 |
| `Dark` | 暗いテーマで長い問題文を表示する。 | 暗い背景でも問題文を判別できる。 |
| `ViewMode` | 長い問題文に閲覧モードを指定する。 | 閲覧向けの表面表示になる。スクロール領域全体の配置は CardPlayer の仕様で扱う。 |
