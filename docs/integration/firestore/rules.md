# Rules Firestore 結合テスト仕様書

## 目的

実際の firestore.rules に対する許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

対応ファイル: [`rules.spec.ts`](../../../test/integration/firestore/rules.spec.ts)

関連 E2E: [PERSISTENCE-01](../../e2e/persistence.md#persistence-01)、[PERSISTENCE-04](../../e2e/persistence.md#persistence-04)、[STUDY-ACTIONS-01](../../e2e/study-actions.md#study-actions-01)

## 共通前提

`test-rule` project で実際の `firestore.rules` を読み込む。Given の事前 document は Rules 無効化 context で準備し、When は Rules 有効の context から直接 SDK を呼ぶ。非匿名認証は `google.com`、匿名認証は `anonymous`、未認証は認証情報なしとする。アプリケーションの schema validation は通さない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-01 | batch | [本人が private session を作成・取得・更新できる](#firestore-rules-01) |
| FIRESTORE-RULES-02 | batch | [公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない](#firestore-rules-02) |
| FIRESTORE-RULES-03 | write | [本人でも session の所有者変更と物理削除はできない](#firestore-rules-03) |
| FIRESTORE-RULES-04 | read | [削除済みの公開 Deck と Card を第三者が取得できない](#firestore-rules-04) |
| FIRESTORE-RULES-05 | batch | [回答作成と State・session 更新を同じ batch で許可する](#firestore-rules-05) |
| FIRESTORE-RULES-06 | write | [回答 ID と完了後の回答順序はアプリケーションの責務とする](#firestore-rules-06) |
| FIRESTORE-RULES-07 | write | [保存済みの回答履歴は本人でも更新・削除できない](#firestore-rules-07) |
| FIRESTORE-RULES-08 | batch | [他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する](#firestore-rules-08) |
| FIRESTORE-RULES-09 | read | [本人による Deck の取得を許可する](#firestore-rules-09) |
| FIRESTORE-RULES-10 | write | [本人による Deck の作成を許可する](#firestore-rules-10) |
| FIRESTORE-RULES-11 | write | [本人による Deck の更新を許可する](#firestore-rules-11) |
| FIRESTORE-RULES-12 | write | [本人による Deck の物理削除を許可する](#firestore-rules-12) |
| FIRESTORE-RULES-13 | read | [本人による Card の取得を許可する](#firestore-rules-13) |
| FIRESTORE-RULES-14 | write | [本人による Card の作成を許可する](#firestore-rules-14) |
| FIRESTORE-RULES-15 | write | [本人による Card の更新を許可する](#firestore-rules-15) |
| FIRESTORE-RULES-16 | write | [本人による Card の物理削除を許可する](#firestore-rules-16) |
| FIRESTORE-RULES-17 | read | [他ユーザーによる Deck の非公開データの取得を拒否する](#firestore-rules-17) |
| FIRESTORE-RULES-18 | read | [他ユーザーによる Deck の公開データの取得を許可する](#firestore-rules-18) |
| FIRESTORE-RULES-19 | write | [他ユーザーによる Deck の作成を拒否する](#firestore-rules-19) |
| FIRESTORE-RULES-20 | write | [他ユーザーによる Deck の更新を拒否する](#firestore-rules-20) |
| FIRESTORE-RULES-21 | write | [他ユーザーによる Deck の物理削除を拒否する](#firestore-rules-21) |
| FIRESTORE-RULES-22 | read | [他ユーザーによる Card の非公開データの取得を拒否する](#firestore-rules-22) |
| FIRESTORE-RULES-23 | read | [他ユーザーによる Card の公開データの取得を許可する](#firestore-rules-23) |
| FIRESTORE-RULES-24 | write | [他ユーザーによる Card の作成を拒否する](#firestore-rules-24) |
| FIRESTORE-RULES-25 | write | [他ユーザーによる Card の更新を拒否する](#firestore-rules-25) |
| FIRESTORE-RULES-26 | write | [他ユーザーによる Card の物理削除を拒否する](#firestore-rules-26) |
| FIRESTORE-RULES-27 | write | [匿名認証による Deck・Card の作成を拒否する](#firestore-rules-27) |
| FIRESTORE-RULES-28 | write | [匿名認証による Deck・Card の更新を拒否する](#firestore-rules-28) |
| FIRESTORE-RULES-29 | write | [匿名認証による Deck・Card の物理削除を拒否する](#firestore-rules-29) |
| FIRESTORE-RULES-30 | read | [匿名認証による Deck・Card の公開データの取得を許可する](#firestore-rules-30) |
| FIRESTORE-RULES-31 | read | [未認証による Deck の非公開データの取得を拒否する](#firestore-rules-31) |
| FIRESTORE-RULES-32 | read | [未認証による Deck の公開データの取得を許可する](#firestore-rules-32) |
| FIRESTORE-RULES-33 | write | [未認証による Deck の作成を拒否する](#firestore-rules-33) |
| FIRESTORE-RULES-34 | write | [未認証による Deck の更新を拒否する](#firestore-rules-34) |
| FIRESTORE-RULES-35 | write | [未認証による Deck の物理削除を拒否する](#firestore-rules-35) |
| FIRESTORE-RULES-36 | read | [未認証による Card の非公開データの取得を拒否する](#firestore-rules-36) |
| FIRESTORE-RULES-37 | read | [未認証による Card の公開データの取得を許可する](#firestore-rules-37) |
| FIRESTORE-RULES-38 | write | [未認証による Card の作成を拒否する](#firestore-rules-38) |
| FIRESTORE-RULES-39 | write | [未認証による Card の更新を拒否する](#firestore-rules-39) |
| FIRESTORE-RULES-40 | write | [未認証による Card の物理削除を拒否する](#firestore-rules-40) |
| FIRESTORE-RULES-41 | write | [本人が任意の状態を作成・読取・更新・削除でき、同一性は変更できない](#firestore-rules-41) |
| FIRESTORE-RULES-42 | write | [公開 Card の State も本人以外はアクセスできない](#firestore-rules-42) |
| FIRESTORE-RULES-43 | write | [状態の同一性・メタデータ・所有 Card を検証する](#firestore-rules-43) |
| FIRESTORE-RULES-44 | write | [旧個人学習フィールドを Card に書き戻せない](#firestore-rules-44) |
| FIRESTORE-RULES-45 | write | [区切り文字と Unicode を含む決定的 ID を許可する](#firestore-rules-45) |

<a id="firestore-rules-01"></a>

### FIRESTORE-RULES-01 本人が private session を作成・取得・更新できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-01] allows the owner to create, resume and complete a private session`

Given:

- 非匿名認証の UID `uid` で、同じ UID の新しい session 入力を用意する。
- 入力は2枚の順序と位置 `0`、未終了の状態を持つ。親 Deck の存在はこのケースでは準備しない。

When:

- SDK で session を作成し、単体 get と `where("uid", "==", "uid")` の query を行う。
- 位置を `1` に更新し、その後 endReason `completed` と endedAt を保存する。

Then:

- 作成・単体取得・本人に限定した query・位置更新・完了更新がすべて許可される。

<a id="firestore-rules-02"></a>

### FIRESTORE-RULES-02 公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-02] denies %s access even when the Deck is public`

Given:

- UID `uid` の公開 Deck と、その UID の session が存在する。
- 認証主体は他ユーザー `other-user`、所有者と同じ UID の匿名認証、未認証の3通りとする。

When:

- 既存 session の get、所有者 UID 条件付き query、同じ所有者を指定した新規作成、位置更新、削除を行う。

Then:

- 3通りの主体すべてで、5種類の操作が拒否される。

<a id="firestore-rules-03"></a>

### FIRESTORE-RULES-03 本人でも session の所有者変更と物理削除はできない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-03] rejects ownership changes and deletion`

Given:

- 非匿名認証の本人が所有する session が存在する。

When:

- UID を `another-user` に変更する update と、`deleteDoc` を個別に実行する。

Then:

- 所有者変更と物理削除はどちらも拒否される。

<a id="firestore-rules-04"></a>

### FIRESTORE-RULES-04 削除済みの公開 Deck と Card を第三者が取得できない

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-04] rejects %s`

Given:

- 所有者 `owner` の公開 Deck `deleted` は deletedAt `1000`、公開 Deck `active` は deletedAt `null` である。
- `deleted` の子 Card は未削除、`active` の別 Card は deletedAt `1000` である。
- 他ユーザー・匿名認証・未認証の3通りで検証する。

When:

- 削除済み Deck、その未削除の子 Card、削除済み Card、未削除の公開 Deck を個別に get する。

Then:

- 最初の3件の読取はすべて拒否され、未削除の公開 Deck の読取だけが許可される。

この拒否は第三者からのアクセス制御であり、document の物理削除を意味しない。

<a id="firestore-rules-05"></a>

### FIRESTORE-RULES-05 回答作成と State・session 更新を同じ batch で許可する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-05] accepts the first and final answer with atomic state and session updates`

Given:

- 非匿名認証の UID `owner` が、Deck `deck`、Card `first` / `last`、未終了の session `session` を所有する。
- 回答は同じ UID・Deck・session・Card を参照し、`{ type: "rating", rating: "good" }` と Timestamp の回答日時を持つ。

When:

- 最初と最後の Card について、回答作成・CardStudyState 更新・session の位置更新を1つの SDK batch に入れて commit する。最後の batch には completed と endedAt も含める。
- 各回答を本人として get する。

Then:

- 両方の batch commit と回答の読取が許可される。

Rules が常に batch を必須にする契約ではない。単独の回答作成は次のケースで確認する。

<a id="firestore-rules-06"></a>

### FIRESTORE-RULES-06 回答 ID と完了後の回答順序はアプリケーションの責務とする

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-06] leaves answer sequencing to the application`

Given:

- 本人が同じ Deck に属する Card と session を所有している。

When:

- 最後の Card に対する回答を単独で作成する。session を completed に更新した後、同じ Card に別の回答 ID でもう一度回答を作成する。

Then:

- 単独作成と、session 完了後の別 ID での作成がどちらも許可される。

一意な回答 ID、回答順序、Card 進捗更新の同時実行を Rules の保証として扱わない。

<a id="firestore-rules-07"></a>

### FIRESTORE-RULES-07 保存済みの回答履歴は本人でも更新・削除できない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-07] forbids rewriting or deleting answer history`

Given:

- 本人の rating `good` の回答履歴が存在する。

When:

- rating を `again` にする update と、回答の delete を実行する。

Then:

- 更新と削除はどちらも拒否される。

<a id="firestore-rules-08"></a>

### FIRESTORE-RULES-08 他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-08] rejects %s reads and answer batches`

Given:

- UID `owner` の回答履歴、Card、session が存在する。
- 主体は他ユーザーと、所有者と同じ UID の匿名認証の2通りとする。

When:

- 回答を get する。続いて回答作成・CardStudyState への書き込み・session 更新を含む batch を commit する。Card 自体は更新しない。

Then:

- 両方の主体で、回答の読取と batch commit が拒否される。

<a id="firestore-rules-09"></a>

### FIRESTORE-RULES-09 本人による Deck の取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-09] should read a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid", isPublic: false` を事前保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 取得が許可される。

<a id="firestore-rules-10"></a>

### FIRESTORE-RULES-10 本人による Deck の作成を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-10] should create a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- 保存先は未使用の ID とする。

When:

- UID `uid` を指定して `setDoc` で作成する。

Then:

- 作成が許可される。

<a id="firestore-rules-11"></a>

### FIRESTORE-RULES-11 本人による Deck の更新を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-11] should update a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- UID を維持して name を `update` に更新する。

Then:

- 更新が許可される。

<a id="firestore-rules-12"></a>

### FIRESTORE-RULES-12 本人による Deck の物理削除を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-12] should delete a deck`

Given:

- 非匿名認証の UID `uid` で操作する。
- Deck に `uid: "uid"` を事前保存する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が許可される。

<a id="firestore-rules-13"></a>

### FIRESTORE-RULES-13 本人による Card の取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-13] should read a card`

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 取得が許可される。

<a id="firestore-rules-14"></a>

### FIRESTORE-RULES-14 本人による Card の作成を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-14] should create a card`

Given:

- 非匿名認証の UID `uid` で操作する。
- 保存先は未使用の ID とする。
- 親 Deck は UID `uid` が所有し、書込後の Card の deckId はその親を参照する。

When:

- UID `uid` と親 deckId を指定して `setDoc` で作成する。

Then:

- 作成が許可される。

<a id="firestore-rules-15"></a>

### FIRESTORE-RULES-15 本人による Card の更新を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-15] should update a card`

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に `uid: "uid"` を事前保存する。
- 親 Deck は UID `uid` が所有し、書込後の Card の deckId はその親を参照する。

When:

- UID を維持し、本人の親 Deck ID を `updateDoc` で保存する。

Then:

- 更新が許可される。

<a id="firestore-rules-16"></a>

### FIRESTORE-RULES-16 本人による Card の物理削除を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-16] should delete a card`

Given:

- 非匿名認証の UID `uid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が許可される。

<a id="firestore-rules-17"></a>

### FIRESTORE-RULES-17 他ユーザーによる Deck の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-17] should not read a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-18"></a>

### FIRESTORE-RULES-18 他ユーザーによる Deck の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-18] should read a public deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- UID `uid` の Deck に `isPublic: true` を保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-19"></a>

### FIRESTORE-RULES-19 他ユーザーによる Deck の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-19] should not create a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Deck を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-20"></a>

### FIRESTORE-RULES-20 他ユーザーによる Deck の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-20] should not update a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Deck の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-21"></a>

### FIRESTORE-RULES-21 他ユーザーによる Deck の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-21] should not delete a deck`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-22"></a>

### FIRESTORE-RULES-22 他ユーザーによる Card の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-22] should not read a card`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-23"></a>

### FIRESTORE-RULES-23 他ユーザーによる Card の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-23] should read a public card`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- UID `uid` の公開 Deck と、それを deckId で参照する同じ所有者の Card が存在する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-24"></a>

### FIRESTORE-RULES-24 他ユーザーによる Card の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-24] should not create a card`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Card を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-25"></a>

### FIRESTORE-RULES-25 他ユーザーによる Card の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-25] should not update a card`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Card の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-26"></a>

### FIRESTORE-RULES-26 他ユーザーによる Card の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-26] should not delete a card`

Given:

- 所有者 UID `uid` と異なる、非匿名認証の UID `invalid` で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-27"></a>

### FIRESTORE-RULES-27 匿名認証による Deck・Card の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-27] rejects creating a %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck が存在し、新しい保存先 ID と同じ UID・deckId を指定する。

When:

- `setDoc` で新規作成する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-28"></a>

### FIRESTORE-RULES-28 匿名認証による Deck・Card の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-28] rejects updating an existing %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 本人 UID の親 Deck と、同じ UID・deckId を持つ更新対象が存在する。

When:

- `updateDoc` で name を `guest update` に変更する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-29"></a>

### FIRESTORE-RULES-29 匿名認証による Deck・Card の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-29] rejects deleting an existing %s`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 対象 document の UID は匿名認証の UID と同じである。

When:

- `deleteDoc` を実行する。

Then:

- Deck と Card の両方で操作が拒否される。UID の一致だけでは書き込めない。

<a id="firestore-rules-30"></a>

### FIRESTORE-RULES-30 匿名認証による Deck・Card の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-30] preserves public %s reads`

Given:

- 匿名認証の UID `uid` で、Deck と Card のそれぞれを検証する。
- 別 UID `another-user` の公開 Deck と、その Deck を参照する同じ所有者の Card が存在する。

When:

- 公開 Deck と、その子 Card をそれぞれ `getDoc` で取得する。

Then:

- Deck と Card の両方で取得が許可される。

<a id="firestore-rules-31"></a>

### FIRESTORE-RULES-31 未認証による Deck の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-31] should not read a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-32"></a>

### FIRESTORE-RULES-32 未認証による Deck の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-32] should read a public deck`

Given:

- 認証情報を持たない SDK context で操作する。
- UID `uid` の Deck に `isPublic: true` を保存する。

When:

- 対象 Deck を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-33"></a>

### FIRESTORE-RULES-33 未認証による Deck の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-33] should not create a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Deck を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-34"></a>

### FIRESTORE-RULES-34 未認証による Deck の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-34] should not update a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Deck の UID を`uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-35"></a>

### FIRESTORE-RULES-35 未認証による Deck の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-35] should not delete a deck`

Given:

- 認証情報を持たない SDK context で操作する。
- Deck に `uid: "uid"` だけを事前保存する。

When:

- 対象 Deck に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-36"></a>

### FIRESTORE-RULES-36 未認証による Card の非公開データの取得を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-36] should not read a card`

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 非公開データの取得が拒否される。

<a id="firestore-rules-37"></a>

### FIRESTORE-RULES-37 未認証による Card の公開データの取得を許可する

カテゴリ: `read`

対応テスト: `[FIRESTORE-RULES-37] should read a public card`

Given:

- 認証情報を持たない SDK context で操作する。
- UID `uid` の公開 Deck と、それを deckId で参照する同じ所有者の Card が存在する。

When:

- 対象 Card を `getDoc` で取得する。

Then:

- 公開データの取得が許可される。

<a id="firestore-rules-38"></a>

### FIRESTORE-RULES-38 未認証による Card の作成を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-38] should not create a card`

Given:

- 認証情報を持たない SDK context で操作する。
- 保存先は未使用の ID とする。

When:

- `uid: "uid"` を指定して Card を新規作成する。

Then:

- 作成が拒否される。

<a id="firestore-rules-39"></a>

### FIRESTORE-RULES-39 未認証による Card の更新を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-39] should not update a card`

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。公開設定は与えない。

When:

- 既存 Card の UID を `uid` のまま、name を `update` に更新する。

Then:

- 更新が拒否される。

<a id="firestore-rules-40"></a>

### FIRESTORE-RULES-40 未認証による Card の物理削除を拒否する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-40] should not delete a card`

Given:

- 認証情報を持たない SDK context で操作する。
- Card に `uid: "uid"` だけを事前保存する。

When:

- 対象 Card に `deleteDoc` を実行する。

Then:

- 物理削除が拒否される。

<a id="firestore-rules-41"></a>

### FIRESTORE-RULES-41 本人が任意の状態を作成・読取・更新・削除でき、同一性は変更できない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-41] permits optional owner state and keeps its identity stable`

Given:

- State がない本人所有の Card がある。

When:

- Card を単体取得し、fsrs: null の State を作成して単体取得・本人 UID 条件付き query を行い、有効な FSRS へ更新する。
- UID・Card ID・作成日時の変更を試み、State の削除と再削除を行う。

Then:

- Card の読取と、State の作成・単体取得・query・FSRS 更新・削除は許可される。
- UID・Card ID・作成日時の変更は拒否される。State がない場合の削除も no-op として許可する。

<a id="firestore-rules-42"></a>

### FIRESTORE-RULES-42 公開 Card の State も本人以外はアクセスできない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-42] keeps public Card state private from %s`

Given:

- 公開 Card と本人の State がある。

When:

- 他ユーザー・同一 UID の匿名・未認証で Card の単体読取と、State の単体・一覧読取、書込・更新・削除を試みる。
- 存在しない State の削除も試みる。

Then:

- Card の単体読取は許可されるが、試みた State への全操作は拒否される。既存 State と未作成 State のどちらも、本人以外による削除は拒否される。

<a id="firestore-rules-43"></a>

### FIRESTORE-RULES-43 状態の同一性・メタデータ・所有 Card を検証する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-43] rejects invalid identity, metadata and unrelated Cards`

Given:

- 本人の Deck と Card がある。

When:

- 異なる document ID、version 2、重複 id、異なる Deck、非 map の FSRS、文字列の作成日時、小数の更新日時、他人所有または削除済み Card の State を保存する。
- 本人の正常な Card に、空 map、難易度 0・無限大 stability を持つ FSRS、負の作成日時・年9999上限を超える整数の更新日時を保存する。

Then:

- 同一性・外側の型・所有権に違反する前者は拒否され、後者は許可される。Rules は FSRS を null または map、メタデータ日時を整数としてのみ検証する。
- これはサーバー側のデータ整合性保証を意図的に減らす変更である。本人がアプリを迂回すると不正 FSRS を保存できる。詳細な範囲・必須項目は Zod/Adapter が検証し、不正データで本人の購読・学習が失敗し得る。未評価への読み替えはしない（[Adapter の検証](card-study-state.md#firestore-card-study-state-03)）。

<a id="firestore-rules-44"></a>

### FIRESTORE-RULES-44 旧個人学習フィールドを Card に書き戻せない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-44] rejects legacy Card field %s`

Given:

- 本人の Deck と内容のみの Card がある。

When:

- difficulty / numberOfSeen / firstSeenAt / lastSeenAt / nextSeeingAt / interval / studySchedule をそれぞれ追加して作成・更新する。

Then:

- 全て拒否される。

<a id="firestore-rules-45"></a>

### FIRESTORE-RULES-45 区切り文字と Unicode を含む決定的 ID を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-45] accepts delimiter and Unicode characters in deterministic IDs`

Given:

- UID は a:日😀、Card ID は b:c😀 とする。

When:

- UID の長さを接頭辞とした State ID で本人が保存し、削除と再削除を行う。

Then:

- 許可される。Deck ID は識別子に含まれない。
