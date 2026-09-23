# Subscriptions Firestore 結合テスト仕様書

## 目的

Firestore の snapshot を Card / Deck store に反映し、購読解除で反映を止める契約を確認する。

対応ファイル: [`subscriptions.spec.ts`](../../../../test/integration/firestore/subscriptions.spec.ts)

追加テストの仕様（未実装・未検証）は [Snapshot](./snapshot.md) を参照する。本書の既存3ケースとは分けて管理する。

関連 E2E: [CARD-VIEW-01](../../e2e/card-view.md#card-view-01)、[DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)

## 共通前提

本人の非匿名認証 UID は `uid` とする。ケースごとに Card / Deck store を空にし、別の ID を使う。追加・更新・削除の反映は対象 ID の期待値になるまで待つ。親 Deck を購読で準備する場合は、Card の作成前に Deck store への反映を待つ。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-SUBSCRIPTIONS-01 | read | [初期 snapshot から Card 本文を取得できる](#firestore-subscriptions-01) |
| FIRESTORE-SUBSCRIPTIONS-02 | batch | [購読中の追加・更新・論理削除を store に反映できる](#firestore-subscriptions-02) |
| FIRESTORE-SUBSCRIPTIONS-03 | read | [購読解除後の編集で store の値を更新しない](#firestore-subscriptions-03) |

<a id="firestore-subscriptions-01"></a>

### FIRESTORE-SUBSCRIPTIONS-01 初期 snapshot から Card 本文を取得できる

カテゴリ: `read`

対応テスト: `[FIRESTORE-SUBSCRIPTIONS-01] loads Card content from the initial snapshot`

Given:

- 本人の Deck と Card を保存済みで、親 Deck を store に保持している。
- Card は frontText `Fetched Card` を持つ。

When:

- `subscribeCards("uid", onError)` を開始し、対象 ID の store 反映を待つ。

Then:

- Card store に同じ ID と本文 が反映される。
- 購読エラーは通知されない。

<a id="firestore-subscriptions-02"></a>

### FIRESTORE-SUBSCRIPTIONS-02 購読中の追加・更新・論理削除を store に反映できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-SUBSCRIPTIONS-02] delivers initial, update, and delete snapshots without a cursor`

Given:

- Card と Deck の store を空にし、本人の UID で両方の購読を開始している。

When:

- 本人の Deck を作成して store 反映を待ち、その後 Card を作成して反映を待つ。
- Deck の name と Card の frontText を `Updated` に変更して反映を待つ。
- Card と Deck をそれぞれ削除して反映を待つ。

Then:

- 追加時は両方の ID、更新時は両方の `Updated` が各 store に現れる。
- 削除後は両方の ID が各 store からなくなる。購読エラーは発生しない。

このケースは Card と Deck の両方を削除する。親 Deck だけの削除による子 Card の非表示確認とは区別する。

<a id="firestore-subscriptions-03"></a>

### FIRESTORE-SUBSCRIPTIONS-03 購読解除後の編集で store の値を更新しない

カテゴリ: `read`

対応テスト: `[FIRESTORE-SUBSCRIPTIONS-03] stops changing stores after unsubscribe`

Given:

- 本人の Deck と Card を購読中で、name と frontText が `Before stop` として store に反映済みである。

When:

- 両方の購読を解除し、Deck と Card を `After stop` に編集する。

Then:

- 編集操作後の各 store には `Before stop` が残る。
- 購読エラーは発生しない。

既存 assertion は編集操作直後の値を確認する。遅延イベントまで含めた長時間の無反映を、このテストだけで保証しない。
