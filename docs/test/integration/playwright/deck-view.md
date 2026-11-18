# Deck 閲覧画面 Playwright 結合テスト仕様書

## 目的

Deck 閲覧画面を入口とした Playwright テストで、閲覧条件に一致する Card の連続閲覧と、読書・表裏切替・移動・表示設定を確認する。学習の評価操作とは区別する。Card player 部品の配置、読書用入力、公開された操作要求も独立した契約として確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-CARD-PLAYER-01 | interaction | 正常系 | [読書中のスクロールを Card 移動にしない](#playwright-card-player-01) |
| PLAYWRIGHT-CARD-PLAYER-02 | interaction | 正常系 | [文字選択中に閲覧を終了しない](#playwright-card-player-02) |
| PLAYWRIGHT-CARD-PLAYER-03 | interaction | 正常系 | [Space とタップを区別する](#playwright-card-player-03) |
| PLAYWRIGHT-CARD-PLAYER-04 | interaction | 正常系 | [閲覧設定で許可済みの裏面操作を失わない](#playwright-card-player-04) |
| PLAYWRIGHT-CARD-PLAYER-05 | interaction | 正常系 | [編集操作の表示を切り替える](#playwright-card-player-05) |
| PLAYWRIGHT-CARD-PLAYER-06 | render | 正常系 | [裏面に編集操作を表示しない](#playwright-card-player-06) |
| PLAYWRIGHT-CARD-PLAYER-07 | render | 正常系 | [裏面では解答に集中できる表示にする](#playwright-card-player-07) |
| PLAYWRIGHT-CARD-PLAYER-08 | interaction | 正常系 | [端の Card 移動と解答クリックを分離する](#playwright-card-player-08) |
| PLAYWRIGHT-CARD-PLAYER-09 | interaction | 正常系 | [端のホイール入力でも文章をスクロールする](#playwright-card-player-09) |
| PLAYWRIGHT-CARD-PLAYER-10 | interaction | 正常系 | [操作一覧から閲覧操作を選ぶ](#playwright-card-player-10) |
| PLAYWRIGHT-CARD-PLAYER-11 | interaction | 正常系 | [ヘルプの再表示操作を失わない](#playwright-card-player-11) |
| PLAYWRIGHT-CARD-PLAYER-12 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](#playwright-card-player-12) |
| PLAYWRIGHT-CARD-PLAYER-13 | interaction | 正常系 | [閲覧モードと切替ボタンの表示を分ける](#playwright-card-player-13) |
| PLAYWRIGHT-CARD-PLAYER-14 | interaction | 正常系 | [表示設定をショートカットで切り替える](#playwright-card-player-14) |
| PLAYWRIGHT-CARD-PLAYER-15 | interaction | 正常系 | [Card の詳細表示をまとめて切り替える](#playwright-card-player-15) |
| PLAYWRIGHT-CARD-PLAYER-16 | interaction | 正常系 | [再生操作が使えない理由を確認する](#playwright-card-player-16) |
| PLAYWRIGHT-CARD-PLAYER-17 | render | 正常系 | [選んだ下部操作だけを表示する](#playwright-card-player-17) |
| PLAYWRIGHT-CARD-PLAYER-18 | interaction | 正常系 | [許可されていない裏面の方向操作を無視する](#playwright-card-player-18) |
| PLAYWRIGHT-CARD-PLAYER-19 | interaction | 正常系 | [方向ボタンを隠しても表面のスワイプを使う](#playwright-card-player-19) |
| PLAYWRIGHT-CARD-PLAYER-20 | interaction | 正常系 | [ドラッグ後にクリックを重複して扱わない](#playwright-card-player-20) |
| PLAYWRIGHT-CARD-PLAYER-21 | interaction | 正常系 | [中・右ボタンのドラッグで Card を移動しない](#playwright-card-player-21) |
| PLAYWRIGHT-CARD-PLAYER-22 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](#playwright-card-player-22) |
| PLAYWRIGHT-CARD-PLAYER-23 | render | 正常系 | [未評価と FSRS 難易度を区別する](#playwright-card-player-23) |
| PLAYWRIGHT-CARD-PLAYER-24 | render | 正常系 | [表示設定と safe area によらず表面を中央に配置する](#playwright-card-player-24) |
| PLAYWRIGHT-CARD-PLAYER-25 | render | 正常系 | [暗色の数式解答にアプリの配色を適用する](#playwright-card-player-25) |
| PLAYWRIGHT-CARD-PLAYER-26 | interaction | 正常系 | [狭い画面の操作一覧を重ねず表示する](#playwright-card-player-26) |
| PLAYWRIGHT-CARD-PLAYER-27 | interaction | 正常系 | [読書中のスクロールを Card 移動にしない](#playwright-card-player-27) |
| PLAYWRIGHT-CARD-PLAYER-28 | interaction | 正常系 | [文字選択中に閲覧を終了しない](#playwright-card-player-28) |
| PLAYWRIGHT-CARD-PLAYER-29 | interaction | 正常系 | [Space とタップを区別する](#playwright-card-player-29) |
| PLAYWRIGHT-CARD-PLAYER-30 | interaction | 正常系 | [閲覧設定で許可済みの裏面操作を失わない](#playwright-card-player-30) |
| PLAYWRIGHT-CARD-PLAYER-31 | interaction | 正常系 | [編集操作の表示を切り替える](#playwright-card-player-31) |
| PLAYWRIGHT-CARD-PLAYER-32 | render | 正常系 | [裏面と編集操作なしの画面に編集操作を表示しない](#playwright-card-player-32) |
| PLAYWRIGHT-CARD-PLAYER-33 | render | 正常系 | [裏面では解答に集中できる表示にする](#playwright-card-player-33) |
| PLAYWRIGHT-CARD-PLAYER-34 | interaction | 正常系 | [端のホイール入力でも文章をスクロールする](#playwright-card-player-34) |
| PLAYWRIGHT-CARD-PLAYER-35 | interaction | 正常系 | [操作一覧から各操作を要求する](#playwright-card-player-35) |
| PLAYWRIGHT-CARD-PLAYER-36 | interaction | 正常系 | [ヘルプの再表示操作を失わない](#playwright-card-player-36) |
| PLAYWRIGHT-CARD-PLAYER-37 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](#playwright-card-player-37) |
| PLAYWRIGHT-CARD-PLAYER-38 | interaction | 正常系 | [閲覧モードと切替ボタンの表示を分ける](#playwright-card-player-38) |
| PLAYWRIGHT-CARD-PLAYER-39 | interaction | 正常系 | [ショートカットの表示組合せを維持する](#playwright-card-player-39) |
| PLAYWRIGHT-CARD-PLAYER-40 | interaction | 正常系 | [Card の詳細表示をまとめて切り替える](#playwright-card-player-40) |
| PLAYWRIGHT-CARD-PLAYER-41 | interaction | 正常系 | [再生操作が使えない理由を確認する](#playwright-card-player-41) |
| PLAYWRIGHT-CARD-PLAYER-42 | render | 正常系 | [選んだ下部操作だけを表示する](#playwright-card-player-42) |
| PLAYWRIGHT-CARD-PLAYER-43 | interaction | 正常系 | [許可されていない裏面の方向操作を無視する](#playwright-card-player-43) |
| PLAYWRIGHT-CARD-PLAYER-44 | interaction | 正常系 | [方向ボタンを隠しても表面のスワイプを使う](#playwright-card-player-44) |
| PLAYWRIGHT-CARD-PLAYER-45 | interaction | 正常系 | [ドラッグ後にクリックを重複して扱わない](#playwright-card-player-45) |
| PLAYWRIGHT-CARD-PLAYER-46 | interaction | 正常系 | [中・右ボタンのドラッグで Card を移動しない](#playwright-card-player-46) |
| PLAYWRIGHT-CARD-PLAYER-47 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](#playwright-card-player-47) |
| PLAYWRIGHT-CARD-PLAYER-48 | render | 正常系 | [未評価と FSRS 難易度を区別する](#playwright-card-player-48) |
| PLAYWRIGHT-CARD-PLAYER-49 | interaction | 正常系 | [Card player のヘルプでフォーカスを閉じ込める](#playwright-card-player-49) |
| PLAYWRIGHT-CARD-PLAYER-50 | interaction | 正常系 | [Card player のモーダルと背景通知の操作を分ける](#playwright-card-player-50) |
| PLAYWRIGHT-DECK-VIEW-01 | interaction | 正常系 | [閲覧条件に一致する Card を順番に読む](#playwright-deck-view-01) |
| PLAYWRIGHT-DECK-VIEW-02 | render | 正常系 | [Card がない場合に戻る操作を表示する](#playwright-deck-view-02) |
| PLAYWRIGHT-DECK-VIEW-03 | render | 正常系 | [閲覧条件による0件を未作成と区別する](#playwright-deck-view-03) |
| PLAYWRIGHT-DECK-VIEW-04 | interaction | 正常系 | [閲覧条件を学習条件と Deck ごとに分離する](#playwright-deck-view-04) |
| PLAYWRIGHT-DECK-VIEW-05 | interaction | 正常系 | [タグと一致条件による同じ閲覧対象を確認する](#playwright-deck-view-05) |
| PLAYWRIGHT-DECK-VIEW-06 | interaction | 正常系 | [Card 未登録の Deck 閲覧から Deck 一覧へ戻れる](#playwright-deck-view-06) |
| PLAYWRIGHT-DECK-VIEW-07 | interaction | 正常系 | [フィルター解除の応答後に一覧と閲覧を全件へ戻す](#playwright-deck-view-07) |
| PLAYWRIGHT-DECK-VIEW-08 | interaction | 異常系 | [全 Card を読めない Deck から警告を維持して戻る](#playwright-deck-view-08) |
| PLAYWRIGHT-DECK-VIEW-09 | interaction | 正常系 | [閲覧を先頭の表面から開始し端を越えると一覧へ戻る](#playwright-deck-view-09) |
| PLAYWRIGHT-DECK-VIEW-10 | interaction | 正常系 | [学習の条件に制限されず全 Card を標準順で閲覧する](#playwright-deck-view-10) |
| PLAYWRIGHT-DECK-VIEW-11 | interaction | 異常系 | [利用できない Deck の閲覧を終了する](#playwright-deck-view-11) |
| PLAYWRIGHT-DECK-VIEW-12 | interaction | 正常系 | [一枚の長い解答をタッチで読み左右の端から退出する](#playwright-deck-view-12) |
| PLAYWRIGHT-DECK-VIEW-13 | interaction | 正常系 | [閲覧の再生を明示的に開始して停止と再開を操作する](#playwright-deck-view-13) |
| PLAYWRIGHT-DECK-VIEW-14 | interaction | 正常系 | [進捗スライダーの標準操作で閲覧位置を選ぶ](#playwright-deck-view-14) |
| PLAYWRIGHT-DECK-VIEW-15 | interaction | 正常系 | [閲覧の解答に含まれるリンクと入力部品を操作する](#playwright-deck-view-15) |
| PLAYWRIGHT-DECK-VIEW-16 | interaction | 正常系 | [閲覧の上下キーと上下ドラッグを無効にする](#playwright-deck-view-16) |
| PLAYWRIGHT-DECK-VIEW-17 | interaction | 正常系 | [閲覧ヘルプを閉じて起動元へ戻る](#playwright-deck-view-17) |
| PLAYWRIGHT-DECK-VIEW-18 | interaction | 正常系 | [現在の閲覧 Card を編集リンクで開く](#playwright-deck-view-18) |
| PLAYWRIGHT-DECK-VIEW-19 | interaction | 正常系 | [間隔0の閲覧では再生を開始しない](#playwright-deck-view-19) |
| PLAYWRIGHT-DECK-VIEW-20 | interaction | 正常系 | [ヘルプの表示中は閲覧の自動送りを止める](#playwright-deck-view-20) |
| PLAYWRIGHT-DECK-VIEW-21 | interaction | 正常系 | [閲覧モードを保ってボタンまたは自動送りで次へ進む](#playwright-deck-view-21) |
| PLAYWRIGHT-DECK-VIEW-22 | interaction | 正常系 | [閲覧の表示設定を学習と共有する](#playwright-deck-view-22) |
| PLAYWRIGHT-DECK-VIEW-23 | interaction | 正常系 | [閲覧モードで長い表面を読み Card 移動を防ぐ](#playwright-deck-view-23) |
| PLAYWRIGHT-DECK-VIEW-24 | interaction | 正常系 | [閲覧モードを終了して通常の表裏操作へ戻る](#playwright-deck-view-24) |
| PLAYWRIGHT-DECK-VIEW-25 | interaction | 正常系 | [閲覧のショートカットとフォーカス対象の標準操作を分ける](#playwright-deck-view-25) |

<a id="playwright-card-player-01"></a>

### PLAYWRIGHT-CARD-PLAYER-01 読書中のスクロールを Card 移動にしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示し、閲覧モードを有効にしている。

When:

- 解答をスクロールし、文章を読むためにドラッグする。

Then:

- 文章をスクロールでき、表示中の Card と表示位置は変わらない。

<a id="playwright-card-player-02"></a>

### PLAYWRIGHT-CARD-PLAYER-02 文字選択中に閲覧を終了しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で解答の文章を表示し、その一部が選択されている。

When:

- 選択を保ったまま、文章を読むために縦方向へドラッグする。

Then:

- 選択した文字列を保ち、一覧へ戻ったり別の Card に移ったりしない。

<a id="playwright-card-player-03"></a>

### PLAYWRIGHT-CARD-PLAYER-03 Space とタップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- Space と本文のタップを独立した操作例として実行する。

Then:

- それぞれ画面の操作説明に対応した切替が行われ、一回の操作で二重に表裏が切り替わらない。

<a id="playwright-card-player-04"></a>

### PLAYWRIGHT-CARD-PLAYER-04 閲覧設定で許可済みの裏面操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、左右の Card 移動が利用できる。

When:

- 閲覧設定を変えて、裏面で左右に移動する。

Then:

- 同じ閲覧順の前後の Card へ移動でき、設定変更だけで許可済み操作が無効にならない。

<a id="playwright-card-player-05"></a>

### PLAYWRIGHT-CARD-PLAYER-05 編集操作の表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 編集操作の表示設定を切り替える。

Then:

- 編集の操作が表示・非表示になり、Card の本文は変わらない。

<a id="playwright-card-player-06"></a>

### PLAYWRIGHT-CARD-PLAYER-06 裏面に編集操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で編集操作の表示を有効にしている。

When:

- 裏面を表示する。

Then:

- 裏面には編集操作が表示されず、解答を読める。

<a id="playwright-card-player-07"></a>

### PLAYWRIGHT-CARD-PLAYER-07 裏面では解答に集中できる表示にする

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で本文と詳細情報を持つ Card がある。

When:

- 裏面を表示する。

Then:

- 解答が表示され、表面用の編集や詳細が解答の読書を妨げない。

<a id="playwright-card-player-08"></a>

### PLAYWRIGHT-CARD-PLAYER-08 端の Card 移動と解答クリックを分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、前後に別の Card がある。

When:

- 端の移動操作と解答本文のクリックを独立した操作例として選ぶ。

Then:

- 端の操作では前後の Card に移り、本文クリックでは同じ Card の表裏を切り替える。

<a id="playwright-card-player-09"></a>

### PLAYWRIGHT-CARD-PLAYER-09 端のホイール入力でも文章をスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示している。

When:

- 解答領域の端でホイールを動かす。

Then:

- 文章がスクロールされ、Card の移動や表裏切替は発生しない。

<a id="playwright-card-player-10"></a>

### PLAYWRIGHT-CARD-PLAYER-10 操作一覧から閲覧操作を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面の操作一覧を開いている。

When:

- 一覧に表示された閲覧操作を、独立した操作例として選ぶ。

Then:

- ヘルプ、詳細、操作ボタンなど、選んだ項目の表示状態が変わり、別の項目は意図せず切り替わらない。

<a id="playwright-card-player-11"></a>

### PLAYWRIGHT-CARD-PLAYER-11 ヘルプの再表示操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面でヘルプの表示設定を変更できる。

When:

- ヘルプを非表示にする。

Then:

- 操作一覧からヘルプを再び表示できる。

<a id="playwright-card-player-12"></a>

### PLAYWRIGHT-CARD-PLAYER-12 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードの切替ボタンを表示している。

When:

- 閲覧モードを切り替える。

Then:

- ボタンの押下状態と実際の閲覧モードが一致する。

<a id="playwright-card-player-13"></a>

### PLAYWRIGHT-CARD-PLAYER-13 閲覧モードと切替ボタンの表示を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードを有効にしている。

When:

- 閲覧モードの切替ボタンを非表示にする。

Then:

- ボタンは消えるが閲覧モードは変わらず、文章をスクロールできる。

<a id="playwright-card-player-14"></a>

### PLAYWRIGHT-CARD-PLAYER-14 表示設定をショートカットで切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面を表示し、入力欄やモーダルにフォーカスしていない。

When:

- 操作説明にある表示切替のショートカットを選ぶ。

Then:

- 対応する表示設定だけが切り替わり、Card の内容や位置は変わらない。

<a id="playwright-card-player-15"></a>

### PLAYWRIGHT-CARD-PLAYER-15 Card の詳細表示をまとめて切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で Card の詳細情報を表示している。

When:

- 詳細表示を切り替える。

Then:

- 対象 Card の詳細がまとまって表示・非表示になり、本文は残る。

<a id="playwright-card-player-16"></a>

### PLAYWRIGHT-CARD-PLAYER-16 再生操作が使えない理由を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で再生操作が利用できない表示状態である。

When:

- 再生設定の説明を確認する。

Then:

- 利用できない理由を確認でき、利用不可のまま再生が始まらない。

<a id="playwright-card-player-17"></a>

### PLAYWRIGHT-CARD-PLAYER-17 選んだ下部操作だけを表示する

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で方向操作のみ、再生操作のみ、両方なしの設定を独立した表示例として用意する。

When:

- 下部の操作領域を確認する。

Then:

- 各設定で選んだ操作だけが表示され、非表示の操作はフォーカス対象にならない。

<a id="playwright-card-player-18"></a>

### PLAYWRIGHT-CARD-PLAYER-18 許可されていない裏面の方向操作を無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。上下の評価操作はこの画面では利用できない。

When:

- 裏面を上下にスワイプする。

Then:

- Card の評価は表示されず、前後の Card へも移動しない。

<a id="playwright-card-player-19"></a>

### PLAYWRIGHT-CARD-PLAYER-19 方向ボタンを隠しても表面のスワイプを使う

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、方向ボタンを非表示にしている。

When:

- 表面で有効な左右スワイプを行う。

Then:

- 前後の Card に移動し、ボタンの非表示によってジェスチャーが無効にならない。

<a id="playwright-card-player-20"></a>

### PLAYWRIGHT-CARD-PLAYER-20 ドラッグ後にクリックを重複して扱わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、次の Card がある。

When:

- 左ボタンで有効な移動ドラッグをして離す。

Then:

- Card の移動は一回だけ行われ、離した操作で移動先の表裏が切り替わらない。

<a id="playwright-card-player-21"></a>

### PLAYWRIGHT-CARD-PLAYER-21 中・右ボタンのドラッグで Card を移動しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 中ボタンと右ボタンのドラッグを独立した操作例として実行する。

Then:

- 表示中の Card と表裏が変わらない。

<a id="playwright-card-player-22"></a>

### PLAYWRIGHT-CARD-PLAYER-22 裏面のドラッグ後に誤操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。

When:

- 裏面でドラッグしてポインターを離す。

Then:

- その状態で許可された操作だけが行われ、追加のクリックによる表裏切替が発生しない。

<a id="playwright-card-player-23"></a>

### PLAYWRIGHT-CARD-PLAYER-23 未評価と FSRS 難易度を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 未評価の Card と、FSRS 難易度を持つ Card がある。

When:

- Deck 閲覧画面でそれぞれの詳細を開く。

Then:

- 未評価を難易度0などの評価済み値として表示せず、評価済みの Card は難易度を確認できる。

<a id="playwright-card-player-24"></a>

### PLAYWRIGHT-CARD-PLAYER-24 表示設定と safe area によらず表面を中央に配置する

カテゴリ: `render`

区分: 正常系

Given:

- Card player の表面を、既定・方向非表示・再生非表示・詳細非表示・方向と再生非表示・再生利用不可・閲覧用操作の各状態で準備する。幅375px と上下47px/34pxの safe area も独立して確認する。

When:

- 表面の配置を確認する。

Then:

- 表面の中心は画面中央となり、safe area では上下の差の半分だけ補正する。許容差は1px未満とする。
- 閲覧用操作では上下の方向が無効で、Next card の選択は次への移動を一度だけ要求し、現在の進捗値を変えない。

<a id="playwright-card-player-25"></a>

### PLAYWRIGHT-CARD-PLAYER-25 暗色の数式解答にアプリの配色を適用する

カテゴリ: `render`

区分: 正常系

Given:

- Card player に暗色テーマの数式解答を表示している。

When:

- Markdown の前景色と境界色の変数を確認する。

Then:

- 前景色はアプリの ink、境界色はアプリの border の変数と一致する。

<a id="playwright-card-player-26"></a>

### PLAYWRIGHT-CARD-PLAYER-26 狭い画面の操作一覧を重ねず表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 幅320pxの Card player に表面と Card 詳細を表示している。

When:

- 操作一覧を開く。

Then:

- 操作一覧は戻るボタンの下に配置され、右端は画面内に収まる。Card 詳細は操作一覧の下に隠す。

<a id="playwright-card-player-27"></a>

### PLAYWRIGHT-CARD-PLAYER-27 読書中のスクロールを Card 移動にしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に長い表面を表示し、閲覧モードを有効にしている。通常幅、幅320px、幅1280px、数式の表面を独立して確認する。

When:

- 本文の末尾へスクロールし、上下左右へタッチドラッグと主ボタンの上ドラッグを行う。最後に明示的な方向ボタンを選ぶ。

Then:

- 本文は初期フォーカスを持ち、末尾まで読める。本文は上部の閲覧切替と下部の再生操作に重ならない。
- 読書用ドラッグでは評価・移動・モード変更を要求せず、方向ボタンを選ぶとその方向を一度だけ要求する。

<a id="playwright-card-player-28"></a>

### PLAYWRIGHT-CARD-PLAYER-28 文字選択中に閲覧を終了しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player の閲覧モードで表面の文章を表示している。

When:

- 文章を選択してクリックし、選択を解除して再びクリックする。

Then:

- 選択中は閲覧モードの終了を要求しない。選択解除後の本文クリックは終了を一度だけ要求する。

<a id="playwright-card-player-29"></a>

### PLAYWRIGHT-CARD-PLAYER-29 Space とタップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player の閲覧モードで表面の読取領域にフォーカスしている。

When:

- Space を押し、続けて本文をタップする。

Then:

- Space は閲覧モードの終了を要求しない。本文のタップは終了を一度だけ要求する。

<a id="playwright-card-player-30"></a>

### PLAYWRIGHT-CARD-PLAYER-30 閲覧設定で許可済みの裏面操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に裏面を表示し、閲覧モードの設定と裏面の左右ジェスチャー許可を有効にしている。

When:

- 裏面をタップし、左へタッチスワイプする。

Then:

- 解答クリックと左方向の操作をそれぞれ一度だけ要求する。

<a id="playwright-card-player-31"></a>

### PLAYWRIGHT-CARD-PLAYER-31 編集操作の表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player の表面に編集リンクがある。幅1280px・320px・375pxを独立して確認する。

When:

- 操作一覧を開き、編集リンクを非表示にして Escape で閉じる。再度開いてリンクを再表示し、Escape で閉じる。

Then:

- 操作一覧の表示中はリンクを表示せず、各操作の領域は重ならない。狭い画面では Card 情報を隠す。
- 押下状態は編集リンクの表示に一致し、Escape は操作一覧のトリガーへフォーカスを戻す。リンクの非表示と再表示を反映する。

<a id="playwright-card-player-32"></a>

### PLAYWRIGHT-CARD-PLAYER-32 裏面と編集操作なしの画面に編集操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Card player に編集リンクを持つ裏面、または編集操作を持たない表面を準備する。

When:

- 裏面を確認するか、表面の操作一覧を開く。

Then:

- 裏面には編集リンクを表示せず、編集操作のない表面では編集リンクの設定を表示しない。

<a id="playwright-card-player-33"></a>

### PLAYWRIGHT-CARD-PLAYER-33 裏面では解答に集中できる表示にする

カテゴリ: `render`

区分: 正常系

Given:

- Card player に長い解答を表示する。幅1280px・375px、および閲覧用の解答ラベルを独立して確認する。

When:

- 解答の領域にフォーカスし、本文と操作を確認する。

Then:

- 解答はスクロール可能でフォーカスを受け取る。
- 表面の本文・詳細情報・戻る・操作一覧・再生・進捗スライダー・方向ボタンは表示しない。

<a id="playwright-card-player-34"></a>

### PLAYWRIGHT-CARD-PLAYER-34 端のホイール入力でも文章をスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に長い解答と左右の操作領域を表示している。

When:

- 左端の操作領域でホイールを動かし、その後に左端をクリックする。

Then:

- 本文がスクロールしても操作領域の位置は固定で、ホイールでは移動や解答クリックを要求しない。上下の操作領域は表示しない。
- 後の左端クリックは左方向だけを一度要求する。

<a id="playwright-card-player-35"></a>

### PLAYWRIGHT-CARD-PLAYER-35 操作一覧から各操作を要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に方向・再生・Skip・Card 詳細の操作を表示し、操作一覧は閉じている。

When:

- 操作一覧を開き、戻る、方向・再生・Skip・Card 詳細の各表示設定を選び、Escape で閉じる。

Then:

- 操作一覧の開閉を expanded 状態で示す。表示中はヘルプのショートカットを隠し、各設定の押下状態を示す。
- 選んだ操作をそれぞれ一度だけ要求する。Escape 後は一覧のトリガーへフォーカスが戻り、ヘルプのショートカットが再表示される。

<a id="playwright-card-player-36"></a>

### PLAYWRIGHT-CARD-PLAYER-36 ヘルプの再表示操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player でヘルプのショートカットを表示している。

When:

- 操作一覧からヘルプを非表示にして再表示する。

Then:

- 非表示の間は設定が非押下となり、説明は再表示を案内する。再表示で押下状態に戻り、対応する操作を二度だけ要求する。

<a id="playwright-card-player-37"></a>

### PLAYWRIGHT-CARD-PLAYER-37 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で閲覧モードは OFF、切替ボタンは表示されている。

When:

- 閲覧モードを ON にする。

Then:

- 切替は一度だけ要求される。ボタンは非押下・Enter view mode の説明から押下・Exit view mode の説明へ変わる。

<a id="playwright-card-player-38"></a>

### PLAYWRIGHT-CARD-PLAYER-38 閲覧モードと切替ボタンの表示を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で閲覧モードを有効にし、切替ボタンを表示している。

When:

- 操作一覧から切替ボタンを非表示にして閉じ、再び表示する。

Then:

- ボタン表示だけが変わり、閲覧モードの変更は要求しない。本文の読取領域を維持し、表示を戻すと Exit view mode と案内する。操作一覧を閉じるとトリガーへフォーカスが戻る。

<a id="playwright-card-player-39"></a>

### PLAYWRIGHT-CARD-PLAYER-39 ショートカットの表示組合せを維持する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player のヘルプ・閲覧モード・編集リンクの表示を、ON/ON/ON、OFF/ON/ON、ON/ON/OFF、OFF/ON/OFF、ON/OFF/ON、OFF/OFF/OFF の各組合せで準備する。

When:

- 操作一覧を開き、ヘルプ・閲覧モード・編集リンクの各表示設定を選んで Escape で閉じる。同じ操作を二度行う。

Then:

- 閉じた操作列には指定したショートカットが指定の順序で表示される。開いた間は編集リンクを隠す。
- 各設定の要求は一巡につき一度だけ行い、閉じると操作一覧トリガーへフォーカスが戻る。

<a id="playwright-card-player-40"></a>

### PLAYWRIGHT-CARD-PLAYER-40 Card の詳細表示をまとめて切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で未評価の Card の詳細情報を表示している。

When:

- 操作一覧で Card 詳細を非表示にして再表示する。

Then:

- 情報がまとまって消え、再表示で戻る。押下状態と説明は Show card details・Hide card details に追従する。

<a id="playwright-card-player-41"></a>

### PLAYWRIGHT-CARD-PLAYER-41 再生操作が使えない理由を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で間隔0のため再生操作を利用できず、方向と再生操作を非表示にしている。

When:

- 操作一覧を開き、再生設定へフォーカスして選ぶ。

Then:

- 方向設定は非押下で再表示の説明を示す。再生設定はフォーカス可能だが aria-disabled が true で、title と読み上げ説明は間隔0を利用不可の理由として示す。再生の切替は要求しない。

<a id="playwright-card-player-42"></a>

### PLAYWRIGHT-CARD-PLAYER-42 選んだ下部操作だけを表示する

カテゴリ: `render`

区分: 正常系

Given:

- Card player で方向操作のみ、再生操作のみ、両方なしの設定を独立して準備する。

When:

- 下部の操作領域を確認する。

Then:

- 指定した操作だけを表示し、非表示の操作は DOM に存在しない。

<a id="playwright-card-player-43"></a>

### PLAYWRIGHT-CARD-PLAYER-43 許可されていない裏面の方向操作を無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に裏面を表示し、裏面の左右ジェスチャーを許可していない。

When:

- 裏面を左と上へタッチスワイプする。

Then:

- 左右と上下の方向操作を要求しない。

<a id="playwright-card-player-44"></a>

### PLAYWRIGHT-CARD-PLAYER-44 方向ボタンを隠しても表面のスワイプを使う

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で表面を表示し、方向ボタンを非表示にしている。

When:

- 表面で上方向のタッチスワイプを行う。

Then:

- 上方向の操作を一度だけ要求する。

<a id="playwright-card-player-45"></a>

### PLAYWRIGHT-CARD-PLAYER-45 ドラッグ後にクリックを重複して扱わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で表面を表示している。

When:

- 主ボタンで上方向にドラッグして離し、ブラウザーの後続クリックを届ける。

Then:

- 上方向の操作を一度だけ要求し、解答クリックや閲覧モードの切替は要求しない。

<a id="playwright-card-player-46"></a>

### PLAYWRIGHT-CARD-PLAYER-46 中・右ボタンのドラッグで Card を移動しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player で表面を表示している。

When:

- 中ボタンと右ボタンで上方向にドラッグする。

Then:

- 方向操作を要求しない。

<a id="playwright-card-player-47"></a>

### PLAYWRIGHT-CARD-PLAYER-47 裏面のドラッグ後に誤操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player に裏面を表示し、裏面の左右ジェスチャーを許可していない。

When:

- 主ボタンで裏面をドラッグし、ブラウザーの後続クリックを届ける。

Then:

- 方向操作と解答クリックを要求しない。

<a id="playwright-card-player-48"></a>

### PLAYWRIGHT-CARD-PLAYER-48 未評価と FSRS 難易度を区別する

カテゴリ: `render`

区分: 正常系

Given:

- Card player に未評価の Card と、FSRS 難易度8の Card を独立して表示する。

When:

- 詳細情報を確認する。

Then:

- 未評価では not studied yet を示して FSRS 難易度を表示しない。評価済みでは FSRS D: 8 を示して未評価の表示を出さない。

<a id="playwright-card-player-49"></a>

### PLAYWRIGHT-CARD-PLAYER-49 Card player のヘルプでフォーカスを閉じ込める

カテゴリ: `interaction`

区分: 正常系

Given:

- Card player のヘルプは閉じており、上方向の Good と表裏切替の説明を持つ。

When:

- ヘルプを開き、Tab・Shift+Tab・Escape の順に入力する。

Then:

- 名前と説明を持つ aria-modal な Study controls が開き、上方向と Good、表裏切替の説明を表示する。
- 閉じる操作が初期フォーカスと Tab・Shift+Tab の移動先になる。Escape で閉じるとトリガーへフォーカスが戻る。

<a id="playwright-card-player-50"></a>

### PLAYWRIGHT-CARD-PLAYER-50 Card player のモーダルと背景通知の操作を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- StrictMode の Card player に閉じられる持続通知がある。

When:

- ヘルプを開いて通知を消す。Escape で閉じ、新しい通知を表示してヘルプを開閉する。

Then:

- ヘルプの表示中は通知の閉じる操作が対象外となり、通知が消えても閉じる操作へのフォーカスを維持する。
- ヘルプを閉じると通知を閉じる操作を利用でき、閉じた通知は表示しない。

<a id="playwright-deck-view-01"></a>

### PLAYWRIGHT-DECK-VIEW-01 閲覧条件に一致する Card を順番に読む

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に閲覧条件に一致する Card が2枚あり、他の Deck にも Card がある。

When:

- 対象 Deck の閲覧画面を開き、表裏を切り替えて次へ進む。

Then:

- 対象の2枚だけを順番に閲覧でき、学習の復習期限では除外されない。

<a id="playwright-deck-view-02"></a>

### PLAYWRIGHT-DECK-VIEW-02 Card がない場合に戻る操作を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card が一枚もない。

When:

- Deck 閲覧画面を開く。

Then:

- Card がない案内と戻る操作が表示され、存在しない Card の本文は表示されない。

<a id="playwright-deck-view-03"></a>

### PLAYWRIGHT-DECK-VIEW-03 閲覧条件による0件を未作成と区別する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card はあるが、閲覧条件に一致するものはない。

When:

- Deck 閲覧画面を開く。

Then:

- 閲覧対象がないことを表示し、Card 未作成の状態と区別できる。

<a id="playwright-deck-view-04"></a>

### PLAYWRIGHT-DECK-VIEW-04 [TODO] 閲覧条件を学習条件と Deck ごとに分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck と別 Deck にタグ付き・タグなしの Card があり、Deck ごとに異なる学習条件がある。対象 Deck の閲覧フィルターは未設定と一部の Card に一致する設定を独立した状態例とし、別 Deck では異なる条件を選択している。
- 対象 Deck の復習期限・学習用タグ・上限・シャッフルでは一部の Card が対象外である。

When:

- 対象 Deck の Card 一覧から Deck 閲覧を開き、別 Deck の一覧と閲覧を経て元の一覧へ戻る。

Then:

- 両画面は対象 Deck の閲覧条件に一致する同じ Card と件数を表示し、学習条件や別 Deck のフィルターで制限しない。
- 元の Deck の選択タグと AND / OR 条件を保ち、表示・遷移だけでは Card・Deck・学習状態・設定を変更しない。

<a id="playwright-deck-view-05"></a>

### PLAYWRIGHT-DECK-VIEW-05 [TODO] タグと一致条件による同じ閲覧対象を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に A だけ、B だけ、A と B、タグなしの Card があり、別 Deck にもタグ付き Card がある。
- フィルター保存先は成功し、同じ Deck の選択条件を返す。単一タグ、AND、OR、タグ未選択を独立した入力例とする。

When:

- Card 一覧でタグと条件を選択し、同じ Deck の閲覧画面を開く。

Then:

- 単一の A は A を持つ Card、A と B の AND は両方を持つ Card、OR はいずれかを持つ Card を一度ずつ表示する。
- タグ未選択なら AND / OR のどちらでもタグなしを含む全 Card を表示する。両画面の件数と対象は一致する。
- 他の Deck の条件、Card 本文、学習条件・学習の順序や位置を変更しない。

<a id="playwright-deck-view-06"></a>

### PLAYWRIGHT-DECK-VIEW-06 Card 未登録の Deck 閲覧から Deck 一覧へ戻れる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 未登録・フィルター未設定の Deck を閲覧できる。

When:

- View を開き一覧へ戻る操作を選ぶ。

Then:

- Card がない旨と戻る操作を表示し、Card 操作を表示しない。Deck 一覧へ戻り、保存内容と学習結果は変わらない。

<a id="playwright-deck-view-07"></a>

### PLAYWRIGHT-DECK-VIEW-07 [TODO] フィルター解除の応答後に一覧と閲覧を全件へ戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 一覧でタグと AND 条件を選択し、別の学習用タグ条件がある。フィルター保存先は成功と解除後の条件を返す。

When:

- フィルター欄の Clear でタグを解除し、同じ Deck の閲覧画面を開く。

Then:

- タグ未選択・OR 条件となり、両画面で全 Card を表示する。学習用タグ条件は変わらない。
- 重複するフィルター解除ボタンは表示しない。

<a id="playwright-deck-view-08"></a>

### PLAYWRIGHT-DECK-VIEW-08 全 Card を読めない Deck から警告を維持して戻る

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の2枚の Card が読み込めない結果を受け取っており、Deck と認証・設定は利用できる。

When:

- 対象 Deck の閲覧リンクを開き、Deck 一覧へ戻る。

Then:

- Card がない旨、読み込めない2件と保存データを変更していない警告を表示する。
- 一覧へ戻っても警告を維持し、復旧操作だけで保存内容を変更しない。

<a id="playwright-deck-view-09"></a>

### PLAYWRIGHT-DECK-VIEW-09 閲覧を先頭の表面から開始し端を越えると一覧へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card と途中の学習がある Deck を閲覧できる。匿名・通常アカウントを独立した状態例とし、学習側の操作割当・裏面維持・自動再生開始は有効である。

When:

- Deck 一覧の対象 Deck の View を開き、表裏の左右ドラッグ・左右キー・前後ボタンで移動する。途中で退出・再入場し、先頭の前と末尾の次へ進む。

Then:

- 閲覧は先頭 Card の表面・停止状態から始まり、位置／総数と表面の本文を読み上げられる。移動先は表面で、ドラッグ後に誤反転しない。
- 両端を越えると Deck 一覧に戻る。上下ボタンは無効で評価せず、再生操作を利用できる。再入場時も先頭表面・停止状態へ戻る。
- Deck・Card・学習結果・現在の学習位置と、明示的に操作していない設定を変えない。

<a id="playwright-deck-view-10"></a>

### PLAYWRIGHT-DECK-VIEW-10 学習の条件に制限されず全 Card を標準順で閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 同じ Deck に学習用タグの一致・不一致、期限到達・未来期限・未学習の Card があり、閲覧フィルターは未選択である。学習の枚数上限とシャッフル・間隔反復が有効である。

When:

- 対象 Deck の View を開き全 Card の表裏を順に閲覧する。

Then:

- 全 Card を絞り込みなしの一覧と同じ標準順で表示し、総数にも全 Card を含む。末尾の次は Deck 一覧へ戻る。
- 学習条件・復習予定・進行中の学習を変更せず、新しい学習を開始しない。

<a id="playwright-deck-view-11"></a>

### PLAYWRIGHT-DECK-VIEW-11 [TODO] 利用できない Deck の閲覧を終了する

カテゴリ: `interaction`

区分: 異常系

Given:

- 指定した閲覧 URL に対応する Deck が存在しない。

When:

- その URL を開き一覧へ戻る操作を選ぶ。

Then:

- Deck が利用できない旨と戻る操作を表示し、Card 操作を表示しない。Deck 一覧へ戻り、他の Deck の内容や学習結果を変えない。

<a id="playwright-deck-view-12"></a>

### PLAYWRIGHT-DECK-VIEW-12 一枚の長い解答をタッチで読み左右の端から退出する

カテゴリ: `interaction`

区分: 正常系

Given:

- 狭い画面で表示領域より長い裏面を持つ Card 一枚の Deck を閲覧する。

When:

- 表面をタッチで開き、ホイールと縦方向のタッチで裏面をスクロールする。左 swipe で退出し、再入場後は表面から右 swipe で退出する。

Then:

- 1件中1件の位置と裏面の末尾を確認できる。縦操作は移動・誤反転を起こさず、左右のどちらの端を越えても Deck 一覧へ戻る。
- 学習結果・学習位置・設定を変えない。

<a id="playwright-deck-view-13"></a>

### PLAYWRIGHT-DECK-VIEW-13 閲覧の再生を明示的に開始して停止と再開を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の Deck を閲覧でき、自動再生開始が有効、再生間隔は正の値である。匿名・通常アカウントを独立した状態例とする。

When:

- View を開いて待ち、再生ボタンまたは Space で再生・停止・再開を行う。手動移動後も待ち、末尾の自動送りと退出後の再入場を行う。

Then:

- 明示的な開始前と再入場直後は停止し、再生中は設定間隔後に次の表面へ進む。手動移動後も新たに設定間隔を待つ。
- 末尾の自動送りで Deck 一覧へ戻る。Card・学習結果・再開位置と設定を変えない。

<a id="playwright-deck-view-14"></a>

### PLAYWRIGHT-DECK-VIEW-14 進捗スライダーの標準操作で閲覧位置を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の Deck を閲覧し、再生操作を表示している。

When:

- 進捗スライダーをポインター・キーボードで前後へ動かし、Card を反転して左右キーで移動してから退出・再入場する。

Then:

- 選んだ位置と本文が一致する。移動先は表面で、再入場時は先頭表面に戻る。
- スライダーにフォーカス中は標準キー操作を優先し、Card 移動を二重に実行しない。Card・学習状態・設定を変えない。

<a id="playwright-deck-view-15"></a>

### PLAYWRIGHT-DECK-VIEW-15 [TODO] 閲覧の解答に含まれるリンクと入力部品を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の閲覧画面でリンクや入力部品を含む裏面を持つ Card を表示する。

When:

- 本文クリックで表裏を切り替え、裏面のリンク・入力部品を操作する。

Then:

- 本文クリックは表裏を切り替える。裏面は本文に集中でき、ツールバー・詳細・操作パネルを隠す。
- リンクや入力部品では誤反転せず、リンクの移動や部品の入力を利用できる。学習状態と設定を変えない。

<a id="playwright-deck-view-16"></a>

### PLAYWRIGHT-DECK-VIEW-16 [TODO] 閲覧の上下キーと上下ドラッグを無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面を表示し、学習の方向操作割当は有効である。

When:

- 上下キー、上下ドラッグを表裏で操作する。

Then:

- Card の位置と表裏を変更せず、評価しない。Card・学習状態・設定を変えない。

<a id="playwright-deck-view-17"></a>

### PLAYWRIGHT-DECK-VIEW-17 [TODO] 閲覧ヘルプを閉じて起動元へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で Help の起動ボタンを表示している。

When:

- Help を開き説明を確認し、背景のショートカットを入力してから閉じる。

Then:

- 左右は前後移動、上下は無効として説明し、反転・再生・表示切替・退出の操作を案内する。
- 表示中は背景のショートカットを実行せず、閉じると元の Card を維持して起動ボタンへフォーカスを戻す。Card・学習状態・設定を変えない。

<a id="playwright-deck-view-18"></a>

### PLAYWRIGHT-DECK-VIEW-18 [TODO] 現在の閲覧 Card を編集リンクで開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 編集リンクは既定で表示されている。英語・日本語と狭い画面を独立した表示例とする。

When:

- 表面の鉛筆リンクをキーボードで開き、保存せず閲覧へ戻って裏面も表示する。

Then:

- アイコンのみのリンクが現在の Card の編集画面を開く。読み上げ名を現在の言語で提供し、狭い画面で操作が重ならない。
- 裏面では編集リンクを隠す。保存しないため Card・学習状態を変えない。

<a id="playwright-deck-view-19"></a>

### PLAYWRIGHT-DECK-VIEW-19 [TODO] 間隔0の閲覧では再生を開始しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 再生間隔0の Deck を閲覧できる。匿名・通常アカウントを独立した状態例とする。

When:

- View を開いて待ち、Help の再生操作説明を確認する。

Then:

- 再生操作と進捗スライダーを表示せず、自動送りしない。Help は利用できない理由を表示する。Card・学習状態・設定を変えない。

<a id="playwright-deck-view-20"></a>

### PLAYWRIGHT-DECK-VIEW-20 [TODO] ヘルプの表示中は閲覧の自動送りを止める

カテゴリ: `interaction`

区分: 正常系

Given:

- 正の間隔で Deck を自動再生中である。匿名・通常アカウントを独立した状態例とする。

When:

- Help を開いて間隔を超えて待ち、Help を閉じる。

Then:

- Help 中は同じ Card を維持し、閉じた後は再生選択を保って設定間隔後に次の Card へ進む。学習状態と設定を変えない。

<a id="playwright-deck-view-21"></a>

### PLAYWRIGHT-DECK-VIEW-21 閲覧モードを保ってボタンまたは自動送りで次へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の閲覧で view mode が有効、再生間隔が正の値である。

When:

- 次の Card ボタンと、再生ボタンで開始する自動送りを独立した操作例として実行する。

Then:

- 次の Card へ進んでも view mode を維持し、学習状態を変更しない。

<a id="playwright-deck-view-22"></a>

### PLAYWRIGHT-DECK-VIEW-22 閲覧の表示設定を学習と共有する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card の詳細・Help・方向ボタン・再生操作・閲覧の編集リンクを表示しており、同じ Deck に途中の学習がある。外部処理は利用可能な学習状態を返す。

When:

- View の操作一覧で編集リンクと他の表示設定を切り替え、同じ Deck の学習へ移動する。

Then:

- 編集リンクの切替では編集画面へ移動せず、非表示後も操作一覧から戻せる。編集リンクは閲覧だけに適用し、他の表示設定は学習にも反映される。
- 明示的に変更した表示設定以外と、Card・学習位置は変えない。

<a id="playwright-deck-view-23"></a>

### PLAYWRIGHT-DECK-VIEW-23 閲覧モードで長い表面を読み Card 移動を防ぐ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面に長い表面の Card を表示している。

When:

- view mode を有効にし、ホイール・タッチ・方向キーでスクロールし、左右・上下にドラッグする。

Then:

- 本文の先頭と末尾を読める。スワイプと方向キーは Card 移動や画面退出を起こさず、view mode を維持する。学習データは変わらない。

<a id="playwright-deck-view-24"></a>

### PLAYWRIGHT-DECK-VIEW-24 閲覧モードを終了して通常の表裏操作へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で view mode が有効である。

When:

- タップと Enter を独立した操作例として view mode を終了し、その後に反転・裏面スクロール・タップ・左右移動を操作する。

Then:

- 終了操作だけでは表面を反転せず、終了後は通常の表裏切替・裏面スクロール・左右移動を利用できる。学習データは変わらない。

<a id="playwright-deck-view-25"></a>

### PLAYWRIGHT-DECK-VIEW-25 [TODO] 閲覧のショートカットとフォーカス対象の標準操作を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントの Deck 閲覧画面で再生操作を表示し、裏面にはスクロール領域がある。

When:

- 本文、入力欄、ボタン、裏面のスクロール領域をそれぞれフォーカスし、Enter・Space・b を入力する。

Then:

- 本文では Enter は反転、Space は再生切替、b は方向ボタンの表示切替として動く。
- 入力欄とボタンの標準操作を妨げず、裏面のスクロール領域の Space はスクロールを優先する。明示的に切り替えた表示設定以外と学習データは変えない。
