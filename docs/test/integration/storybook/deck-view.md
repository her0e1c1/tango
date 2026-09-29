# Deck 閲覧画面 Storybook 結合テスト仕様書

## 目的

Deck 閲覧画面を入口とした `play` で、閲覧条件に一致する Card の連続閲覧と、読書・表裏切替・移動・表示設定を確認する。学習の評価操作とは区別する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-PLAYER-01 | interaction | 正常系 | [読書中のスクロールを Card 移動にしない](#storybook-card-player-01) |
| STORYBOOK-CARD-PLAYER-02 | interaction | 正常系 | [文字選択中に閲覧を終了しない](#storybook-card-player-02) |
| STORYBOOK-CARD-PLAYER-03 | interaction | 正常系 | [Space とタップを区別する](#storybook-card-player-03) |
| STORYBOOK-CARD-PLAYER-04 | interaction | 正常系 | [閲覧設定で許可済みの裏面操作を失わない](#storybook-card-player-04) |
| STORYBOOK-CARD-PLAYER-05 | interaction | 正常系 | [編集操作の表示を切り替える](#storybook-card-player-05) |
| STORYBOOK-CARD-PLAYER-06 | render | 正常系 | [裏面に編集操作を表示しない](#storybook-card-player-06) |
| STORYBOOK-CARD-PLAYER-07 | render | 正常系 | [裏面では解答に集中できる表示にする](#storybook-card-player-07) |
| STORYBOOK-CARD-PLAYER-08 | interaction | 正常系 | [端の Card 移動と解答クリックを分離する](#storybook-card-player-08) |
| STORYBOOK-CARD-PLAYER-09 | interaction | 正常系 | [端のホイール入力でも文章をスクロールする](#storybook-card-player-09) |
| STORYBOOK-CARD-PLAYER-10 | interaction | 正常系 | [操作一覧から閲覧操作を選ぶ](#storybook-card-player-10) |
| STORYBOOK-CARD-PLAYER-11 | interaction | 正常系 | [ヘルプの再表示操作を失わない](#storybook-card-player-11) |
| STORYBOOK-CARD-PLAYER-12 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](#storybook-card-player-12) |
| STORYBOOK-CARD-PLAYER-13 | interaction | 正常系 | [閲覧モードと切替ボタンの表示を分ける](#storybook-card-player-13) |
| STORYBOOK-CARD-PLAYER-14 | interaction | 正常系 | [表示設定をショートカットで切り替える](#storybook-card-player-14) |
| STORYBOOK-CARD-PLAYER-15 | interaction | 正常系 | [Card の詳細表示をまとめて切り替える](#storybook-card-player-15) |
| STORYBOOK-CARD-PLAYER-16 | interaction | 正常系 | [再生操作が使えない理由を確認する](#storybook-card-player-16) |
| STORYBOOK-CARD-PLAYER-17 | render | 正常系 | [選んだ下部操作だけを表示する](#storybook-card-player-17) |
| STORYBOOK-CARD-PLAYER-18 | interaction | 正常系 | [許可されていない裏面の方向操作を無視する](#storybook-card-player-18) |
| STORYBOOK-CARD-PLAYER-19 | interaction | 正常系 | [方向ボタンを隠しても表面のスワイプを使う](#storybook-card-player-19) |
| STORYBOOK-CARD-PLAYER-20 | interaction | 正常系 | [ドラッグ後にクリックを重複して扱わない](#storybook-card-player-20) |
| STORYBOOK-CARD-PLAYER-21 | interaction | 正常系 | [中・右ボタンのドラッグで Card を移動しない](#storybook-card-player-21) |
| STORYBOOK-CARD-PLAYER-22 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](#storybook-card-player-22) |
| STORYBOOK-CARD-PLAYER-23 | render | 正常系 | [未評価と FSRS 難易度を区別する](#storybook-card-player-23) |
| STORYBOOK-DECK-VIEW-01 | interaction | 正常系 | [閲覧条件に一致する Card を順番に読む](#storybook-deck-view-01) |
| STORYBOOK-DECK-VIEW-02 | render | 正常系 | [Card がない場合に戻る操作を表示する](#storybook-deck-view-02) |
| STORYBOOK-DECK-VIEW-03 | render | 正常系 | [閲覧条件による0件を未作成と区別する](#storybook-deck-view-03) |

<a id="storybook-card-player-01"></a>

### STORYBOOK-CARD-PLAYER-01 [TODO] 読書中のスクロールを Card 移動にしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示し、閲覧モードを有効にしている。

When:

- 解答をスクロールし、文章を読むためにドラッグする。

Then:

- 文章をスクロールでき、表示中の Card と表示位置は変わらない。

<a id="storybook-card-player-02"></a>

### STORYBOOK-CARD-PLAYER-02 [TODO] 文字選択中に閲覧を終了しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で解答の文章を表示している。

When:

- 文章の一部をドラッグして選択する。

Then:

- 文章を選択でき、一覧へ戻ったり別の Card に移ったりしない。

<a id="storybook-card-player-03"></a>

### STORYBOOK-CARD-PLAYER-03 [TODO] Space とタップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- Space と本文のタップを独立した操作例として実行する。

Then:

- それぞれ画面の操作説明に対応した切替が行われ、一回の操作で二重に表裏が切り替わらない。

<a id="storybook-card-player-04"></a>

### STORYBOOK-CARD-PLAYER-04 [TODO] 閲覧設定で許可済みの裏面操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、左右の Card 移動が利用できる。

When:

- 閲覧設定を変えて、裏面で左右に移動する。

Then:

- 同じ閲覧順の前後の Card へ移動でき、設定変更だけで許可済み操作が無効にならない。

<a id="storybook-card-player-05"></a>

### STORYBOOK-CARD-PLAYER-05 [TODO] 編集操作の表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 編集操作の表示設定を切り替える。

Then:

- 編集の操作が表示・非表示になり、Card の本文は変わらない。

<a id="storybook-card-player-06"></a>

### STORYBOOK-CARD-PLAYER-06 [TODO] 裏面に編集操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で編集操作の表示を有効にしている。

When:

- 裏面を表示する。

Then:

- 裏面には編集操作が表示されず、解答を読める。

<a id="storybook-card-player-07"></a>

### STORYBOOK-CARD-PLAYER-07 [TODO] 裏面では解答に集中できる表示にする

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で本文と詳細情報を持つ Card がある。

When:

- 裏面を表示する。

Then:

- 解答が表示され、表面用の編集や詳細が解答の読書を妨げない。

<a id="storybook-card-player-08"></a>

### STORYBOOK-CARD-PLAYER-08 [TODO] 端の Card 移動と解答クリックを分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、前後に別の Card がある。

When:

- 端の移動操作と解答本文のクリックを独立した操作例として選ぶ。

Then:

- 端の操作では前後の Card に移り、本文クリックでは同じ Card の表裏を切り替える。

<a id="storybook-card-player-09"></a>

### STORYBOOK-CARD-PLAYER-09 [TODO] 端のホイール入力でも文章をスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示している。

When:

- 解答領域の端でホイールを動かす。

Then:

- 文章がスクロールされ、Card の移動や表裏切替は発生しない。

<a id="storybook-card-player-10"></a>

### STORYBOOK-CARD-PLAYER-10 [TODO] 操作一覧から閲覧操作を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面の操作一覧を開いている。

When:

- 一覧に表示された閲覧操作を、独立した操作例として選ぶ。

Then:

- ヘルプ、詳細、操作ボタンなど、選んだ項目の表示状態が変わり、別の項目は意図せず切り替わらない。

<a id="storybook-card-player-11"></a>

### STORYBOOK-CARD-PLAYER-11 [TODO] ヘルプの再表示操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面でヘルプの表示設定を変更できる。

When:

- ヘルプを非表示にする。

Then:

- 操作一覧からヘルプを再び表示できる。

<a id="storybook-card-player-12"></a>

### STORYBOOK-CARD-PLAYER-12 [TODO] 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードの切替ボタンを表示している。

When:

- 閲覧モードを切り替える。

Then:

- ボタンの押下状態と実際の閲覧モードが一致する。

<a id="storybook-card-player-13"></a>

### STORYBOOK-CARD-PLAYER-13 [TODO] 閲覧モードと切替ボタンの表示を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードを有効にしている。

When:

- 閲覧モードの切替ボタンを非表示にする。

Then:

- ボタンは消えるが閲覧モードは変わらず、文章をスクロールできる。

<a id="storybook-card-player-14"></a>

### STORYBOOK-CARD-PLAYER-14 [TODO] 表示設定をショートカットで切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面を表示し、入力欄やモーダルにフォーカスしていない。

When:

- 操作説明にある表示切替のショートカットを選ぶ。

Then:

- 対応する表示設定だけが切り替わり、Card の内容や位置は変わらない。

<a id="storybook-card-player-15"></a>

### STORYBOOK-CARD-PLAYER-15 [TODO] Card の詳細表示をまとめて切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で Card の詳細情報を表示している。

When:

- 詳細表示を切り替える。

Then:

- 対象 Card の詳細がまとまって表示・非表示になり、本文は残る。

<a id="storybook-card-player-16"></a>

### STORYBOOK-CARD-PLAYER-16 [TODO] 再生操作が使えない理由を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で再生操作が利用できない表示状態である。

When:

- 再生設定の説明を確認する。

Then:

- 利用できない理由を確認でき、利用不可のまま再生が始まらない。

<a id="storybook-card-player-17"></a>

### STORYBOOK-CARD-PLAYER-17 [TODO] 選んだ下部操作だけを表示する

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で方向操作のみ、再生操作のみ、両方なしの設定を独立した表示例として用意する。

When:

- 下部の操作領域を確認する。

Then:

- 各設定で選んだ操作だけが表示され、非表示の操作はフォーカス対象にならない。

<a id="storybook-card-player-18"></a>

### STORYBOOK-CARD-PLAYER-18 [TODO] 許可されていない裏面の方向操作を無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。上下の評価操作はこの画面では利用できない。

When:

- 裏面を上下にスワイプする。

Then:

- Card の評価は表示されず、前後の Card へも移動しない。

<a id="storybook-card-player-19"></a>

### STORYBOOK-CARD-PLAYER-19 [TODO] 方向ボタンを隠しても表面のスワイプを使う

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、方向ボタンを非表示にしている。

When:

- 表面で有効な左右スワイプを行う。

Then:

- 前後の Card に移動し、ボタンの非表示によってジェスチャーが無効にならない。

<a id="storybook-card-player-20"></a>

### STORYBOOK-CARD-PLAYER-20 [TODO] ドラッグ後にクリックを重複して扱わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、次の Card がある。

When:

- 左ボタンで有効な移動ドラッグをして離す。

Then:

- Card の移動は一回だけ行われ、離した操作で移動先の表裏が切り替わらない。

<a id="storybook-card-player-21"></a>

### STORYBOOK-CARD-PLAYER-21 [TODO] 中・右ボタンのドラッグで Card を移動しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 中ボタンと右ボタンのドラッグを独立した操作例として実行する。

Then:

- 表示中の Card と表裏が変わらない。

<a id="storybook-card-player-22"></a>

### STORYBOOK-CARD-PLAYER-22 [TODO] 裏面のドラッグ後に誤操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。

When:

- 裏面でドラッグしてポインターを離す。

Then:

- その状態で許可された操作だけが行われ、追加のクリックによる表裏切替が発生しない。

<a id="storybook-card-player-23"></a>

### STORYBOOK-CARD-PLAYER-23 [TODO] 未評価と FSRS 難易度を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 未評価の Card と、FSRS 難易度を持つ Card がある。

When:

- Deck 閲覧画面でそれぞれの詳細を開く。

Then:

- 未評価を難易度0などの評価済み値として表示せず、評価済みの Card は難易度を確認できる。

<a id="storybook-deck-view-01"></a>

### STORYBOOK-DECK-VIEW-01 [TODO] 閲覧条件に一致する Card を順番に読む

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に閲覧条件に一致する Card が2枚あり、他の Deck にも Card がある。

When:

- 対象 Deck の閲覧画面を開き、表裏を切り替えて次へ進む。

Then:

- 対象の2枚だけを順番に閲覧でき、学習の復習期限では除外されない。

<a id="storybook-deck-view-02"></a>

### STORYBOOK-DECK-VIEW-02 [TODO] Card がない場合に戻る操作を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card が一枚もない。

When:

- Deck 閲覧画面を開く。

Then:

- Card がない案内と戻る操作が表示され、存在しない Card の本文は表示されない。

<a id="storybook-deck-view-03"></a>

### STORYBOOK-DECK-VIEW-03 [TODO] 閲覧条件による0件を未作成と区別する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card はあるが、閲覧条件に一致するものはない。

When:

- Deck 閲覧画面を開く。

Then:

- 閲覧対象がないことを表示し、Card 未作成の状態と区別できる。
