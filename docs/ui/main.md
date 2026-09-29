# Main

主コンテンツ領域の幅・余白・背景。画面固有の内容は扱わない。

Storybook: `Shared/Layout/Main`。

[コンポーネント](../../src/shared/ui/main/Main.tsx) / [Story](../../src/shared/ui/main/Main.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 明るいテーマで見出しと本文を置く。 | 内容を読みやすい幅と余白のある主領域に表示する。 |
| `NarrowDarkReadingSurface` | 暗いモバイル画面に4つの読み取りセクションを置く。 | セクションの間隔を保ち、本文を画面幅内で読める。 |
| `Canvas` | 通常の内容をcanvasの背景にする。 | 内容の配置を保ちつつ、canvasの背景で表示する。 |
