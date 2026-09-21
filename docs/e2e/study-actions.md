# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する 4段階評価、スキップ、移動 action が、学習結果と session 位置へ一度だけ反映されることを確認する。

## 保存境界

- 単一タブ・単一の学習操作元を対象とし、匿名と通常ログインで同じ Firestore batch を使う。
- 評価回答では StudyAnswer の作成、StudyProgress 更新、StudySession の前進・完了を一つの batch にまとめる。ID と回答時刻は受付時に固定する。
- ローカル snapshot へ反映した時点で前進し、クラウド確定や server timestamp を待たない。SDK が保留している操作を新しい ID で再発行しない。
- Security Rules は匿名のクラウド書き込みを拒否し、本人 UID と更新時の UID 維持を確認する。StudyAnswer は本人による read／create のみ許可する。
- 回答形式、参照先、回答 ID、Card 進捗、回答順序、Session の前進・完了はアプリとそのテストの責務とする。Rules は本人 UID の回答作成を許可し、payload や参照先の存在・整合、Session の状態遷移は制約しない。
- FSRS-6.0（ts-fsrs 5.4.2、保持率0.9、fuzz無効、最大36500日、learning steps 1分/10分、relearning step 10分）を使用する。4評価は受付時刻で一度だけ計算し、scheduleを同じ回答batchで保存する。間隔反復OFFでも計算する。
- scheduleには形式version、状態、期限・前回評価時刻（Unixミリ秒）、stability、FSRS difficulty、復習/失敗回数、間隔日数、learning stepを保持し、reload後の次回計算を変えない。相対difficultyとは独立させる。
- 保存・同期失敗は共通通知で表示する。独自の再送・競合復旧キューは作らない。
- これは #1653 の transaction 必須・オンライン確定後のみ前進・匿名別保存という計画を #1665 に従って置き換える。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-ACTIONS-01 | write | [good action で学習結果を保存して次の Card へ進める](#study-actions-01) |
| STUDY-ACTIONS-02 | write | [again action で学習結果を保存して次の Card へ進める](#study-actions-02) |
| STUDY-ACTIONS-03 | write | [スキップ で次の Card へ進める](#study-actions-03) |
| STUDY-ACTIONS-04 | read | [学習中に前の Card へ戻れない](#study-actions-04) |
| STUDY-ACTIONS-05 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#study-actions-05) |

<a id="study-actions-01"></a>

### STUDY-ACTIONS-01 good action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。
- swipe feedback が有効である。

When:

- 現在の Card に good action を実行する。

Then:

- 独立した `studyAnswer/{answerId}` に `{ type: "rating", rating: "good" }` を保存する。
- `hard` / `easy` も受け付けた値のまま保存し、既存の成功評価と同じ difficulty rule を使う。
- good / hard / easyの各評価からFSRS scheduleを生成する。既存scheduleがあればその記憶状態を更新し、なければ閲覧履歴や相対difficultyから推測せず空の初期状態から計算する。初回保存時にlegacy nextSeeingAt/intervalを削除する。
- 現在だった Card の difficulty が good rule に従って 1 下がり、学習回数が 1 増えて保存される。
- 回答・Card の学習結果・session の前進はすべて保存されるか、いずれも保存されない。
- session の位置が次の Card へ進む。
- 保存成功後に最近の学習時刻を更新し、Deck 一覧の学習順と経過表示へ反映する。
- 次の Card の front text が表示される。
- 実行した swipe 方向が、言語に依存しないアイコンとして共通 toast で短時間表示される。
- アプリは 操作受付時に固定した独立したランダム回答 ID を使い、回答、Card の学習回数・回答時刻、session の更新を一つの batch にまとめ、通常の二重送信を防止する。
- browser error が発生しない。

<a id="study-actions-02"></a>

### STUDY-ACTIONS-02 again action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に again action を実行する。

Then:

- 独立した `studyAnswer/{answerId}` に `{ type: "rating", rating: "again" }` を保存する。
- againでFSRS scheduleを更新し、短い期限を保存する。同じsessionへの再投入は行わない。
- 現在だった Card の difficulty が again rule に従って 1 上がり、学習回数が 1 増えて保存される。
- 回答・Card の学習結果・session の前進はすべて保存されるか、いずれも保存されない。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="study-actions-03"></a>

### STUDY-ACTIONS-03 スキップ で次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に スキップ を実行する。

Then:

- 回答Documentを作成しない。
- FSRS scheduleを生成・変更しない。裏面表示、Help、離脱、slider、autoplayでもscheduleを更新しない。
- 現在だった Card の difficulty は変わらず、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="study-actions-04"></a>

### STUDY-ACTIONS-04 学習中に前の Card へ戻れない

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の前に別の Card がある。
- 4方向は左＝again、下＝hard、右＝good、上＝easy に割り当てられている。

When:

- 学習操作と Help の表示を確認する。
- 進捗スライダーを pointer と keyboard で現在位置より前へ動かそうとする。

Then:

- 前の Card へ戻る学習操作・設定・表示は存在しない。
- スライダーの後方入力は現在位置を維持し、前方への移動は引き続き利用できる。
- ボタン・方向キー・swipe・裏面の操作領域は同じ評価に対応する。
- browser error が発生しない。

<a id="study-actions-05"></a>

### STUDY-ACTIONS-05 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- swipe feedback が有効である。
- 前回の学習結果の保存要求が失敗し、同じ Card と session の位置が維持されている。
- 次の学習結果の保存要求は成功できる。

When:

- 保存失敗後に同じ Card に評価を再度実行する。

Then:

- 失敗した試行では swipe feedback が表示されず、成功した再試行だけ共通 toast が表示される。
- cache への保存中は評価、スキップ、スライダー、自動再生を止める。
- オフラインでも cache 反映後は前進し、reload 後も回答・進捗・位置を復元する。未同期の batch は SDK が保持する。
- 最終回答の cache 反映後に remote が拒否した場合も、復元された Card を表示して完了画面を解除し、再試行できる。
- 別 UID・別 Session・別訪問への古い非同期結果や通知を反映しない。
- 画面描画後に認証が変わった場合も、実行時の UID を確認し、前ユーザーの操作を受け付けない。
- SDK の同期エラーは共通通知で表示し、独自の sessionStorage 再送キューは持たない。
- session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
- 最初の保存失敗に伴う未処理の browser error が発生しない。

## 回答保存契約

- アプリが保存する回答は `answer.type == "rating"` と `answer.rating` の4値（`again`、`hard`、`good`、`easy`）のみ。旧2値、`unrated`、未知の形式、欠落値、余分なpayloadを拒否する。
- 回答時刻は操作受付時の端末時刻、作成・更新時刻も同じ端末時刻とする。回答を後から編集しない。
- 単一画面の直列操作で、保存中の二重入力を防ぐ。10枚へ各1回答すると10件になり、再開だけでは増えない。別Sessionで同じCardに回答した記録は残す。
- 最終回答とSession完了を原子的に確定する。離脱・破棄は保存済み回答を削除しない。
- 本人のみ作成・読取できる。公開Deckでも回答は非公開。本人でも回答の更新・通常削除はできない。
- Rules は認証・所有者・回答の更新と削除の禁止だけを担当する。回答形式・参照先・Session の状態遷移はアプリで検証し、Rules へ重複実装しない。本人 UID の独自クライアントによる不正な payload・参照・遷移の保存までは防がない。
- スライダーと自動再生は回答用の操作IDや再試行データを作らず、通常のSession保存経路で前進する。cache 保存中の移動禁止は維持する。
- 本人UIDで絞ったSession別検索、Card別・Deck別の回答時刻降順検索ができる。
- 匿名利用も同じ batch で Firestore の永続 cache に回答を保存し、ネットワークを無効に保つ。匿名のクラウド書き込みは Rules が拒否する。
- 独立IDと補助データなしの構造を維持する。他タブ・他端末との並行更新の調停・最新進捗からの再計算は対象外で、古い進捗値で上書きする可能性がある。改造クライアントの進捗計算の正当性や重複防止も保証しない。

## 将来の回答形式・採点

将来は `choice` の `optionId`、`text` の入力文字を回答payloadとして追加する。今回の型・schema・Rules・UIには追加しない。

採点導入時には回答内容と別に `isCorrect: boolean | null` を追加する。`true` は正解、`false` は不正解、`null` は未採点または対象外を表す。自己評価を正誤へ変換せず、ratingは採点対象外とする。当時の採点結果を保持し、後のカード変更で再採点しない。不正解の振り返りや復習、採点済み回答の正答率に用い、`null` は正答率の分母に含めない。今回このフィールドや採点処理は実装しない。

保存拒否時にはscheduleも既存snapshotの巻き戻りに従い、再試行は復元された現在状態から計算する（STUDY-ACTIONS-05）。SDKの再同期で再計算しない。
