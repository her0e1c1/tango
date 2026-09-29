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
| `Mobile` | 320×568の明るい画面で長い未選択・選択済みラベルを表示する。 | ラベルが画面幅を押し広げず、選択状態を区別できる。 |
| `Tablet` | 768×1024の画面で幅を制限した領域に長いラベルを並べる。 | 各タグが重ならず、親幅内に収まる。 |
| `Desktop` | 1280×800の画面で短いラベルと長いラベルを表示する。 | タグの大きさとラベルの収まりを確認できる。 |
| `MobileDark` | 320×568の暗い画面で長い未選択・選択済みラベルを表示する。 | 文字とタグ面、選択状態が判別でき、タグが画面幅内に収まる。 |
