# Deck Firestore 結合テスト仕様書

## 目的

Deck の作成・部分更新・論理削除を、Firestore 上の保存値として確認する。

関連 E2E: [DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)、[DECK-MANAGEMENT-02](../../e2e/deck-management.md#deck-management-02)、[DECK-MANAGEMENT-05](../../e2e/deck-management.md#deck-management-05)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-DECK-01 | write | 正常系 | [Deck の保存対象だけを新規作成できる](#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | 正常系 | [Deck の編集で作成日時と対象外フィールドを維持できる](#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | 正常系 | [URL の省略と明示的なクリアを区別できる](#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | 正常系 | [Deck と配下 Card をまとめて論理削除できる](#firestore-deck-04) |
| FIRESTORE-DECK-05 | batch | 正常系 | [Card がない Deck を論理削除できる](#firestore-deck-05)（未実装・未検証） |
| FIRESTORE-DECK-06 | batch | 異常系 | [Deck と配下 Card の削除を原子的に扱う](#firestore-deck-06)（未実装・未検証） |
| FIRESTORE-DECK-07 | batch | 正常系 | [多数の Card と登録タグをまとめて改名する](#firestore-deck-07) |
| FIRESTORE-DECK-08 | batch | 異常系 | [タグ更新の拒否で部分保存を残さない](#firestore-deck-08) |

<a id="firestore-deck-01"></a>

### FIRESTORE-DECK-01 Deck の保存対象だけを新規作成できる

カテゴリ: `write`

区分: 正常系

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

区分: 正常系

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

区分: 正常系

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

区分: 正常系

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

区分: 正常系

検証状況: **未実装・未検証（TODO）**。以下は期待仕様であり、検証済みの保証ではない。

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

区分: 異常系

検証状況: **未実装・未検証（TODO）**。以下は期待仕様であり、検証済みの保証ではない。

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

<a id="firestore-deck-07"></a>

### FIRESTORE-DECK-07 多数の Card と登録タグをまとめて改名する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck に旧タグと保持するタグを持つ Card が501枚ある。
- Deck に登録タグ一覧がまだない。

When:

- Entity の公開されたタグ読取・更新操作を一つのトランザクションで実行し、旧タグを新しいタグに変更する。
- 続いて通常の Deck 編集で名前を保存する。

Then:

- 全501枚の Card と Deck の登録タグが新しい名前を保持する。
- 他のタグ、Card の本文・ID・削除状態は変わらない。
- 通常の Deck 編集が登録タグを上書きしない。

<a id="firestore-deck-08"></a>

### FIRESTORE-DECK-08 タグ更新の拒否で部分保存を残さない

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の Deck と、その Deck に属する旧タグ付き Card がある。
- 同じトランザクションに、本人の UID を別 UID に変更する不正な Card 書込が含まれる。

When:

- Entity の公開されたタグ更新操作を含むトランザクションを確定する。

Then:

- 実際の Firestore Rules が不正な Card 更新を拒否する。
- トランザクション全体が失敗し、Deck の登録タグと Card の保存値は操作前と同一である。
