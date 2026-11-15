# Card 作成画面 Playwright 結合テスト仕様書

## 目的

Card 作成画面を入口とした Playwright テストで、対象 Deck への Card 作成、解答プレビュー、作成中・失敗後の操作を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-CARD-FORM-05 | interaction | 正常系 | [入力した両面で Card を作成する](#playwright-card-form-05) |
| PLAYWRIGHT-CARD-FORM-17 | interaction | 正常系 | [作成成功を画面で通知する](#playwright-card-form-17) |
| PLAYWRIGHT-CARD-FORM-18 | interaction | 異常系 | [作成失敗後に入力を保って再試行する](#playwright-card-form-18) |
| PLAYWRIGHT-CARD-FORM-19 | interaction | 正常系 | [作成中の連続操作を抑止する](#playwright-card-form-19) |
| PLAYWRIGHT-CARD-CREATE-01 | interaction | 異常系 | [未入力のまま Card を作成しない](#playwright-card-create-01) |
| PLAYWRIGHT-CARD-CREATE-02 | interaction | 正常系 | [下書きを保存せず解答を確認する](#playwright-card-create-02) |
| PLAYWRIGHT-CARD-CREATE-03 | interaction | 正常系 | [未保存の Card 作成内容の離脱を確認できる](#playwright-card-create-03) |
| PLAYWRIGHT-CARD-CREATE-04 | interaction | 正常系 | [未変更の Card 作成画面は確認なしで取り消せる](#playwright-card-create-04) |
| PLAYWRIGHT-CARD-CREATE-05 | interaction | 正常系 | [作成中の未保存の解答をプレビューできる](#playwright-card-create-05) |
| PLAYWRIGHT-CARD-CREATE-06 | interaction | 正常系 | [狭い画面で両面とタグを入力して作成する](#playwright-card-create-06) |
| PLAYWRIGHT-CARD-CREATE-07 | interaction | 正常系 | [長い Card 本文の作成通知を狭い画面で閉じる](#playwright-card-create-07) |
| PLAYWRIGHT-CARD-CREATE-08 | interaction | 正常系 | [作成成功の応答で未回答の離脱確認を閉じる](#playwright-card-create-08) |
| PLAYWRIGHT-CARD-CREATE-09 | interaction | 正常系 | [作成中の離脱後に遅い成功で画面を戻さない](#playwright-card-create-09) |
| PLAYWRIGHT-CARD-CREATE-10 | interaction | 異常系 | [作成失敗の応答後も離脱確認と入力を保持する](#playwright-card-create-10) |
| PLAYWRIGHT-CARD-CREATE-11 | interaction | 異常系 | [作成画面の離脱後に失敗の応答を通知する](#playwright-card-create-11) |
| PLAYWRIGHT-CARD-CREATE-12 | interaction | 正常系 | [Card 作成で所属 Deck のタグを選択し新規タグを追加できる](#playwright-card-create-12) |

<a id="playwright-card-form-05"></a>

### PLAYWRIGHT-CARD-FORM-05 [TODO] 入力した両面で Card を作成する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 作成画面を開き、保存先は成功を返す。

When:

- 表面 Hello と裏面 Hola、前後空白のある新規タグ名を入力する。入力欄から別の場所へ移動せずにその候補をクリックして解除し、同じ名前を再追加して Escape でタグ編集を閉じ、作成する。

Then:

- 作成成功が表示され、対象 Deck の一覧から Hello の Card を選んで Hola を確認できる。
- 新規タグ名の前後空白だけを除き、内部の空白は保持して一覧に表示する。
- 新規タグの候補を一度クリックすると入力行が消え、解除される。

<a id="playwright-card-form-17"></a>

### PLAYWRIGHT-CARD-FORM-17 [TODO] 作成成功を画面で通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で Front value と Back value を入力し、保存先は成功を返す。

When:

- Create card を選ぶ。

Then:

- 成功応答を受けた後に Created card “Front value”. が表示される。

<a id="playwright-card-form-18"></a>

### PLAYWRIGHT-CARD-FORM-18 [TODO] 作成失敗後に入力を保って再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 作成画面で有効な両面を入力し、保存先は失敗、成功の順に返す。

When:

- 作成し、失敗後にもう一度作成する。

Then:

- 失敗時は再試行の案内と両面の入力が残り、再試行成功後は成功通知が表示される。

<a id="playwright-card-form-19"></a>

### PLAYWRIGHT-CARD-FORM-19 [TODO] 作成中の連続操作を抑止する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で両面を入力し、作成の完了を待っている。

When:

- 作成を続けて選び、保留中の処理を完了させる。

Then:

- 待機中は Creating… が無効になり、完了後は Create card が再び有効になる。同じ送信で複数の Card が一覧に増えない。

<a id="playwright-card-create-01"></a>

### PLAYWRIGHT-CARD-CREATE-01 [TODO] 未入力のまま Card を作成しない

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の Card 作成画面で両面を未入力にしている。

When:

- 作成を選ぶ。

Then:

- 必須入力のエラーが表示され、作成成功の通知は出ない。入力を修正して再び操作できる。

<a id="playwright-card-create-02"></a>

### PLAYWRIGHT-CARD-CREATE-02 [TODO] 下書きを保存せず解答を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で裏面に太字と数式を入力している。

When:

- 解答プレビューを開き、閉じる。

Then:

- 入力内容がプレビューに描画され、閉じても下書きが残り、作成成功の通知は出ない。

<a id="playwright-card-create-03"></a>

### PLAYWRIGHT-CARD-CREATE-03 [TODO] 未保存の Card 作成内容の離脱を確認できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 作成画面で、表面の本文を変更し、未保存である。

When:

- Cancel の確認で Keep editing を選び、再度 Cancel して Discard changes を選ぶ。

Then:

- 未保存変更の確認を表示し、Keep editing では入力を保つ。
- Discard changes では所属 Deck の Card 一覧へ移動し、Card は作成しない。

<a id="playwright-card-create-04"></a>

### PLAYWRIGHT-CARD-CREATE-04 [TODO] 未変更の Card 作成画面は確認なしで取り消せる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 作成画面を開き、まだ入力を変更していない。

When:

- Cancel を選択する。

Then:

- 未変更の場合は確認なしで所属 Deck の Card 一覧へ戻る。

<a id="playwright-card-create-05"></a>

### PLAYWRIGHT-CARD-CREATE-05 [TODO] 作成中の未保存の解答をプレビューできる

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名で利用中の Deck の Card 作成画面を開いている。Front は未入力である。

When:

- Back に未保存の本文を入力し、プレビューをキーボードで開閉する。
- math タグを入力または選択し、強調、表、数式を含む本文をプレビューする。
- 拡大入力でも本文を変更してプレビューを確認し、通常入力へ戻る。

Then:

- 最新の下書きが Deck のカテゴリと最初の対応タグに従って表示される。
- プレーンテキストは改行を保持し、math は Markdown の強調・表と数式を表示する。
- Front の入力エラーや保存処理が始まらず、本文とタグを維持して入力へ戻れる。
- プレビューを開閉した後も、開く前の入力操作を Undo できる。
- 狭い画面でもプレビュー操作と入力欄を利用できる。
- プレビューだけでは Card を作成せず、Deck の内容・学習結果・学習の現在位置・URL は変わらない。

<a id="playwright-card-create-06"></a>

### PLAYWRIGHT-CARD-CREATE-06 [TODO] 狭い画面で両面とタグを入力して作成する

カテゴリ: `interaction`

区分: 正常系

Given:

- Google 連携済みの状態で所属 Deck の Card 作成画面をモバイル幅で開いている。
- 保存先は成功応答と新しい Card の結果を返す。

When:

- Front / Back を拡大して入力し、タグ選択画面でタグを選んで作成を続けて選ぶ。

Then:

- 両面の拡大編集は画面の上端から下端まで表示し、見出し・完了ボタンが欠けず、背景とタグ選択画面は下端に隙間なく接する。
- 検証中・保存中は作成を無効にし、成功応答後に対象 Deck の一覧へ移動して入力した両面とタグの Card を1件だけ表示し、成功を通知する。

<a id="playwright-card-create-07"></a>

### PLAYWRIGHT-CARD-CREATE-07 [TODO] 長い Card 本文の作成通知を狭い画面で閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名で利用する Deck の Card 作成画面を360×640で開いている。保存先は成功応答と作成結果を返す。

When:

- 約1,748文字の通常の段落の表面と有効な裏面を入力して作成し、通知の Dismiss へ移動して Enter で閉じる。

Then:

- 翻訳された成功通知と Card 本文の冒頭を含む最大3行のプレビューが viewport 内に収まり、通知の読み上げは Card の文脈を保つ。
- Dismiss の描画範囲と可視フォーカスが viewport 内に収まり、ポインターとキーボードで操作でき、閉じるとページへフォーカスが戻る。
- 一覧と閲覧で両面の全文を確認でき、通知用の切り詰めを本文へ適用しない。

<a id="playwright-card-create-08"></a>

### PLAYWRIGHT-CARD-CREATE-08 [TODO] 作成成功の応答で未回答の離脱確認を閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 作成画面で両面を入力し、保存応答を保留している。

When:

- Header の離脱確認で Keep editing を選ぶ。再び離脱を試み、確認を未回答のまま保存完了を待つ。

Then:

- 確認には離脱後も作成が続くことと、留まる場合の成功時の遷移・失敗時の通知を表示する。Keep editing では入力と処理を保つ。
- 成功応答前は遷移せず、成功応答後に未回答の確認を閉じて所属 Deck の一覧へ移動し、入力した Card を1件表示して成功を通知する。以前 Header で選んだ画面へ移動しない。

<a id="playwright-card-create-09"></a>

### PLAYWRIGHT-CARD-CREATE-09 [TODO] 作成中の離脱後に遅い成功で画面を戻さない

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 作成画面で両面を入力し、保存応答を保留している。

When:

- Header の離脱確認で Discard changes を選び、移動先で保存完了を待つ。

Then:

- 離脱確認には処理が続くことと完了時の挙動を表示する。Discard changes で要求した Deck 一覧へ移動する。
- 遅い成功応答と Card の結果を受け取っても、現在の画面を維持し、離脱した作成画面の成功通知・自動遷移を行わない。所属 Deck を開き直すと入力した Card を1件確認できる。
- 別画面へ移動した後に同じ結果が届いても再び遷移しない。

<a id="playwright-card-create-10"></a>

### PLAYWRIGHT-CARD-CREATE-10 [TODO] 作成失敗の応答後も離脱確認と入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の Card 作成画面で両面を入力している。保存先は応答を保留でき、最初は失敗、再試行は成功を返す。

When:

- Create card で保存を開始し、応答待ち中に Header から離脱確認を開く。
- 離脱確認を未回答のまま失敗応答を受け取り、Keep editing を選んで再試行する。

Then:

- 失敗応答では未回答の離脱確認と入力を保持し、成功時の遷移を行わない。
- Keep editing 後に同じ入力で再試行でき、成功応答と作成結果を受け取ると所属 Deck の一覧へ移動し、入力した Card を1件表示して成功を通知する。

<a id="playwright-card-create-11"></a>

### PLAYWRIGHT-CARD-CREATE-11 [TODO] 作成画面の離脱後に失敗の応答を通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- ログイン中のアカウントが所有する Deck の Card 作成画面で、両面を入力して保存を始めている。
- 保存中の離脱確認で Discard changes を選び、別画面へ移動済みである。

When:

- 保存先が拒否の応答と対象 Card が存在しない結果を返す。

Then:

- 失敗通知を表示し、成功時の遷移は行わない。
- 拒否された Card は一覧に残らず、離脱済みの入力画面や確認へ戻らない。

<a id="playwright-card-create-12"></a>

### PLAYWRIGHT-CARD-CREATE-12 [TODO] Card 作成で所属 Deck のタグを選択し新規タグを追加できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 作成画面で両面を入力している。保存先は成功応答と作成結果を返す。
- 所属 Deck の Card にタグがある場合と、どの Card にもタグがない場合を独立した入力例とする。

When:

- タグ選択画面で既存候補を選択するか新しいタグを入力し、Card を作成する。タグ候補がない場合はタグなしでも作成する。

Then:

- タグ候補は所属 Deck の Card から集約したタグであり、固定カテゴリや別 Deck のタグは追加されない。Card のタグがなければ候補は空で、タグを新規入力するかタグなしで作成できる。
- 新規入力したタグ名の前後空白を除き、内部の空白は保持する。選択した既存候補の値は保持し、新規タグを末尾へ追加する。
