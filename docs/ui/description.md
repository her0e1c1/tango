# Description

補足説明の文字組みと読みやすさ。

Storybook: `Shared/Content/Description`。

[コンポーネント](../../src/shared/ui/content/Description.tsx) / [Story](../../src/shared/ui/content/Description.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の説明文。 | 補足説明として本文を表示する。 |
| `Short` | 短い説明文。 | 短文を自然な大きさで表示する。 |
| `Long` | 狭いモバイル画面に長い説明文を渡す。 | 説明文が折り返され、画面全体を横に押し広げない。 |
| `Dark` | 暗いテーマで説明文を表示する。 | 控えめな強調を保ちつつ本文を読める。 |
