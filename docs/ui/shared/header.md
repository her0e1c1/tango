# Header

ヘッダーの表示・固定配置。各リンクの実遷移は扱わない。

Storybook: `Shared/Layout/Header`。

[コンポーネント](../../../src/shared/ui/header/Header.tsx) / [Story](../../../src/shared/ui/header/Header.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 明るいテーマの通常ヘッダー。 | ヘッダーの内容を表示する。 |
| `MobileDarkFixed` | 暗いモバイル画面で固定ヘッダーにする。 | 暗いテーマのヘッダーを固定配置で表示する。 |
| `Mobile` | より狭いモバイル画面に表示する。 | ヘッダーの内容が画面幅に収まる。 |
