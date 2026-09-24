# Deck Firestore 結合テスト仕様書

## 目的

Deck の公開された保存操作を通して、作成・部分更新・論理削除の結果を確認する。
入力の検証と Rules の認可を区別し、ローカル反映とサーバーへの保存を同一視しない。

関連 E2E: [DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)、[DECK-MANAGEMENT-02](../../e2e/deck-management.md#deck-management-02)、[DECK-MANAGEMENT-05](../../e2e/deck-management.md#deck-management-05)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-DECK-01 | write | 正常系 | [Deck の保存対象だけを新規作成できる](#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | 正常系 | [Deck の編集で作成日時と対象外フィールドを維持できる](#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | 正常系 | [URL の省略と明示的なクリアを区別できる](#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | 正常系 | [Deck を論理削除して子 Card の保存内容を保持する](#firestore-deck-04) |
| FIRESTORE-DECK-05 | batch | 正常系 | [Card がない Deck を論理削除できる](#firestore-deck-05) |
| FIRESTORE-DECK-06 | batch | 異常系 | [Deck と配下 Card の削除を原子的に扱う](#firestore-deck-06) |

<a id="firestore-deck-01"></a>

### FIRESTORE-DECK-01 Deck の保存対象だけを新規作成できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の新しい Deck ID と name `new deck name` が指定されている。
- 作成入力に学習 session の `currentIndex: 1`、`cardOrderIds: ["card-1"]` も含まれている。

When:

- 公開された Deck の新規作成操作で保存する。

Then:

- 登録タグ `tags` は入力に含まれていても新たに保存されない。

- サーバー上に指定した ID・UID・name と既定の Deck 設定を保存する。難易度範囲は `1`〜`10`、`deletedAt` は `null` である。
- `createdAt` は数値、`updatedAt` はサーバー確定 Timestamp であり、document が存在する。
- `localMode`、`currentIndex`、`cardOrderIds` は保存しない。

<a id="firestore-deck-02"></a>

### FIRESTORE-DECK-02 Deck の編集で作成日時と対象外フィールドを維持できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の Deck が存在し、変更前の名前・作成日時・設定が保存されている。

When:

- 公開された編集操作で name を `updated` に変更する。編集入力には `currentIndex: 1` と `cardOrderIds: ["card-1"]` も含める。

Then:

- 登録タグ `tags` は入力に含まれていても新たに保存されない。

- サーバー上の name は `updated`、`updatedAt` はサーバー確定 Timestamp になる。`createdAt` を含むその他の保存値は変わらない。
- `localMode`、`currentIndex`、`cardOrderIds` は追加しない。

<a id="firestore-deck-03"></a>

### FIRESTORE-DECK-03 [TODO] URL の省略と明示的なクリアを区別できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の Deck に URL `https://example.com/deck` が保存されている。
- 次の入力を、それぞれ同じ保存済み状態から独立して確認する。

| 編集入力 | 保存後の URL |
| --- | --- |
| name だけを変更し、URL を指定しない | 保存済みの URL を維持する |
| `url: null` を指定する | `url` フィールドが存在しない |

When:

- 対象の編集入力を公開された Deck の編集操作で保存する。

Then:

- サーバー上の URL は表の結果となり、省略を削除要求として扱わない。

<a id="firestore-deck-04"></a>

### FIRESTORE-DECK-04 Deck を論理削除して子 Card の保存内容を保持する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が2件存在する。
- 別の Deck と、その配下 Card も存在する。

When:

- 公開された削除操作で対象 Deck を削除する。

Then:

- サーバー上の対象 Deck は物理削除されず、`deletedAt` に数値が入る。
- 対象 Deck に属する2件の Card は物理削除されず、本文・FSRS・更新時刻・`deletedAt: null` を維持する。
- 親 Deck の削除による子 Card の非表示は [差分同期](./incremental-sync.md#firestore-incremental-sync-02) で確認する。
- 別の Deck とその配下 Card は変更されない。

<a id="firestore-deck-05"></a>

### FIRESTORE-DECK-05 Card がない Deck を論理削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck が存在し、その Deck に属する Card は存在しない。

When:

- 公開された削除操作で対象 Deck を削除する。

Then:

- サーバー上の対象 Deck は物理削除されず、`deletedAt` に数値が入る。
- 子 Card が0件でも削除操作は成功する。

<a id="firestore-deck-06"></a>

### FIRESTORE-DECK-06 [TODO] Deck と配下 Card の削除を原子的に扱う

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が複数存在する。
- 削除対象の Card のうち1件は、今回の認証状態では更新を許可されない。
- Deck と全 Card の削除前の保存値が分かっている。

When:

- 公開された削除操作で、Deck と配下 Card をまとめて論理削除する。

Then:

- 削除の失敗が通知される。
- サーバー上の Deck の `deletedAt` は変更されない。
- 配下 Card の `deletedAt` は全件とも削除前の値であり、親だけ・子だけ・一部の子だけが削除された部分成功を残さない。
