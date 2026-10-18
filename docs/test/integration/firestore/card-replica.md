# Card replica 結合テスト仕様書

## 目的

通常アカウントの確定 Card の replica・checkpoint と、匿名向け Card 購読の SDK cache・差分反映を検証する。[共通前提](./AGENTS.md#共通前提)に従い、Firestore は実 Emulator、IndexedDB は transaction を実装するテスト用データベースを使う。匿名ケースはアプリの匿名購読経路を対象とし、匿名 SDK 認証の Rules 認可やブラウザー再読み込みの確認とは分ける。

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
| FIRESTORE-CARD-REPLICA-08 | read | 正常系 | [通常／匿名で1000枚中の Card A の変更だけを処理する](#firestore-card-replica-08) |
| FIRESTORE-CARD-REPLICA-09 | read | 正常系 | [cache のみでは checkpoint を進めない](#firestore-card-replica-09) |
| FIRESTORE-CARD-REPLICA-10 | read | 正常系 | [FSRS は確定後に反映する](#firestore-card-replica-10) |
| FIRESTORE-CARD-REPLICA-11 | batch | 正常系 | [匿名は replica を使わず Card A のローカル変更を表示する](#firestore-card-replica-11) |
| FIRESTORE-CARD-REPLICA-12 | read | 異常系 | [匿名は正常0件の不正 Card A 初期読込でも ready を完了する](#firestore-card-replica-12) |
| FIRESTORE-CARD-REPLICA-13 | batch | 異常系 | [匿名は Card A の修復・再隔離・再修復と Card B の更新を反映する](#firestore-card-replica-13) |
| FIRESTORE-CARD-REPLICA-14 | batch | 異常系 | [匿名は Card B の論理削除と Card A の有効な tombstone を反映する](#firestore-card-replica-14) |
| FIRESTORE-CARD-REPLICA-15 | batch | 異常系 | [匿名は物理削除で Card A の診断と Card B の表示を除去する](#firestore-card-replica-15) |
| FIRESTORE-CARD-REPLICA-16 | read | 正常系 | [匿名の UID 切替後に旧購読の変更を反映しない](#firestore-card-replica-16) |
| FIRESTORE-CARD-REPLICA-17 | read | 正常系 | [匿名の metadata 通知では Card A を再処理しない](#firestore-card-replica-17) |

<a id="firestore-card-replica-01"></a>

### FIRESTORE-CARD-REPLICA-01 同一時刻の境界と停止中の変更を差分復元する

カテゴリ: `read`

区分: 正常系

Given:

- 通常アカウントで、同一 UID の複数 Card を取得して replica と checkpoint を保存済みである。

When:

- 購読を停止し、checkpoint と同一 millisecond の追加と、別 Card の編集・追加・論理削除を行って再開する。

Then:

- 境界の Card と変更を反映し、未変更 Card を失わず、ID の重複がない。

<a id="firestore-card-replica-02"></a>

### FIRESTORE-CARD-REPLICA-02 失われた replica と不正な metadata を全件取得で復旧する

カテゴリ: `read`

区分: 異常系

Given:

- 通常アカウントで、取得済み replica に対し、DB 消失・Card 欠落・Card の型破損・version 不一致・所有 UID 不一致・保存済み Card より先行した checkpoint のいずれかが起きている。

When:

- メモリを空にして購読を再開する。

Then:

- checkpoint を使わず全 Card を取得し、不正な内容を表示しない。

<a id="firestore-card-replica-03"></a>

### FIRESTORE-CARD-REPLICA-03 pending の更新と拒否で確定値を維持する

カテゴリ: `read`

区分: 異常系

Given:

- 通常アカウントで、checkpoint より古い確定済み Card があり、オフラインで権限のない変更を要求する。変更は本文、論理削除、または新規作成である。

When:

- pending snapshot を受信し、再接続して書き込みを拒否する。

Then:

- pending 値と ghost Card はメモリ・永続 replica に入らず、query window から removed になっても確定 Card を削除しない。

<a id="firestore-card-replica-04"></a>

### FIRESTORE-CARD-REPLICA-04 pending のまま停止して拒否されても確定値を復元する

カテゴリ: `read`

区分: 異常系

Given:

- 通常アカウントで、確定済み Card に対するオフラインの不正な本文変更が pending になっている。

When:

- 購読停止後に再接続して拒否され、メモリを空にして再開する。

Then:

- 変更前の Card を復元し、未確定の本文を表示しない。

<a id="firestore-card-replica-05"></a>

### FIRESTORE-CARD-REPLICA-05 不正 document を部分適用せず修復後に復帰する

カテゴリ: `read`

区分: 異常系

Given:

- 通常アカウントで、確定済み replica と checkpoint から再開し、同じ snapshot に有効な変更と不正な Card がある。

When:

- 検証エラーを受け取り、不正 Card を修復する。キャッシュの候補が metadata のみのサーバー通知で確定する場合も含む。
- 修復前に、有効な変更の Card へ pending 書き込みが入り、拒否後に query 境界外へ移動する場合も確認する。

Then:

- 不正な snapshot の一部を適用せず、修復後は保留していた有効な変更も含めて反映する。

<a id="firestore-card-replica-06"></a>

### FIRESTORE-CARD-REPLICA-06 UID 切替と復元中の停止で古い Card を表示しない

カテゴリ: `read`

区分: 正常系

Given:

- 通常アカウントで、UID A の replica が存在する。

When:

- UID A の復元開始直後に停止し、UID B に切り替えて購読する。

Then:

- 古い復元と callback は B の Store を変更せず、B の Card だけが表示される。

<a id="firestore-card-replica-07"></a>

### FIRESTORE-CARD-REPLICA-07 transaction 失敗で checkpoint だけ先行しない

カテゴリ: `read`

区分: 異常系

Given:

- 通常アカウントで、確定済み Card と checkpoint が IndexedDB に保存されている。

When:

- 変更 Card と新 checkpoint の保存 transaction を中断し、その後に復元する。

Then:

- 元の Card と checkpoint が一緒に残り、未保存の変更を取得範囲から除外しない。

<a id="firestore-card-replica-08"></a>

### FIRESTORE-CARD-REPLICA-08 通常／匿名で1000枚中の Card A の変更だけを処理する

カテゴリ: `read`

区分: 正常系

Given:

- 通常経路と匿名経路の2通りで、Card A（`card-a`）、Card B（`card-b`）、その他998枚の初回取得が完了している。
- 通常経路では checkpoint `1000` が保存済みで、匿名経路では replica が存在しない。

When:

- 外部クライアントが Card A の本文を `changed` に更新する。

Then:

- Card A の本文が `changed` になり、1000枚が表示される。Card B とその他998枚の値・参照を維持する。
- Card A だけを parse・Store 適用する。
- 通常経路は Card A だけを replica へ書き込み、匿名経路は replica を作成しない。

<a id="firestore-card-replica-09"></a>

### FIRESTORE-CARD-REPLICA-09 cache のみでは checkpoint を進めない

カテゴリ: `read`

区分: 正常系

Given:

- 通常アカウントで、確定済み Card と checkpoint があり、通信を切断している。

When:

- キャッシュから再購読し、オフラインで本文変更を要求する。

Then:

- 確定済み replica を表示し、pending 本文と推定時刻を保存しない。

<a id="firestore-card-replica-10"></a>

### FIRESTORE-CARD-REPLICA-10 FSRS は確定後に反映する

カテゴリ: `read`

区分: 正常系

Given:

- 通常アカウントで、未評価の確定 Card がある。

When:

- オフラインで FSRS を更新し、その後再接続する。

Then:

- pending 中は未評価のままで、サーバー確定後に FSRS と checkpoint を保存する。

<a id="firestore-card-replica-11"></a>

### FIRESTORE-CARD-REPLICA-11 匿名は replica を使わず Card A のローカル変更を表示する

カテゴリ: `batch`

区分: 正常系

Given:

- 匿名経路の SDK 通信を停止しており、Card A（`card-a`）と replica は存在しない。

When:

1. 空の cache で購読を開始する。
2. Card A を本文 `created` で作成する。
3. Card A の本文を `edited` に変更する。
4. 購読を停止し、メモリを空にして再購読する。
5. Card A を論理削除する。

Then:

1. サーバー応答を待たず ready が完了し、Card は0件である。
2. Card A が本文 `created` で表示される。
3. Card A の本文が `edited` になる。
4. Card A の本文 `edited` が SDK cache から復元される。
5. Card A が非表示になる。replica・checkpoint の IndexedDB データベースは作成されない。

<a id="firestore-card-replica-12"></a>

### FIRESTORE-CARD-REPLICA-12 匿名は正常0件の不正 Card A 初期読込でも ready を完了する

カテゴリ: `read`

区分: 異常系

Given:

- 匿名経路の SDK cache に Card A（`card-a`）だけがあり、FSRS はフィールド欠落または不正値である。両方を確認する。
- SDK はオフラインで、正常 Card と replica は0件である。

When:

- Card の購読を開始し、初回の cache 結果を受信する。

Then:

- ready が完了し、Card は0件、不正 ID は `card-a` だけになる。
- 欠落・不正 FSRS を null に補完せず、保存値を変更しない。listener error はなく、replica は作成されない。

<a id="firestore-card-replica-13"></a>

### FIRESTORE-CARD-REPLICA-13 匿名は Card A の修復・再隔離・再修復と Card B の更新を反映する

カテゴリ: `batch`

区分: 異常系

Given:

- 匿名経路で Card A（`card-a`）の初回 cache 読込が完了し、不正 ID は `card-a` だけである。
- Card A の FSRS は欠落または不正値で、両方を確認する。Card B（`card-b`）と replica は存在しない。

When:

1. SDK を再接続し、外部から Card A の FSRS を有効な null に修復すると同時に正常 Card B を追加する。
2. Card A の FSRS を元の不正状態に戻すと同時に Card B の本文を `changed` に更新する。
3. Card A の FSRS を再び有効な null に修復する。同じ購読で1〜3を連続して行う。

Then:

1. Card A/B が表示され、不正 ID は0件になる。
2. Card A の古い正常値は表示されず、Card B の本文は `changed`、不正 ID は `card-a` だけになる。不正 FSRS の保存値は変更されない。
3. Card A/B が表示され、不正 ID は0件になる。Card B の本文 `changed` は維持される。

listener error はなく、replica は作成されない。

<a id="firestore-card-replica-14"></a>

### FIRESTORE-CARD-REPLICA-14 匿名は Card B の論理削除と Card A の有効な tombstone を反映する

カテゴリ: `batch`

区分: 異常系

Given:

- 匿名経路の初回読込が完了し、正常な Card B（`card-b`）だけが表示される。不正 ID は Card A（`card-a`）だけである。
- Card A の FSRS は欠落または不正値で、両方を確認する。replica は存在しない。

When:

1. SDK を再接続し、外部から Card B に `deletedAt: 2000` を保存する。
2. Card A を修復する。
3. Card A の FSRS を元の不正状態に戻す。
4. Card A を有効な FSRS と `deletedAt: 3000` を持つ tombstone にする。

Then:

1. Card は0件になるが、不正 ID `card-a` は維持される。Card B の document は `deletedAt: 2000` で残る。
2. Card A が表示され、不正 ID は0件になる。
3. Card は0件、不正 ID は `card-a` だけになる。
4. Card は0件、不正 ID も0件になる。Card A の document は `deletedAt: 3000` で残る。

listener error はなく、replica は作成されない。

<a id="firestore-card-replica-15"></a>

### FIRESTORE-CARD-REPLICA-15 匿名は物理削除で Card A の診断と Card B の表示を除去する

カテゴリ: `batch`

区分: 異常系

Given:

- 匿名経路の初回読込が完了し、正常な Card B（`card-b`）だけが表示される。不正 ID は Card A（`card-a`）だけである。
- Card A の FSRS は欠落または不正値で、両方を確認する。replica は存在しない。

When:

- SDK を再接続し、Rules 無効化の外部接続から Card A/B を同時に物理削除して、SDK の removed 結果を受信する。これはアプリの物理削除を認可する操作ではない。

Then:

- Card は0件、不正 ID も0件になる。

listener error はなく、replica は作成されない。

<a id="firestore-card-replica-16"></a>

### FIRESTORE-CARD-REPLICA-16 匿名の UID 切替後に旧購読の変更を反映しない

カテゴリ: `read`

区分: 正常系

Given:

- 匿名経路で UID A の Card A（`card-a`）が表示され、不正な Card B（`card-b`）の ID が公開されている。
- 別の UID B は正常な Card C（`card-c`）を所有する。

When:

1. UID A の購読を解除し、購読 UID と親 Deck を UID B に切り替えて購読する。
2. 外部クライアントが UID A の Card A の本文を `late` に更新する。UID A の受信側 SDK の独立 listener で到着を確認する。

Then:

1. Card C だけが表示され、不正 ID は0件になる。
2. Store と UID A の ready/error 通知は変わらず、Card A/B とその診断は復活しない。

<a id="firestore-card-replica-17"></a>

### FIRESTORE-CARD-REPLICA-17 匿名の metadata 通知では Card A を再処理しない

カテゴリ: `read`

区分: 正常系

Given:

- 匿名経路の SDK cache に正常な Card A（`card-a`）があり、オフラインで初回購読の ready が完了している。

When:

- SDK をオンラインにして、Card A の内容が同じサーバー結果を受信する。

Then:

- metadata のみの通知でも ready callback を再び呼び、Store と Card A の値・参照を維持する。
- Card の再 parse・Store 更新・replica 作成は行わず、listener error はない。
