# Card List Storybook 結合テスト仕様書

## 目的

Card 一覧の操作通知、空状態の区別、タグ解除、フォーカスの維持、メニューの排他表示と操作抑止を確認する。

## 検証境界

CardList、Card、CardActionsMenu、実際の子 UI と Story 側の状態管理。Card の取得・保存、フィルター計算や実際のソート結果は対象外。

関連 E2E: [card-view](../../e2e/card-view.md) / [card-list-actions](../../e2e/card-list-actions.md) / [card-management](../../e2e/card-management.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-CARD-LIST-01 | interaction | [Card の追加を要求する](#storybook-card-list-01) | CardList :: `AddCard` |
| STORYBOOK-CARD-LIST-02 | render | [Card 未作成の空状態を表示する](#storybook-card-list-02) | CardList :: `Empty` |
| STORYBOOK-CARD-LIST-03 | render | [フィルターによる0件状態に解除導線を表示する](#storybook-card-list-03) | CardList :: `FilterZero` |
| STORYBOOK-CARD-LIST-04 | render | [復習期限による0件状態をフィルター不一致と区別する](#storybook-card-list-04) | CardList :: `IntervalZero` |
| STORYBOOK-CARD-LIST-05 | interaction | [選択した Card の ID を閲覧 callback に渡す](#storybook-card-list-05) | CardList :: `ViewCard` |
| STORYBOOK-CARD-LIST-06 | interaction | [選択済みタグを解除して表示を更新する](#storybook-card-list-06) | CardList :: `RemovableSelectedTags` |
| STORYBOOK-CARD-LIST-07 | interaction | [Card の overlay を閉じる](#storybook-card-list-07) | CardList :: `CardViewInteraction` |
| STORYBOOK-CARD-LIST-08 | interaction | [標準順への変更を要求する](#storybook-card-list-08) | CardList :: `NewestAdded` |
| STORYBOOK-CARD-LIST-09 | interaction | [Card の編集を要求して操作メニューを閉じる](#storybook-card-list-09) | CardActionsMenu :: `Interaction` |
| STORYBOOK-CARD-LIST-10 | render | [空理由の指定がなければ空状態の案内を断定しない](#storybook-card-list-10) | CardList :: `UnspecifiedEmptyReason`（未実装） |
| STORYBOOK-CARD-LIST-11 | render | [長い選択タグの文字列を変更しない](#storybook-card-list-11) | CardList :: `LongSelectedTag`（未実装） |
| STORYBOOK-CARD-LIST-12 | interaction | [タグ解除後に残ったタグへフォーカスを移す](#storybook-card-list-12) | CardList :: `RemoveTagKeyboard`（未実装） |
| STORYBOOK-CARD-LIST-13 | interaction | [最後のタグ解除後はフィルターの見出しへ戻る](#storybook-card-list-13) | CardList :: `RemoveLastTagKeyboard`（未実装） |
| STORYBOOK-CARD-LIST-14 | interaction | [Tab 移動でタグ選択を変更しない](#storybook-card-list-14) | CardList :: `TagTabOrder`（未実装） |
| STORYBOOK-CARD-LIST-15 | interaction | [メニューを一つに保ち削除された行のメニューを閉じる](#storybook-card-list-15) | CardList :: `MenuLifecycle`（未実装） |
| STORYBOOK-CARD-LIST-16 | interaction | [行の並べ替え後も同じ Card を操作する](#storybook-card-list-16) | CardList :: `ReorderFocus`（未実装） |
| STORYBOOK-CARD-LIST-17 | interaction | [空状態の追加ボタンから作成を要求する](#storybook-card-list-17) | CardList :: `EmptyAddAction`（未実装） |
| STORYBOOK-CARD-LIST-18 | interaction | [0件状態からフィルター解除を要求する](#storybook-card-list-18) | CardList :: `EmptyClearAction`（未実装） |
| STORYBOOK-CARD-LIST-19 | interaction | [Card 行の編集要求に対象 ID を渡す](#storybook-card-list-19) | Card :: `EditTarget`（未実装） |
| STORYBOOK-CARD-LIST-20 | render | [保存中の Card 行の閲覧と操作を無効にする](#storybook-card-list-20) | Card :: `PendingContract`（未実装） |
| STORYBOOK-CARD-LIST-21 | interaction | [Card の削除を要求する](#storybook-card-list-21) | CardActionsMenu :: `DeleteAction`（未実装） |
| STORYBOOK-CARD-LIST-22 | render | [無効な操作メニューを表示しない](#storybook-card-list-22) | CardActionsMenu :: `DisabledContract`（未実装） |

対応ファイルは [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx)、[CardActionsMenu.stories.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx)。Card は `src/pages/card-list/ui/Card.stories.tsx` を対応予定ファイルとする。10 以降の named export は追加予定であり、既存 `play` の検証済み項目ではない。

<a id="storybook-card-list-01"></a>

### STORYBOOK-CARD-LIST-01 Card の追加を要求する

カテゴリ: `interaction`

対応 Story: CardList :: `AddCard`

Given:

- Card 一覧に追加 callback を渡す。

When:

- Actions を開き、Add card を選択する。

Then:

- 追加 callback が一度通知される。

<a id="storybook-card-list-02"></a>

### STORYBOOK-CARD-LIST-02 Card 未作成の空状態を表示する

カテゴリ: `render`

対応 Story: CardList :: `Empty`

Given:

- Card が0件で、フィルターは未指定、空理由は no-cards である。

When:

- 一覧を描画する。

Then:

- 0 cards、No cards yet、Add card ボタンが表示される。

<a id="storybook-card-list-03"></a>

### STORYBOOK-CARD-LIST-03 フィルターによる0件状態に解除導線を表示する

カテゴリ: `render`

対応 Story: CardList :: `FilterZero`

Given:

- react タグが指定され、表示 Card は0件、空理由は filter-zero である。

When:

- 一覧を描画する。

Then:

- No cards match the active filters と Clear filters ボタンが表示される。

<a id="storybook-card-list-04"></a>

### STORYBOOK-CARD-LIST-04 復習期限による0件状態をフィルター不一致と区別する

カテゴリ: `render`

対応 Story: CardList :: `IntervalZero`

Given:

- フィルターは未指定で表示 Card は0件、空理由は interval-zero である。

When:

- 一覧を描画する。

Then:

- No cards due for review が表示され、Clear filters ボタンは存在しない。

<a id="storybook-card-list-05"></a>

### STORYBOOK-CARD-LIST-05 選択した Card の ID を閲覧 callback に渡す

カテゴリ: `interaction`

対応 Story: CardList :: `ViewCard`

Given:

- Card 一覧に閲覧 callback を渡す。

When:

- 先頭 Card の View ボタンを押す。

Then:

- 閲覧 callback にその Card の ID が渡される。

<a id="storybook-card-list-06"></a>

### STORYBOOK-CARD-LIST-06 選択済みタグを解除して表示を更新する

カテゴリ: `interaction`

対応 Story: CardList :: `RemovableSelectedTags`

Given:

- TypeScript と Accessibility が選択済みで、解除を Story 側の状態に反映する。

When:

- Remove TypeScript filter を押す。

Then:

- 解除 callback に TypeScript が渡され、そのタグの解除ボタンが一覧からなくなる。

<a id="storybook-card-list-07"></a>

### STORYBOOK-CARD-LIST-07 Card の overlay を閉じる

カテゴリ: `interaction`

対応 Story: CardList :: `CardViewInteraction`

Given:

- Card の解答 overlay が開いており、close callback を Story 側の状態に反映する。

When:

- Close card を押す。

Then:

- close callback が一度通知され、Close card ボタンが表示領域からなくなる。

<a id="storybook-card-list-08"></a>

### STORYBOOK-CARD-LIST-08 標準順への変更を要求する

カテゴリ: `interaction`

対応 Story: CardList :: `NewestAdded`

Given:

- 並び順が newest の一覧に変更 callback を渡す。

When:

- Sort order で standard を選択する。

Then:

- 並び順変更 callback に standard が渡される。

<a id="storybook-card-list-09"></a>

### STORYBOOK-CARD-LIST-09 Card の編集を要求して操作メニューを閉じる

カテゴリ: `interaction`

対応 Story: CardActionsMenu :: `Interaction`

Given:

- What is a binary search? の Card 操作メニューが閉じており、開閉を Story 側の状態に反映する。

When:

- 対象 Card の操作メニューを開き、Edit を選択する。

Then:

- 開いたメニューは対象 Card のテキストを含む読み上げ名を持つ。
- 編集 callback が一度通知され、メニューが閉じる。

<a id="storybook-card-list-10"></a>

### STORYBOOK-CARD-LIST-10 空理由の指定がなければ空状態の案内を断定しない

カテゴリ: `render`

対応予定 Story: CardList :: `UnspecifiedEmptyReason`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `renders the heading, zero count, and collapsed no-filter summary` / `shows filter disclosure state`。

Given:

- Card は0件、フィルターなしで、空理由を渡していない。

When:

- 一覧を描画する。

Then:

- Cards の見出し、0 cards、Filters、No filters を表示する。
- No cards yet の案内や、この一覧自身の tango ボタンは表示しない。

<a id="storybook-card-list-11"></a>

### STORYBOOK-CARD-LIST-11 長い選択タグの文字列を変更しない

カテゴリ: `render`

対応予定 Story: CardList :: `LongSelectedTag`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `preserves a long selected tag without changing its text`。

Given:

- `tag-` に `unbroken` を30回連結したタグを選択している。

When:

- 一覧を描画する。

Then:

- フィルター要約に元のタグ文字列全体を保持する。

<a id="storybook-card-list-12"></a>

### STORYBOOK-CARD-LIST-12 タグ解除後に残ったタグへフォーカスを移す

カテゴリ: `interaction`

対応予定 Story: CardList :: `RemoveTagKeyboard`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `removes a selected tag via keyboard and keeps visible focus on the remaining tag`。

Given:

- one / two を選択し、Remove one filter にフォーカスしている。解除を Story の状態へ反映する。

When:

- Enter で one を解除し、Tab を押す。

Then:

- one の解除を通知して Remove two filter にフォーカスを移す。
- 次の Tab で先頭 Card の View ボタンに移る。

<a id="storybook-card-list-13"></a>

### STORYBOOK-CARD-LIST-13 最後のタグ解除後はフィルターの見出しへ戻る

カテゴリ: `interaction`

対応予定 Story: CardList :: `RemoveLastTagKeyboard`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `removes the final selected tag via keyboard and moves focus to the filters heading summary`。

Given:

- two だけを選択し、その解除ボタンにフォーカスしている。

When:

- Space で解除する。

Then:

- two の解除を通知し、タグの解除ボタンが消える。
- Filters / No filters という名前の summary にフォーカスが移る。

<a id="storybook-card-list-14"></a>

### STORYBOOK-CARD-LIST-14 Tab 移動でタグ選択を変更しない

カテゴリ: `interaction`

対応予定 Story: CardList :: `TagTabOrder`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `maintains focus order through chips without altering filters during tab navigation`。

Given:

- one / two を選択し、one の解除ボタンにフォーカスしている。

When:

- Tab、Shift+Tab の順に移動する。

Then:

- two、one の順にフォーカスが移り、どちらのタグも解除されない。

<a id="storybook-card-list-15"></a>

### STORYBOOK-CARD-LIST-15 メニューを一つに保ち削除された行のメニューを閉じる

カテゴリ: `interaction`

対応予定 Story: CardList :: `MenuLifecycle`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `keeps only one menu open and removes it with a missing row`。

Given:

- Front と Other の2行を表示する。

When:

- Front、Other の順に操作メニューを開き、Story の入力から Other を除いてから再追加する。

Then:

- Other を開くと Front のメニューが閉じる。
- 行を除くとそのメニューも閉じ、再追加しても勝手に開かない。

<a id="storybook-card-list-16"></a>

### STORYBOOK-CARD-LIST-16 行の並べ替え後も同じ Card を操作する

カテゴリ: `interaction`

対応予定 Story: CardList :: `ReorderFocus`（未実装、View / Edit の2条件）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `preserves the %s target and focus across reorder and other row changes`。

Given:

- 対象 Card の View ボタン、または開いたメニューの Edit にフォーカスしている。

When:

- 対象を残したまま行の順序変更・別行の追加と削除を行い、Enter を押す。

Then:

- フォーカスを失わず、閲覧または編集 callback に元の対象 Card の ID が渡される。

<a id="storybook-card-list-17"></a>

### STORYBOOK-CARD-LIST-17 空状態の追加ボタンから作成を要求する

カテゴリ: `interaction`

対応予定 Story: CardList :: `EmptyAddAction`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `renders empty state with Add card action for no-cards`。

Given:

- no-cards の空状態に追加 callback を渡す。

When:

- 空状態に表示された Add card を押す。

Then:

- 追加 callback が一度通知される。Actions メニュー経由の01とは操作入口が異なる。

<a id="storybook-card-list-18"></a>

### STORYBOOK-CARD-LIST-18 0件状態からフィルター解除を要求する

カテゴリ: `interaction`

対応予定 Story: CardList :: `EmptyClearAction`（未実装）。元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) :: `renders empty state with Clear filters action for filter-zero`。

Given:

- filter-zero の空状態に解除 callback を渡す。

When:

- Clear filters を押す。

Then:

- 解除 callback が一度通知される。フィルター計算や再取得結果は確認しない。

<a id="storybook-card-list-19"></a>

### STORYBOOK-CARD-LIST-19 Card 行の編集要求に対象 ID を渡す

カテゴリ: `interaction`

対応予定 Story: Card :: `EditTarget`（未実装）。元テスト: [Card.spec.tsx](../../../../src/pages/card-list/ui/Card.spec.tsx) :: `shows text and tags and routes view and edit by card ID`。

Given:

- ID が card、表面 Front、タグ one / two の Card 行を表示する。

When:

- その行の操作メニューから Edit を選択する。

Then:

- 行のタグを確認でき、編集 callback に `card` が渡される。

<a id="storybook-card-list-20"></a>

### STORYBOOK-CARD-LIST-20 保存中の Card 行の閲覧と操作を無効にする

カテゴリ: `render`

対応予定 Story: Card :: `PendingContract`（未実装）。元テスト: [Card.spec.tsx](../../../../src/pages/card-list/ui/Card.spec.tsx) :: `disables view and actions during a pending write`。

Given:

- 無効状態の Card 行を用意する。

When:

- 行を描画する。

Then:

- View Front と Open actions for Front の両方が無効になる。

<a id="storybook-card-list-21"></a>

### STORYBOOK-CARD-LIST-21 Card の削除を要求する

カテゴリ: `interaction`

対応予定 Story: CardActionsMenu :: `DeleteAction`（未実装）。元テスト: [CardActionsMenu.spec.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.spec.tsx) :: `renders edit and delete actions`。

Given:

- Binary search の操作メニューが閉じている。

When:

- メニューを開き、Delete を選択する。

Then:

- Card actions for Binary search の group に Edit / Delete の順で項目を表示する。
- 削除 callback が一度通知される。実際の Card 削除は確認しない。

<a id="storybook-card-list-22"></a>

### STORYBOOK-CARD-LIST-22 無効な操作メニューを表示しない

カテゴリ: `render`

対応予定 Story: CardActionsMenu :: `DisabledContract`（未実装）。元テスト: [CardActionsMenu.spec.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.spec.tsx) :: `disables the trigger and hides an open menu`。

Given:

- 開く指定と無効指定の両方を受け取ったメニューを用意する。

When:

- メニューを描画する。

Then:

- 開くボタンは無効で、menu 自体は表示しない。

## 自動アサーションに含めない項目

`FilterSaving`、`CardSaving` と各メニューの `Disabled` は表示専用である。追加予定の20・22を書いたことだけでは、これらの Story の操作抑止を検証済みにはしない。
