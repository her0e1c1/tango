# StudyAnswer Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する StudyAnswer entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

対応ファイル: [`rules.spec.ts`](../../../test/integration/firestore/rules.spec.ts)

## 共通前提

`test-rule` project で実際の `firestore.rules` を読み込む。Given の事前 document は Rules 無効化 context で準備し、When は Rules 有効の context から直接 SDK を呼ぶ。非匿名認証は `google.com`、匿名認証は `anonymous`、未認証は認証情報なしとする。アプリケーションの schema validation は通さない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-STUDY-ANSWER-01 | batch | [回答作成と Card.fsrs・session 更新を同じ batch で許可する](#firestore-rules-study-answer-01) |
| FIRESTORE-RULES-STUDY-ANSWER-02 | write | [回答 ID と完了後の回答順序はアプリケーションの責務とする](#firestore-rules-study-answer-02) |
| FIRESTORE-RULES-STUDY-ANSWER-03 | write | [保存済みの回答履歴は本人でも更新・削除できない](#firestore-rules-study-answer-03) |
| FIRESTORE-RULES-STUDY-ANSWER-04 | batch | [他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する](#firestore-rules-study-answer-04) |

<a id="firestore-rules-study-answer-01"></a>

### FIRESTORE-RULES-STUDY-ANSWER-01 回答作成と Card.fsrs・session 更新を同じ batch で許可する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-STUDY-ANSWER-01] accepts the first and final answer with atomic state and session updates`

Given:

- 非匿名認証の UID `owner` が、Deck `deck`、Card `first` / `last`、未終了の session `session` を所有する。
- 回答は同じ UID・Deck・session・Card を参照し、`{ type: "rating", rating: "good" }` と Timestamp の回答日時を持つ。

When:

- 最初と最後の Card について、回答作成・Card.fsrs 更新・session の位置更新を1つの SDK batch に入れて commit する。最後の batch には completed と endedAt も含める。
- 各回答を本人として get する。

Then:

- 両方の batch commit と回答の読取が許可される。

Rules が常に batch を必須にする契約ではない。単独の回答作成は次のケースで確認する。

<a id="firestore-rules-study-answer-02"></a>

### FIRESTORE-RULES-STUDY-ANSWER-02 回答 ID と完了後の回答順序はアプリケーションの責務とする

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-STUDY-ANSWER-02] leaves answer sequencing to the application`

Given:

- 本人が同じ Deck に属する Card と session を所有している。

When:

- 最後の Card に対する回答を単独で作成する。session を completed に更新した後、同じ Card に別の回答 ID でもう一度回答を作成する。

Then:

- 単独作成と、session 完了後の別 ID での作成がどちらも許可される。

一意な回答 ID、回答順序、Card 進捗更新の同時実行を Rules の保証として扱わない。

<a id="firestore-rules-study-answer-03"></a>

### FIRESTORE-RULES-STUDY-ANSWER-03 保存済みの回答履歴は本人でも更新・削除できない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-STUDY-ANSWER-03] forbids rewriting or deleting answer history`

Given:

- 本人の rating `good` の回答履歴が存在する。

When:

- rating を `again` にする update と、回答の delete を実行する。

Then:

- 更新と削除はどちらも拒否される。

<a id="firestore-rules-study-answer-04"></a>

### FIRESTORE-RULES-STUDY-ANSWER-04 他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-RULES-STUDY-ANSWER-04] rejects %s reads and answer batches`

Given:

- UID `owner` の回答履歴、Card、session が存在する。
- 主体は他ユーザーと、所有者と同じ UID の匿名認証の2通りとする。

When:

- 回答を get する。続いて回答作成・Card.fsrs への書き込み・session 更新を含む batch を commit する。Card の fsrs と updatedAt を更新する。

Then:

- 両方の主体で、回答の読取と batch commit が拒否される。
