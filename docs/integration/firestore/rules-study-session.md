# StudySession Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する StudySession entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

対応ファイル: [`rules.spec.ts`](../../../test/integration/firestore/rules.spec.ts)

## 共通前提

`test-rule` project で実際の `firestore.rules` を読み込む。Given の事前 document は Rules 無効化 context で準備し、When は Rules 有効の context から直接 SDK を呼ぶ。非匿名認証は `google.com`、匿名認証は `anonymous`、未認証は認証情報なしとする。アプリケーションの schema validation は通さない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-STUDY-SESSION-01 | batch | [本人が private session を作成・取得・更新できる](#firestore-rules-study-session-01) |
| FIRESTORE-RULES-STUDY-SESSION-02 | batch | [公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない](#firestore-rules-study-session-02) |
| FIRESTORE-RULES-STUDY-SESSION-03 | write | [本人でも session の所有者変更と物理削除はできない](#firestore-rules-study-session-03) |

<a id="firestore-rules-study-session-01"></a>

### FIRESTORE-RULES-STUDY-SESSION-01 本人が private session を作成・取得・更新できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-STUDY-SESSION-01] allows the owner to create, resume and complete a private session`

Given:

- 非匿名認証の UID `uid` で、同じ UID の新しい session 入力を用意する。
- 入力は2枚の順序と位置 `0`、未終了の状態を持つ。親 Deck の存在はこのケースでは準備しない。

When:

- SDK で session を作成し、単体 get と `where("uid", "==", "uid")` の query を行う。
- 位置を `1` に更新し、その後 endReason `completed` と endedAt を保存する。

Then:

- 作成・単体取得・本人に限定した query・位置更新・完了更新がすべて許可される。

<a id="firestore-rules-study-session-02"></a>

### FIRESTORE-RULES-STUDY-SESSION-02 公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-STUDY-SESSION-02] denies %s access even when the Deck is public`

Given:

- UID `uid` の公開 Deck と、その UID の session が存在する。
- 認証主体は他ユーザー `other-user`、所有者と同じ UID の匿名認証、未認証の3通りとする。

When:

- 既存 session の get、所有者 UID 条件付き query、同じ所有者を指定した新規作成、位置更新、削除を行う。

Then:

- 3通りの主体すべてで、5種類の操作が拒否される。

<a id="firestore-rules-study-session-03"></a>

### FIRESTORE-RULES-STUDY-SESSION-03 本人でも session の所有者変更と物理削除はできない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-STUDY-SESSION-03] rejects ownership changes and deletion`

Given:

- 非匿名認証の本人が所有する session が存在する。

When:

- UID を `another-user` に変更する update と、`deleteDoc` を個別に実行する。

Then:

- 所有者変更と物理削除はどちらも拒否される。
