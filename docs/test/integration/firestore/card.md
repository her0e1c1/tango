# Card Firestore 結合テスト仕様書

## 目的

Card 内容の書込範囲、部分失敗、論理削除を確認する。
Card.fsrs に学習状態を保存し、新規作成では null とする。

関連 E2E: [CARD-MANAGEMENT-01](../../e2e/card-management.md#card-management-01)、[CARD-MANAGEMENT-02](../../e2e/card-management.md#card-management-02)、[CARD-MANAGEMENT-05](../../e2e/card-management.md#card-management-05)、[IMPORT-03](../../e2e/import.md#import-03)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-01 | write | 正常系 | [Card の保存対象だけを新規作成できる](#firestore-card-01) |
| FIRESTORE-CARD-02 | write | 正常系 | [Card の編集で作成日時と対象外フィールドを維持できる](#firestore-card-02) |
| FIRESTORE-CARD-03 | write | 正常系 | [Card 作成時に旧個人学習フィールドを除外する](#firestore-card-03) |
| FIRESTORE-CARD-04 | write | 正常系 | [一括作成の再試行で既存 Card の学習状態を維持する](#firestore-card-04) |
| FIRESTORE-CARD-05 | batch | 異常系 | [一部の入力失敗を返しつつ有効な Card を保存できる](#firestore-card-05) |
| FIRESTORE-CARD-06 | write | 異常系 | [保存計画後に物理削除された Card を編集で再作成しない](#firestore-card-06) |
| FIRESTORE-CARD-07 | write | 正常系 | [Card の削除日時を保存し本文を維持できる](#firestore-card-07) |
| FIRESTORE-CARD-08 | read | 正常系 | [作成した Card の存在を確認できる](#firestore-card-08) |

<a id="firestore-card-01"></a>

### FIRESTORE-CARD-01 Card の保存対象だけを新規作成できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck が存在する。
- 新しい Card ID、本文 `front text` / `back text`、空の tags、`uniqueKey: "unique-key"` を用意する。
- 入力に `currentIndex: 1` と `cardOrderIds: ["card-1"]` も混在させる。

When:

- `createCard("uid", input)` を実行し、送信完了後に `card/{id}` を取得する。

Then:

- 指定した ID・UID・親 Deck ID・本文・tags・uniqueKey を保存する。`deletedAt` は `null` である。fsrs は null である。
- `createdAt` と `updatedAt` は同じ数値である。
- `currentIndex` と `cardOrderIds` は保存しない。

<a id="firestore-card-02"></a>

### FIRESTORE-CARD-02 Card の編集で作成日時と対象外フィールドを維持できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck と Card が存在し、Card に有効な FSRS を保存して値を取得している。

When:

- frontText を `updated` に変更する。入力に `currentIndex: 1` と `cardOrderIds: ["card-1"]` を混在させて `editCard` と既存 Card の `mutateCards` 更新を順に実行する。

Then:

- frontText は `updated`、`updatedAt` は数値になる。`createdAt` を含むその他の保存値は変わらない。
- `currentIndex` と `cardOrderIds` は追加しない。

<a id="firestore-card-03"></a>

### FIRESTORE-CARD-03 Card 作成時に旧個人学習フィールドを除外する

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck があり、Card 内容と評価済み FSRS、旧 difficulty、numberOfSeen を含む複製元の入力を用意する。

When:

- Card の作成 Adapter を実行する。

Then:

- 保存した Card に difficulty と numberOfSeen が含まれず、fsrs は null となる。

これは Adapter の入力処理の検証であり、直接 SDK の拒否は Rules 仕様で確認する。新規 ID の Card に複製元の学習状態を引き継がない。

<a id="firestore-card-04"></a>

### FIRESTORE-CARD-04 一括作成の再試行で既存 Card の学習状態を維持する

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck が存在する。新しい Card ID と frontText `upserted` を持つ完全な Card 入力を用意する。

When:

- `mutateCards("uid", [{ kind: "create", card }])` を実行する。
- 保存した Card を評価し、同じ ID の作成操作を再実行する。

Then:

- 入力した Card の値を保存し、createdAt と updatedAt は同じ数値になる。

- 再試行後も FSRS と本文、createdAt、updatedAt を含む保存値が変わらない。

再試行は SDK キャッシュに保存済みの同じ ID を使用する。キャッシュにない別クライアントの document の存在確認は保証に含めない。

<a id="firestore-card-05"></a>

### FIRESTORE-CARD-05 一部の入力失敗を返しつつ有効な Card を保存できる

カテゴリ: `batch`

区分: 異常系

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

区分: 異常系

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

区分: 正常系

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

区分: 正常系

Given:

- 本人の親 Deck が存在し、新しい Card を `createCard` で作成している。

When:

- SDK の送信完了後に `card/{id}` を取得する。

Then:

- 取得した snapshot の `exists()` は `true` になる。
