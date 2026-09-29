# CardView

渡されたカード本文を、通常テキスト・コード・数式として表示する部品。

Storybook: `Entities/Card/CardView`。

[コンポーネント](../../../src/entities/card/ui/CardView.tsx) / [Story](../../../src/entities/card/ui/CardView.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の裏面テキストを raw カテゴリで渡す。 | 通常テキストとして表示する。 |
| `LongPlainText` | 長い通常テキストを渡す。 | 内容の改行と長文の収まりを確認できる。 |
| `LongCode` | Python の長いコードを渡す。 | 指定した言語のコード表示と長文の収まりを確認できる。 |
| `LongMath` | 複数の数式を渡す。 | 数式として表示する。 |
| `Mobile` | 狭い画面で長い通常テキストを表示する。 | 狭い幅でも内容を確認できる。 |
| `Dark` | 暗いテーマとコードの暗色表示を指定する。 | 長いコードを暗い背景で判別できる。 |
