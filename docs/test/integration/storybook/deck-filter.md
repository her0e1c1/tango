# Deck Filter Storybook 結合テスト仕様書

## 目的

タグ選択の解除と、多数のタグを開示する UI の結合を確認する。

## 検証境界

DeckFilterForm / TagFilter、実際の子 UI と Story 側の選択状態。Card の絞り込み結果、難易度範囲の正規化や永続化は対象外。

関連 E2E: [card-list-actions](../../e2e/card-list-actions.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FILTER-01 | interaction | [選択済みタグをクリアする](#storybook-deck-filter-01) | [DeckFilterForm.stories.tsx](../../../../src/features/deck-filter/ui/DeckFilterForm.stories.tsx) :: `Interaction` |
| STORYBOOK-DECK-FILTER-02 | interaction | [折りたたまれたタグをすべて表示する](#storybook-deck-filter-02) | [TagFilter.stories.tsx](../../../../src/features/deck-filter/ui/TagFilter.stories.tsx) :: `Expanded` |

<a id="storybook-deck-filter-01"></a>

### STORYBOOK-DECK-FILTER-01 選択済みタグをクリアする

カテゴリ: `interaction`

対応 Story: [DeckFilterForm.stories.tsx](../../../../src/features/deck-filter/ui/DeckFilterForm.stories.tsx) :: `Interaction`

Given:

- tag 1 が選択済みのフィルターフォームを用意し、変更を Story 側の状態に反映する。

When:

- タグ選択の Clear を押す。

Then:

- 選択タグの変更 callback に空配列が渡され、tag 1 のチェックが外れる。

<a id="storybook-deck-filter-02"></a>

### STORYBOOK-DECK-FILTER-02 折りたたまれたタグをすべて表示する

カテゴリ: `interaction`

対応 Story: [TagFilter.stories.tsx](../../../../src/features/deck-filter/ui/TagFilter.stories.tsx) :: `Expanded`

Given:

- タグ12件があり、8件を表示して残り4件を折りたたんでいる。

When:

- Show 4 more tags を押す。

Then:

- 12件のタグのチェックボックスが表示される。
- 開示ボタンが Show fewer tags になり、aria-expanded が true になる。
