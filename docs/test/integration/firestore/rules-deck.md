# Deck Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する Deck entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

共通前提は [AGENTS.md](./AGENTS.md#security-rules-common-prerequisites) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-DECK-01 | read | 正常系 / 異常系 | [削除済みの公開 Deck を第三者が取得できない](#firestore-rules-deck-01) |
| FIRESTORE-RULES-DECK-02 | read | 正常系 | [本人による Deck の取得を許可する](#firestore-rules-deck-02) |
| FIRESTORE-RULES-DECK-03 | write | 正常系 | [本人による Deck の作成を許可する](#firestore-rules-deck-03) |
| FIRESTORE-RULES-DECK-04 | write | 正常系 | [本人による Deck の更新を許可する](#firestore-rules-deck-04) |
| FIRESTORE-RULES-DECK-05 | write | 異常系 | [本人による Deck の物理削除を拒否する](#firestore-rules-deck-05) |
| FIRESTORE-RULES-DECK-06 | read | 異常系 | [他ユーザーによる Deck の非公開データの取得を拒否する](#firestore-rules-deck-06) |
| FIRESTORE-RULES-DECK-07 | read | 正常系 | [他ユーザーによる Deck の公開データの取得を許可する](#firestore-rules-deck-07) |
| FIRESTORE-RULES-DECK-08 | write | 異常系 | [他ユーザーによる Deck の作成を拒否する](#firestore-rules-deck-08) |
| FIRESTORE-RULES-DECK-09 | write | 異常系 | [他ユーザーによる Deck の更新を拒否する](#firestore-rules-deck-09) |
| FIRESTORE-RULES-DECK-10 | write | 異常系 | [他ユーザーによる Deck の物理削除を拒否する](#firestore-rules-deck-10) |
| FIRESTORE-RULES-DECK-11 | write | 異常系 | [匿名認証による Deck の作成を拒否する](#firestore-rules-deck-11) |
| FIRESTORE-RULES-DECK-12 | write | 異常系 | [匿名認証による Deck の更新を拒否する](#firestore-rules-deck-12) |
| FIRESTORE-RULES-DECK-13 | write | 異常系 | [匿名認証による Deck の物理削除を拒否する](#firestore-rules-deck-13) |
| FIRESTORE-RULES-DECK-14 | read | 正常系 | [匿名認証による Deck の公開データの取得を許可する](#firestore-rules-deck-14) |
| FIRESTORE-RULES-DECK-15 | read | 異常系 | [未認証による Deck の非公開データの取得を拒否する](#firestore-rules-deck-15) |
| FIRESTORE-RULES-DECK-16 | read | 正常系 | [未認証による Deck の公開データの取得を許可する](#firestore-rules-deck-16) |
| FIRESTORE-RULES-DECK-17 | write | 異常系 | [未認証による Deck の作成を拒否する](#firestore-rules-deck-17) |
| FIRESTORE-RULES-DECK-18 | write | 異常系 | [未認証による Deck の更新を拒否する](#firestore-rules-deck-18) |
| FIRESTORE-RULES-DECK-19 | write | 異常系 | [未認証による Deck の物理削除を拒否する](#firestore-rules-deck-19) |
| FIRESTORE-RULES-DECK-20 | write | 異常系 | [本人による所有者 UID の変更・削除を拒否する](#firestore-rules-deck-20) |
| FIRESTORE-RULES-DECK-21 | write | 異常系 | [他人の Deck の所有者を自分にする更新・上書きを拒否する](#firestore-rules-deck-21) |
| FIRESTORE-RULES-DECK-22 | read | 正常系 | [本人の UID で絞った Deck 一覧取得を許可する](#firestore-rules-deck-22) |
| FIRESTORE-RULES-DECK-23 | read | 異常系 | [権限を保証できない Deck 一覧取得を拒否する](#firestore-rules-deck-23) |
| FIRESTORE-RULES-DECK-24 | read | 異常系 | [匿名認証による他人の非公開 Deck 取得を拒否する](#firestore-rules-deck-24) |

<a id="firestore-rules-deck-01"></a>

### FIRESTORE-RULES-DECK-01 削除済みの公開 Deck を第三者が取得できない

カテゴリ: `read`

区分: 正常系 / 異常系

Given:

- 所有者 `owner` の公開 Deck `deleted` は deletedAt `1000`、公開 Deck `active` は deletedAt `null` である。
- 他ユーザー・匿名認証・未認証の3通りで検証する。

When:

- 削除済み Deck と未削除の公開 Deck を個別に get する。

Then:

- 削除済み Deck の読取は拒否され、未削除の公開 Deck の読取だけが許可される。

この拒否は第三者からのアクセス制御であり、document の物理削除を意味しない。

<a id="firestore-rules-deck-02"></a>

### FIRESTORE-RULES-DECK-02 本人による Deck の取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid", isPublic: false` を事前保存する。`deletedAt` は `null`（未削除）と `1000`（論理削除済み）の2通りで検証する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 論理削除の有無にかかわらず、本人による取得が許可される。

<a id="firestore-rules-deck-03"></a>

### FIRESTORE-RULES-DECK-03 本人による Deck の作成を許可する

カテゴリ: `write`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- 保存先は未使用の ID とする。

When:

- UID `uid` を指定して `setDoc` で作成する。

Then:

- 作成が許可される。

<a id="firestore-rules-deck-04"></a>

### FIRESTORE-RULES-DECK-04 本人による Deck の更新を許可する

カテゴリ: `write`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- UID を維持して name を `update` に更新する。

Then:

- 更新が許可される。

<a id="firestore-rules-deck-05"></a>

### FIRESTORE-RULES-DECK-05 本人による Deck の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除は拒否され、document は残る。

<a id="firestore-rules-deck-06"></a>

### FIRESTORE-RULES-DECK-06 他ユーザーによる Deck の非公開データの取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` を事前保存する。`isPublic` 未指定と `isPublic: false` の2通りで検証する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-deck-07"></a>

### FIRESTORE-RULES-DECK-07 他ユーザーによる Deck の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- UID `uid` の Deck に `isPublic: true` を保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-deck-08"></a>

### FIRESTORE-RULES-DECK-08 他ユーザーによる Deck の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Deck を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-deck-09"></a>

### FIRESTORE-RULES-DECK-09 他ユーザーによる Deck の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- 既存 Deck の UID を `uid` のまま、name を `update` に更新する。

Then:

- 公開設定にかかわらず、更新が拒否される。

<a id="firestore-rules-deck-10"></a>

### FIRESTORE-RULES-DECK-10 他ユーザーによる Deck の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 公開設定にかかわらず、物理削除が拒否される。

<a id="firestore-rules-deck-11"></a>

### FIRESTORE-RULES-DECK-11 匿名認証による Deck の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で操作する。
- 本人 UID の Deck が存在し、未使用の ID に同じ UID と既存 Deck の ID を `deckId` として指定する。

When:

- `setDoc` で新規作成する。

Then:

- Deck の作成が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-deck-12"></a>

### FIRESTORE-RULES-DECK-12 匿名認証による Deck の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- `updateDoc` で name を `guest update` に変更する。

Then:

- 公開設定や UID の一致にかかわらず、匿名認証による操作が拒否される。

<a id="firestore-rules-deck-13"></a>

### FIRESTORE-RULES-DECK-13 匿名認証による Deck の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- `deleteDoc` を実行する。

Then:

- 公開設定や UID の一致にかかわらず、匿名認証による操作が拒否される。

<a id="firestore-rules-deck-14"></a>

### FIRESTORE-RULES-DECK-14 匿名認証による Deck の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 匿名認証の UID `uid` で操作する。
- 別 UID `another-user` の Deck に `isPublic: true` を事前保存する。

When:

- 公開 Deck を `getDoc` で取得する。

Then:

- Deck の取得が許可される。

<a id="firestore-rules-deck-15"></a>

### FIRESTORE-RULES-DECK-15 未認証による Deck の非公開データの取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` を事前保存する。`isPublic` 未指定と `isPublic: false` の2通りで検証する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-deck-16"></a>

### FIRESTORE-RULES-DECK-16 未認証による Deck の公開データの取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 認証情報を持たない SDK context で操作する。
- UID `uid` の Deck に `isPublic: true` を保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-deck-17"></a>

### FIRESTORE-RULES-DECK-17 未認証による Deck の作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Deck を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-deck-18"></a>

### FIRESTORE-RULES-DECK-18 未認証による Deck の更新を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- 既存 Deck の UID を`uid` のまま、name を `update` に更新する。

Then:

- 公開設定にかかわらず、更新が拒否される。

<a id="firestore-rules-deck-19"></a>

### FIRESTORE-RULES-DECK-19 未認証による Deck の物理削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` 未指定・`false`・`true` の3通りで検証する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 公開設定にかかわらず、物理削除が拒否される。

<a id="firestore-rules-deck-20"></a>

### FIRESTORE-RULES-DECK-20 本人による所有者 UID の変更・削除を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- `updateDoc` で `uid` を `another-user` に変更、`null` に変更、`deleteField()` で削除する3操作をそれぞれ試す。
- UID を含まない `{ name: "replacement" }` による `setDoc` の全体上書きも試す。

Then:

- 4操作すべてが拒否される。本人でも所有者 UID を変更・削除できない。

<a id="firestore-rules-deck-21"></a>

### FIRESTORE-RULES-DECK-21 他人の Deck の所有者を自分にする更新・上書きを拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid", deletedAt: null` を事前保存する。`isPublic` は `false` と `true` の2通りで検証する。

When:

- `updateDoc` で `uid` を操作主体の `invalid` に変更する。
- `setDoc` で `{ uid: "invalid", name: "replacement" }` に全体を上書きする。

Then:

- 公開・非公開のいずれも更新と上書きが拒否される。更新後の UID を自分にしても、他人の Deck の所有権を奪えない。

<a id="firestore-rules-deck-22"></a>

### FIRESTORE-RULES-DECK-22 本人の UID で絞った Deck 一覧取得を許可する

カテゴリ: `read`

区分: 正常系

Given:

- 非匿名認証の UID `uid` で操作する。
- 本人の Deck `private`（非公開・未削除）、`public`（公開・未削除）、`deleted`（公開・`deletedAt: 1000`）を事前保存する。未削除の Deck の `deletedAt` は `null` とする。
- 別 UID `another-user` の公開 Deck `other-public` と非公開 Deck `other-private` も保存する。両方とも `deletedAt: null` とする。

When:

- `where("uid", "==", "uid")` を指定した `deck` コレクションの query を `getDocs` で取得する。

Then:

- 取得が許可され、返却 ID は `private`・`public`・`deleted` の3件だけである。
- 他ユーザーの Deck は含まれず、本人の論理削除済み Deck は含まれる。これは Rules の認可であり、アプリケーションでの非表示とは区別する。

<a id="firestore-rules-deck-23"></a>

### FIRESTORE-RULES-DECK-23 権限を保証できない Deck 一覧取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 所有者 UID `uid` の公開 Deck と非公開 Deck を事前保存する。両方とも `deletedAt: null` とする。
- 非匿名認証 UID `other-user`・匿名認証 UID `anonymous`・未認証の3通りで検証する。認証 UID は所有者 UID と一致しない。

When:

- 条件なしの `deck` コレクション全件取得を `getDocs` で実行する。
- 所有者の `where("uid", "==", "uid")` だけで絞った query も `getDocs` で実行する。

Then:

- 各認証主体で2種類の query がともに拒否される。読めない Deck を除外して成功する動作とは扱わない。

<a id="firestore-rules-deck-24"></a>

### FIRESTORE-RULES-DECK-24 匿名認証による他人の非公開 Deck 取得を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 匿名認証の UID `uid` で操作する。
- 別 UID `another-user` の Deck を事前保存する。`isPublic` 未指定と `isPublic: false` の2通りで検証する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- どちらの非公開 Deck も取得が拒否される。

所有者と同じ UID の匿名認証に対する読取仕様は、このケースでは変更しない。
