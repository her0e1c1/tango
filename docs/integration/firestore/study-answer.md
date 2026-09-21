# StudyAnswer Firestore 結合テスト仕様書

## 目的

回答保存・スキップ・再試行と、回答履歴の所有権・不変性を確認する。アプリケーションの操作と Rules だけの検証を区別する。

対応ファイル: [`study-answer.spec.ts`](../../../test/integration/firestore/study-answer.spec.ts)

関連 E2E: [STUDY-ACTIONS-01](../../e2e/study-actions.md#study-actions-01)、[STUDY-SESSION-03](../../e2e/study-session.md#study-session-03)

## 共通前提

project `test-study-answer` に実際の `firestore.rules` を読み込む。各ケース前に専用 project を消去し、非匿名認証の UID `answer-owner`、公開 Deck `deck`、Card `card-0`〜`card-9`、未終了の session `session` を準備する。
Card / Deck store と認証状態も初期化する。4評価の受理済み操作は、StudyProgress の相対難易度・閲覧記録と独立した StudySchedule の FSRS schedule を保持し、同一 batch で保存する。操作の ID は UUID、通常の回答日時は `2000` とし、保存時は pending writes と書込エラー通知を確認する。終了時は Rules 環境を cleanup する。
事前データはテスト内で作成し、新しい fixture ファイルは用意しない。共通の実行方法は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-ANSWER-01 | batch | [4種類の評価を保存し進捗と位置を1回更新する](#firestore-study-answer-01) |
| FIRESTORE-STUDY-ANSWER-02 | batch | [保存済みの位置から同じ操作を再実行して回答を増やさない](#firestore-study-answer-02) |
| FIRESTORE-STUDY-ANSWER-03 | write | [保存時の再計算ではなく受理済みの進捗値を使う](#firestore-study-answer-03) |
| FIRESTORE-STUDY-ANSWER-04 | batch | [10枚への回答を保存して session を完了する](#firestore-study-answer-04) |
| FIRESTORE-STUDY-ANSWER-05 | batch | [中断後も回答を保持し別 session で同じ Card に回答できる](#firestore-study-answer-05) |
| FIRESTORE-STUDY-ANSWER-06 | batch | [途中のスキップは回答を作らず進捗と位置を更新する](#firestore-study-answer-06) |
| FIRESTORE-STUDY-ANSWER-07 | batch | [最後のスキップは回答を作らず session を完了する](#firestore-study-answer-07) |
| FIRESTORE-STUDY-ANSWER-08 | write | [ブラウザのオフライン判定だけで保存を止めない](#firestore-study-answer-08) |
| FIRESTORE-STUDY-ANSWER-09 | batch | [存在しない session と認証変更で部分保存を残さない](#firestore-study-answer-09) |
| FIRESTORE-STUDY-ANSWER-10 | batch | [書込拒否後に同じ操作を再試行できる](#firestore-study-answer-10) |
| FIRESTORE-STUDY-ANSWER-11 | read | [所有者条件を付けて session・Card・Deck ごとの回答を取得する](#firestore-study-answer-11) |
| FIRESTORE-STUDY-ANSWER-12 | write | [別 UID の回答作成を拒否する](#firestore-study-answer-12) |
| FIRESTORE-STUDY-ANSWER-13 | write | [回答形式と参照先の検証は Rules では強制しない](#firestore-study-answer-13) |
| FIRESTORE-STUDY-ANSWER-14 | write | [回答単独の保存では進捗と session を更新しない](#firestore-study-answer-14) |
| FIRESTORE-STUDY-ANSWER-15 | write | [境界値の難易度を受理済み進捗として保存できる](#firestore-study-answer-15) |
| FIRESTORE-STUDY-ANSWER-16 | write | [session の所有権とアプリケーションの終了遷移を区別する](#firestore-study-answer-16) |
| FIRESTORE-STUDY-ANSWER-17 | write | [本人でも保存済み回答を更新・上書き・削除できない](#firestore-study-answer-17) |
| FIRESTORE-STUDY-ANSWER-18 | read | [存在しない回答 ID の読取を拒否する](#firestore-study-answer-18) |
| FIRESTORE-STUDY-ANSWER-19 | batch | [公開 Deck でも第三者・匿名・未認証に回答を公開しない](#firestore-study-answer-19) |
| FIRESTORE-STUDY-ANSWER-20 | batch | [FSRSを復元し部分更新とSkipで維持する](#firestore-study-answer-20) |

<a id="firestore-study-answer-01"></a>

### FIRESTORE-STUDY-ANSWER-01 4種類の評価を保存し進捗と位置を1回更新する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-01] records %s with progress and one advance`

Given:

- 本人の10枚の session が位置 `0` で存在する。対象 Card の difficulty は `5`、numberOfSeen は `0` とする。rating は again / hard / good / easy の4通りを使う。

When:

- 回答時刻 `2000` の操作を `saveStudyOperation` で保存し、送信完了を待つ。

Then:

- scheduleは同じbatchで保存され、保存済み値は入力scheduleと一致する。
- 操作 ID の回答 document に UID・sessionId・deckId・cardId と指定した rating を保存する。answeredAt は入力時刻の Timestamp、createdAt と updatedAt は等しい Timestamp になる。Card の numberOfSeen は `1`、lastSeenAt は `2000`、difficulty は again なら `6`、その他は `4` になる。戻り値と保存 session の位置は `1` になる。

<a id="firestore-study-answer-02"></a>

### FIRESTORE-STUDY-ANSWER-02 保存済みの位置から同じ操作を再実行して回答を増やさない

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-02] rejects stale positions without another answer`

Given:

- 位置 `0` の回答操作を一度保存している。

When:

- 同じ入力を再び保存する。

Then:

- `session does not match` を含むエラーになり、回答件数と対象 Card の numberOfSeen はどちらも `1` のままである。

<a id="firestore-study-answer-03"></a>

### FIRESTORE-STUDY-ANSWER-03 保存時の再計算ではなく受理済みの進捗値を使う

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-03] persists accepted progress despite concurrent changes`

Given:

- difficulty `4`・numberOfSeen `1` を含む回答操作を準備した後、保存先 Card を difficulty `9`・numberOfSeen `20` に変更している。

When:

- 準備済みの操作を保存する。

Then:

- 保存後の difficulty は `4`、numberOfSeen は `1` になる。

複数端末の進捗を加算・マージする保証ではない。

<a id="firestore-study-answer-04"></a>

### FIRESTORE-STUDY-ANSWER-04 10枚への回答を保存して session を完了する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-04] records ten answers and completes`

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

対応テスト: `[FIRESTORE-STUDY-ANSWER-05] preserves answers across abandonment and restart`

Given:

- 最初の Card の回答を保存し、旧 session を abandoned に更新している。同じ Card 順序の別 ID の session を用意する。

When:

- 別 session で同じ Card の回答を保存する。受理済み進捗は difficulty `3`・numberOfSeen `2` とする。

Then:

- 回答は合計2件になり、Card の numberOfSeen は `2` になる。

<a id="firestore-study-answer-06"></a>

### FIRESTORE-STUDY-ANSWER-06 途中のスキップは回答を作らず進捗と位置を更新する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-06] skips with progress but no answer`

Given:

- 本人の session が位置 `0` にあり、Card の difficulty は `5`、numberOfSeen は `0` である。

When:

- rating を指定せず操作を保存し、その後、古い位置 `0` の回答操作を保存しようとする。

Then:

- 回答は0件のまま、Card の difficulty は `5`、numberOfSeen は `1`、session の位置は `1` になる。古い位置からの回答はエラーになる。

<a id="firestore-study-answer-07"></a>

### FIRESTORE-STUDY-ANSWER-07 最後のスキップは回答を作らず session を完了する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-07] completes a final skip without an answer`

Given:

- session の位置を最後の `9` にしている。

When:

- card-9 に対して rating を指定せず操作を保存する。

Then:

- 回答は0件のまま、対象 Card の numberOfSeen は `1`、session の endReason は `completed` になる。

<a id="firestore-study-answer-08"></a>

### FIRESTORE-STUDY-ANSWER-08 ブラウザのオフライン判定だけで保存を止めない

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-08] saves despite an offline browser flag`

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

対応テスト: `[FIRESTORE-STUDY-ANSWER-09] rejects missing sessions and changed authentication`

Given:

- 本人の通常の session は存在するが、別 ID `not-saved` は存在しない。

When:

- 存在しない ID の操作を実行する。続いてアプリケーションの認証 UID を other-user に変え、元の操作を実行する。

Then:

- 最初の呼び出しはエラーになり、認証変更後は `user changed` を含むエラーになる。回答は0件、元の Card の numberOfSeen は `0` のままである。

不存在の検証ではテストの準備処理も対象 session を取得する。アプリケーションが独自の不存在エラーを返す保証ではない。

<a id="firestore-study-answer-10"></a>

### FIRESTORE-STUDY-ANSWER-10 書込拒否後に同じ操作を再試行できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-10] retries denied writes without partial progress`

Given:

- 本人の操作を準備し、Rules 無効化 context で親 Deck の UID を別の所有者へ変更する。

When:

- 操作を保存して失敗後の保存値を確認する。その後、親 Deck の UID を戻し、同じ ID・入力の操作を再試行する。

Then:

- 最初の保存はエラーになり、回答は0件、session の位置と Card の numberOfSeen は `0` のままである。再試行後は同じ操作 ID の回答に answeredAt `2000` の Timestamp が保存される。

<a id="firestore-study-answer-11"></a>

### FIRESTORE-STUDY-ANSWER-11 所有者条件を付けて session・Card・Deck ごとの回答を取得する

カテゴリ: `read`

対応テスト: `[FIRESTORE-STUDY-ANSWER-11] queries by %s`

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

対応テスト: `[FIRESTORE-STUDY-ANSWER-12] rejects an answer owned by another UID`

Given:

- 本人の非匿名認証 context と有効な回答入力を用意する。

When:

- 回答の UID だけを other に変更し、SDK で新規作成する。

Then:

- 作成が拒否され、本人の回答は0件のままである。

<a id="firestore-study-answer-13"></a>

### FIRESTORE-STUDY-ANSWER-13 回答形式と参照先の検証は Rules では強制しない

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-13] leaves payload and references to the application`

Given:

- 本人の非匿名認証 context で、存在しない sessionId / cardId と `{ type: "text", text: "custom" }` の回答を用意する。

When:

- アプリケーションの保存処理を通さず SDK で新規作成する。

Then:

- UID と指定した値だけの document を保存でき、取得値も入力と一致する。

これは Rules が形式や参照先を検証しないという契約であり、UI が text 回答に対応する仕様ではない。

<a id="firestore-study-answer-14"></a>

### FIRESTORE-STUDY-ANSWER-14 回答単独の保存では進捗と session を更新しない

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-14] allows standalone answers without transitions`

Given:

- 本人の Card の numberOfSeen と session の位置は `0` である。

When:

- アプリケーションの保存処理を通さず、本人の回答だけを SDK で保存する。

Then:

- 回答は1件になり、Card の numberOfSeen と session の位置は `0` のままである。

Rules が3種類の document の同時更新を必須にする保証ではない。

<a id="firestore-study-answer-15"></a>

### FIRESTORE-STUDY-ANSWER-15 境界値の難易度を受理済み進捗として保存できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-15] preserves difficulty bounds for $rating`

Given:

- again / difficulty `10`、easy / difficulty `1` の2通りを用意する。保存先 Card と操作の進捗に同じ難易度を設定する。

When:

- numberOfSeen `1` と境界値の difficulty を含む操作を保存する。

Then:

- 入力した difficulty と numberOfSeen `1` が保存され、回答は1件になる。

このテストは境界内の受理済み値の保存を確認する。範囲外入力の補正・拒否や難易度計算の全境界を保証しない。

<a id="firestore-study-answer-16"></a>

### FIRESTORE-STUDY-ANSWER-16 session の所有権とアプリケーションの終了遷移を区別する

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-ANSWER-16] restricts session ownership, not transitions`

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

対応テスト: `[FIRESTORE-STUDY-ANSWER-17] denies answer updates, overwrites and deletion`

Given:

- 本人の回答をアプリケーション経由で保存済みである。

When:

- 同じ回答 ID の rating 更新、setDoc による上書き、deleteDoc をそれぞれ実行する。

Then:

- すべて拒否される。

<a id="firestore-study-answer-18"></a>

### FIRESTORE-STUDY-ANSWER-18 存在しない回答 ID の読取を拒否する

カテゴリ: `read`

対応テスト: `[FIRESTORE-STUDY-ANSWER-18] denies reading missing answer IDs`

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

対応テスト: `[FIRESTORE-STUDY-ANSWER-19] denies %s`

Given:

- 本人の公開 Deck と回答が保存済みである。主体は他ユーザー・本人と同じ UID の匿名認証・未認証の3通りとする。

When:

- 回答の単体 get、所有者 UID 条件付き query、本人 UID を指定した回答の新規作成を実行する。

Then:

- 3通りすべてで、読取・query・作成が拒否される。

<a id="firestore-study-answer-20"></a>

### FIRESTORE-STUDY-ANSWER-20 FSRSを復元し部分更新とSkipで維持する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-ANSWER-20] restores FSRS and preserves it across partial edits and skip`

Given:

- 本人のCardにlegacy期限とintervalがあり、10枚のsessionの先頭から評価できる。

When:

- goodを保存し、Card readerとProgress mapperで復元する。難易度と本文を部分更新する。
- 同じCardを含む新sessionでSkipする。

Then:

- 初回評価でlegacy nextSeeingAt/intervalを削除し、復元scheduleの全フィールドと次回の計算結果は保存前と一致する。
- 難易度・本文編集とSkipはscheduleを維持する。Skipでは回答を増やさない。
- 未対応versionや不正期限の保存データはCard readerの検証エラーとなり、新規として復元しない。
