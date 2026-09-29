# Title

タイトルの表示とクリック通知。通知後の画面遷移は扱わない。

Storybook: `Shared/Content/Title`。

[コンポーネント](../../src/shared/ui/content/Title.tsx) / [Story](../../src/shared/ui/content/Title.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常のタイトル文字列。 | タイトルとして強調して表示する。 |
| `Clickable` | タイトルにクリック通知先を渡す。 | タイトルを表示し、操作を公開callbackへ通知できる。 |
| `Short` | 短いタイトル。 | 不要な領域拡張なしに短いタイトルを表示する。 |
| `Long` | 狭いモバイル画面に連続した長いタイトルを渡す。 | 画面幅内でタイトルを確認できる。 |
| `Dark` | 暗いテーマで通常のタイトルを表示する。 | 背景と区別してタイトルを読める。 |
