# Deck List Storybook 結合テスト仕様書

## 目的

Deck 一覧のメニュー、閲覧要求、空状態、復習件数と日本語表示を確認する。

## 検証境界

DeckList、DeckActionsMenu と実際の子 UI。操作の通知先は公開 callback の spy とし、遷移・ダウンロード・復習件数の算出は検証しない。

関連 E2E: [deck-navigation](../../e2e/deck-navigation.md) / [deck-management](../../e2e/deck-management.md) / [deck-transfer](../../e2e/deck-transfer.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-DECK-LIST-01 | interaction | [一覧から Deck の作成を要求する](#storybook-deck-list-01) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ListActions` |
| STORYBOOK-DECK-LIST-02 | interaction | [一覧から Deck のインポートを要求する](#storybook-deck-list-02) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ListActions` |
| STORYBOOK-DECK-LIST-03 | interaction | [日本語の一覧と操作名を表示する](#storybook-deck-list-03) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `Japanese` |
| STORYBOOK-DECK-LIST-04 | interaction | [選択した Deck の ID を閲覧 callback に渡す](#storybook-deck-list-04) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ViewDeck` |
| STORYBOOK-DECK-LIST-05 | interaction | [確定した空の一覧でも追加の導線を表示する](#storybook-deck-list-05) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `Empty` |
| STORYBOOK-DECK-LIST-06 | render | [渡された復習件数を一覧に表示する](#storybook-deck-list-06) | [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ReviewCounts` |
| STORYBOOK-DECK-LIST-07 | interaction | [Deck のダウンロードを要求してメニューを閉じる](#storybook-deck-list-07) | [DeckActionsMenu.stories.tsx](../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx) :: `Interaction` |
| STORYBOOK-DECK-LIST-08 | interaction | [Deck の学習履歴を開くよう要求する](#storybook-deck-list-08) | [DeckActionsMenu.stories.tsx](../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx) :: `History` |

<a id="storybook-deck-list-01"></a>

### STORYBOOK-DECK-LIST-01 一覧から Deck の作成を要求する

カテゴリ: `interaction`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ListActions`

Given:

- Deck 一覧を表示し、作成・インポートの callback を用意する。

When:

- Actions を開き、Create deck を選択する。

Then:

- 作成 callback が通知され、メニューが閉じる。

<a id="storybook-deck-list-02"></a>

### STORYBOOK-DECK-LIST-02 一覧から Deck のインポートを要求する

カテゴリ: `interaction`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ListActions`

Given:

- Deck 一覧の Actions メニューが閉じている。

When:

- Actions を開き、Import decks を選択する。

Then:

- インポート callback が通知され、メニューが閉じる。

<a id="storybook-deck-list-03"></a>

### STORYBOOK-DECK-LIST-03 日本語の一覧と操作名を表示する

カテゴリ: `interaction`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `Japanese`

Given:

- 日本語 locale で、学習中の Deck を含む一覧を用意する。

When:

- 一覧を描画し、「アクション」を開く。

Then:

- 見出し「デッキ」と「デッキを作成」「デッキをインポート」が表示される。
- 渡した先頭 Deck の名前が表示される。

<a id="storybook-deck-list-04"></a>

### STORYBOOK-DECK-LIST-04 選択した Deck の ID を閲覧 callback に渡す

カテゴリ: `interaction`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ViewDeck`

Given:

- 閲覧 callback と学習中の Deck を含む一覧を用意する。

When:

- 先頭 Deck の View ボタンを押す。

Then:

- 閲覧 callback に、その Deck の ID が渡される。

<a id="storybook-deck-list-05"></a>

### STORYBOOK-DECK-LIST-05 確定した空の一覧でも追加の導線を表示する

カテゴリ: `interaction`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `Empty`

Given:

- 学習中・その他の Deck がともに空で、空状態が確定している。

When:

- 一覧を描画し、Actions を開く。

Then:

- 0 decks、No decks yet、Create deck ボタンが表示される。
- Create deck と Import decks のメニュー項目が有効である。

<a id="storybook-deck-list-06"></a>

### STORYBOOK-DECK-LIST-06 渡された復習件数を一覧に表示する

カテゴリ: `render`

対応 Story: [DeckList.stories.tsx](../../../src/pages/deck-list/ui/DeckList.stories.tsx) :: `ReviewCounts`

Given:

- 復習対象を含む一覧と、期限到来5件・新規5件の集計値を渡す。

When:

- 一覧を描画する。

Then:

- Review now の見出しと 5 due · 5 new が表示される。

<a id="storybook-deck-list-07"></a>

### STORYBOOK-DECK-LIST-07 Deck のダウンロードを要求してメニューを閉じる

カテゴリ: `interaction`

対応 Story: [DeckActionsMenu.stories.tsx](../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx) :: `Interaction`

Given:

- Japanese verbs のメニューが閉じており、開閉を Story 側の状態で反映する。

When:

- 対象 Deck の操作メニューを開き、Download を選択する。

Then:

- 開いたメニューは対象 Deck 名を含む読み上げ名を持つ。
- ダウンロード callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-08"></a>

### STORYBOOK-DECK-LIST-08 Deck の学習履歴を開くよう要求する

カテゴリ: `interaction`

対応 Story: [DeckActionsMenu.stories.tsx](../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx) :: `History`

Given:

- 学習履歴 callback を持つ Deck の操作メニューが閉じている。

When:

- メニューを開き、Study history を選択する。

Then:

- 学習履歴 callback が一度通知される。

## 自動アサーションに含めない項目

`Checking`、`BootstrapError` などの表示専用 Story は、復旧操作の自動アサーションを持たない。
