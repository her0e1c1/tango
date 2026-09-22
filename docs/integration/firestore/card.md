# Card Firestore 結合テスト仕様書

## 目的

Card 内容の書込範囲、部分失敗、論理削除を確認する。

対応ファイル: [`card.spec.ts`](../../../test/integration/firestore/card.spec.ts)

関連 E2E: [CARD-MANAGEMENT-01](../../e2e/card-management.md#card-management-01)、[CARD-MANAGEMENT-02](../../e2e/card-management.md#card-management-02)、[CARD-MANAGEMENT-05](../../e2e/card-management.md#card-management-05)、[IMPORT-03](../../e2e/import.md#import-03)

## 共通前提

本人の非匿名認証 UID は `uid` とする。作成・更新対象には本人所有の親 Deck を用意し、各ケースで別の ID を使う。個人学習状態は Card の保存値に含めない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-CARD-01 | write | [Card の保存対象だけを新規作成できる](#firestore-card-01) |
| FIRESTORE-CARD-02 | write | [Card の編集で作成日時と対象外フィールドを維持できる](#firestore-card-02) |
| FIRESTORE-CARD-03 | write | [Card 作成時に旧個人学習フィールドを除外する](#firestore-card-03) |
| FIRESTORE-CARD-04 | write | [一括保存 API で新規 Card を保存できる](#firestore-card-04) |
| FIRESTORE-CARD-05 | batch | [一部の入力失敗を返しつつ有効な Card を保存できる](#firestore-card-05) |
| FIRESTORE-CARD-06 | write | [保存計画後に物理削除された Card を編集で再作成しない](#firestore-card-06) |
| FIRESTORE-CARD-07 | write | [Card の削除日時を保存し本文を維持できる](#firestore-card-07) |
| FIRESTORE-CARD-08 | read | [作成した Card の存在を確認できる](#firestore-card-08) |

<a id="firestore-card-01"></a>

### FIRESTORE-CARD-01 Card の保存対象だけを新規作成できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-01] should create a card`

Given:

- 本人の親 Deck が存在する。
- 新しい Card ID、本文 `front text` / `back text`、空の tags、`uniqueKey: "unique-key"` を用意する。
- 入力に `currentIndex: 1` と `cardOrderIds: ["card-1"]` も混在させる。

When:

- `createCard("uid", input)` を実行し、送信完了後に `card/{id}` を取得する。

Then:

- 指定した ID・UID・親 Deck ID・本文・tags・uniqueKey を保存する。`deletedAt` は `null` である。個人学習状態は Card に保存しない。
- `createdAt` と `updatedAt` は同じ数値である。
- `currentIndex` と `cardOrderIds` は保存しない。

<a id="firestore-card-02"></a>

### FIRESTORE-CARD-02 Card の編集で作成日時と対象外フィールドを維持できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-02] should update a card`

Given:

- 本人の親 Deck と Card が存在し、Card の作成直後の保存値を取得している。

When:

- frontText を `updated` に変更する。入力に `currentIndex: 1` と `cardOrderIds: ["card-1"]` を混在させて `editCard` を実行する。

Then:

- frontText は `updated`、`updatedAt` は数値になる。`createdAt` を含むその他の保存値は変わらない。
- `currentIndex` と `cardOrderIds` は追加しない。

<a id="firestore-card-03"></a>

### FIRESTORE-CARD-03 Card 作成時に旧個人学習フィールドを除外する

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-03] excludes personal study fields from new Card writes`

Given:

- 本人の親 Deck があり、Card 内容と旧 difficulty、numberOfSeen を含む入力を用意する。

When:

- Card の作成 Adapter を実行する。

Then:

- 保存した Card に difficulty と numberOfSeen が含まれない。

これは Adapter の入力処理の検証であり、直接 SDK の拒否は Rules 仕様で確認する。State document が作成されていないことは、このケースの assertion では直接確認していない。

<a id="firestore-card-04"></a>

### FIRESTORE-CARD-04 一括保存 API で新規 Card を保存できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-04] should upsert a complete card`

Given:

- 本人の親 Deck が存在する。新しい Card ID と frontText `upserted` を持つ完全な Card 入力を用意する。

When:

- `mutateCards("uid", [{ kind: "create", card }])` を実行する。

Then:

- 入力した Card の値を保存し、createdAt と updatedAt は同じ数値になる。

既存テスト名の `upsert` にかかわらず、このケースは未使用 ID への create だけを検証する。既存 document の上書きは保証に含めない。

<a id="firestore-card-05"></a>

### FIRESTORE-CARD-05 一部の入力失敗を返しつつ有効な Card を保存できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-CARD-05] reports failed imported Cards while persisting valid Cards`

Given:

- 本人の親 Deck が存在する。
- frontText が文字列 `valid` の Card と、数値 `42` の不正な Card を別々の新しい ID で用意する。

When:

- 2件の create を同じ `mutateCards` 呼び出しに渡す。

Then:

- 呼び出しはエラーを返す。
- 有効な Card は入力どおり保存され、createdAt と updatedAt は同じ数値になる。

不正入力の拒否はアプリケーション側の validation であり、Rules の型検証ではない。不正な Card の保存先不在は既存 assertion で直接確認していない。

<a id="firestore-card-06"></a>

### FIRESTORE-CARD-06 保存計画後に物理削除された Card を編集で再作成しない

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-06] does not recreate an existing Card deleted after import planning`

Given:

- 本人の親 Deck と Card が存在し、store に編集対象の Card がある。
- 保存計画後、SDK の `deleteDoc` でその Card を物理削除する。

When:

- 書込エラーを購読してから、その Card の edit を `mutateCards` に渡す。
- エラー通知を待ち、本人の Card を UID 条件付き query で取得する。

Then:

- 書込エラーが通知される。
- query 結果に対象 ID はなく、編集によって Card が再作成されない。

<a id="firestore-card-07"></a>

### FIRESTORE-CARD-07 Card の削除日時を保存し本文を維持できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-07] should logical-remove a card`

Given:

- 本人の親 Deck と Card が存在し、削除前の保存値を取得している。

When:

- `deleteCard("uid", card)` を実行し、送信完了後に対象を取得する。

Then:

- document は残り、deletedAt と updatedAt が同じ数値になる。
- createdAt とその他の保存値は変わらない。

<a id="firestore-card-08"></a>

### FIRESTORE-CARD-08 作成した Card の存在を確認できる

カテゴリ: `read`

対応テスト: `[FIRESTORE-CARD-08] should exists a card`

Given:

- 本人の親 Deck が存在し、新しい Card を `createCard` で作成している。

When:

- SDK の送信完了後に `card/{id}` を取得する。

Then:

- 取得した snapshot の `exists()` は `true` になる。
