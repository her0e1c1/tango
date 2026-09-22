# Deck Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する Deck entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

対応ファイル: [`rules.spec.ts`](../../../test/integration/firestore/rules.spec.ts)

## 共通前提

`test-rule` project で実際の `firestore.rules` を読み込む。Given の事前 document は Rules 無効化 context で準備し、When は Rules 有効の context から直接 SDK を呼ぶ。非匿名認証は `google.com`、匿名認証は `anonymous`、未認証は認証情報なしとする。アプリケーションの schema validation は通さない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-DECK-01 | read | [削除済みの公開 Deck を第三者が取得できない](#firestore-rules-deck-01) |
| FIRESTORE-RULES-DECK-02 | read | [本人による Deck の取得を許可する](#firestore-rules-deck-02) |
| FIRESTORE-RULES-DECK-03 | write | [本人による Deck の作成を許可する](#firestore-rules-deck-03) |
| FIRESTORE-RULES-DECK-04 | write | [本人による Deck の更新を許可する](#firestore-rules-deck-04) |
| FIRESTORE-RULES-DECK-05 | write | [本人による Deck の物理削除を許可する](#firestore-rules-deck-05) |
| FIRESTORE-RULES-DECK-06 | read | [他ユーザーによる Deck の非公開データの取得を拒否する](#firestore-rules-deck-06) |
| FIRESTORE-RULES-DECK-07 | read | [他ユーザーによる Deck の公開データの取得を許可する](#firestore-rules-deck-07) |
| FIRESTORE-RULES-DECK-08 | write | [他ユーザーによる Deck の作成を拒否する](#firestore-rules-deck-08) |
| FIRESTORE-RULES-DECK-09 | write | [他ユーザーによる Deck の更新を拒否する](#firestore-rules-deck-09) |
| FIRESTORE-RULES-DECK-10 | write | [他ユーザーによる Deck の物理削除を拒否する](#firestore-rules-deck-10) |
| FIRESTORE-RULES-DECK-11 | write | [匿名認証による Deck の作成を拒否する](#firestore-rules-deck-11) |
| FIRESTORE-RULES-DECK-12 | write | [匿名認証による Deck の更新を拒否する](#firestore-rules-deck-12) |
| FIRESTORE-RULES-DECK-13 | write | [匿名認証による Deck の物理削除を拒否する](#firestore-rules-deck-13) |
| FIRESTORE-RULES-DECK-14 | read | [匿名認証による Deck の公開データの取得を許可する](#firestore-rules-deck-14) |
| FIRESTORE-RULES-DECK-15 | read | [未認証による Deck の非公開データの取得を拒否する](#firestore-rules-deck-15) |
| FIRESTORE-RULES-DECK-16 | read | [未認証による Deck の公開データの取得を許可する](#firestore-rules-deck-16) |
| FIRESTORE-RULES-DECK-17 | write | [未認証による Deck の作成を拒否する](#firestore-rules-deck-17) |
| FIRESTORE-RULES-DECK-18 | write | [未認証による Deck の更新を拒否する](#firestore-rules-deck-18) |
| FIRESTORE-RULES-DECK-19 | write | [未認証による Deck の物理削除を拒否する](#firestore-rules-deck-19) |

<a id="firestore-rules-deck-01"></a>

### FIRESTORE-RULES-DECK-01 削除済みの公開 Deck を第三者が取得できない

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-01] rejects %s from reading a deleted public Deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-02] should read a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid", isPublic: false` を事前保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 取得が許可される。

<a id="firestore-rules-deck-03"></a>

### FIRESTORE-RULES-DECK-03 本人による Deck の作成を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-03] should create a deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-04] should update a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- UID を維持して name を `update` に更新する。

Then:

- 更新が許可される。

<a id="firestore-rules-deck-05"></a>

### FIRESTORE-RULES-DECK-05 本人による Deck の物理削除を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-05] should delete a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が許可される。

<a id="firestore-rules-deck-06"></a>

### FIRESTORE-RULES-DECK-06 他ユーザーによる Deck の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-06] should not read a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-deck-07"></a>

### FIRESTORE-RULES-DECK-07 他ユーザーによる Deck の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-07] should read a public deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-08] should not create a deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-09] should not update a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Deck の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-deck-10"></a>

### FIRESTORE-RULES-DECK-10 他ユーザーによる Deck の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-10] should not delete a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-deck-11"></a>

### FIRESTORE-RULES-DECK-11 匿名認証による Deck の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-11] rejects creating a %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck が存在し、新しい保存先 ID と同じ UID・deckId を指定する。

When:

- `setDoc` で新規作成する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-deck-12"></a>

### FIRESTORE-RULES-DECK-12 匿名認証による Deck の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-12] rejects updating an existing %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck と、同じ UID・deckId を持つ更新対象が存在する。

When:

- `updateDoc` で name を `guest update` に変更する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-deck-13"></a>

### FIRESTORE-RULES-DECK-13 匿名認証による Deck の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-13] rejects deleting an existing %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 対象 document の UID は匿名認証の UID と同じである。

When:

- `deleteDoc` を実行する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-deck-14"></a>

### FIRESTORE-RULES-DECK-14 匿名認証による Deck の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-14] preserves public %s reads`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 別 UID `another-user` の公開 Deck と、その Deck を参照する同じ所有者の Card が存在する。

When:

- 公開 Deck と、その子 Card をそれぞれ `getDoc` で取得する。

Then:

- Deck と Card の両方で取得が許可される。

<a id="firestore-rules-deck-15"></a>

### FIRESTORE-RULES-DECK-15 未認証による Deck の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-15] should not read a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-deck-16"></a>

### FIRESTORE-RULES-DECK-16 未認証による Deck の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-DECK-16] should read a public deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-17] should not create a deck`

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

対応テスト: `[FIRESTORE-RULES-DECK-18] should not update a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Deck の UID を`uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-deck-19"></a>

### FIRESTORE-RULES-DECK-19 未認証による Deck の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-DECK-19] should not delete a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。
