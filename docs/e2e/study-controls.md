# Study Controls E2E テスト仕様書

## 目的

学習画面の pointer 操作と Help dialog が、設定された action を正しく案内・実行し、意図しない Card 状態変更を起こさないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-CONTROLS-01 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](#study-controls-01) |
| STUDY-CONTROLS-02 | read | [non-primary mouse の drag を無視できる](#study-controls-02) |
| STUDY-CONTROLS-03 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](#study-controls-03) |
| STUDY-CONTROLS-04 | read | [Help dialog に現在の操作 mapping を表示できる](#study-controls-04) |
| STUDY-CONTROLS-05 | write | [Help button の表示設定を reload 後も維持できる](#study-controls-05) |
| STUDY-CONTROLS-06 | write | [view mode で長い表面を操作の誤発火なくスクロールできる](#study-controls-06) |
| STUDY-CONTROLS-07 | write | [view mode をタップまたは Enter で終了して表面を維持できる](#study-controls-07) |
| STUDY-CONTROLS-08 | batch | [view mode 中も評価ボタンと自動再生で次の Card へ進める](#study-controls-08) |
| STUDY-CONTROLS-09 | write | [view mode 設定を閲覧・学習・reload 間で共有できる](#study-controls-09) |
| STUDY-CONTROLS-10 | write | [横向きの短い画面でも本文と操作ボタンに到達できる](#study-controls-10) |
| STUDY-CONTROLS-11 | write | [view mode でタッチスクロールとピンチ拡大ができる](#study-controls-11) |

<a id="study-controls-01"></a>

### STUDY-CONTROLS-01 remote Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-drag`](./fixture/study-session-start-drag.yaml)
- 認証済みユーザーが所有する remote Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の easy 学習結果が保存される。
- 次の Card の front text が表示され、back text は表示されない。
- drag 後の click によって次の Card が裏面へ切り替わらない。
- browser error が発生しない。

<a id="study-controls-02"></a>

### STUDY-CONTROLS-02 non-primary mouse の drag を無視できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。

When:

- non-primary mouse button で現在の Card を swipe action に対応する方向へ drag する。

Then:

- 現在の Card の front text が引き続き表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-controls-03"></a>

### STUDY-CONTROLS-03 local-only Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- browser storage に、複数の Card を含む local-only Deck と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の easy 学習結果が browser storage に保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示され、back text は表示されない。
- browser error が発生しない。

<a id="study-controls-04"></a>

### STUDY-CONTROLS-04 Help dialog に現在の操作 mapping を表示できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 方向操作には既定値と異なる action が設定され、操作ボタンの一部は非表示に設定されている。
- document locale は English に設定されている。
- 永続する共通 toast が表示されている。

When:

- 学習画面から Help dialog を開く。
- dialog 内で方向キーと操作ボタン表示切り替えキーを入力し、focus を移動する。
- Escape で Help dialog を閉じる。

Then:

- Help dialog に現在設定されている方向操作の意味が semantic label で表示される。
- Card の表示、autoplay、操作ボタン表示、Card details、Deck 一覧へ戻る操作が表示される。
- 非表示の操作ボタンは現在の設定と一致する説明で表示される。
- 設定された4段階評価の意味が表示され、前のCardへ戻る学習操作は存在しない。
- Help dialog 表示中の toast は操作 control と pointer hit target を持たない。
- dialog 表示中に toast が消えるか置き換わっても、focus は Close help に維持される。
- Help dialog を閉じると、永続する toast の通常の操作 control が復元される。
- dialog 内のキー入力で Card、学習結果、session の位置が変更されない。
- focus が dialog 内に維持され、閉じた後は Help trigger へ戻る。
- browser error が発生しない。

<a id="study-controls-05"></a>

### STUDY-CONTROLS-05 Help button の表示設定を reload 後も維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- Help button の表示設定は既定値の ON である。

When:

- 学習画面の Study actions から Help button の表示を OFF にする。
- 学習画面を reload する。

Then:

- Help button は既定で省略ボタンの左側に表示される。
- 表示を OFF にすると Help button は非表示になる。
- reload 後も Help button の表示設定は OFF のまま維持される。
- browser error が発生しない。

<a id="study-controls-06"></a>

### STUDY-CONTROLS-06 view mode で長い表面を操作の誤発火なくスクロールできる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い front text の Card を学習中である。

When:

- ツールバーの閲覧モードボタンから view mode を ON にして、wheel・touch・方向キー・Space・PageUp／PageDown で本文を読む。マウスを全方向へドラッグし、文字選択も行う。

Then:

- 文字サイズと数式表示を保ち、先頭から末尾までスクロールできる。操作ボタン・ツールバーは本文を覆わない。
- スワイプと方向キーで評価・移動が発生せず、スクロールや選択後も view mode と表面が維持される。
- Space は自動再生やモード終了を起こさない。Help は閲覧中の操作を説明する。
- browser error が発生しない。

<a id="study-controls-07"></a>

### STUDY-CONTROLS-07 view mode をタップまたは Enter で終了して表面を維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Card の表面を表示し、view mode を ON にしている。

When:

- 本文をタップして view mode を終了する。再び ON にして Enter でも終了し、その後もう一度 Enter を入力する。

Then:

- タップと最初の Enter は同じ Card の表面を維持して view mode だけを OFF にする。次の Enter で裏面へ切り替わる。
- Enter を押し続けても終了後に裏返らない。
- スクロール位置はカード・表裏・モードの変更時に先頭へ戻る。
- browser error が発生しない。

<a id="study-controls-08"></a>

### STUDY-CONTROLS-08 view mode 中も評価ボタンと自動再生で次の Card へ進める

カテゴリ: `batch`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card があり、view mode が ON、自動再生の間隔が正の値である。

When:

- 評価ボタンで次の Card へ進み、再生ボタンから自動再生を開始して次の Card へ進む。

Then:

- 評価ボタンの結果が保存され、次の Card に進む。自動再生でも次の Card に進む。
- どちらの移動後も view mode は ON で、スクロール位置は先頭になる。
- browser error が発生しない。

<a id="study-controls-09"></a>

### STUDY-CONTROLS-09 view mode 設定を閲覧・学習・reload 間で共有できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- view mode は既定値の OFF である。保存済み設定に項目がない場合も OFF とする。

When:

- 学習画面で ON にして reload し、Deck 閲覧画面へ移動する。本文をタップして OFF にし、学習画面へ戻って reload する。

Then:

- ON と OFF が両画面と reload 後に反映される。他の設定は維持される。
- browser error が発生しない。

<a id="study-controls-10"></a>

### STUDY-CONTROLS-10 横向きの短い画面でも本文と操作ボタンに到達できる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 568×320 の画面で長い front text を学習中である。view mode とカード情報・評価・再生・Skip の表示を ON にしている。

When:

- 「…」を展開し、本文と各操作部をスクロールする。

Then:

- 本文の表示領域は画面の高さの半分以上を保ち、末尾まで読める。評価・再生・Skip ボタンも画面内にスクロールして表示できる。
- 評価・カード移動・モード終了は発生しない。browser error が発生しない。

<a id="study-controls-11"></a>

### STUDY-CONTROLS-11 view mode でタッチスクロールとピンチ拡大ができる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- タッチ端末で長い front text を学習中で、view mode が ON である。

When:

- 本文を縦にスクロールし、2本指でピンチ拡大する。

Then:

- 本文のスクロール位置が変わり、ピンチ操作で表示倍率が上がる。
- 評価・カード移動・モード終了は発生しない。browser error が発生しない。
