# Snapshot Firestore 結合テスト仕様書

## 目的

`subscribeCards` / `subscribeDecks` が実際の Firestore snapshot を受け取り、現在の購読結果を store に反映する契約を確認する。
初期取得だけでなく、空の結果、UID 分離、物理削除、不正な document、購読エラー、解除・再購読を対象とする。

## 検証状況

本書の追加仕様はすべて **未実装・未検証** であり、既存テストによる保証ではない。本番コードとテストコードは、この仕様書追加では変更しない。
既存ケースは [Subscriptions](./subscriptions.md) に維持し、重複して採番しない。

| 既存ケース | 既存 assertion の範囲 |
| --- | --- |
| [FIRESTORE-SUBSCRIPTIONS-01](./subscriptions.md#firestore-subscriptions-01) | 初期 snapshot の Card ID と本文 |
| [FIRESTORE-SUBSCRIPTIONS-02](./subscriptions.md#firestore-subscriptions-02) | 同一クライアントからの Card / Deck の追加・更新・論理削除 |
| [FIRESTORE-SUBSCRIPTIONS-03](./subscriptions.md#firestore-subscriptions-03) | 購読解除後の編集操作直後に、store が更新前の値を保持すること |

未検証事項と既存テストの一対一対応を混同しないため、追加仕様にはまだ実行対象のケース ID を付けない。
テスト実装時に、本書の文書順で `FIRESTORE-SNAPSHOT-<NN>` を `01` から欠番なく採番し、索引・明示的な ID アンカー・見出し・テストタイトルを同じ変更で更新する。

## 検証境界

実行と cleanup は [README](./README.md) に従う。Firestore Emulator と実際の購読 Adapter を使い、`onSnapshot` や snapshot の内容を mock しない。
本人は非匿名認証とし、通常ケースでは認証 UID と購読 UID を一致させる。ケース専用の UID と document ID を使い、他のテストのデータを削除しない。
事前の store 値、他人の document、不正な document はテスト側で準備する。Rules を無効化するのは必要な事前データの準備だけとし、購読と検証操作には実際の Rules を適用する。

各追加仕様は、下表の Card / Deck の組み合わせをそれぞれ確認する。Card では同じ所有者の親 Deck を保存しておく。

| 対象 | 購読 API | 観測する値 | 更新する表示値 | 不正な document の例 |
| --- | --- | --- | --- | --- |
| Card | `subscribeCards` | Card store の remote Card 一覧 | `frontText` | `tags: null` |
| Deck | `subscribeDecks` | Deck store の remote Deck 一覧 | `name` | `name: null` |

store の ID 集合と値を検証し、配列順、内部関数の呼出し回数、snapshot の通知回数には依存しない。
通常は期待する値への反映を待ち、Firestore への書込み完了だけを購読反映完了とみなさない。サーバー側の更新を扱うケースでは、書込み確認と受信側の反映を別々に待つ。
すべての購読は失敗時も解除し、作成したクライアントを破棄する。

Card の FSRS 固有の契約は [Card.fsrs](./card-fsrs.md)、StudySession の復元は [StudySession](./study-session.md)、履歴 query と cache は [Study History](./study-history.md) を参照する。本書ではそれらの仕様を重複させない。

## 追加テスト仕様一覧（未検証）

| カテゴリ | 区分 | 追加仕様 | 対象 |
| --- | --- | --- | --- |
| read | 正常系 | [空の初期 snapshot で以前のデータを消す](#empty-initial-snapshot) | Card / Deck |
| read | 正常系 | [初期 snapshot から有効な document だけを反映する](#active-initial-snapshot) | Card / Deck |
| read | 正常系 | [購読 UID 以外の document を混在させない](#owner-isolation) | Card / Deck |
| batch | 正常系 | [物理削除で結果から消えた document を store から除く](#physical-deletion) | Card / Deck |
| batch | 正常系 | [別クライアントの追加・更新を反映する](#remote-client-updates) | Card / Deck |
| read | 異常系 | [不正な snapshot で直前の正常な結果を壊さない](#invalid-document) | Card / Deck |
| read | 異常系 | [不正な document の修正後に購読が回復する](#validation-recovery) | Card / Deck |
| read | 異常系 | [読取拒否を購読エラーとして通知する](#permission-denied) | Card / Deck |
| read | 正常系 | [購読解除後の snapshot で store を更新しない](#unsubscribe) | Card / Deck |
| read | 正常系 | [再購読で停止中の変更を含む現在の結果を取得する](#resubscribe) | Card / Deck |

<a id="empty-initial-snapshot"></a>

### 空の初期 snapshot で以前のデータを消す

カテゴリ: `read`

区分: 正常系

Given:

- 購読する UID の対象 collection には document がない。
- 対象 store には、Firestore に存在しない古い document の値を保持している。

When:

- 対象 UID で購読を開始し、空の初期結果の反映完了を待つ。

Then:

- 対象 store の remote 一覧は空になり、古い ID は残らない。
- `onReady` により空の結果でも読込完了が通知され、`onError` は通知されない。

<a id="active-initial-snapshot"></a>

### 初期 snapshot から有効な document だけを反映する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の document A / B は `deletedAt: null`、C は `deletedAt` に削除日時を持つ。
- すべて schema 上は有効で、各 document は異なる ID と表示値を持つ。
- 対象 store は空である。

When:

- 本人の UID で購読を開始し、初期結果の反映完了を待つ。

Then:

- store の ID 集合は A / B のみで、それぞれ保存した表示値を持つ。
- 論理削除済みの C は含まれない。
- `onReady` で通知された時点で上記の値を読め、`onError` は通知されない。

<a id="owner-isolation"></a>

### 購読 UID 以外の document を混在させない

カテゴリ: `read`

区分: 正常系

Given:

- 本人の document A と、異なる UID の document B を保存している。
- B は読取可能な公開 Deck、またはその配下の公開対象 Card とする。Card / Deck ともに論理削除されていない。
- 対象 store は空である。

When:

- 本人の認証 context から、本人の UID で購読を開始する。

Then:

- store の ID 集合は A のみで、読取可能であっても他人の B は含まれない。
- 購読エラーは発生しない。

Rules による読取拒否ではなく、購読 query の UID 分離を確認する。

<a id="physical-deletion"></a>

### 物理削除で結果から消えた document を store から除く

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の document A / B が保存され、購読結果として両方が store に反映済みである。

When:

- 本人の別クライアントから SDK で A を物理削除し、受信側が B のみになるまで待つ。
- 続いて B も物理削除し、受信側の空の結果への反映を待つ。

Then:

- A の削除後は B の ID と表示値を維持し、A は残らない。
- B の削除後は remote 一覧が空になる。
- 購読エラーは発生しない。

`deletedAt` の更新による論理削除とは別の契約である。

<a id="remote-client-updates"></a>

### 別クライアントの追加・更新を反映する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の UID に対応する購読を開始し、初期結果の反映が完了している。
- 書込み用には同じ本人 UID の別 Firebase app / Firestore インスタンスを用意し、購読側と SDK cache を共有しない。

When:

- 書込み用クライアントで document A を `Before` として追加し、購読側で A の反映を待つ。
- 同じ ID の表示値を `After` に更新し、購読側でその値への反映を待つ。

Then:

- 購読側で書込み操作や store の直接更新をしなくても、A が追加されて `After` に変わる。
- 更新後に同じ ID の項目が重複せず、購読エラーは発生しない。

同一 SDK 内の local snapshot やブラウザの複数タブではなく、独立した SDK クライアント間の反映を確認する。

<a id="invalid-document"></a>

### 不正な snapshot で直前の正常な結果を壊さない

カテゴリ: `read`

区分: 異常系

Given:

- 本人の有効な document A が購読され、表示値 `Before` が store に反映済みである。
- `onReady` / `onError` の検証は、この正常な初期反映以降を観測対象とする。

When:

- 本人の書込み用 context から、1つの batch で A の表示値を `After` に変更し、同じ UID の不正な document B を追加する。
- B は Card では `tags: null`、Deck では `name: null` とし、他のフィールドは有効な値とする。
- Adapter の validation エラー通知を待つ。

Then:

- `onError` に B を識別できる document validation エラーが渡る。
- store は直前の正常な A / `Before` を維持し、A / `After` だけを部分反映したり、B を取り込んだりしない。
- 不正な結果を正常な読込完了として `onReady` へ通知しない。

入力 validation のあるアプリケーションの保存 API ではなく、実際の Rules が許可する SDK 書込みで不正データを作り、購読 Adapter の validation を確認する。

<a id="validation-recovery"></a>

### 不正な document の修正後に購読が回復する

カテゴリ: `read`

区分: 異常系

Given:

- 不正な document B を含む snapshot に対して validation エラーが通知され、同じ購読を継続している。
- Card では B の `tags` が `null`、Deck では B の `name` が `null` であり、他のフィールドは有効である。

When:

- 本人の書込み用 context から B を修正する。Card は `tags: []`、Deck は `name: "Recovered"` にする。
- 購読を作り直さず、修正された結果の反映を待つ。

Then:

- B を含む現在の正常な document 一覧が store に反映される。
- 正常な結果の反映後に `onReady` が通知される。
- 修正後の正常な snapshot では validation エラーを通知しない。修正前に発生したエラーは消去されたものとして扱わない。

<a id="permission-denied"></a>

### 読取拒否を購読エラーとして通知する

カテゴリ: `read`

区分: 異常系

Given:

- 本人とは異なる UID の非公開 Deck、またはその配下の Card を保存している。
- 購読側は本人の非匿名認証を使う新しいクライアントで、他人の document を cache や store に保持していない。

When:

- 本人の認証 context から他人の UID を指定して購読を開始し、実際の Rules による拒否通知を待つ。

Then:

- `onError` に `permission-denied` の Firestore エラーが渡る。
- 他人の document は store に反映されない。

SDK の拒否を mock せず、Adapter の document validation エラーとも区別する。拒否に先行する cache 由来の通知回数は、このケースの期待値に含めない。

<a id="unsubscribe"></a>

### 購読解除後の snapshot で store を更新しない

カテゴリ: `read`

区分: 正常系

Given:

- document A / `Before` が store に反映済みである。
- 購読側の同じ Firestore インスタンスに、store を変更しない検証用 listener を別途用意している。

When:

- Adapter から返された解除関数を呼ぶ。
- 本人の別クライアントで A の表示値を `After` に更新する。
- 検証用 listener がサーバーの `After` を受信するまで待つ。

Then:

- 解除した Adapter が管理する store は A / `Before` を維持する。
- 解除後の更新に対する Adapter の完了通知・エラー通知は発生しない。

編集 Promise の完了直後や固定 sleep だけで判定しない。ここで保証するのは検証用 listener の受信完了までの観測結果であり、無期限の無通知を証明するものではない。

<a id="resubscribe"></a>

### 再購読で停止中の変更を含む現在の結果を取得する

カテゴリ: `read`

区分: 正常系

Given:

- 本人の document A / B が store に反映済みで、購読を解除している。
- 停止中に本人の別クライアントで A の表示値を `After` に更新し、B を物理削除し、C を追加している。
- これらの書込みはサーバーに反映済みである。

When:

- 同じ UID で新しい購読を開始し、現在のサーバー結果への反映を待つ。

Then:

- store の ID 集合は A / C のみとなり、A は `After` を持つ。
- 削除された B や停止前の A の値は、反映完了後の結果に残らない。
- 正常な読込完了が通知され、購読エラーは発生しない。

再購読直後に cache の値が届かないことは要求しない。同じ SDK の再購読であり、ブラウザ reload や永続 cache からの復元を保証するケースではない。
