# Card List Storybook 結合テスト仕様書

## 目的

一覧・空状態、操作通知、タグ解除、フォーカスの維持とメニューの操作抑止を確認する。

## 検証境界

CardList、実際の Card / CardActionsMenu と Story 側の表示状態を組み合わせる。取得・保存、フィルター計算、実際のソート処理は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [card-view](../../e2e/card-view.md)、[card-list-actions](../../e2e/card-list-actions.md)、[card-management](../../e2e/card-management.md) を参照する。

10〜22 は Vitest から追加した契約で、対応 Story は追加先である。各ケースの状態準備とアサーションは未実装である。Card 行単体の契約は実際の行を含む CardList の Story に紐付ける。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-CARD-LIST-01 | interaction | [Card の追加を要求する](#storybook-card-list-01) | CardList :: `AddCard` |
| STORYBOOK-CARD-LIST-02 | render | [Card 未作成の空状態を表示する](#storybook-card-list-02) | CardList :: `Empty` |
| STORYBOOK-CARD-LIST-03 | render | [フィルターによる0件状態を表示する](#storybook-card-list-03) | CardList :: `FilterZero` |
| STORYBOOK-CARD-LIST-04 | render | [復習期限による0件状態を区別する](#storybook-card-list-04) | CardList :: `IntervalZero` |
| STORYBOOK-CARD-LIST-05 | interaction | [閲覧要求に対象 ID を渡す](#storybook-card-list-05) | CardList :: `ViewCard` |
| STORYBOOK-CARD-LIST-06 | interaction | [選択タグを解除する](#storybook-card-list-06) | CardList :: `RemovableSelectedTags` |
| STORYBOOK-CARD-LIST-07 | interaction | [Card の overlay を閉じる](#storybook-card-list-07) | CardList :: `CardViewInteraction` |
| STORYBOOK-CARD-LIST-08 | interaction | [標準順への変更を要求する](#storybook-card-list-08) | CardList :: `NewestAdded` |
| STORYBOOK-CARD-LIST-09 | interaction | [編集を要求してメニューを閉じる](#storybook-card-list-09) | CardActionsMenu :: `Interaction` |
| STORYBOOK-CARD-LIST-10 | render | [空理由がなければ案内を断定しない](#storybook-card-list-10) | CardList :: `Empty`（未実装） |
| STORYBOOK-CARD-LIST-11 | render | [長い選択タグを保持する](#storybook-card-list-11) | CardList :: `RemovableSelectedTags`（未実装） |
| STORYBOOK-CARD-LIST-12 | interaction | [タグ解除後に残るタグへフォーカスを移す](#storybook-card-list-12) | CardList :: `RemovableSelectedTags`（未実装） |
| STORYBOOK-CARD-LIST-13 | interaction | [最後のタグ解除後はフィルターへ戻る](#storybook-card-list-13) | CardList :: `RemovableSelectedTags`（未実装） |
| STORYBOOK-CARD-LIST-14 | interaction | [Tab 移動で選択を変えない](#storybook-card-list-14) | CardList :: `RemovableSelectedTags`（未実装） |
| STORYBOOK-CARD-LIST-15 | interaction | [メニューを一つに保ち行の削除で閉じる](#storybook-card-list-15) | CardList :: `ViewCard`（未実装） |
| STORYBOOK-CARD-LIST-16 | interaction | [並べ替え後も同じ Card を操作する](#storybook-card-list-16) | CardList :: `ViewCard`（未実装） |
| STORYBOOK-CARD-LIST-17 | interaction | [空状態から追加を要求する](#storybook-card-list-17) | CardList :: `Empty`（未実装） |
| STORYBOOK-CARD-LIST-18 | interaction | [0件状態からフィルター解除を要求する](#storybook-card-list-18) | CardList :: `FilterZero`（未実装） |
| STORYBOOK-CARD-LIST-19 | interaction | [行の編集要求に対象 ID を渡す](#storybook-card-list-19) | CardList :: `ViewCard`（未実装） |
| STORYBOOK-CARD-LIST-20 | render | [処理中の行を操作させない](#storybook-card-list-20) | CardList :: `ViewCard`（未実装） |
| STORYBOOK-CARD-LIST-21 | interaction | [削除を要求する](#storybook-card-list-21) | CardActionsMenu :: `Interaction`（未実装） |
| STORYBOOK-CARD-LIST-22 | render | [無効なメニューを表示しない](#storybook-card-list-22) | CardActionsMenu :: `Interaction`（未実装） |

<a id="storybook-card-list-01"></a>

### STORYBOOK-CARD-LIST-01 Card の追加を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `AddCard`

Given:

- 一覧に追加 callback を渡す。

When:

- Actions を開いて Add card を選ぶ。

Then:

- 追加 callback が一度通知される。

<a id="storybook-card-list-02"></a>

### STORYBOOK-CARD-LIST-02 Card 未作成の空状態を表示する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `Empty`

Given:

- Card は0件、フィルターなし、空理由は no-cards である。

When:

- 一覧を描画する。

Then:

- 0 cards、No cards yet、Add card を表示する。

<a id="storybook-card-list-03"></a>

### STORYBOOK-CARD-LIST-03 フィルターによる0件状態を表示する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `FilterZero`

Given:

- react タグを指定し、表示0件、空理由は filter-zero である。

When:

- 一覧を描画する。

Then:

- No cards match the active filters と Clear filters を表示する。

<a id="storybook-card-list-04"></a>

### STORYBOOK-CARD-LIST-04 復習期限による0件状態を区別する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `IntervalZero`

Given:

- フィルターなし、表示0件、空理由は interval-zero である。

When:

- 一覧を描画する。

Then:

- No cards due for review を表示し、Clear filters は表示しない。

<a id="storybook-card-list-05"></a>

### STORYBOOK-CARD-LIST-05 閲覧要求に対象 ID を渡す

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`

Given:

- 一覧に閲覧 callback を渡す。

When:

- 先頭 Card の View を押す。

Then:

- 閲覧 callback に対象 Card の ID を渡す。

<a id="storybook-card-list-06"></a>

### STORYBOOK-CARD-LIST-06 選択タグを解除する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`

Given:

- TypeScript / Accessibility を選択し、解除を Story 側の状態に反映する。

When:

- Remove TypeScript filter を押す。

Then:

- 解除 callback に TypeScript を渡し、その解除ボタンが消える。

<a id="storybook-card-list-07"></a>

### STORYBOOK-CARD-LIST-07 Card の overlay を閉じる

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `CardViewInteraction`

Given:

- 解答 overlay が開き、close callback を Story 側の状態に反映する。

When:

- Close card を押す。

Then:

- close callback が一度通知され、Close card が消える。

<a id="storybook-card-list-08"></a>

### STORYBOOK-CARD-LIST-08 標準順への変更を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `NewestAdded`

Given:

- 並び順は newest で、変更 callback を渡す。

When:

- Sort order で standard を選ぶ。

Then:

- 変更 callback に standard を渡す。

<a id="storybook-card-list-09"></a>

### STORYBOOK-CARD-LIST-09 編集を要求してメニューを閉じる

カテゴリ: `interaction`

対応 Story: [CardActionsMenu.stories.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) :: `Interaction`

Given:

- What is a binary search? のメニューが閉じており、開閉を Story 側に反映する。

When:

- メニューを開いて Edit を選ぶ。

Then:

- 対象テキストを含む読み上げ名でメニューを特定できる。編集 callback が一度通知され、メニューが閉じる。

<a id="storybook-card-list-10"></a>

### STORYBOOK-CARD-LIST-10 空理由がなければ案内を断定しない

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `Empty`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の0件・フィルター要約。

Given:

- Card は0件、フィルターなしで、空理由を渡さない。

When:

- 一覧を描画する。

Then:

- Cards、0 cards、Filters、No filters を表示する。No cards yet や、この一覧自身の tango ボタンは表示しない。

<a id="storybook-card-list-11"></a>

### STORYBOOK-CARD-LIST-11 長い選択タグを保持する

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の long selected tag。

Given:

- `tag-` に `unbroken` を30回連結したタグを選択している。

When:

- 一覧を描画する。

Then:

- フィルター要約に元のタグ文字列全体を保持する。

<a id="storybook-card-list-12"></a>

### STORYBOOK-CARD-LIST-12 タグ解除後に残るタグへフォーカスを移す

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の残るタグへのフォーカス。

Given:

- one / two を選択し、one の解除ボタンにフォーカスしている。解除を Story 側に反映する。

When:

- Enter で one を解除し、Tab を押す。

Then:

- one の解除を通知して two の解除ボタンへ移り、次の Tab で先頭 Card の View に移る。

<a id="storybook-card-list-13"></a>

### STORYBOOK-CARD-LIST-13 最後のタグ解除後はフィルターへ戻る

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の最後のタグ解除。

Given:

- two だけを選択し、その解除ボタンにフォーカスしている。

When:

- Space で解除する。

Then:

- two の解除を通知し、解除ボタンが消える。Filters / No filters という名前の summary にフォーカスが移る。

<a id="storybook-card-list-14"></a>

### STORYBOOK-CARD-LIST-14 Tab 移動で選択を変えない

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `RemovableSelectedTags`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の chip 間の Tab 移動。

Given:

- one / two を選択し、one の解除ボタンにフォーカスしている。

When:

- Tab、Shift+Tab と移動する。

Then:

- two、one の順にフォーカスが移り、どちらも解除されない。

<a id="storybook-card-list-15"></a>

### STORYBOOK-CARD-LIST-15 メニューを一つに保ち行の削除で閉じる

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) のメニュー排他と行の除去。

Given:

- Front / Other の2行を表示する。

When:

- Front、Other の順にメニューを開き、Other の行を入力から除去して再追加する。

Then:

- Other を開くと Front のメニューが閉じる。行を除くとメニューも閉じ、再追加しても開かない。

<a id="storybook-card-list-16"></a>

### STORYBOOK-CARD-LIST-16 並べ替え後も同じ Card を操作する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の reorder 後の View / Edit。

Given:

- 対象 Card の View、または開いたメニューの Edit にフォーカスしている。2条件を個別に用意する。

When:

- 対象を残したまま順序変更・別行の追加と削除を行い、Enter を押す。

Then:

- フォーカスを失わず、対象操作の callback に元の Card の ID を渡す。

<a id="storybook-card-list-17"></a>

### STORYBOOK-CARD-LIST-17 空状態から追加を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `Empty`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の no-cards の追加操作。

Given:

- no-cards の空状態に追加 callback を渡す。

When:

- 空状態の Add card を押す。

Then:

- 追加 callback が一度通知される。Actions メニュー経由とは操作入口が異なる。

<a id="storybook-card-list-18"></a>

### STORYBOOK-CARD-LIST-18 0件状態からフィルター解除を要求する

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `FilterZero`（追加先、未実装）

元テスト: [CardList.spec.tsx](../../../../src/pages/card-list/ui/CardList.spec.tsx) の filter-zero の解除操作。

Given:

- filter-zero に解除 callback を渡す。

When:

- Clear filters を押す。

Then:

- 解除 callback が一度通知される。フィルター計算や再取得結果は確認しない。

<a id="storybook-card-list-19"></a>

### STORYBOOK-CARD-LIST-19 行の編集要求に対象 ID を渡す

カテゴリ: `interaction`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`（追加先、未実装）

元テスト: [Card.spec.tsx](../../../../src/pages/card-list/ui/Card.spec.tsx) の text / tags と ID の通知。

Given:

- ID card、表面 Front、タグ one / two の行を表示する。

When:

- その行のメニューから Edit を選ぶ。

Then:

- タグを確認でき、編集 callback に card を渡す。

<a id="storybook-card-list-20"></a>

### STORYBOOK-CARD-LIST-20 処理中の行を操作させない

カテゴリ: `render`

対応 Story: [CardList.stories.tsx](../../../../src/pages/card-list/ui/CardList.stories.tsx) :: `ViewCard`（追加先、未実装）

元テスト: [Card.spec.tsx](../../../../src/pages/card-list/ui/Card.spec.tsx) の pending write。

Given:

- 処理中で無効な Card 行を表示する。

When:

- 行を描画する。

Then:

- View Front と Open actions for Front の両方が無効になる。

<a id="storybook-card-list-21"></a>

### STORYBOOK-CARD-LIST-21 削除を要求する

カテゴリ: `interaction`

対応 Story: [CardActionsMenu.stories.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardActionsMenu.spec.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.spec.tsx) の edit / delete actions。

Given:

- Binary search のメニューが閉じている。

When:

- メニューを開いて Delete を選ぶ。

Then:

- Card actions for Binary search の group に Edit / Delete の順で表示し、削除 callback が一度通知される。実際の削除は確認しない。

<a id="storybook-card-list-22"></a>

### STORYBOOK-CARD-LIST-22 無効なメニューを表示しない

カテゴリ: `render`

対応 Story: [CardActionsMenu.stories.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardActionsMenu.spec.tsx](../../../../src/pages/card-list/ui/CardActionsMenu.spec.tsx) の disabled trigger。

Given:

- 開く指定と無効指定の両方を渡す。

When:

- メニューを描画する。

Then:

- 開くボタンは無効で、menu は表示しない。
