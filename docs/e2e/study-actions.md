# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する 4段階評価、スキップ、移動 action が、学習結果と session 位置へ一度だけ反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [good action で学習結果を保存して次の Card へ進める](#swipe-02) |
| SWIPE-03 | write | [again action で学習結果を保存して次の Card へ進める](#swipe-03) |
| SWIPE-04 | write | [スキップ で次の Card へ進める](#swipe-04) |
| SWIPE-05 | read | [学習中に前の Card へ戻れない](#swipe-05) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#swipe-12) |

<a id="swipe-02"></a>

### SWIPE-02 good action で学習結果を保存して次の Card へ進める

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
- 現在だった Card の difficulty が good rule に従って 1 下がり、学習回数が 1 増えて保存される。
- 回答・Card の学習結果・session の前進はすべて保存されるか、いずれも保存されない。
- session の位置が次の Card へ進む。
- 保存成功後に最近の学習時刻を更新し、Deck 一覧の学習順と経過表示へ反映する。
- 次の Card の front text が表示される。
- 実行した swipe 方向が、言語に依存しないアイコンとして共通 toast で短時間表示される。
- browser error が発生しない。

<a id="swipe-03"></a>

### SWIPE-03 again action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に again action を実行する。

Then:

- 独立した `studyAnswer/{answerId}` に `{ type: "rating", rating: "again" }` を保存する。
- 現在だった Card の difficulty が again rule に従って 1 上がり、学習回数が 1 増えて保存される。
- 回答・Card の学習結果・session の前進はすべて保存されるか、いずれも保存されない。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-04"></a>

### SWIPE-04 スキップ で次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に スキップ を実行する。

Then:

- 回答Documentを作成しない。
- 現在だった Card の difficulty は変わらず、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-05"></a>

### SWIPE-05 学習中に前の Card へ戻れない

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

<a id="swipe-12"></a>

### SWIPE-12 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- swipe feedback が有効である。
- 前回の学習結果の保存要求が失敗し、同じ Card と session の位置が維持されている。
- 次の学習結果の保存要求は成功できる。

When:

- 保存失敗後にページへ再訪または reload し、「再試行」を実行する。

Then:

- 失敗した試行では swipe feedback が表示されず、成功した再試行だけ共通 toast が表示される。
- 最初に受け付けた回答ID・UID・参照ID・評価・回答時刻・計算済み進捗を再試行でも維持する。
- 保存中・再試行待ちには別の評価、スキップ、スライダー、自動再生で前進できない。
- オフラインではSDKの保存確認を待つ間は保存中として操作を止め、確認前に前進しない。保存失敗やSessionの作成未完了では同じ位置から再試行できる。
- 結果不明時も新しいIDを生成しない。batchが失敗した場合だけ同じIDをサーバーで確認し、内容が一致する保存済み回答なら再保存せず成功確認とする。未保存・内容不一致・確認失敗は成功扱いせず固定操作を保持する。
- 別UID・別Sessionの操作を現在の画面へ適用しない。Rulesにより参照Sessionの現在Cardと一致しない新規回答を拒否する。
- 画面描画後に認証が変わった場合も、実行時のUIDを確認し、前ユーザーの操作を受け付けない。
- ローカル・匿名利用は既存の進捗保存と位置更新を利用し、remote用の固定操作・sessionStorage・再試行管理を追加しない。ローカルの部分保存失敗をまたぐexactly-once保証は対象外。
- スキップの再試行も固定した絶対値を保存する。最終スキップの結果不明時はSessionと進捗の一致を確認する。
- 単一画面の再試行で学習回数を二重に加算しない。
- 保存後のcleanup失敗は保存失敗として表示せず、再試行待ちにも戻さない。
- session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
- 最初の保存失敗に伴う未処理の browser error が発生しない。

## 回答保存契約

- 保存する回答は `answer.type == "rating"` と `answer.rating` の4値（`again`、`hard`、`good`、`easy`）のみ。旧2値、`unrated`、未知の形式、欠落値、余分なpayloadを拒否する。
- 回答時刻は操作受付時の端末時刻、作成・更新時刻は初回保存のserver timestampとする。回答を後から編集しない。
- 単一画面の直列操作で、保存中の二重入力を防ぐ。10枚へ各1回答すると10件になり、再開だけでは増えない。別Sessionで同じCardに回答した記録は残す。
- 最終回答とSession完了を原子的に確定する。離脱・破棄は保存済み回答を削除しない。
- 本人のみ作成・読取できる。公開Deckでも回答は非公開。本人でも回答の更新・通常削除はできない。
- Rulesは所有者、回答の不変性、基本形式、参照Sessionとの一致を検証する。進捗は読み込み済みCardから一度計算し、回答・進捗・Sessionは同じwriteBatchで保存する。Rulesに進捗の計算式や次位置・完了判定を重複させない。正しい所有者・payload・参照を持つ回答の単独作成は許可し、独自クライアントの同時遷移までは強制しない。
- スライダーと自動再生は回答用の操作IDや再試行データを作らず、通常のSession保存経路で前進する。回答保存中・再試行待ちの移動禁止は維持する。
- 本人UIDで絞ったSession別検索、Card別・Deck別の回答時刻降順検索ができる。
- ローカル利用・匿名認証では回答をFirestoreへ保存しない。
- 独立IDと補助データなしの構造を維持する。他タブ・他端末との並行更新の調停・最新進捗からの再計算は対象外で、古い進捗値で上書きする可能性がある。改造クライアントの進捗計算の正当性や重複防止も保証しない。

## 将来の回答形式・採点

将来は `choice` の `optionId`、`text` の入力文字を回答payloadとして追加する。今回の型・schema・Rules・UIには追加しない。

採点導入時には回答内容と別に `isCorrect: boolean | null` を追加する。`true` は正解、`false` は不正解、`null` は未採点または対象外を表す。自己評価を正誤へ変換せず、ratingは採点対象外とする。当時の採点結果を保持し、後のカード変更で再採点しない。不正解の振り返りや復習、採点済み回答の正答率に用い、`null` は正答率の分母に含めない。今回このフィールドや採点処理は実装しない。
