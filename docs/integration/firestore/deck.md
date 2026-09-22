# Deck Firestore 結合テスト仕様書

## 目的

Deck の作成・部分更新・論理削除を、Firestore 上の保存値として確認する。

対応ファイル: [`deck.spec.ts`](../../../test/integration/firestore/deck.spec.ts)

関連 E2E: [DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)、[DECK-MANAGEMENT-02](../../e2e/deck-management.md#deck-management-02)、[DECK-MANAGEMENT-05](../../e2e/deck-management.md#deck-management-05)

## 共通前提

本人の非匿名認証 UID は `uid` とする。各ケースは別の Deck ID を使う。API の完了は local 反映なので、保存値の確認前に `waitForPendingWrites` を待つ。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-DECK-01 | write | [Deck の保存対象だけを新規作成できる](#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | [Deck の編集で作成日時と対象外フィールドを維持できる](#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | [URL の省略と明示的なクリアを区別できる](#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | [Deck と配下 Card をまとめて論理削除できる](#firestore-deck-04) |\n| FIRESTORE-DECK-05 | batch | [Card がない Deck を論理削除できる](#firestore-deck-05) |\n| FIRESTORE-DECK-06 | batch | [Deck と配下 Card の削除を原子的に扱う](#firestore-deck-06) |

<a id="firestore-deck-01"></a>

### FIRESTORE-DECK-01 Deck の保存対象だけを新規作成できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-DECK-01] should create a deck and check if exists`

Given:

- 本人の新しい Deck ID と name `new deck name` を用意する。
- 入力に学習 session の `currentIndex: 1`、`cardOrderIds: ["card-1"]` も混在させる。

When:

- `createDeck("uid", input)` を実行し、SDK の送信完了後に `deck/{id}` を取得する。

Then:

- 指定した ID・UID・name と既定の Deck 設定を保存する。難易度範囲は `1`〜`10`、`deletedAt` は `null` である。
- `createdAt` と `updatedAt` は同じ数値であり、document が存在する。
- `localMode`、`currentIndex`、`cardOrderIds` は保存しない。

<a id="firestore-deck-02"></a>

### FIRESTORE-DECK-02 Deck の編集で作成日時と対象外フィールドを維持できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-DECK-02] should update a deck`

Given:

- 本人の Deck が存在し、作成直後の保存値を取得している。

When:

- name を `updated` に変更する。入力に `currentIndex: 1` と `cardOrderIds: ["card-1"]` を混在させて `editDeck` を実行する。

Then:

- name は `updated`、`updatedAt` は数値になる。`createdAt` を含むその他の保存値は変わらない。
- `localMode`、`currentIndex`、`cardOrderIds` は追加しない。

<a id="firestore-deck-03"></a>

### FIRESTORE-DECK-03 URL の省略と明示的なクリアを区別できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-DECK-03] preserves an omitted URL and removes a cleared URL`

Given:

- 本人の Deck に URL `https://example.com/deck` が保存されている。

When:

- URL を省略した name の編集を保存し、その後 `url: null` を指定して保存する。

Then:

- 最初の編集後も既存の URL を保持する。
- `url: null` の保存後は `url` フィールド自体がなくなる。

<a id="firestore-deck-04"></a>

### FIRESTORE-DECK-04 Deck と配下 Card をまとめて論理削除できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-DECK-04] tombstones a Deck and all child Cards atomically`

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が2件存在する。
- 別の Deck と、その配下 Card も存在する。

When:

- `deleteDeck("uid", deckId)` を実行し、送信完了後に対象 Deck と Card を取得する。

Then:

- 対象 Deck は物理削除されず、`deletedAt` に数値が入る。
- 対象 Deck に属する2件の Card も物理削除されず、`deletedAt` に数値が入る。
- Deck と2件の Card の `deletedAt` は同じ削除操作の時刻である。
- 別の Deck とその配下 Card は変更されない。

<a id="firestore-deck-05"></a>

### FIRESTORE-DECK-05 Card がない Deck を論理削除できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-DECK-05] tombstones an empty Deck`

Given:

- 本人の Deck が存在し、その Deck に属する Card は存在しない。

When:

- `deleteDeck("uid", deckId)` を実行し、送信完了後に対象 Deck を取得する。

Then:

- 対象 Deck は物理削除されず、`deletedAt` に数値が入る。
- 子 Card が0件でも削除操作は成功する。

<a id="firestore-deck-06"></a>

### FIRESTORE-DECK-06 Deck と配下 Card の削除を原子的に扱う

カテゴリ: `batch`

対応テスト: `[FIRESTORE-DECK-06] leaves the Deck and all child Cards unchanged when the delete batch is rejected`

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が複数存在する。
- 同一 batch 内の Card 更新の1件が Firestore Rules に拒否される状態を用意する。
- 削除前の Deck と全 Card の保存値を取得している。

When:

- Deck と配下 Card を同一 batch で論理削除する操作を実行し、書込失敗を待つ。

Then:

- 削除操作は失敗する。
- Deck の `deletedAt` は変更されない。
- 配下 Card は一部だけ削除された状態にならず、全件の `deletedAt` が削除前の値のままである。

このケースでは「Deck は削除済みだが Card が残る」「一部の Card だけ削除済み」という部分成功を許可しない。
