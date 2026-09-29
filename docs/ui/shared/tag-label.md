# TagLabel

読み取り用タグラベルの表示。削除操作自体は [RemovableTag](./removable-tag.md) で扱う。

Storybook: `Shared/Content/TagLabel`。

[コンポーネント](../../../src/shared/ui/content/TagLabel.tsx) / [Story](../../../src/shared/ui/content/TagLabel.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | TypeScriptの未選択ラベル。 | ラベルを表示する。 |
| `Selected` | 選択済みとして表示する。 | 未選択と区別できる表示になる。 |
| `LongLabel` | 幅を制限した領域に長いラベルを渡す。 | ラベルが領域を横に押し広げない。 |
| `Removable` | RemovableTagを使った削除操作付きの表示例。 | ラベルと削除ボタンを表示する。TagLabel単体の削除機能とは扱わない。 |
| `LightAndDark` | 明暗それぞれの背景に未選択と選択済みを並べる。 | 両方の背景でラベルと選択状態を判別できる。 |
