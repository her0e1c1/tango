# Card Firestore 結合テスト仕様書

## 目的

Card の公開された保存操作を通して、内容の書込範囲、部分失敗、再試行、論理削除を確認する。Card.fsrs に学習状態を保存し、新規作成では null とする。
本書の入力拒否は Adapter の validation の契約であり、SDK を直接利用した Rules の認可とは区別する。

関連 E2E: [CARD-MANAGEMENT-01](../../e2e/card-management.md#card-management-01)、[CARD-MANAGEMENT-02](../../e2e/card-management.md#card-management-02)、[CARD-MANAGEMENT-05](../../e2e/card-management.md#card-management-05)、[IMPORT-03](../../e2e/deck-import.md#import-03)

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
- 新しい Card ID、本文 `front text` / `back text`、空の tags、`uniqueKey: "unique-key"` が指定されている。
- 作成入力に Card 内容ではない `currentIndex: 1` と `cardOrderIds: ["card-1"]` も含まれている。

When:

- 公開された Card の新規作成操作で保存する。

Then:

- サーバー上に指定した ID・UID・親 Deck ID・本文・tags・uniqueKey が保存される。`deletedAt` と `fsrs` は `null` である。
- `createdAt` と `updatedAt` は同じ数値である。
- `currentIndex` と `cardOrderIds` は保存されない。

<a id="firestore-card-02"></a>

### FIRESTORE-CARD-02 [TODO] Card の編集で作成日時と対象外フィールドを維持できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck と Card が存在し、Card は評価済みの有効な FSRS を持つ。
- 変更後とは異なる表面の本文と、裏面の本文・tags・uniqueKey・作成日時が保存されている。
- 単独編集と一括変更に含まれる編集を、それぞれ同じ変更前の状態から確認する。

When:

- 対象の編集操作で frontText を `updated` に変更する。編集入力には Card 内容ではない `currentIndex: 1` と `cardOrderIds: ["card-1"]` も含める。

Then:

- サーバー上の frontText は `updated`、`updatedAt` は数値になる。
- `createdAt`、FSRS、裏面の本文・tags・uniqueKey を含むその他の保存値は変わらない。
- `currentIndex` と `cardOrderIds` は追加されない。

<a id="firestore-card-03"></a>

### FIRESTORE-CARD-03 Card 作成時に旧個人学習フィールドを除外する

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck があり、Card 内容と評価済み FSRS、旧 difficulty、numberOfSeen を含む複製元の入力がある。

When:

- 公開された Card の新規作成操作で、新しい ID の Card を保存する。

Then:

- 保存した Card に difficulty と numberOfSeen が含まれず、fsrs は null となる。
- 新しい Card に複製元の学習状態を引き継がない。

<a id="firestore-card-04"></a>

### FIRESTORE-CARD-04 一括作成の再試行で既存 Card の学習状態を維持する

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck があり、一括作成で受け付けた Card が保存済みである。
- その Card は作成後に評価され、現在の本文、FSRS、作成日時、更新日時が保存されている。
- 同じクライアントが同じ Card ID の作成要求を再試行でき、保存済みの対象 Card を端末内でも参照できる。

When:

- 最初と同じ Card ID・作成入力で一括作成を再試行する。

Then:

- FSRS と本文、createdAt、updatedAt を含む保存値が再試行前から変わらない。
- 同じ Card を二重に作成しない。

<a id="firestore-card-05"></a>

### FIRESTORE-CARD-05 [TODO] 一部の入力失敗を返しつつ有効な Card を保存できる

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の親 Deck が存在する。
- frontText が文字列 `valid` の有効な Card と、数値 `42` の不正な Card が、別々の新しい ID で指定されている。

When:

- 両方の Card を一つの一括作成操作で保存する。

Then:

- 操作は入力の失敗をエラーとして返し、すべて成功した結果にはしない。
- 有効な Card はサーバー上に入力どおり保存され、createdAt と updatedAt は同じ数値になる。
- 不正な Card の ID にはサーバー上の保存データが作成されない。

<a id="firestore-card-06"></a>

### FIRESTORE-CARD-06 保存計画後に物理削除された Card を編集で再作成しない

カテゴリ: `write`

区分: 異常系

Given:

- 本人の親 Deck があり、既存の Card に対する編集内容が準備されている。
- その後、編集対象の Card がサーバー上から物理削除され、保存先に存在しなくなっている。
- アプリケーションは削除前の Card の ID・所有者・所属 Deck を編集対象として保持しており、削除の通知はまだ反映されていない。

When:

- 準備済みの内容で、その Card を一括変更の編集対象として保存する。

Then:

- 書込エラーが通知される。
- サーバー上に対象 ID の Card は存在せず、編集によって再作成されない。

<a id="firestore-card-07"></a>

### FIRESTORE-CARD-07 Card の削除日時を保存し本文を維持できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の親 Deck と Card が存在し、Card の内容と作成日時が保存されている。

When:

- 公開された Card の削除操作を行う。

Then:

- サーバー上の document は残り、deletedAt と updatedAt が同じ数値になる。
- createdAt とその他の保存値は変わらない。

<a id="firestore-card-08"></a>

### FIRESTORE-CARD-08 作成した Card の存在を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- 本人の親 Deck が存在し、新しい Card の作成とサーバーへの保存が完了している。

When:

- 作成した Card を ID で読み取る。

Then:

- 指定した ID の Card が存在することを確認できる。
