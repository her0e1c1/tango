# Study Controls E2E テスト仕様書

## 目的

学習画面の操作と Help が設定どおりに機能し、スクロールやキーの長押しで誤操作が起きないことを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-CONTROLS-02 | read | 正常系 | [主ボタン以外のドラッグでは評価・移動しない](#study-controls-02) |
| STUDY-CONTROLS-04 | read | 正常系 | [Help に現在の操作割り当てを表示する](#study-controls-04) |
| STUDY-CONTROLS-11 | read | 正常系 | [閲覧モードでタッチスクロールができる](#study-controls-11) |
| STUDY-CONTROLS-14 | read | 正常系 | [Space の長押しで再生を連続切替しない](#study-controls-14) |
| STUDY-CONTROLS-17 | read | 正常系 | [Help 内のキー入力とフォーカスを学習操作から分離する](#study-controls-17) |
| STUDY-CONTROLS-18 | read | 正常系 | [通知は Help の操作とフォーカスを妨げない](#study-controls-18) |
| STUDY-CONTROLS-22 | read | 正常系 | [閲覧モードでピンチ拡大ができる](#study-controls-22) |
| STUDY-CONTROLS-01 | write | 正常系 | [ログイン中に上ドラッグで評価して次へ進む](#study-controls-01) |
| STUDY-CONTROLS-03 | write | 正常系 | [匿名利用中に上ドラッグで評価して次へ進む](#study-controls-03) |
| STUDY-CONTROLS-05 | write | 正常系 | [Help ボタンの表示設定を再読み込み後も維持できる](#study-controls-05) |
| STUDY-CONTROLS-06 | write | 正常系 | [閲覧モードでは誤操作なく長い表面を読める](#study-controls-06) |
| STUDY-CONTROLS-07 | write | 正常系 | [閲覧モードの終了では Card を裏返さない](#study-controls-07) |
| STUDY-CONTROLS-08 | batch | 正常系 | [閲覧モード中も評価ボタンで次の Card へ進める](#study-controls-08) |
| STUDY-CONTROLS-09 | write | 正常系 | [閲覧モード設定を画面移動・再読み込み後も維持する](#study-controls-09) |
| STUDY-CONTROLS-10 | write | 正常系 | [横向きの短い画面でも本文と操作ボタンに到達できる](#study-controls-10) |
| STUDY-CONTROLS-12 | write | 正常系 | [方向ボタンの読み上げ名で現在の操作を確認できる](#study-controls-12) |
| STUDY-CONTROLS-13 | write | 正常系 | [方向キーの長押しで追加評価しない](#study-controls-13) |
| STUDY-CONTROLS-15 | write | 正常系 | [修飾付きショートカットを無視して通常入力を受け付ける](#study-controls-15) |
| STUDY-CONTROLS-16 | write | 正常系 | [修飾付き Enter で閲覧モードを終了しない](#study-controls-16) |
| STUDY-CONTROLS-19 | write | 正常系 | [閲覧モードボタンの表示設定を共有・維持する](#study-controls-19) |
| STUDY-CONTROLS-20 | write | 正常系 | [Card・表裏・モードの変更で本文のスクロール位置が先頭へ戻る](#study-controls-20) |
| STUDY-CONTROLS-21 | write | 正常系 | [閲覧モード中も自動再生で次の Card へ進める](#study-controls-21) |
| STUDY-CONTROLS-23 | write | 正常系 | [b の長押しで方向ボタンを連続切替しない](#study-controls-23) |

<a id="study-controls-02"></a>

### STUDY-CONTROLS-02 主ボタン以外のドラッグでは評価・移動しない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card の表面が表示されている。

When:

- マウスの主ボタン以外で現在の Card をスワイプに対応する方向へドラッグする。

Then:

- 同じ Card の表面を表示し続ける。
- Card の学習結果と学習位置は変わらない。

<a id="study-controls-04"></a>

### STUDY-CONTROLS-04 Help に現在の操作割り当てを表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 方向操作は既定と異なる割り当てで、操作ボタンの一部は非表示である。
- 英語の画面を表示している。

When:

- 学習画面から Help ダイアログを開く。

Then:

- 方向操作を現在の割り当てと意味の分かるラベルで表示する。
- Card の表示、自動再生、操作ボタン表示、Card details、Deck 一覧へ戻る操作が表示される。
- 操作ボタンの説明は非表示設定にも一致する。
- 設定された4段階評価の意味が表示され、前の Card へ戻る学習操作は存在しない。

<a id="study-controls-11"></a>

### STUDY-CONTROLS-11 閲覧モードでタッチスクロールができる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- タッチ端末で長い本文の表面を学習中で、閲覧モードは ON である。

When:

- 本文をタッチ操作で縦にスクロールする。

Then:

- 本文のスクロール位置が変わる。
- 評価・Card 移動・モード終了は発生しない。

<a id="study-controls-14"></a>

### STUDY-CONTROLS-14 Space の長押しで再生を連続切替しない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 閲覧モードが OFF で Card の表面が表示され、自動再生は停止中である。
- 方向ボタンは表示中で、操作中には次の Card へ進まない再生間隔である。

When:

- Space を押して保持し、離して再び押す。

Then:

- 最初の Space で再生を開始し、保持中は再生を維持し、再押下で停止する。
- Card の表示・回答履歴・記憶状態・学習位置は変わらない。

<a id="study-controls-17"></a>

### STUDY-CONTROLS-17 Help 内のキー入力とフォーカスを学習操作から分離する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 方向操作は既定と異なる割り当てで、操作ボタンの一部は非表示である。
- 英語の画面で Help ダイアログを開いている。

When:

- ダイアログ内で方向キーと操作ボタン表示切り替えキーを入力し、フォーカスを移動してから Escape で閉じる。

Then:

- ダイアログ内のキー入力で Card、学習結果、学習の位置、操作ボタンの表示設定が変更されない。
- フォーカスがダイアログ内に維持され、閉じた後は Help ボタンへ戻る。

<a id="study-controls-18"></a>

### STUDY-CONTROLS-18 [TODO] 通知は Help の操作とフォーカスを妨げない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 英語の画面に自動では消えない通知と Help ダイアログが表示され、Close help にフォーカスがある。

When:

- 通知が重なった状態と、消去・置き換え後のダイアログを操作し、Help を閉じる。

Then:

- 通知の表示・消去・置き換えはダイアログの操作を妨げず、フォーカスは Close help に保たれる。通知へ誤操作やフォーカス移動が起きない。
- Help ダイアログを閉じると、残っている通知の操作を再び利用できる。

<a id="study-controls-22"></a>

### STUDY-CONTROLS-22 閲覧モードでピンチ拡大ができる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- タッチ端末で長い本文の表面を学習中で、閲覧モードは ON である。

When:

- 本文を2本指でピンチ拡大する。

Then:

- ピンチ操作で表示倍率が上がる。
- 評価・Card 移動・モード終了は発生しない。

<a id="study-controls-01"></a>

### STUDY-CONTROLS-01 ログイン中に上ドラッグで評価して次へ進む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-drag`](./fixture/study-session-start-drag.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の表面が表示されている。
- 上方向のドラッグは easy の評価に設定されている。

When:

- マウスの主ボタンで現在の Card を上方向へドラッグする。

Then:

- easy の評価結果を保存する。
- 次の Card の表面だけを表示する。
- ドラッグ後のクリックによって次の Card が裏面へ切り替わらない。

<a id="study-controls-03"></a>

### STUDY-CONTROLS-03 匿名利用中に上ドラッグで評価して次へ進む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーが、このブラウザーの Deck で複数の Card を学習中である。
- 現在の Card の表面が表示されている。
- 上方向のドラッグは easy の評価に設定されている。

When:

- マウスの主ボタンで現在の Card を上方向へドラッグする。

Then:

- easy の評価結果をこのブラウザーで保持し、次の Card の表面へ進む。

<a id="study-controls-05"></a>

### STUDY-CONTROLS-05 Help ボタンの表示設定を再読み込み後も維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- ログイン中のアカウントの Deck を学習中である。
- Help ボタンの表示設定は既定値の ON である。

When:

- 学習画面の Study actions から Help ボタンを OFF にして再読み込みする。

Then:

- ON のときは Help ボタンと省略ボタンが重ならずに表示される。
- OFF にすると Help ボタンが消え、再読み込み後も非表示を維持する。

<a id="study-controls-06"></a>

### STUDY-CONTROLS-06 閲覧モードでは誤操作なく長い表面を読める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い本文の Card の表面を学習中である。

When:

- ツールバーで閲覧モードを ON にし、ホイール・タッチ・方向キー・Space・PageUp／PageDown で本文を読む。全方向へのマウスドラッグと文字選択も行う。
- Help を開いて閲覧中の操作の説明を確認する。

Then:

- 文字サイズと数式表示を保ち、先頭から末尾までスクロールできる。操作ボタン・ツールバーは本文を覆わない。
- スワイプ・方向キー・スクロール・文字選択・Help の操作では評価や移動が起きず、閲覧モードと表面、学習結果と現在位置を維持する。
- Space は自動再生やモード終了を起こさない。Help は閲覧中の操作を説明する。

<a id="study-controls-07"></a>

### STUDY-CONTROLS-07 閲覧モードの終了では Card を裏返さない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Card の表面を表示し、閲覧モードを ON にしている。

When:

- 本文をタップして閲覧モードを終了する。再び ON にして Enter でも終了し、その後もう一度 Enter を入力する。

Then:

- タップと最初の Enter は同じ Card の表面を維持して閲覧モードだけを OFF にする。次の Enter で裏面へ切り替わる。
- Enter を押し続けても終了後に裏返らない。

<a id="study-controls-08"></a>

### STUDY-CONTROLS-08 閲覧モード中も評価ボタンで次の Card へ進める

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card があり、閲覧モードが ON である。

When:

- 評価ボタンで次の Card へ進む。

Then:

- 評価ボタンの結果が保存され、次の Card に進む。
- 移動後も閲覧モードは ON で、スクロール位置は先頭になる。

<a id="study-controls-09"></a>

### STUDY-CONTROLS-09 閲覧モード設定を画面移動・再読み込み後も維持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 閲覧モードは未設定時を含め、既定の OFF である。

When:

- 学習画面で ON にして再読み込みし、Deck 閲覧画面へ移動する。本文をタップして OFF にし、学習画面へ戻って再読み込みする。

Then:

- ON と OFF が両画面と再読み込み後に反映される。他の設定は維持される。

<a id="study-controls-10"></a>

### STUDY-CONTROLS-10 横向きの短い画面でも本文と操作ボタンに到達できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 568×320 の画面で長い表面の本文を学習中である。閲覧モードと Card 情報・評価・再生・Skip の表示を ON にしている。

When:

- 「…」を展開し、本文と各操作部をスクロールする。

Then:

- 本文は画面高の半分以上の領域で末尾まで読め、評価・再生・Skip もスクロールで表示できる。
- 評価・Card 移動・モード終了は発生しない。

<a id="study-controls-12"></a>

### STUDY-CONTROLS-12 方向ボタンの読み上げ名で現在の操作を確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 学習中の Card の表面と4方向の操作ボタンが表示されている。
- 英語・日本語で、既定の評価割り当てと、上＝学習終了・下＝操作なし・左＝スキップ・右＝Hard の割り当てを確認する。

When:

- 方向ボタンの読み上げ名・表示と Help の説明を確認する。

Then:

- 各ボタンの読み上げ名は方向と現在の操作を含む。既定の上方向は英語で「Swipe up: Easy」、日本語で「上へスワイプ: Easy」となる。
- 操作名はキャプション・Help と一致し、評価・スキップ・学習終了・操作なしを区別する。独立した Exit は学習を保持する操作として区別する。
- 言語・割り当てに名前とキャプションが追従する。名前の更新ではフォーカス、Card、学習結果、学習状態、他の設定は変わらない。
- 矢印・キャプション・ボタンの順序を維持する。操作なしのボタンは無効で表示され、Tab 移動の対象外となる。

<a id="study-controls-13"></a>

### STUDY-CONTROLS-13 方向キーの長押しで追加評価しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 閲覧モードが OFF で複数の未評価 Card を学習中であり、方向キーには4段階評価が割り当てられている。

When:

- 方向キーを押し、最初の評価の保存が完了して次の Card が操作可能になってからも押し続ける。
- キーを離して再び押す。

Then:

- 最初の押下では割当どおりの評価を1件保存し、次の Card に進む。
- 長押し中は次の Card の回答履歴・記憶状態・復習予定と学習位置を変えない。
- 離して再び押すと現在の Card を割当どおりに1回評価し、さらに次へ進む。

<a id="study-controls-15"></a>

### STUDY-CONTROLS-15 修飾付きショートカットを無視して通常入力を受け付ける

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 閲覧モードが OFF で未評価 Card の表面を学習中であり、自動再生は停止している。

When:

- Ctrl、Meta、Alt の各修飾キーを伴う方向キー・Enter・Space・b を入力する。Shift を併用する場合も確認する。
- 修飾キーを外して通常の Enter と方向キーを入力する。

Then:

- アプリに届いた修飾付き入力では、表裏・再生・方向ボタン表示・回答履歴・記憶状態・復習予定・学習位置が変わらない。
- 修飾キーを外した Enter は表裏を切り替え、表面での方向キーは現在の割当どおり1回評価して次に進む。
- 無視した入力の既定動作と伝播を妨げず、入力欄・contenteditable・ボタン・スライダー・読取領域を操作できる。Shift 単独のキー割り当ては変わらない。

<a id="study-controls-16"></a>

### STUDY-CONTROLS-16 修飾付き Enter で閲覧モードを終了しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Card の表面を表示し、閲覧モードを ON にしている。

When:

- Ctrl、Meta、Alt の各修飾キーを伴う Enter を入力する。Shift を併用する場合も確認する。
- 再読み込みした後、修飾キーを外した Enter を押して保持し、離して再び押す。

Then:

- 修飾付き Enter では表面と閲覧モードを維持し、再読み込み後も ON のままとなる。
- 修飾なしの最初の Enter で閲覧モードだけを終了し、保持中は表面を維持する。再押下で裏面へ切り替わる。
- 回答履歴・記憶状態・学習位置は変わらない。

<a id="study-controls-19"></a>

### STUDY-CONTROLS-19 閲覧モードボタンの表示設定を共有・維持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い本文の Card の表面を学習中で、閲覧モードは ON である。
- 閲覧モードボタンは既定で表示されている。

When:

- 「…」から閲覧モードボタンを非表示にし、再読み込みして閲覧画面へ移動する。閲覧画面の「…」から再表示して学習画面へ戻る。

Then:

- 「…」の同じアイコンで表示・非表示を切り替えられる。
- ボタンの表示設定は再読み込み後も維持され、学習・閲覧画面で共有される。
- 表示切替・再読み込み・画面移動では、閲覧モードと学習位置は変わらない。

<a id="study-controls-20"></a>

### STUDY-CONTROLS-20 [TODO] Card・表裏・モードの変更で本文のスクロール位置が先頭へ戻る

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い本文の Card を学習中で、本文を先頭以外までスクロールしている。

When:

- Card、表裏、モードのいずれかを変更する。

Then:

- 変更後の本文のスクロール位置は先頭へ戻る。

<a id="study-controls-21"></a>

### STUDY-CONTROLS-21 閲覧モード中も自動再生で次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card があり、閲覧モードが ON、自動再生の間隔が正の値である。

When:

- 再生ボタンから自動再生を開始して次の Card へ進む。

Then:

- 自動再生で次の Card に進む。
- 移動後も閲覧モードは ON で、スクロール位置は先頭になる。

<a id="study-controls-23"></a>

### STUDY-CONTROLS-23 b の長押しで方向ボタンを連続切替しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 閲覧モードが OFF で Card の表面が表示され、自動再生は停止中である。
- 方向ボタンは表示されている。

When:

- b を押して保持し、離して再び押す。

Then:

- 最初の b で方向ボタンを隠し、保持中は非表示を維持し、再押下で表示する。
- Card の表示・回答履歴・記憶状態・学習位置は変わらない。
