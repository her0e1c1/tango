# Card Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する Card entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

共通前提は [AGENTS.md](./AGENTS.md#security-rules-common-prerequisites) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-CARD-01 | read | 異常系 | [削除済みの公開 Deck 配下または削除済みの Card を第三者が取得できない](#firestore-rules-card-01) |
| FIRESTORE-RULES-CARD-02 | read | 正常系 | [本人による Card の取得を許可する](#firestore-rules-card-02) |
| FIRESTORE-RULES-CARD-03 | write | 正常系 | [本人による Card の作成を許可する](#firestore-rules-card-03) |
| FIRESTORE-RULES-CARD-04 | write | 正常系 | [本人による Card の更新を許可する](#firestore-rules-card-04) |
| FIRESTORE-RULES-CARD-05 | write | 正常系 | [本人による Card の物理削除を許可する](#firestore-rules-card-05) |
| FIRESTORE-RULES-CARD-06 | read | 異常系 | [他ユーザーによる Card の非公開データの取得を拒否する](#firestore-rules-card-06) |
| FIRESTORE-RULES-CARD-07 | read | 正常系 | [他ユーザーによる Card の公開データの取得を許可する](#firestore-rules-card-07) |
| FIRESTORE-RULES-CARD-08 | write | 異常系 | [他ユーザーによる Card の作成を拒否する](#firestore-rules-card-08) |
| FIRESTORE-RULES-CARD-09 | write | 異常系 | [他ユーザーによる Card の更新を拒否する](#firestore-rules-card-09) |
| FIRESTORE-RULES-CARD-10 | write | 異常系 | [他ユーザーによる Card の物理削除を拒否する](#firestore-rules-card-10) |
| FIRESTORE-RULES-CARD-11 | write | 異常系 | [匿名認証による Card の作成を拒否する](#firestore-rules-card-11) |
| FIRESTORE-RULES-CARD-12 | write | 異常系 | [匿名認証による Card の更新を拒否する](#firestore-rules-card-12) |
| FIRESTORE-RULES-CARD-13 | write | 異常系 | [匿名認証による Card の物理削除を拒否する](#firestore-rules-card-13) |
| FIRESTORE-RULES-CARD-14 | read | 正常系 | [匿名認証による Card の公開データの取得を許可する](#firestore-rules-card-14) |
| FIRESTORE-RULES-CARD-15 | read | 異常系 | [未認証による Card の非公開データの取得を拒否する](#firestore-rules-card-15) |
| FIRESTORE-RULES-CARD-16 | read | 正常系 | [未認証による Card の公開データの取得を許可する](#firestore-rules-card-16) |
| FIRESTORE-RULES-CARD-17 | write | 異常系 | [未認証による Card の作成を拒否する](#firestore-rules-card-17) |
| FIRESTORE-RULES-CARD-18 | write | 異常系 | [未認証による Card の更新を拒否する](#firestore-rules-card-18) |
| FIRESTORE-RULES-CARD-19 | write | 異常系 | [未認証による Card の物理削除を拒否する](#firestore-rules-card-19) |
| FIRESTORE-RULES-CARD-20 | write | 異常系 | [旧個人学習フィールドを Card に書き戻せない](#firestore-rules-card-20) |
| FIRESTORE-RULES-CARD-21 | write | 正常系 / 異常系 | [本人の FSRS 更新を許可し Card の同一性を維持する](#firestore-rules-card-21) |
| FIRESTORE-RULES-CARD-22 | write | 正常系 / 異常系 | [公開 Card の FSRS を公開し他人の書込を拒否する](#firestore-rules-card-22) |
| FIRESTORE-RULES-CARD-23 | write | 正常系 / 異常系 | [FSRS 外形と所有権・削除状態を確認する](#firestore-rules-card-23) |
| FIRESTORE-RULES-CARD-24 | write | 異常系 | [評価更新で物理削除 Card を再作成しない](#firestore-rules-card-24) |

<a id="firestore-rules-card-01"></a>

### FIRESTORE-RULES-CARD-01 削除済みの公開 Deck 配下または削除済みの Card を第三者が取得できない

カテゴリ: `read`

区分: 異常系

Given:

- 所有者 `owner` の公開 Deck `deleted` は deletedAt `1000`、公開 Deck `active` は deletedAt `null` である。
- `deleted` の子 Card は未削除、`active` の別 Card は deletedAt `1000` である。
- 他ユーザー・匿名認証・未認証の3通りで検証する。

When:

- 削除済み Deck 配下の未削除 Card と、未削除 Deck 配下の削除済み Card を個別に get する。

Then:

- どちらの Card も読取が拒否される。

この拒否は第三者からのアクセス制御であり、document の物理削除を意味しない。

<a id="firestore-rules-card-02"></a>

### FIRESTORE-RULES-CARD-02 本人による Card の取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 取得が許可される。

<a id="firestore-rules-card-03"></a>

### FIRESTORE-RULES-CARD-03 本人による Card の作成を許可する

カテゴリ: `write`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- 保存先は未使用の ID とする。
- 親 Deck は UID `uid` が所有し、書込後の Card の deckId はその親を参照する。

When:

- UID `uid`、親 deckId、fsrs: null、createdAt: 0、deletedAt: null を指定して `setDoc` で作成する。

Then:

- 作成が許可される。

<a id="firestore-rules-card-04"></a>

### FIRESTORE-RULES-CARD-04 本人による Card の更新を許可する

カテゴリ: `write`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に uid、親 deckId、fsrs: null、createdAt: 0、deletedAt: null を事前保存する。
- 親 Deck は UID `uid` が所有し、書込後の Card の deckId はその親を参照する。

When:

- UID と親 Deck を維持し、frontText を `Updated` に更新する。

Then:

- 更新が許可される。

<a id="firestore-rules-card-05"></a>

### FIRESTORE-RULES-CARD-05 本人による Card の物理削除を許可する

カテゴリ: `write`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が許可される。

<a id="firestore-rules-card-06"></a>

### FIRESTORE-RULES-CARD-06 他ユーザーによる Card の非公開データの取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-card-07"></a>

### FIRESTORE-RULES-CARD-07 他ユーザーによる Card の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- UID `uid` の公開 Deck と、それを deckId で参照する同じ所有者の Card が存在する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-card-08"></a>

### FIRESTORE-RULES-CARD-08 他ユーザーによる Card の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Card を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-card-09"></a>

### FIRESTORE-RULES-CARD-09 他ユーザーによる Card の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Card の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-card-10"></a>

### FIRESTORE-RULES-CARD-10 他ユーザーによる Card の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-card-11"></a>

### FIRESTORE-RULES-CARD-11 匿名認証による Card の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck が存在し、新しい保存先 ID と同じ UID・deckId を指定する。

When:

- `setDoc` で新規作成する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-card-12"></a>

### FIRESTORE-RULES-CARD-12 匿名認証による Card の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck と、同じ UID・deckId を持つ更新対象が存在する。

When:

- `updateDoc` で name を `guest update` に変更する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-card-13"></a>

### FIRESTORE-RULES-CARD-13 匿名認証による Card の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 対象 document の UID は匿名認証の UID と同じである。

When:

- `deleteDoc` を実行する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-card-14"></a>

### FIRESTORE-RULES-CARD-14 匿名認証による Card の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 別 UID `another-user` の公開 Deck と、その Deck を参照する同じ所有者の Card が存在する。

When:

- 公開 Deck と、その子 Card をそれぞれ `getDoc` で取得する。

Then:

- Deck と Card の両方で取得が許可される。

<a id="firestore-rules-card-15"></a>

### FIRESTORE-RULES-CARD-15 未認証による Card の非公開データの取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-card-16"></a>

### FIRESTORE-RULES-CARD-16 未認証による Card の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 認証情報を持たない SDK context で操作する。
- UID `uid` の公開 Deck と、それを deckId で参照する同じ所有者の Card が存在する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-card-17"></a>

### FIRESTORE-RULES-CARD-17 未認証による Card の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Card を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-card-18"></a>

### FIRESTORE-RULES-CARD-18 未認証による Card の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Card の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-card-19"></a>

### FIRESTORE-RULES-CARD-19 未認証による Card の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-card-20"></a>

### FIRESTORE-RULES-CARD-20 旧個人学習フィールドを Card に書き戻せない

カテゴリ: `write`

区分: 異常系

Given:

- 本人の Deck と fsrs: null の Card がある。

When:

- difficulty / numberOfSeen / firstSeenAt / lastSeenAt / nextSeeingAt / interval / studySchedule をそれぞれ追加して作成・更新する。

Then:

- 全て拒否される。

<a id="firestore-rules-card-21"></a>

### FIRESTORE-RULES-CARD-21 本人の FSRS 更新を許可し Card の同一性を維持する

カテゴリ: `write`

区分: 正常系 / 異常系

Given:

- 本人の Deck と fsrs: null、createdAt: 1000 の Card がある。

When:

- Card の単体・本人 UID query 読取、FSRS 更新、UID・Deck・作成日時変更、物理削除を試す。

Then:

- 読取・FSRS 更新・削除を許可し、UID・Deck・作成日時変更は拒否する。

<a id="firestore-rules-card-22"></a>

### FIRESTORE-RULES-CARD-22 公開 Card の FSRS を公開し他人の書込を拒否する

カテゴリ: `write`

区分: 正常系 / 異常系

Given:

- 公開 Deck の評価済み Card がある。

When:

- 他ユーザー・同一 UID の匿名・未認証で Card を読み、置換・FSRS 更新・削除を試す。

Then:

- 全員が保存された FSRS を取得できる。全ての書込は拒否される。

<a id="firestore-rules-card-23"></a>

### FIRESTORE-RULES-CARD-23 FSRS 外形と所有権・削除状態を確認する

カテゴリ: `write`

区分: 正常系 / 異常系

Given:

- 本人の Deck と Card がある。

When:

- 数値 FSRS、空 map、不正な数値を含む map を更新する。他人の Card、削除 Card、他人所有 Deck の Card に評価を書き込む。

Then:

- 非 map、他人・削除済み・Deck 所有者不一致を拒否する。空 map と difficulty: 0、stability: Infinity を含む map は Rules が許可する。詳細検証は Adapter が担当し、不正値は購読時に拒否される。

<a id="firestore-rules-card-24"></a>

### FIRESTORE-RULES-CARD-24 評価更新で物理削除 Card を再作成しない

カテゴリ: `write`

区分: 異常系

Given:

- 本人の Deck と Card がある。

When:

- Card を物理削除した後、fsrs と updatedAt の部分更新を試す。

Then:

- 更新は拒否され、Card は再作成されない。
