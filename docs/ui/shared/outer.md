# Outer

外側の背景と標準ページのスクロール領域。

Storybook: `Shared/Layout/Outer`。

[コンポーネント](../../../src/shared/ui/outer/Outer.tsx) / [Story](../../../src/shared/ui/outer/Outer.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 明るいテーマで一つのセクションを置く。 | アプリの背景上にセクションを表示する。 |
| `MobileDarkLongContent` | 暗いモバイル画面に8つのセクションを置く。 | 縦にスクロールして全セクションを確認できる。 |
