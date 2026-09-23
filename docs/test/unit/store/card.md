# Card Store 単体テスト仕様書

## 目的

Card リモートストア (`cardStore`) の初期状態、リモート Card スナップショットによる全置換更新、および認証スコープ終了時のクリア処理を確認する。

対応ファイル: [`store.ts`](../../../../src/entities/card/model/store.ts) / [`replaceRemoteCards.ts`](../../../../src/entities/card/model/actions/replaceRemoteCards.ts) / [`clearRemoteCards.ts`](../../../../src/entities/card/model/actions/clearRemoteCards.ts) / [`subscription.spec.tsx`](../../../../src/entities/card/api/subscription.spec.tsx)

関連 E2E: [CARD-VIEW-01](../../e2e/card-view.md#card-view-01)、[CARD-MANAGEMENT-01](../../e2e/card-management.md#card-management-01)

## 共通前提

テスト実行前に `cardStore.setState({ remoteCards: [] })` を呼び出し、`cardStore` のリモート Card 一覧を空配列に初期化する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-CARD-01 | initial | [初期状態で remoteCards が空配列であること](#unit-store-card-01) |
| UNIT-STORE-CARD-02 | state-change | [リモートスナップショットで Card 一覧を全置換できること](#unit-store-card-02) |
| UNIT-STORE-CARD-03 | scope-reset | [認証スコープ終了時に remoteCards をクリアできること](#unit-store-card-03) |

<a id="unit-store-card-01"></a>

### UNIT-STORE-CARD-01 初期状態で remoteCards が空配列であること

カテゴリ: `initial`

対応テスト: `Card Firestore subscription [CARD-VIEW-01]`

Given:

- `cardStore` が初期化されている。

When:

- `cardStore.getState()` を取得する。

Then:

- `remoteCards` は空の配列 `[]` である。

<a id="unit-store-card-02"></a>

### UNIT-STORE-CARD-02 リモートスナップショットで Card 一覧を全置換できること

カテゴリ: `state-change`

対応テスト: `[CARD-VIEW-01] fully replaces active Cards from each snapshot`

Given:

- 初期状態の `cardStore` が存在する。
- 1つのアクティブな RemoteCard オブジェクトを用意する。

When:

- `replaceRemoteCards([remoteCard])` を呼び出し、その後別の RemoteCard 配列で再度呼び出す。

Then:

- `cardStore.getState().remoteCards` の内容が、渡されたスナップショットで完全に置換され最新の状態が反映される。

<a id="unit-store-card-03"></a>

### UNIT-STORE-CARD-03 認証スコープ終了時に remoteCards をクリアできること

カテゴリ: `scope-reset`

対応テスト: 仕様（アクション `clearRemoteCards.ts`）定義

Given:

- `cardStore` に RemoteCard が保持されている。

When:

- `clearRemoteCards()` を呼び出す。

Then:

- `cardStore.getState().remoteCards` は空配列 `[]` にクリアされる。
