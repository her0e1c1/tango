# Study Controls E2E テスト仕様書

## 目的

学習画面の pointer 操作と Help dialog が、設定された操作を正しく案内・実行し、意図しない Card 状態変更を起こさないことを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-CONTROLS-01 | write | 正常系 | [ログイン中の Deck で primary mouse の上方向 drag により次の Card へ進める](#study-controls-01) |
| STUDY-CONTROLS-02 | read | 正常系 | [non-primary mouse の drag を無視できる](#study-controls-02) |
| STUDY-CONTROLS-03 | write | 正常系 | [匿名利用中の Deck で primary mouse の上方向 drag により次の Card へ進める](#study-controls-03) |
| STUDY-CONTROLS-04 | read | 正常系 | [Help dialog に現在の操作の割り当てを表示できる](#study-controls-04) |
| STUDY-CONTROLS-05 | write | 正常系 | [Help button の表示設定を reload 後も維持できる](#study-controls-05) |
| STUDY-CONTROLS-06 | write | 正常系 | [view mode で長い表面を操作の誤発火なくスクロールできる](#study-controls-06) |
| STUDY-CONTROLS-07 | write | 正常系 | [view mode をタップまたは Enter で終了して表面を維持できる](#study-controls-07) |
| STUDY-CONTROLS-08 | batch | 正常系 | [view mode 中も評価ボタンと自動再生で次の Card へ進める](#study-controls-08) |
| STUDY-CONTROLS-09 | write | 正常系 | [view mode 設定を閲覧・学習・reload 間で共有できる](#study-controls-09) |
| STUDY-CONTROLS-10 | write | 正常系 | [横向きの短い画面でも本文と操作ボタンに到達できる](#study-controls-10) |
| STUDY-CONTROLS-11 | write | 正常系 | [view mode でタッチスクロールとピンチ拡大ができる](#study-controls-11) |
| STUDY-CONTROLS-12 | write | 正常系 | [方向ボタンの読み上げ名で現在の操作を確認できる](#study-controls-12) |
| STUDY-CONTROLS-13 | write | 正常系 | [方向キーを長押ししても追加評価せず再押下で進める](#study-controls-13) |
| STUDY-CONTROLS-14 | write | 正常系 | [Space と b の長押しで連続切替せず再押下で切り替える](#study-controls-14) |
| STUDY-CONTROLS-15 | write | 正常系 | [修飾付きショートカットを無視して通常入力を受け付ける](#study-controls-15) |
| STUDY-CONTROLS-16 | write | 正常系 | [修飾付き Enter で view mode を終了しない](#study-controls-16) |

<a id="study-controls-01"></a>

### STUDY-CONTROLS-01 ログイン中の Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-drag`](./fixture/study-session-start-drag.yaml)
- ログイン中のアカウントの Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の easy 学習結果が保存される。
- 次の Card の front text が表示され、back text は表示されない。
- drag 後の click によって次の Card が裏面へ切り替わらない。

<a id="study-controls-02"></a>

### STUDY-CONTROLS-02 non-primary mouse の drag を無視できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。

When:

- non-primary mouse button で現在の Card を swipe に対応する方向へ drag する。

Then:

- 現在の Card の front text が引き続き表示される。
- Card の学習結果と session の位置が変更されない。

<a id="study-controls-03"></a>

### STUDY-CONTROLS-03 匿名利用中の Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、複数の Card と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の easy 学習結果が、このブラウザーで維持される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示され、back text は表示されない。

<a id="study-controls-04"></a>

### STUDY-CONTROLS-04 Help dialog に現在の操作の割り当てを表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 方向操作には既定値と異なる操作が設定され、操作ボタンの一部は非表示に設定されている。
- 英語の画面を表示している。
- 自動では消えない通知が表示されている。

When:

- 学習画面から Help dialog を開く。
- dialog 内で方向キーと操作ボタン表示切り替えキーを入力し、focus を移動する。
- Escape で Help dialog を閉じる。

Then:

- Help dialog に現在設定されている方向操作の意味が分かるラベルで表示される。
- Card の表示、自動再生、操作ボタン表示、Card details、Deck 一覧へ戻る操作が表示される。
- 非表示の操作ボタンは現在の設定と一致する説明で表示される。
- 設定された4段階評価の意味が表示され、前の Card へ戻る学習操作は存在しない。
- Help dialog 表示中は、通知が重なっていても dialog の操作を妨げず、通知へ誤って操作や focus が移らない。
- dialog 表示中に通知が消えるか置き換わっても、focus は Close help に維持される。
- Help dialog を閉じると、残っている通知の操作を再び利用できる。
- dialog 内のキー入力で Card、学習結果、session の位置が変更されない。
- focus が dialog 内に維持され、閉じた後は Help button へ戻る。

<a id="study-controls-05"></a>

### STUDY-CONTROLS-05 Help button の表示設定を reload 後も維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- Help button の表示設定は既定値の ON である。

When:

- 学習画面の Study actions から Help button の表示を OFF にする。
- 学習画面を reload する。

Then:

- ON のときは Help button と省略ボタンが重ならずに表示される。
- 表示を OFF にすると Help button は非表示になる。
- reload 後も Help button の表示設定は OFF のまま維持される。

<a id="study-controls-06"></a>

### STUDY-CONTROLS-06 view mode で長い表面を操作の誤発火なくスクロールできる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い front text の Card を学習中である。

When:

- ツールバーの閲覧モードボタンから view mode を ON にして、wheel・touch・方向キー・Space・PageUp／PageDown で本文を読む。マウスを全方向へドラッグし、文字選択も行う。
- 「…」から閲覧モードボタンを非表示にし、reload して閲覧画面へ移動する。閲覧画面の「…」から再表示して学習画面へ戻る。

Then:

- 文字サイズと数式表示を保ち、先頭から末尾までスクロールできる。操作ボタン・ツールバーは本文を覆わない。
- スワイプと方向キーで評価・移動が発生せず、スクロールや選択後も view mode と表面が維持される。Card の学習結果と session の現在位置も変わらない。表示切替・reload・画面移動・Help 表示を終えた時点でも session の現在位置を維持する。
- Space は自動再生やモード終了を起こさない。Help は閲覧中の操作を説明する。
- 閲覧モードボタンは既定で表示される。「…」を開くと同じアイコンで表示・非表示を切り替えられ、モード自体は変化しない。非表示でも「…」から再表示でき、設定は reload 後も維持され、学習・閲覧画面で共有される。

<a id="study-controls-07"></a>

### STUDY-CONTROLS-07 view mode をタップまたは Enter で終了して表面を維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Card の表面を表示し、view mode を ON にしている。

When:

- 本文をタップして view mode を終了する。再び ON にして Enter でも終了し、その後もう一度 Enter を入力する。

Then:

- タップと最初の Enter は同じ Card の表面を維持して view mode だけを OFF にする。次の Enter で裏面へ切り替わる。
- Enter を押し続けても終了後に裏返らない。
- スクロール位置は Card・表裏・モードの変更時に先頭へ戻る。

<a id="study-controls-08"></a>

### STUDY-CONTROLS-08 view mode 中も評価ボタンと自動再生で次の Card へ進める

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card があり、view mode が ON、自動再生の間隔が正の値である。

When:

- 評価ボタンで次の Card へ進み、再生ボタンから自動再生を開始して次の Card へ進む。

Then:

- 評価ボタンの結果が保存され、次の Card に進む。自動再生でも次の Card に進む。
- どちらの移動後も view mode は ON で、スクロール位置は先頭になる。

<a id="study-controls-09"></a>

### STUDY-CONTROLS-09 view mode 設定を閲覧・学習・reload 間で共有できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- view mode は既定値の OFF である。以前に設定したことがない場合も OFF である。

When:

- 学習画面で ON にして reload し、Deck 閲覧画面へ移動する。本文をタップして OFF にし、学習画面へ戻って reload する。

Then:

- ON と OFF が両画面と reload 後に反映される。他の設定は維持される。

<a id="study-controls-10"></a>

### STUDY-CONTROLS-10 横向きの短い画面でも本文と操作ボタンに到達できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 568×320 の画面で長い front text を学習中である。view mode と Card 情報・評価・再生・Skip の表示を ON にしている。

When:

- 「…」を展開し、本文と各操作部をスクロールする。

Then:

- 本文の表示領域は画面の高さの半分以上を保ち、末尾まで読める。評価・再生・Skip ボタンも画面内にスクロールして表示できる。
- 評価・Card 移動・モード終了は発生しない。

<a id="study-controls-11"></a>

### STUDY-CONTROLS-11 view mode でタッチスクロールとピンチ拡大ができる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- タッチ端末で長い front text を学習中で、view mode が ON である。

When:

- 本文を縦にスクロールし、2本指でピンチ拡大する。

Then:

- 本文のスクロール位置が変わり、ピンチ操作で表示倍率が上がる。
- 評価・Card 移動・モード終了は発生しない。

<a id="study-controls-12"></a>

### STUDY-CONTROLS-12 方向ボタンの読み上げ名で現在の操作を確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 学習中の Card の表面と4方向の操作ボタンが表示されている。
- 英語または日本語で、既定の評価割り当て、または上が学習終了・下が操作なし・左がスキップ・右が Hard の有効な別割り当てを使用している。

When:

- 方向ボタンへフォーカスを移して名前と表示を確認し、Help で現在の操作の説明を確認する。

Then:

- 各ボタンの読み上げ名は方向と現在の操作を含む。既定の上方向は英語で「Swipe up: Easy」、日本語で「上へスワイプ: Easy」となる。
- 操作名は表示中の caption と一致し、Help の意味とも一致する。別割り当てでは評価・スキップ・学習終了・何もしないを区別し、独立した Exit は session を保持する操作として区別する。
- 言語や有効な割り当てが変わると名前と caption が追従し、名前の更新だけではボタンのフォーカス、Card、学習結果、session、他の設定を変更しない。
- 矢印・caption・ボタンの表示順は維持される。操作なしのボタンは表示されたまま無効であり、Tab 移動の対象にならない。

<a id="study-controls-13"></a>

### STUDY-CONTROLS-13 方向キーを長押ししても追加評価せず再押下で進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- view mode が OFF で複数の未評価 Card を学習中であり、方向キーには4段階評価が割り当てられている。

When:

- 方向キーを押し、最初の評価の保存が完了して次の Card が操作可能になってからも押し続ける。
- キーを離して再び押す。

Then:

- 最初の押下では割当どおりの評価を1件保存し、次の Card に進む。
- 長押し中は次の Card の回答履歴・記憶状態・復習予定と学習位置を変えない。
- 離して再び押すと現在の Card を割当どおりに1回評価し、さらに次へ進む。

<a id="study-controls-14"></a>

### STUDY-CONTROLS-14 Space と b の長押しで連続切替せず再押下で切り替える

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- view mode が OFF で Card の表面が表示され、自動再生は停止中である。
- 再生間隔は操作を終えるまで次の Card に進まない長さであり、方向ボタンは表示されている。

When:

- Space を押して保持し、離して再び押す。
- b を押して保持し、離して再び押す。

Then:

- 最初の Space で再生を開始し、保持中は再生を維持し、再押下で停止する。
- 最初の b で方向ボタンを隠し、保持中は非表示を維持し、再押下で表示する。
- Card の表示・回答履歴・記憶状態・学習位置は変わらない。

<a id="study-controls-15"></a>

### STUDY-CONTROLS-15 修飾付きショートカットを無視して通常入力を受け付ける

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- view mode が OFF で未評価 Card の表面を学習中であり、自動再生は停止している。

When:

- Ctrl、Meta、Alt の各修飾キーを伴う方向キー・Enter・Space・b を入力する。Shift を併用する場合も確認する。
- 修飾キーを外して通常の Enter と方向キーを入力する。

Then:

- アプリに届いた修飾付き入力では、表裏・再生・方向ボタン表示・回答履歴・記憶状態・復習予定・学習位置が変わらない。
- 修飾キーを外した Enter は表裏を切り替え、表面での方向キーは現在の割当どおり1回評価して次に進む。
- 無視した入力の既定動作と伝播を妨げず、入力欄・contenteditable・ボタン・slider・読取領域の操作を維持する。Shift 単独の既存のキー一致条件を変更しない。

<a id="study-controls-16"></a>

### STUDY-CONTROLS-16 修飾付き Enter で view mode を終了しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Card の表面を表示し、view mode を ON にしている。

When:

- Ctrl、Meta、Alt の各修飾キーを伴う Enter を入力する。Shift を併用する場合も確認する。
- reload した後、修飾キーを外した Enter を押して保持し、離して再び押す。

Then:

- 修飾付き Enter では表面と view mode を維持し、reload 後も ON のままとなる。
- 修飾なしの最初の Enter で view mode だけを終了し、保持中は表面を維持する。再押下で裏面へ切り替わる。
- 回答履歴・記憶状態・学習位置は変わらない。
