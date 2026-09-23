# Deck Store 単体テスト仕様書

## 目的

Deck リモートストア (`deckStore`) の初期状態、リモート Deck スナップショットによる全置換更新、および認証スコープ終了時のクリア処理を確認する。

対応ファイル: [`store.ts`](../../../../src/entities/deck/model/store.ts) / [`replaceRemoteDecks.ts`](../../../../src/entities/deck/model/actions/replaceRemoteDecks.ts) / [`clearRemoteDecks.ts`](../../../../src/entities/deck/model/actions/clearRemoteDecks.ts) / [`subscription.spec.tsx`](../../../../src/entities/deck/api/subscription.spec.tsx)

関連 E2E: [CARD-LIST-ACTIONS-01](../../e2e/card-list-actions.md#card-list-actions-01)、[DECK-NAVIGATION-01](../../e2e/deck-navigation.md#deck-navigation-01)

## 共通前提

テスト実行前に `deckStore.setState({ remoteDecks: [] })` を呼び出し、`deckStore` のリモート Deck 一覧を空配列に初期化する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-DECK-01 | initial | [初期状態で remoteDecks が空配列であること](#unit-store-deck-01) |
| UNIT-STORE-DECK-02 | state-change | [リモートスナップショットで Deck 一覧を置換できること](#unit-store-deck-02) |
| UNIT-STORE-DECK-03 | scope-reset | [認証スコープ終了時に remoteDecks をクリアできること](#unit-store-deck-03) |

<a id="unit-store-deck-01"></a>

### UNIT-STORE-DECK-01 初期状態で remoteDecks が空配列であること

カテゴリ: `initial`

対応テスト: `Deck Firestore subscription [CARD-LIST-ACTIONS-01]`

Given:

- `deckStore` が初期化されている。

When:

- `deckStore.getState()` を取得する。

Then:

- `remoteDecks` は空の配列 `[]` である。

<a id="unit-store-deck-02"></a>

### UNIT-STORE-DECK-02 リモートスナップショットで Deck 一覧を置換できること

カテゴリ: `state-change`

対応テスト: `[CARD-LIST-ACTIONS-01] replaces the store with active Decks`

Given:

- 初期状態の `deckStore` が存在する。
- アクティブな Deck オブジェクトを用意する。

When:

- `replaceRemoteDecks([deck])` を呼び出す。

Then:

- `deckStore.getState().remoteDecks` に指定した Deck 配列が保存・置換される。

<a id="unit-store-deck-03"></a>

### UNIT-STORE-DECK-03 認証スコープ終了時に remoteDecks をクリアできること

カテゴリ: `scope-reset`

対応テスト: 仕様（アクション `clearRemoteDecks.ts`）定義

Given:

- `deckStore` に Deck が保持されている。

When:

- `clearRemoteDecks()` を呼び出す。

Then:

- `deckStore.getState().remoteDecks` は空配列 `[]` にクリアされる。
