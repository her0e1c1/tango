# Deck Firestore 結合テスト仕様書

## 目的

Deck の公開された保存操作を通して、作成・部分更新・論理削除・タグ変更の結果を確認する。
入力の検証と Rules の認可を区別し、ローカル反映とサーバーへの保存を同一視しない。

関連 E2E: [DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)、[DECK-MANAGEMENT-02](../../e2e/deck-management.md#deck-management-02)、[DECK-MANAGEMENT-05](../../e2e/deck-management.md#deck-management-05)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-DECK-01 | write | 正常系 | [Deck の保存対象だけを新規作成できる](#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | 正常系 | [Deck の編集で作成日時と対象外フィールドを維持できる](#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | 正常系 | [URL の省略と明示的なクリアを区別できる](#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | 正常系 | [Deck と配下 Card をまとめて論理削除できる](#firestore-deck-04) |
| FIRESTORE-DECK-05 | batch | 正常系 | [Card がない Deck を論理削除できる](#firestore-deck-05) |
| FIRESTORE-DECK-06 | batch | 異常系 | [Deck と配下 Card の削除を原子的に扱う](#firestore-deck-06) |
| FIRESTORE-DECK-07 | batch | 正常系 | [多数の Card と登録タグをまとめて改名する](#firestore-deck-07) |
| FIRESTORE-DECK-08 | batch | 異常系 | [タグ更新の拒否で部分保存を残さない](#firestore-deck-08) |
| FIRESTORE-DECK-09 | batch | 正常系 | [保留中の Card 保存の後にタグ変更を同期する](#firestore-deck-09) |
| FIRESTORE-DECK-10 | batch | 正常系 | [タグ名の交換と削除・再追加で Card の対応を維持する](#firestore-deck-10) |

<a id="firestore-deck-01"></a>

### FIRESTORE-DECK-01 [TODO] Deck の保存対象だけを新規作成できる

カテゴリ: `write`

区分: 正常系

Given:

- 本人の新しい Deck ID と name `new deck name` が指定されている。
- 作成入力に学習 session の `currentIndex: 1`、`cardOrderIds: ["card-1"]` も含まれている。

When:

- 公開された Deck の新規作成操作で保存する。

Then:

- サーバー上に指定した ID・UID・name と既定の Deck 設定を保存する。難易度範囲は `1`〜`10`、`deletedAt` は `null` である。
- `createdAt` と `updatedAt` は同じ数値であり、document が存在する。
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

- サーバー上の name は `updated`、`updatedAt` は数値になる。`createdAt` を含むその他の保存値は変わらない。
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

### FIRESTORE-DECK-04 [TODO] Deck と配下 Card をまとめて論理削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck と、その Deck に属する `deletedAt: null` の Card が2件存在する。
- 別の Deck と、その配下 Card も存在する。

When:

- 公開された削除操作で対象 Deck を削除する。

Then:

- サーバー上の対象 Deck は物理削除されず、`deletedAt` に数値が入る。
- 対象 Deck に属する2件の Card も物理削除されず、`deletedAt` に数値が入る。
- Deck と2件の Card の `deletedAt` は同じ削除操作の時刻である。
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

<a id="firestore-deck-07"></a>

### FIRESTORE-DECK-07 多数の Card と登録タグをまとめて改名する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck に旧タグと保持するタグを持つ Card が501枚ある。
- Deck に登録タグ一覧がまだない。

When:

- 公開された Deck の編集・タグ更新操作で、Deck 名と登録タグ、対象 Card の旧タグ名を一つの保存単位で変更する。

Then:

- サーバー上の Deck 名と登録タグ、全501枚の Card のタグが新しい値を保持する。
- 他のタグ、Card の本文・ID・削除状態は変わらない。

<a id="firestore-deck-08"></a>

### FIRESTORE-DECK-08 タグ更新の拒否で部分保存を残さない

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の Deck と、その Deck に属する旧タグ付き Card がある。
- 同じ保存単位に、本人の UID を別 UID に変更する不正な Card 更新が含まれている。

When:

- 公開された Deck 名・タグ更新と不正な Card 更新を、一つの保存単位として確定する。

Then:

- Rules による認可で Card 更新が拒否され、保存全体が失敗する。
- サーバー上の Deck 名・登録タグと Card の保存値は操作前と同一であり、部分保存を残さない。

<a id="firestore-deck-09"></a>

### FIRESTORE-DECK-09 保留中の Card 保存の後にタグ変更を同期する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck と旧タグ・保持するタグを持つ Card が同期済みである。
- 通信がない状態で、同じタグを持つ Card の追加と、既存 Card の本文変更をローカル保存している。
- 改名と削除を、それぞれ同じ変更前の状態から独立して確認する。

When:

- 公開された Deck 編集・タグ変更操作で名前を変更し、旧タグを改名または削除して再接続する。

Then:

- 追加済み・編集済み両方の Card が更新対象となる。
- オフライン中のローカル値と、再接続後のサーバー値に改名または削除の結果が残り、旧タグが復活しない。
- Deck 名の変更、先行する本文の変更と他のタグは保持される。

<a id="firestore-deck-10"></a>

### FIRESTORE-DECK-10 タグ名の交換と削除・再追加で Card の対応を維持する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck にタグ `a`、`b` が登録され、各タグを持つ別々の Card がある。

When:

- 同じ保存で `a` を `b`、`b` を `a` に交換する。または `a` を削除して同じ名前のタグを再追加する。

Then:

- 名前を交換した場合、元の `a` の Card には `b`、元の `b` の Card には `a` だけが保存される。
- 削除・再追加した場合、元の `a` の Card はタグなしとなり、元の `b` の Card は変わらない。
- どちらも Deck の登録タグは `a` と `b` を保持し、Card の他の情報は変わらない。
