# Overlay

重ね合わせる内容の位置・背景・長文表示。ダイアログ固有の操作は扱わない。

Storybook: `Shared/Feedback/Overlay`。

[コンポーネント](../../src/shared/ui/feedback/Overlay.tsx) / [Story](../../src/shared/ui/feedback/Overlay.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Center` | 中央配置。 | 内容を中央に表示する。 |
| `Left` | 左配置。 | 内容を左側に表示する。 |
| `Right` | 右配置。 | 内容を右側に表示する。 |
| `Top` | 上配置。 | 内容を上側に表示する。 |
| `Bottom` | 下配置。 | 内容を下側に表示する。 |
| `Transparent` | 中央配置で背景を透過する。 | 内容を表示し、透過の見た目を確認できる。 |
| `LongMobile` | 狭いモバイル画面に長い本文を中央配置する。 | 本文を読み、必要に応じてスクロールして内容を確認できる。 |
| `Dark` | 暗いテーマで中央配置する。 | 暗い背景で内容を判別できる。 |
