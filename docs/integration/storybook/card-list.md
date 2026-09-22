# Card List Storybook 結合テスト仕様書

## 目的

Card 一覧の操作通知、空状態の区別、タグ解除、overlay の終了と並び順の変更要求を確認する。

## 検証境界

CardList、CardActionsMenu、実際の子 UI と Story 側の状態管理。Card の取得・保存、フィルター計算や実際のソート結果は対象外。

関連 E2E: [card-view](../../e2e/card-view.md) / [card-list-actions](../../e2e/card-list-actions.md) / [card-management](../../e2e/card-management.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-CARD-LIST-01 | interaction | [Card の追加を要求する](#storybook-card-list-01) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `AddCard` |
| STORYBOOK-CARD-LIST-02 | interaction | [難易度の一括変更を要求する](#storybook-card-list-02) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `BulkDifficulty` |
| STORYBOOK-CARD-LIST-03 | render | [Card 未作成の空状態を表示する](#storybook-card-list-03) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `Empty` |
| STORYBOOK-CARD-LIST-04 | render | [フィルターによる0件状態に解除導線を表示する](#storybook-card-list-04) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `FilterZero` |
| STORYBOOK-CARD-LIST-05 | render | [復習期限による0件状態をフィルター不一致と区別する](#storybook-card-list-05) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `IntervalZero` |
| STORYBOOK-CARD-LIST-06 | interaction | [選択した Card の ID を閲覧 callback に渡す](#storybook-card-list-06) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard` |
| STORYBOOK-CARD-LIST-07 | interaction | [選択済みタグを解除して表示を更新する](#storybook-card-list-07) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags` |
| STORYBOOK-CARD-LIST-08 | interaction | [Card の overlay を閉じる](#storybook-card-list-08) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `CardViewInteraction` |
| STORYBOOK-CARD-LIST-09 | interaction | [標準順への変更を要求する](#storybook-card-list-09) | [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `NewestAdded` |
| STORYBOOK-CARD-LIST-10 | interaction | [Card の編集を要求して操作メニューを閉じる](#storybook-card-list-10) | [CardActionsMenu.stories.tsx](../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) :: `Interaction` |

<a id="storybook-card-list-01"></a>

### STORYBOOK-CARD-LIST-01 Card の追加を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `AddCard`

Given:

- Card 一覧に追加 callback を渡す。

When:

- Actions を開き、Add card を選択する。

Then:

- 追加 callback が一度通知される。

<a id="storybook-card-list-02"></a>

### STORYBOOK-CARD-LIST-02 難易度の一括変更を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `BulkDifficulty`

Given:

- Card 一覧に難易度変更 callback を渡す。

When:

- Actions を開き、Change difficulty を選択する。

Then:

- 難易度変更 callback が一度通知される。

<a id="storybook-card-list-03"></a>

### STORYBOOK-CARD-LIST-03 Card 未作成の空状態を表示する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `Empty`

Given:

- Card が0件で、フィルターは未指定、空理由は no-cards である。

When:

- 一覧を描画する。

Then:

- 0 cards、No cards yet、Add card ボタンが表示される。

<a id="storybook-card-list-04"></a>

### STORYBOOK-CARD-LIST-04 フィルターによる0件状態に解除導線を表示する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `FilterZero`

Given:

- 難易度3〜5と react タグが指定され、表示 Card は0件、空理由は filter-zero である。

When:

- 一覧を描画する。

Then:

- No cards match the active filters と Clear filters ボタンが表示される。

<a id="storybook-card-list-05"></a>

### STORYBOOK-CARD-LIST-05 復習期限による0件状態をフィルター不一致と区別する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `IntervalZero`

Given:

- フィルターは未指定で表示 Card は0件、空理由は interval-zero である。

When:

- 一覧を描画する。

Then:

- No cards due for review が表示され、Clear filters ボタンは存在しない。

<a id="storybook-card-list-06"></a>

### STORYBOOK-CARD-LIST-06 選択した Card の ID を閲覧 callback に渡す

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`

Given:

- Card 一覧に閲覧 callback を渡す。

When:

- 先頭 Card の View ボタンを押す。

Then:

- 閲覧 callback にその Card の ID が渡される。

<a id="storybook-card-list-07"></a>

### STORYBOOK-CARD-LIST-07 選択済みタグを解除して表示を更新する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`

Given:

- TypeScript と Accessibility が選択済みで、解除を Story 側の状態に反映する。

When:

- Remove TypeScript filter を押す。

Then:

- 解除 callback に TypeScript が渡され、そのタグの解除ボタンが一覧からなくなる。

<a id="storybook-card-list-08"></a>

### STORYBOOK-CARD-LIST-08 Card の overlay を閉じる

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `CardViewInteraction`

Given:

- Card の解答 overlay が開いており、close callback を Story 側の状態に反映する。

When:

- Close card を押す。

Then:

- close callback が一度通知され、Close card ボタンが表示領域からなくなる。

<a id="storybook-card-list-09"></a>

### STORYBOOK-CARD-LIST-09 標準順への変更を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../src/pages/card-list/ui/CardList.stories.tsx) :: `NewestAdded`

Given:

- 並び順が newest の一覧に変更 callback を渡す。

When:

- Sort order で standard を選択する。

Then:

- 並び順変更 callback に standard が渡される。

<a id="storybook-card-list-10"></a>

### STORYBOOK-CARD-LIST-10 Card の編集を要求して操作メニューを閉じる

カテゴリ: `interaction`

対応 Story: [CardActionsMenu.stories.tsx](../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) :: `Interaction`

Given:

- What is a binary search? の Card 操作メニューが閉じており、開閉を Story 側の状態に反映する。

When:

- 対象 Card の操作メニューを開き、Edit を選択する。

Then:

- 開いたメニューは対象 Card のテキストを含む読み上げ名を持つ。
- 編集 callback が一度通知され、メニューが閉じる。

## 自動アサーションに含めない項目

`FilterSaving`、`CardSaving` と各メニューの `Disabled` は表示専用で、処理中の操作抑止をこの一覧の検証済み項目に含めない。
