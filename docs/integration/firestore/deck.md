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
| FIRESTORE-DECK-04 | write | [親 Deck だけを論理削除し子 Card を書き換えない](#firestore-deck-04) |

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

### FIRESTORE-DECK-04 親 Deck だけを論理削除し子 Card を書き換えない

カテゴリ: `write`

対応テスト: `[FIRESTORE-DECK-04] tombstones the parent without rewriting child documents`

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が2件存在する。

When:

- `deleteDeck("uid", deckId)` を実行し、送信完了後に親と子を取得する。

Then:

- Deck は物理削除されず、`deletedAt` に数値が入る。
- 2件の Card は残り、各 `deletedAt` は `null` のままである。

子 Card の非表示や第三者からのアクセス拒否はこの保存確認と区別する。第三者の読取制限は [FIRESTORE-RULES-04](./rules.md#firestore-rules-04) を参照する。
