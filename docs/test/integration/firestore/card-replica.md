# Card replica 結合テスト仕様書

## 目的

サーバー確定 Card の IndexedDB 保存・差分購読・復旧を検証する。Firestore は実 Emulator、IndexedDB は transaction を実装するテスト用データベースを使用し、ブラウザー再読み込みは Persistence E2E で確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-REPLICA-01 | read | 正常系 | [同一時刻の境界と停止中の変更を差分復元する](#firestore-card-replica-01) |
| FIRESTORE-CARD-REPLICA-02 | read | 異常系 | [失われた replica と不正な metadata を全件取得で復旧する](#firestore-card-replica-02) |
| FIRESTORE-CARD-REPLICA-03 | read | 異常系 | [pending の更新と拒否で確定値を維持する](#firestore-card-replica-03) |
| FIRESTORE-CARD-REPLICA-04 | read | 異常系 | [pending のまま停止して拒否されても確定値を復元する](#firestore-card-replica-04) |
| FIRESTORE-CARD-REPLICA-05 | read | 異常系 | [不正 document を部分適用せず修復後に復帰する](#firestore-card-replica-05) |
| FIRESTORE-CARD-REPLICA-06 | read | 正常系 | [UID 切替と復元中の停止で古い Card を表示しない](#firestore-card-replica-06) |
| FIRESTORE-CARD-REPLICA-07 | read | 異常系 | [transaction 失敗で checkpoint だけ先行しない](#firestore-card-replica-07) |
| FIRESTORE-CARD-REPLICA-08 | read | 正常系 | [少数更新の処理件数を Card 総数から独立させる](#firestore-card-replica-08) |
| FIRESTORE-CARD-REPLICA-09 | read | 正常系 | [cache のみでは checkpoint を進めない](#firestore-card-replica-09) |
| FIRESTORE-CARD-REPLICA-10 | read | 正常系 | [FSRS は確定後に反映する](#firestore-card-replica-10) |

<a id="firestore-card-replica-01"></a>

### FIRESTORE-CARD-REPLICA-01 同一時刻の境界と停止中の変更を差分復元する

カテゴリ: `read`

区分: 正常系

Given:

- 同一 UID の複数 Card を取得して replica と checkpoint を保存済みである。

When:

- 購読を停止し、checkpoint と同一 millisecond の追加と、別 Card の編集・追加・論理削除を行って再開する。

Then:

- 境界の Card と変更を反映し、未変更 Card を失わず、ID の重複がない。

<a id="firestore-card-replica-02"></a>

### FIRESTORE-CARD-REPLICA-02 失われた replica と不正な metadata を全件取得で復旧する

カテゴリ: `read`

区分: 異常系

Given:

- 取得済み replica に対し、DB 消失・Card 欠落・Card の型破損・version 不一致・所有 UID 不一致・保存済み Card より先行した checkpoint のいずれかが起きている。

When:

- メモリを空にして購読を再開する。

Then:

- checkpoint を使わず全 Card を取得し、不正な内容を表示しない。

<a id="firestore-card-replica-03"></a>

### FIRESTORE-CARD-REPLICA-03 pending の更新と拒否で確定値を維持する

カテゴリ: `read`

区分: 異常系

Given:

- checkpoint より古い確定済み Card があり、オフラインで権限のない変更を要求する。変更は本文、論理削除、または新規作成である。

When:

- pending snapshot を受信し、再接続して書き込みを拒否する。

Then:

- pending 値と ghost Card はメモリ・永続 replica に入らず、query window から removed になっても確定 Card を削除しない。

<a id="firestore-card-replica-04"></a>

### FIRESTORE-CARD-REPLICA-04 pending のまま停止して拒否されても確定値を復元する

カテゴリ: `read`

区分: 異常系

Given:

- 確定済み Card に対するオフラインの不正な本文変更が pending になっている。

When:

- 購読停止後に再接続して拒否され、メモリを空にして再開する。

Then:

- 変更前の Card を復元し、未確定の本文を表示しない。

<a id="firestore-card-replica-05"></a>

### FIRESTORE-CARD-REPLICA-05 不正 document を部分適用せず修復後に復帰する

カテゴリ: `read`

区分: 異常系

Given:

- 確定済み replica と checkpoint から再開し、同じ snapshot に有効な変更と不正な Card がある。

When:

- 検証エラーを受け取り、不正 Card を修復する。

Then:

- 不正な snapshot の一部を適用せず、修復後は保留していた有効な変更も含めて反映する。

<a id="firestore-card-replica-06"></a>

### FIRESTORE-CARD-REPLICA-06 UID 切替と復元中の停止で古い Card を表示しない

カテゴリ: `read`

区分: 正常系

Given:

- UID A の replica が存在する。

When:

- UID A の復元開始直後に停止し、UID B に切り替えて購読する。

Then:

- 古い復元と callback は B の Store を変更せず、B の Card だけが表示される。

<a id="firestore-card-replica-07"></a>

### FIRESTORE-CARD-REPLICA-07 transaction 失敗で checkpoint だけ先行しない

カテゴリ: `read`

区分: 異常系

Given:

- 確定済み Card と checkpoint が IndexedDB に保存されている。

When:

- 変更 Card と新 checkpoint の保存 transaction を中断し、その後に復元する。

Then:

- 元の Card と checkpoint が一緒に残り、未保存の変更を取得範囲から除外しない。

<a id="firestore-card-replica-08"></a>

### FIRESTORE-CARD-REPLICA-08 少数更新の処理件数を Card 総数から独立させる

カテゴリ: `read`

区分: 正常系

Given:

- 1000 枚の Card の同期が完了している。

When:

- 1枚の Card の本文を変更する。

Then:

- 変更 document だけを parse・Store 適用・IndexedDB 書き込みし、他の Card を再処理しない。

<a id="firestore-card-replica-09"></a>

### FIRESTORE-CARD-REPLICA-09 cache のみでは checkpoint を進めない

カテゴリ: `read`

区分: 正常系

Given:

- 確定済み Card と checkpoint があり、通信を切断している。

When:

- キャッシュから再購読し、オフラインで本文変更を要求する。

Then:

- 確定済み replica を表示し、pending 本文と推定時刻を保存しない。

<a id="firestore-card-replica-10"></a>

### FIRESTORE-CARD-REPLICA-10 FSRS は確定後に反映する

カテゴリ: `read`

区分: 正常系

Given:

- 未評価の確定 Card がある。

When:

- オフラインで FSRS を更新し、その後再接続する。

Then:

- pending 中は未評価のままで、サーバー確定後に FSRS と checkpoint を保存する。
