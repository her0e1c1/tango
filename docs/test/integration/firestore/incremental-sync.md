# Firestore の同期 テスト仕様書

## 目的

購読中と再開後の変更が欠落・重複なく表示へ反映されることを確認する。[共通前提](./AGENTS.md#共通前提) に従う。オフライン復元は [Persistence](../../e2e/persistence.md)、不正データと rollback は [Snapshot](./snapshot.md)、日時と回答履歴は各 Entity の仕様で扱う。取得量や独自 cursor の利用を契約にしない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-INCREMENTAL-SYNC-01 | read | 正常系 | [連続する差分で変更のないデータと同時刻の更新を保持する](#firestore-incremental-sync-01) |
| FIRESTORE-INCREMENTAL-SYNC-02 | batch | 正常系 | [購読中の論理削除を反映する](#firestore-incremental-sync-02) |
| FIRESTORE-INCREMENTAL-SYNC-03 | read | 正常系 | [購読再開後に停止中の変更を反映する](#firestore-incremental-sync-03) |

<a id="firestore-incremental-sync-01"></a>

### FIRESTORE-INCREMENTAL-SYNC-01 連続する差分で変更のないデータと同時刻の更新を保持する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の Deck・Card を空の状態から購読する。複数の document を同一 batch で作成し、取得済みとする。

When:

- 購読を継続したまま別クライアントで異なる Card を順番に編集し、それぞれの確定を待つ。

Then:

- 空の初回取得は完了し、追加・編集を反映する。後続の差分を取り込んでも、それ以前に確定した変更を保持する。同一更新時刻の全 document と変更していない document を欠落・重複なく保持する。

<a id="firestore-incremental-sync-02"></a>

### FIRESTORE-INCREMENTAL-SYNC-02 購読中の論理削除を反映する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck と複数の Card を取得済みとし、購読を継続している。

When:

- 別クライアントで Card または親 Deck を論理削除する。

Then:

- 削除対象は表示から消える。他のデータは残り、サーバーの tombstone は保持される。

<a id="firestore-incremental-sync-03"></a>

### FIRESTORE-INCREMENTAL-SYNC-03 購読再開後に停止中の変更を反映する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の Deck と Card A・B・変更対象外の Card を取得済みである。

When:

- 購読を停止する。別クライアントで A を編集し、B を論理削除し、C を追加してから購読を再開する。

Then:

- A の編集と C の追加が表示され、B は表示されない。変更対象外の Card は残る。欠落・重複なくサーバーの現在の状態に一致する。
