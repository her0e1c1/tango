# Snapshot Firestore 結合テスト仕様書

## 目的

Card / Deck の公開された購読操作を通して、取得結果、所有者の分離、削除、不正データからの復旧、購読の停止・再開を確認する。
各ケースは Card と Deck をそれぞれ対象とする。表示値は Card では `frontText`、Deck では `name` を指し、Card には同じ所有者の有効な親 Deck がある。不正データを明示した場合を除き、保存内容は有効とする。

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。初期取得と同一クライアント内の変更は [Subscriptions](./subscriptions.md)、FSRS の保存内容は [Card.fsrs](./card-fsrs.md)、学習の復元は [StudySession](./study-session.md)、履歴取得は [Study History](./study-history.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-SNAPSHOT-01 | read | 正常系 | [空の初期取得結果で以前のデータを置き換える](#firestore-snapshot-01) |
| FIRESTORE-SNAPSHOT-02 | read | 正常系 | [初期取得で論理削除されていないデータだけを提供する](#firestore-snapshot-02) |
| FIRESTORE-SNAPSHOT-03 | read | 正常系 | [読取可能な公開データでも別所有者のデータを混在させない](#firestore-snapshot-03) |
| FIRESTORE-SNAPSHOT-04 | batch | 正常系 | [物理削除されたデータを取得結果から除く](#firestore-snapshot-04) |
| FIRESTORE-SNAPSHOT-05 | batch | 正常系 | [別クライアントによる追加・更新を購読結果に反映する](#firestore-snapshot-05) |
| FIRESTORE-SNAPSHOT-06 | read | 異常系 | [不正データを含む取得結果で直前の正常な結果を壊さない](#firestore-snapshot-06) |
| FIRESTORE-SNAPSHOT-07 | read | 異常系 | [不正データの修正後に同じ購読で正常な結果を取得する](#firestore-snapshot-07) |
| FIRESTORE-SNAPSHOT-08 | read | 異常系 | [読取拒否を通知し他人の非公開データを提供しない](#firestore-snapshot-08) |
| FIRESTORE-SNAPSHOT-09 | read | 正常系 | [停止後に到達した更新で取得結果と通知を変更しない](#firestore-snapshot-09) |
| FIRESTORE-SNAPSHOT-10 | read | 正常系 | [再購読で停止中の変更を含む現在の結果を取得する](#firestore-snapshot-10) |
| FIRESTORE-SNAPSHOT-11 | read | 異常系 | [不正な初期取得結果を正常な読込完了として扱わない](#firestore-snapshot-11) |

<a id="empty-initial-snapshot"></a>
<a id="firestore-snapshot-01"></a>

### FIRESTORE-SNAPSHOT-01 [TODO] 空の初期取得結果で以前のデータを置き換える

カテゴリ: `read`

区分: 正常系

Given:

- 本人が所有する対象データは保存されていない。
- 利用側には、保存先には存在しない以前の取得結果が残っている。

When:

- 本人のデータの購読を開始する。

Then:

- 初回の取得が完了すると、参照できる一覧は空となり、以前の ID は残らない。
- 0件でも正常な読込完了が通知され、購読エラーは通知されない。

<a id="active-initial-snapshot"></a>
<a id="firestore-snapshot-02"></a>

### FIRESTORE-SNAPSHOT-02 [TODO] 初期取得で論理削除されていないデータだけを提供する

カテゴリ: `read`

区分: 正常系

Given:

- 本人のデータ A / B は未削除であり、C には論理削除の日時が保存されている。
- A / B / C は異なる ID と表示値を持ち、まだ取得していない。

When:

- 本人のデータの購読を開始する。

Then:

- 読込完了時に参照できる ID は A / B だけで、それぞれ保存された表示値を持つ。
- 論理削除済みの C は含まれず、購読エラーは通知されない。

<a id="owner-isolation"></a>
<a id="firestore-snapshot-03"></a>

### FIRESTORE-SNAPSHOT-03 [TODO] 読取可能な公開データでも別所有者のデータを混在させない

カテゴリ: `read`

区分: 正常系

Given:

- 本人のデータ A と、別の所有者のデータ B が保存されている。
- B は公開 Deck、または公開 Deck に属する Card であり、本人にも読取権限がある。
- A / B は未削除で、まだ取得していない。

When:

- 本人の認証で、本人を所有者とするデータを購読する。

Then:

- 取得結果の ID は A だけとなり、読取可能であっても B は含まれない。
- 購読エラーは通知されない。読取拒否ではなく、指定した所有者による取得範囲の分離を確認できる。

<a id="physical-deletion"></a>
<a id="firestore-snapshot-04"></a>

### FIRESTORE-SNAPSHOT-04 [TODO] 物理削除されたデータを取得結果から除く

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の保存済みデータを購読している。次の各行を独立した状態とする。

| 削除前に取得済みのデータ | 物理削除するデータ | 削除後の取得結果 |
| --- | --- | --- |
| A / B | A | B のみ |
| A のみ | A | 空 |

When:

- 本人の別クライアントで、表の対象データを保存先から物理削除する。

Then:

- 変更の受信後に参照できる ID は表に一致し、削除された A は残らない。
- 残る B の表示値は変わらず、最後の1件を削除した場合は空の結果になる。
- 購読エラーは通知されない。削除日時の更新による論理削除とは区別する。

<a id="remote-client-updates"></a>
<a id="firestore-snapshot-05"></a>

### FIRESTORE-SNAPSHOT-05 [TODO] 別クライアントによる追加・更新を購読結果に反映する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の購読は初回の取得を完了している。
- 書込側は同じ本人の独立したクライアントであり、受信側とは端末内のデータを共有しない。
- 次の各行を独立した状態とする。

| 変更前の保存内容と取得結果 | 書込側の操作 | 受信後の取得結果 |
| --- | --- | --- |
| A は存在しない | A を表示値 Before で作成する | A / Before が含まれる |
| A / Before が存在する | 同じ A の表示値を After に更新する | A / After が含まれ、Before は残らない |

When:

- 書込側で表の操作を行う。受信側は購読を継続し、保存操作や取得結果の直接変更を行わない。

Then:

- 受信後の結果は表に一致し、同じ ID の項目が重複しない。
- 購読を開始し直さずに変更を取得でき、購読エラーは通知されない。

<a id="invalid-document"></a>
<a id="firestore-snapshot-06"></a>

### FIRESTORE-SNAPSHOT-06 [TODO] 不正データを含む取得結果で直前の正常な結果を壊さない

カテゴリ: `read`

区分: 異常系

Given:

- 本人の有効なデータ A / Before を取得済みで、購読を継続している。

When:

- 保存先に、A の表示値を After に変更する更新と、本人の不正データ B の追加が一括で反映される。
- B は Card では `tags: null`、Deck では `name: null` とし、それ以外の値は有効とする。

Then:

- B を識別できるデータ検証エラーが通知される。
- 参照できる結果は直前の正常な A / Before のままであり、A / After だけの部分反映や B の取り込みは行わない。
- 不正な取得結果に対して正常な読込完了を通知しない。

<a id="validation-recovery"></a>
<a id="firestore-snapshot-07"></a>

### FIRESTORE-SNAPSHOT-07 [TODO] 不正データの修正後に同じ購読で正常な結果を取得する

カテゴリ: `read`

区分: 異常系

Given:

- 本人の不正データ B を含む取得結果に対して検証エラーが通知され、購読を継続している。
- B は Card では `tags: null`、Deck では `name: null` であり、それ以外の保存値は有効である。

When:

- B の保存値を、Card では `tags: []`、Deck では `name: "Recovered"` に修正する。

Then:

- 購読を開始し直さなくても、B を含む現在の正常なデータ一覧を参照できる。
- 修正された結果を参照できる状態で正常な読込完了が通知され、その正常な取得結果について検証エラーは通知されない。
- 修正前に通知されたエラーが、後から発生しなかったことになるわけではない。

<a id="permission-denied"></a>
<a id="firestore-snapshot-08"></a>

### FIRESTORE-SNAPSHOT-08 [TODO] 読取拒否を通知し他人の非公開データを提供しない

カテゴリ: `read`

区分: 異常系

Given:

- 別の所有者の非公開 Deck、またはその配下の Card が保存されている。
- 購読側は本人の非匿名認証を使い、その非公開データを過去に取得しておらず、端末内にも保持していない。

When:

- 本人の認証で、別の所有者のデータの購読を開始する。

Then:

- 読取権限の不足を示す `permission-denied` が通知される。
- 他人の非公開データは取得結果に含まれない。
- 保存内容の検証エラーとは区別する。拒否より前の端末内データに由来する通知回数は要求しない。

<a id="unsubscribe"></a>
<a id="firestore-snapshot-09"></a>

### FIRESTORE-SNAPSHOT-09 [TODO] 停止後に到達した更新で取得結果と通知を変更しない

カテゴリ: `read`

区分: 正常系

Given:

- 本人のデータ A / Before を取得済みである。
- その購読を停止した後の取得結果と通知を観測する。

When:

- 本人の別クライアントで A の表示値を After に更新する。

Then:

- 更新が受信側へ到達したことを共通前提の方法で確認した時点でも、停止した購読の取得結果は A / Before のままである。
- 停止後の更新に対する読込完了やエラーは通知されない。
- 編集操作の完了直後だけを確認する [FIRESTORE-SUBSCRIPTIONS-03](./subscriptions.md#firestore-subscriptions-03) とは観測範囲を区別する。

<a id="resubscribe"></a>
<a id="firestore-snapshot-10"></a>

### FIRESTORE-SNAPSHOT-10 [TODO] 再購読で停止中の変更を含む現在の結果を取得する

カテゴリ: `read`

区分: 正常系

Given:

- 本人のデータ A / B を取得済みで、購読を停止している。
- 停止中に本人の別クライアントで A を After に更新し、B を物理削除し、C を追加している。
- これらの変更はサーバーに保存済みである。

When:

- 同じ本人のデータの購読を開始し直す。

Then:

- サーバーと同期した結果の ID は A / C だけとなり、A は After を持つ。
- 同期後の結果に、削除された B や以前の A の値は残らない。
- 正常な読込完了が通知され、購読エラーは通知されない。
- 再購読直後に端末内の古い値が通知されることは禁止しない。同じクライアントの再購読であり、ブラウザーの再読み込みや新規クライアントでの復元は保証しない。

<a id="firestore-snapshot-11"></a>

### FIRESTORE-SNAPSHOT-11 [TODO] 不正な初期取得結果を正常な読込完了として扱わない

カテゴリ: `read`

区分: 異常系

Given:

- 本人の有効なデータ A と不正なデータ B が保存されている。
- B は Card では `tags: null`、Deck では `name: null` とし、それ以外の値は有効とする。
- まだ正常な取得結果を持っていない。

When:

- 本人のデータの購読を開始する。

Then:

- 初回の取得に対して、B を識別できるデータ検証エラーが通知される。
- A だけの部分的な一覧を正常な取得結果として提供せず、不正な B も取り込まない。
- エラーを正常な0件取得や未評価データへ読み替えず、正常な読込完了を通知しない。
