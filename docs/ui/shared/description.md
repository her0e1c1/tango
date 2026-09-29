# Description

補足説明の文字組みと読みやすさ。

Storybook: `Shared/Content/Description`。

[コンポーネント](../../../src/shared/ui/content/Description.tsx) / [Story](../../../src/shared/ui/content/Description.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 通常の説明文。 | 補足説明として本文を表示する。 |
| `Short` | 短い説明文。 | 短文を自然な大きさで表示する。 |
| `Long` | 狭いモバイル画面に長い説明文を渡す。 | 説明文が折り返され、画面全体を横に押し広げない。 |
| `Dark` | 暗いテーマで説明文を表示する。 | 控えめな強調を保ちつつ本文を読める。 |
| [TODO] `Tablet` | 768×1024の画面で幅を制限した領域に長い説明文を表示する。 | 親幅に合わせて折り返し、説明の末尾まで確認できる。 |
| [TODO] `Desktop` | 1280×800の画面で短文と長文を表示する。 | 補足としての見た目を保ち、長文が隣接内容を覆わない。 |
| [TODO] `MobileDark` | 320×568の暗い画面で長い日本語の説明文を表示する。 | 補足文が暗い背景に埋もれず、折り返して読める。 |
