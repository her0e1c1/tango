# FullScreen

表示領域全体を使う配置・中央寄せ・内部スクロール。

Storybook: `Shared/Layout/FullScreen`。

[コンポーネント](../../src/shared/ui/full-screen/FullScreen.tsx) / [Story](../../src/shared/ui/full-screen/FullScreen.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 明るいテーマで短い内容を置く。 | 表示領域の高さを使って内容を表示する。 |
| `Center` | 中央寄せを指定して短い文章を渡す。 | 内容を中央に表示する。 |
| `InContainer` | Story側のコンテナ内に配置する。 | 親の中で全画面領域を使う際の配置を確認できる。 |
| `ScrollableMobileDark` | 暗いモバイル画面で縦スクロール可にし、7つのセクションを置く。 | 領域内で縦にスクロールして内容を確認でき、不要な横スクロールを生まない。 |
