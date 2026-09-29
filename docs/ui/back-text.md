# BackText

カード裏面の本文・数式・コード表示とクリックの通知先。

Storybook: `Entities/Card/BackText`。

[コンポーネント](../../src/entities/card/ui/BackText.tsx) / [Story](../../src/entities/card/ui/BackText.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の解答文とクリック通知先を渡す。 | 解答文を表示し、クリックを通知できる。 |
| `MathContent` | 数式カテゴリの解答を渡す。 | 数式として表示する。 |
| `Python` | コード表示を有効にして Python を指定する。 | 指定言語のコード表示になる。 |
| `Golang` | 同じコード入力に Golang を指定する。 | 指定言語のコード表示を確認できる。サンプルコードの実行結果は扱わない。 |
| `LongText` | 長い通常テキストを渡す。 | 長い解答の収まりを確認できる。 |
| `LongCode` | Python のコードを大量に渡す。 | コードの改行や表示領域を確認できる。 |
| `LongMath` | 複数の数式を渡す。 | 数式の表示と長い内容の収まりを確認できる。 |
| `Mobile` | 狭い画面で長い通常テキストを表示する。 | 狭い幅でも内容を確認できる。 |
| `Dark` | 暗いテーマとコードの暗色表示を指定する。 | コードを暗い背景で判別できる。 |
