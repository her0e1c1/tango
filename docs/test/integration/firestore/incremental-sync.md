# Firestore 差分同期 テスト仕様書

## 目的

サーバー確定時刻による差分購読と、取得済みデータを checkpoint から復元した再開を実際の Emulator で確認する。[共通前提](./AGENTS.md#共通前提) に従う。ブラウザーの永続化は [Persistence](../../e2e/persistence.md) で確認し、本番 index の準備完了とは区別する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-INCREMENTAL-SYNC-01 | read | 正常系 | [更新境界を含めて再開し変更のないデータと同時刻の更新を保持する](#firestore-incremental-sync-01) |
| FIRESTORE-INCREMENTAL-SYNC-02 | batch | 正常系 | [停止中の論理削除を再開後に反映する](#firestore-incremental-sync-02) |
| FIRESTORE-INCREMENTAL-SYNC-03 | batch | 異常系 | [未確定変更を表示し拒否された変更を巻き戻す](#firestore-incremental-sync-03) |
| FIRESTORE-INCREMENTAL-SYNC-04 | read | 異常系 | [不正な差分の修復後に保留した変更も反映する](#firestore-incremental-sync-04) |
| FIRESTORE-INCREMENTAL-SYNC-05 | read | 正常系 | [同期時刻と学習日時を分離して履歴と再開状態を共有する](#firestore-incremental-sync-05) |
| FIRESTORE-INCREMENTAL-SYNC-06 | read | 正常系 | [回答履歴のスコープと表示上限を保ちながら全差分を取り込む](#firestore-incremental-sync-06) |
| FIRESTORE-INCREMENTAL-SYNC-07 | read | 正常系 | [回答履歴の初回取得中の追加を取り込む](#firestore-incremental-sync-07) |
| FIRESTORE-INCREMENTAL-SYNC-08 | write | 異常系 | [全 Entity の更新にサーバー時刻を要求する](#firestore-incremental-sync-08) |

<a id="firestore-incremental-sync-01"></a>

### FIRESTORE-INCREMENTAL-SYNC-01 更新境界を含めて再開し変更のないデータと同時刻の更新を保持する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の Deck・Card を空の状態から購読する。複数の document を同一 batch で作成し、取得済みとする。

When:

- 購読を継続したまま別クライアントで異なる Card を順番に編集し、それぞれの確定を待つ。その後、購読を止め、別クライアントで一部を編集して再開する。変更なしの再購読も行う。

Then:

- 空の初回取得は完了し、追加・編集を反映する。後続の差分を取り込んでも、それ以前に確定した変更を保持する。同一更新時刻の全 document と変更していない document を欠落・重複なく保持する。

<a id="firestore-incremental-sync-02"></a>

### FIRESTORE-INCREMENTAL-SYNC-02 停止中の論理削除を再開後に反映する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Deck と複数の Card を取得済みとし、購読を止めている。

When:

- 別クライアントで Card または親 Deck を論理削除し、購読を再開する。

Then:

- 削除対象は表示から消える。他のデータは残り、サーバーの tombstone は保持される。再度の購読でも復活しない。

<a id="firestore-incremental-sync-03"></a>

### FIRESTORE-INCREMENTAL-SYNC-03 未確定変更を表示し拒否された変更を巻き戻す

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の Deck を同期済みである。ネットワークを切断し、端末時計を過去または未来にずらしている。

When:

- オフラインで本文を変更する。別クライアントが所有権を変えてから再接続し、書き込みを拒否させる。

Then:

- 未確定変更は直ちに購読結果へ反映される。サーバー確定していない時刻から再開しない。拒否後は SDK の rollback を反映し、未確定本文を残さない。

<a id="firestore-incremental-sync-04"></a>

### FIRESTORE-INCREMENTAL-SYNC-04 不正な差分の修復後に保留した変更も反映する

カテゴリ: `read`

区分: 異常系

Given:

- 本人の有効な Deck を取得済みである。表示名が数値の不正 document と既存 Deck の変更をサーバーへ一括保存する。
- 購読を継続する場合と、不正な差分を SDK cache に取り込んだ後で購読を停止し、表示状態を破棄してオフラインで再開する場合を確認する。

When:

- 検証エラーを受け取った後、不正 document を有効な表示名へ修復する。

Then:

- 不正な差分で直前の正常な表示を壊さず、修復後は保留されていた既存 Deck の変更も反映する。
- オフラインで再開した場合も、初回の準備完了時点で取得済みの正常な Deck を復元する。不正な差分はエラーとして通知し、再接続後の修復を継続して取り込む。

<a id="firestore-incremental-sync-05"></a>

### FIRESTORE-INCREMENTAL-SYNC-05 同期時刻と学習日時を分離して履歴と再開状態を共有する

カテゴリ: `read`

区分: 正常系

Given:

- Store が空で、本人の開始履歴と完了履歴を購読している。StudySession のネットワーク購読はまだ開始していない。

When:

- StudySession の購読を明示的に開始してから、学習日時を過去の値として保存し、セッションを進めて完了する。一方の履歴購読だけを停止し、別 UID の履歴購読を追加する。

Then:

- 別 UID の履歴購読はレコードを通知せず、既存の Store の所有者や学習状態を変更しない。StudySession の購読開始後は再開状態と残った履歴の更新が継続する。最終学習日時は指定した発生時刻であり、updatedAt はサーバー Timestamp となる。終了済みセッションは履歴に残り、再開対象からは消える。

<a id="firestore-incremental-sync-06"></a>

### FIRESTORE-INCREMENTAL-SYNC-06 回答履歴のスコープと表示上限を保ちながら全差分を取り込む

カテゴリ: `read`

区分: 正常系

Given:

- 本人の回答履歴を期間・Deck・要求件数を変えて購読する。要求上限は2件または1000件とする。

When:

- 停止中に要求件数より多い回答と、更新時刻は新しいが回答日時は古い回答を追加し、再開する。

Then:

- 回答日時・ID の降順を保ち、最大要求件数まで表示して超過を通知する。別期間・Deck の値を混ぜず、過去日時の回答も対象スコープへ取り込む。

<a id="firestore-incremental-sync-07"></a>

### FIRESTORE-INCREMENTAL-SYNC-07 回答履歴の初回取得中の追加を取り込む

カテゴリ: `read`

区分: 正常系

Given:

- 本人の対象期間には回答がない場合と既存回答がある場合をそれぞれ用意する。

When:

- 初回の履歴取得中に別クライアントから新しい回答を追加する。

Then:

- 初期結果とその後の差分が統合され、追加回答を欠落・重複なく返す。サーバー同期後は server かつ未送信なしとなる。

<a id="firestore-incremental-sync-08"></a>

### FIRESTORE-INCREMENTAL-SYNC-08 全 Entity の更新にサーバー時刻を要求する

カテゴリ: `write`

区分: 異常系

Given:

- 本人の Deck・Card・StudySession を用意し、各 Entity と StudyAnswer に有効な保存内容がある。

When:

- SDK から updatedAt を数値、端末生成 Timestamp、または省略した値で保存する。続いて serverTimestamp を指定する。

Then:

- 前者を Rules が拒否し、serverTimestamp の書き込みだけを許可する。本文編集、FSRS、学習進行にも同じ制約が適用される。
