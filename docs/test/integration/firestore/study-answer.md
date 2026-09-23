# StudyAnswer Firestore 結合テスト仕様書

## 目的

回答保存・スキップ・再試行と、回答履歴の所有権・不変性を確認する。アプリケーションの操作と Rules だけの検証を区別する。

関連 E2E: [STUDY-ACTIONS-01](../../e2e/study-actions.md#study-actions-01)、[STUDY-SESSION-03](../../e2e/study-session.md#study-session-03)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## 対象データと操作

各ケースでは、本人の公開 Deck `deck`、Card `card-0`〜`card-9`、未終了の session `session` を初期状態として準備する。
4評価の受理済み操作は計算済み FSRS を保持し、Card・Answer・Session を同一 batch で保存する。Card の本文と createdAt は維持し、fsrs と updatedAt だけを更新する。
操作の ID は UUID、通常の回答日時は `2000` とする。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-STUDY-ANSWER-01 | batch | 正常系 | [4種類の評価を保存し進捗と位置を1回更新する](#firestore-study-answer-01) |
| FIRESTORE-STUDY-ANSWER-02 | batch | 異常系 | [保存済みの位置から同じ操作を再実行して回答を増やさない](#firestore-study-answer-02) |
| FIRESTORE-STUDY-ANSWER-03 | write | 正常系 | [評価では Card の本文と作成日時を維持する](#firestore-study-answer-03) |
| FIRESTORE-STUDY-ANSWER-04 | batch | 正常系 | [10枚への回答を保存して session を完了する](#firestore-study-answer-04) |
| FIRESTORE-STUDY-ANSWER-05 | batch | 正常系 | [中断後も回答を保持し別 session で同じ Card に回答できる](#firestore-study-answer-05) |
| FIRESTORE-STUDY-ANSWER-06 | batch | 正常系 / 異常系 | [途中のスキップは Session だけを前進する](#firestore-study-answer-06) |
| FIRESTORE-STUDY-ANSWER-07 | batch | 正常系 | [最後のスキップは回答を作らず session を完了する](#firestore-study-answer-07) |
| FIRESTORE-STUDY-ANSWER-08 | write | 正常系 | [ブラウザのオフライン判定だけで保存を止めない](#firestore-study-answer-08) |
| FIRESTORE-STUDY-ANSWER-09 | batch | 異常系 | [存在しない session と認証変更で部分保存を残さない](#firestore-study-answer-09) |
| FIRESTORE-STUDY-ANSWER-10 | batch | 異常系 | [書込拒否後に同じ操作を再試行できる](#firestore-study-answer-10) |
| FIRESTORE-STUDY-ANSWER-11 | read | 正常系 / 異常系 | [所有者条件を付けて session・Card・Deck ごとの回答を取得する](#firestore-study-answer-11) |
| FIRESTORE-STUDY-ANSWER-12 | write | 異常系 | [別 UID の回答作成を拒否する](#firestore-study-answer-12) |
| FIRESTORE-STUDY-ANSWER-13 | write | 正常系 | [回答形式と参照先の検証は Rules では強制しない](#firestore-study-answer-13) |
| FIRESTORE-STUDY-ANSWER-14 | write | 正常系 | [回答単独の保存では Card.fsrs と Session を更新しない](#firestore-study-answer-14) |
| FIRESTORE-STUDY-ANSWER-15 | write | 正常系 | [4評価の FSRS を検証して保存する](#firestore-study-answer-15) |
| FIRESTORE-STUDY-ANSWER-16 | write | 正常系 / 異常系 | [session の所有権とアプリケーションの終了遷移を区別する](#firestore-study-answer-16) |
| FIRESTORE-STUDY-ANSWER-17 | write | 異常系 | [本人でも保存済み回答を更新・上書き・削除できない](#firestore-study-answer-17) |
| FIRESTORE-STUDY-ANSWER-18 | read | 異常系 | [存在しない回答 ID の読取を拒否する](#firestore-study-answer-18) |
| FIRESTORE-STUDY-ANSWER-19 | batch | 異常系 | [公開 Deck でも第三者・匿名・未認証に回答を公開しない](#firestore-study-answer-19) |
| FIRESTORE-STUDY-ANSWER-20 | batch | 正常系 | [FSRS を復元し本文編集とスキップで維持する](#firestore-study-answer-20) |

<a id="firestore-study-answer-01"></a>

### FIRESTORE-STUDY-ANSWER-01 4種類の評価を保存し進捗と位置を1回更新する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の10枚の session が位置 `0` で存在する。対象 Card に FSRS は null。rating は again / hard / good / easy の4通りを使う。

When:

- 回答時刻 `2000` の操作を `saveStudyOperation` で保存し、送信完了を待つ。

Then:

- scheduleは同じbatchで保存され、保存済み値は入力scheduleと一致する。
- 操作 ID の回答 document に UID・sessionId・deckId・cardId と指定した rating を保存する。answeredAt は入力時刻の Timestamp、createdAt と updatedAt は等しい Timestamp になる。Card の fsrs.reps は `1`、createdAt は `0`、updatedAt は `2000` となる。戻り値と保存 session の位置は `1` になる。

<a id="firestore-study-answer-02"></a>

### FIRESTORE-STUDY-ANSWER-02 保存済みの位置から同じ操作を再実行して回答を増やさない

カテゴリ: `batch`

区分: 異常系

Given:

- 位置 `0` の回答操作を一度保存している。

When:

- 同じ入力を再び保存する。

Then:

- `session does not match` を含むエラーになり、回答件数と対象 Card.fsrs.reps はどちらも `1` のままである。

<a id="firestore-study-answer-03"></a>

### FIRESTORE-STUDY-ANSWER-03 評価では Card の本文と作成日時を維持する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Card があり、fsrs は null である。

When:

- 受理した評価操作を保存する。

Then:

- Card の fsrs と updatedAt だけが変わり、本文と createdAt は維持される。

<a id="firestore-study-answer-04"></a>

### FIRESTORE-STUDY-ANSWER-04 10枚への回答を保存して session を完了する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の10枚の未終了 session が存在する。

When:

- 各 Card を順番に、位置 `0`〜`9` と時刻 `2000 + 位置` で回答保存する。

Then:

- 回答は10件になり、session の currentIndex は `9`、endReason は `completed`、endedAt は Timestamp になる。

失敗時の部分更新なしは FIRESTORE-STUDY-ANSWER-10 で確認する。

<a id="firestore-study-answer-05"></a>

### FIRESTORE-STUDY-ANSWER-05 中断後も回答を保持し別 session で同じ Card に回答できる

カテゴリ: `batch`

区分: 正常系

Given:

- 最初の Card の回答を保存し、旧 session を abandoned に更新している。同じ Card 順序の別 ID の session を用意する。

When:

- 別 session で同じ Card の回答を保存する。前回保存した FSRS から次の評価を計算する。

Then:

- 回答は合計2件になり、Card.fsrs.reps は `2` になる。

<a id="firestore-study-answer-06"></a>

### FIRESTORE-STUDY-ANSWER-06 途中のスキップは Session だけを前進する

カテゴリ: `batch`

区分: 正常系 / 異常系

Given:

- 本人の session が位置 0 にあり、FSRS は null。

When:

- rating のないスキップ操作を保存し、古い位置から評価を試みる。

Then:

- 回答と FSRS は null、session の位置は1になる。古い位置からの回答は拒否される。

<a id="firestore-study-answer-07"></a>

### FIRESTORE-STUDY-ANSWER-07 最後のスキップは回答を作らず session を完了する

カテゴリ: `batch`

区分: 正常系

Given:

- session の位置を最後の `9` にしている。

When:

- card-9 に対して rating を指定せず操作を保存する。

Then:

- 回答は0件のまま、FSRS は null のままで、session の endReason は `completed` になる。

<a id="firestore-study-answer-08"></a>

### FIRESTORE-STUDY-ANSWER-08 ブラウザのオフライン判定だけで保存を止めない

カテゴリ: `write`

区分: 正常系

Given:

- Firestore Emulator に接続できる状態で、`navigator.onLine` だけを `false` に差し替える。

When:

- 回答操作を保存し、ブラウザ判定の差し替えを解除する。

Then:

- 回答が1件保存される。

SDK の通信遮断やオフライン queue の検証ではない。

<a id="firestore-study-answer-09"></a>

### FIRESTORE-STUDY-ANSWER-09 存在しない session と認証変更で部分保存を残さない

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の通常の session は存在するが、別 ID `not-saved` は存在しない。

When:

- 存在しない ID の操作を実行する。続いてアプリケーションの認証 UID を other-user に変え、元の操作を実行する。

Then:

- 最初の呼び出しはエラーになり、認証変更後は `user changed` を含むエラーになる。回答は0件、FSRS は null のままである。

不存在の検証ではテストの準備処理も対象 session を取得する。アプリケーションが独自の不存在エラーを返す保証ではない。

<a id="firestore-study-answer-10"></a>

### FIRESTORE-STUDY-ANSWER-10 書込拒否後に同じ操作を再試行できる

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の操作を準備し、Rules 無効化 context で親 Deck の UID を別の所有者へ変更する。

When:

- 操作を保存して失敗後の保存値を確認する。その後、親 Deck の UID を戻し、同じ ID・入力の操作を再試行する。

Then:

- 最初の保存はエラーになり、回答は0件、session の位置は `0` のままで FSRS は null のままである。再試行後は同じ操作 ID の回答に answeredAt `2000` の Timestamp が保存される。

<a id="firestore-study-answer-11"></a>

### FIRESTORE-STUDY-ANSWER-11 所有者条件を付けて session・Card・Deck ごとの回答を取得する

カテゴリ: `read`

区分: 正常系 / 異常系

Given:

- 本人の回答が1件保存されている。絞り込み項目は sessionId / cardId / deckId の3通りとする。

When:

- UID と対象項目で query する。cardId / deckId では answeredAt の降順条件も付ける。続いて同じ対象項目だけで UID 条件なしの query を行う。

Then:

- UID 条件付き query は許可され、保存した回答 ID の1件が返る。UID 条件なしは拒否される。

1件での取得確認であり、複数 record のソート順の検証ではない。

<a id="firestore-study-answer-12"></a>

### FIRESTORE-STUDY-ANSWER-12 別 UID の回答作成を拒否する

カテゴリ: `write`

区分: 異常系

Given:

- 本人の非匿名認証 context と有効な回答入力を用意する。

When:

- 回答の UID だけを other に変更し、SDK で新規作成する。

Then:

- 作成が拒否され、本人の回答は0件のままである。

<a id="firestore-study-answer-13"></a>

### FIRESTORE-STUDY-ANSWER-13 回答形式と参照先の検証は Rules では強制しない

カテゴリ: `write`

区分: 正常系

Given:

- 本人の非匿名認証 context で、存在しない sessionId / cardId と `{ type: "text", text: "custom" }` の回答を用意する。

When:

- アプリケーションの保存処理を通さず SDK で新規作成する。

Then:

- UID と指定した値だけの document を保存でき、取得値も入力と一致する。

これは Rules が形式や参照先を検証しないという契約であり、UI が text 回答に対応する仕様ではない。

<a id="firestore-study-answer-14"></a>

### FIRESTORE-STUDY-ANSWER-14 回答単独の保存では Card.fsrs と Session を更新しない

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Card に FSRS が null で、session の位置は0である。

When:

- アプリ保存処理を通さず SDK で本人の回答だけを保存する。

Then:

- 回答は1件になり、FSRS は null で session の位置は0のままである。Rules は同時更新自体を強制しない。

<a id="firestore-study-answer-15"></a>

### FIRESTORE-STUDY-ANSWER-15 4評価の FSRS を検証して保存する

カテゴリ: `batch`

区分: 正常系

Given:

- 未評価の Card に対し again / hard / good / easy の4通りを用意する。

When:

- 受理時に計算した FSRS を含む操作を保存し、Card document を parser で復元する。

Then:

- 保存した FSRS は入力値と一致し、reps は1となる。

<a id="firestore-study-answer-16"></a>

### FIRESTORE-STUDY-ANSWER-16 session の所有権とアプリケーションの終了遷移を区別する

カテゴリ: `write`

区分: 正常系 / 異常系

Given:

- 本人の非匿名認証で session を保存済みである。別 UID の認証 context も用意する。

When:

- 本人が UID を変更しようとする。位置 `1`・completed の保存後、位置 `0`・endReason `null` に戻す。他人の位置更新と本人の物理削除も試みる。

Then:

- UID 変更・他人の更新・物理削除は拒否される。本人による完了状態の保存と未終了への変更は Rules で許可される。

アプリケーションの遅延更新が終了済み session を再開しない契約は StudySession 仕様書で扱う。

<a id="firestore-study-answer-17"></a>

### FIRESTORE-STUDY-ANSWER-17 本人でも保存済み回答を更新・上書き・削除できない

カテゴリ: `write`

区分: 異常系

Given:

- 本人の回答をアプリケーション経由で保存済みである。

When:

- 同じ回答 ID の rating 更新、setDoc による上書き、deleteDoc をそれぞれ実行する。

Then:

- すべて拒否される。

<a id="firestore-study-answer-18"></a>

### FIRESTORE-STUDY-ANSWER-18 存在しない回答 ID の読取を拒否する

カテゴリ: `read`

区分: 異常系

Given:

- 本人の非匿名認証 context で、missing-answer の document は存在しない。

When:

- その回答 ID を getDoc で取得する。

Then:

- 読取は拒否される。

単体読取の permission-denied だけを根拠に、不正入力が保存されていないと判断しない。

<a id="firestore-study-answer-19"></a>

### FIRESTORE-STUDY-ANSWER-19 公開 Deck でも第三者・匿名・未認証に回答を公開しない

カテゴリ: `batch`

区分: 異常系

Given:

- 本人の公開 Deck と回答が保存済みである。主体は他ユーザー・本人と同じ UID の匿名認証・未認証の3通りとする。

When:

- 回答の単体 get、所有者 UID 条件付き query、本人 UID を指定した回答の新規作成を実行する。

Then:

- 3通りすべてで、読取・query・作成が拒否される。

<a id="firestore-study-answer-20"></a>

### FIRESTORE-STUDY-ANSWER-20 FSRS を復元し本文編集とスキップで維持する

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の Card と未評価の session を用意する。

When:

- good を時刻2000で保存し Card parser で復元する。本文を編集し、新 session でスキップし、さらに時刻602000で評価する。

Then:

- 復元した FSRS と次回計算結果は保存前と一致する。本文編集とスキップでは FSRS が変わらず回答も増えない。次回評価後は createdAt: 0、updatedAt: 602000、reps: 2 となる。不正な FSRS は parser が拒否する。
