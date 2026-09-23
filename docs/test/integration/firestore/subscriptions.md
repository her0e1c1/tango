# Subscriptions Firestore 結合テスト仕様書

## 目的

Card / Deck の公開された購読操作を通して、保存済みの内容と同一クライアント内の変更を取得でき、購読停止後は以前の取得結果を保持することを確認する。
空の結果、所有者の分離、不正データ、独立したクライアントからの更新は [Snapshot](./snapshot.md) を参照する。停止後の更新到達まで確認する契約は [FIRESTORE-SNAPSHOT-09](./snapshot.md#firestore-snapshot-09) として区別する。

関連 E2E: [CARD-VIEW-01](../../e2e/card-view.md#card-view-01)、[DECK-MANAGEMENT-01](../../e2e/deck-management.md#deck-management-01)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-SUBSCRIPTIONS-01 | read | 正常系 | [初回の購読結果から Card 本文を取得できる](#firestore-subscriptions-01) |
| FIRESTORE-SUBSCRIPTIONS-02 | batch | 正常系 | [購読中の追加・更新・論理削除を取得結果に反映する](#firestore-subscriptions-02) |
| FIRESTORE-SUBSCRIPTIONS-03 | read | 正常系 | [購読停止後の編集完了時にも以前の取得結果を保持する](#firestore-subscriptions-03) |

<a id="firestore-subscriptions-01"></a>

### FIRESTORE-SUBSCRIPTIONS-01 初回の購読結果から Card 本文を取得できる

カテゴリ: `read`

区分: 正常系

Given:

- 本人の Deck と Card が保存済みで、親 Deck は利用側から参照できる。
- Card の表面の本文は Fetched Card である。

When:

- 本人の Card の購読を開始する。

Then:

- 対象 Card の ID と保存した本文を、購読結果から参照できる。
- 購読エラーは通知されない。

<a id="firestore-subscriptions-02"></a>

### FIRESTORE-SUBSCRIPTIONS-02 購読中の追加・更新・論理削除を取得結果に反映する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Card と Deck を購読している。次の各行を、それぞれの操作前の状態とする。

| 操作前の状態 | 保存操作 | 反映後に参照できる結果 |
| --- | --- | --- |
| 対象 Deck と Card が存在しない | Deck を作成し、その Deck に属する Card を作成する | 作成した Deck と Card の ID が含まれる |
| 対象 Deck と Card が取得済みである | Deck の名前と Card の表面の本文を Updated に変更する | 両方の対象 ID が Updated を持つ |
| 対象 Deck と Card が取得済みである | Card と Deck の両方を論理削除する | 両方の対象 ID が含まれない |

When:

- 購読している同じクライアントから、表の保存操作を行う。

Then:

- 変更を受信した購読結果は表に一致する。
- 購読エラーは通知されない。
- 最後の行は Card と Deck の両方の削除を対象とし、親 Deck だけを削除したときの子 Card の扱いは保証しない。

<a id="firestore-subscriptions-03"></a>

### FIRESTORE-SUBSCRIPTIONS-03 購読停止後の編集完了時にも以前の取得結果を保持する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の Deck と Card を購読し、名前と表面の本文として Before stop を取得済みである。

When:

- 両方の購読を停止し、同じクライアントで Deck と Card を After stop に編集する。

Then:

- 編集操作が完了した時点でも、取得結果の名前と本文は Before stop のままである。
- 購読エラーは通知されない。
- この時点の確認を、別クライアントの更新が到達した後も結果や通知が変わらないことの保証として扱わない。
