# Code

ソースコードの読み取り表示。コードの実行は扱わない。

Storybook: `Shared/Content/Code`。

[コンポーネント](../../src/shared/ui/content/Code.tsx) / [Story](../../src/shared/ui/content/Code.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Python` | Pythonとしてコード本文を渡す。 | Pythonのコードを整形・強調表示する。 |
| `WideMobile` | 狭いモバイル画面に長い1行のTypeScriptコードを渡す。 | 長い行を確認でき、コードが画面全体を横に押し広げない。 |
| `Dark` | Pythonコードを暗いテーマ・暗いコード表示にする。 | 暗い背景でもコードを読める。 |
