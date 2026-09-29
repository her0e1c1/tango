# Layout

ヘッダーと主領域を組み合わせた汎用レイアウト。Appの認証・ルーティングは扱わない。

Storybook: `Shared/Layout/Layout`。

[コンポーネント](../../src/shared/ui/layout/Layout.tsx) / [Story](../../src/shared/ui/layout/Layout.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 明るいテーマでヘッダーと短い本文を表示する。 | ヘッダー、幅を制限した本文領域、下部余白を表示する。 |
| `FixedHeaderLongContent` | 固定ヘッダーと8つのセクションを表示して下へスクロールする。 | 先頭内容がヘッダーに隠れず、スクロールしてもヘッダーの位置を保つ。 |
| `MobileDarkFullscreen` | 暗いモバイル画面で全画面・スクロール可にし、6つのセクションを表示する。 | 全画面の領域内で縦にスクロールして内容を確認できる。 |
