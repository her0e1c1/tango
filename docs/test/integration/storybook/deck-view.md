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
| STORYBOOK-DECK-VIEW-04 | interaction | 正常系 | [閲覧条件を学習条件と Deck ごとに分離する](#storybook-deck-view-04) |
| STORYBOOK-DECK-VIEW-05 | interaction | 正常系 | [タグと一致条件による同じ閲覧対象を確認する](#storybook-deck-view-05) |
| STORYBOOK-DECK-VIEW-06 | interaction | 正常系 | [Card 未登録の Deck 閲覧から Deck 一覧へ戻れる](#storybook-deck-view-06) |
| STORYBOOK-DECK-VIEW-07 | interaction | 正常系 | [フィルター解除の応答後に一覧と閲覧を全件へ戻す](#storybook-deck-view-07) |
| STORYBOOK-DECK-VIEW-08 | interaction | 異常系 | [全 Card を読めない Deck から警告を維持して戻る](#storybook-deck-view-08) |
| STORYBOOK-DECK-VIEW-09 | interaction | 正常系 | [閲覧を先頭の表面から開始し端を越えると一覧へ戻る](#storybook-deck-view-09) |
| STORYBOOK-DECK-VIEW-10 | interaction | 正常系 | [学習の条件に制限されず全 Card を標準順で閲覧する](#storybook-deck-view-10) |
| STORYBOOK-DECK-VIEW-11 | interaction | 異常系 | [利用できない Deck の閲覧を終了する](#storybook-deck-view-11) |
| STORYBOOK-DECK-VIEW-12 | interaction | 正常系 | [一枚の長い解答をタッチで読み左右の端から退出する](#storybook-deck-view-12) |
| STORYBOOK-DECK-VIEW-13 | interaction | 正常系 | [閲覧の再生を明示的に開始して停止と再開を操作する](#storybook-deck-view-13) |
| STORYBOOK-DECK-VIEW-14 | interaction | 正常系 | [進捗スライダーの標準操作で閲覧位置を選ぶ](#storybook-deck-view-14) |
| STORYBOOK-DECK-VIEW-15 | interaction | 正常系 | [閲覧の解答に含まれるリンクと入力部品を操作する](#storybook-deck-view-15) |
| STORYBOOK-DECK-VIEW-16 | interaction | 正常系 | [閲覧の上下キーと上下ドラッグを無効にする](#storybook-deck-view-16) |
| STORYBOOK-DECK-VIEW-17 | interaction | 正常系 | [閲覧ヘルプを閉じて起動元へ戻る](#storybook-deck-view-17) |
| STORYBOOK-DECK-VIEW-18 | interaction | 正常系 | [現在の閲覧 Card を編集リンクで開く](#storybook-deck-view-18) |
| STORYBOOK-DECK-VIEW-19 | interaction | 正常系 | [間隔0の閲覧では再生を開始しない](#storybook-deck-view-19) |
| STORYBOOK-DECK-VIEW-20 | interaction | 正常系 | [ヘルプの表示中は閲覧の自動送りを止める](#storybook-deck-view-20) |
| STORYBOOK-DECK-VIEW-21 | interaction | 正常系 | [閲覧モードを保ってボタンまたは自動送りで次へ進む](#storybook-deck-view-21) |
| STORYBOOK-DECK-VIEW-22 | interaction | 正常系 | [閲覧の表示設定を学習と共有する](#storybook-deck-view-22) |
| STORYBOOK-DECK-VIEW-23 | interaction | 正常系 | [閲覧モードで長い表面を読み Card 移動を防ぐ](#storybook-deck-view-23) |
| STORYBOOK-DECK-VIEW-24 | interaction | 正常系 | [閲覧モードを終了して通常の表裏操作へ戻る](#storybook-deck-view-24) |
| STORYBOOK-DECK-VIEW-25 | interaction | 正常系 | [閲覧のショートカットとフォーカス対象の標準操作を分ける](#storybook-deck-view-25) |

<a id="storybook-card-player-01"></a>

### STORYBOOK-CARD-PLAYER-01 読書中のスクロールを Card 移動にしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示し、閲覧モードを有効にしている。

When:

- 解答をスクロールし、文章を読むためにドラッグする。

Then:

- 文章をスクロールでき、表示中の Card と表示位置は変わらない。

<a id="storybook-card-player-02"></a>

### STORYBOOK-CARD-PLAYER-02 文字選択中に閲覧を終了しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で解答の文章を表示している。

When:

- 文章の一部をドラッグして選択する。

Then:

- 文章を選択でき、一覧へ戻ったり別の Card に移ったりしない。

<a id="storybook-card-player-03"></a>

### STORYBOOK-CARD-PLAYER-03 Space とタップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- Space と本文のタップを独立した操作例として実行する。

Then:

- それぞれ画面の操作説明に対応した切替が行われ、一回の操作で二重に表裏が切り替わらない。

<a id="storybook-card-player-04"></a>

### STORYBOOK-CARD-PLAYER-04 閲覧設定で許可済みの裏面操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、左右の Card 移動が利用できる。

When:

- 閲覧設定を変えて、裏面で左右に移動する。

Then:

- 同じ閲覧順の前後の Card へ移動でき、設定変更だけで許可済み操作が無効にならない。

<a id="storybook-card-player-05"></a>

### STORYBOOK-CARD-PLAYER-05 編集操作の表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 編集操作の表示設定を切り替える。

Then:

- 編集の操作が表示・非表示になり、Card の本文は変わらない。

<a id="storybook-card-player-06"></a>

### STORYBOOK-CARD-PLAYER-06 裏面に編集操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で編集操作の表示を有効にしている。

When:

- 裏面を表示する。

Then:

- 裏面には編集操作が表示されず、解答を読める。

<a id="storybook-card-player-07"></a>

### STORYBOOK-CARD-PLAYER-07 裏面では解答に集中できる表示にする

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で本文と詳細情報を持つ Card がある。

When:

- 裏面を表示する。

Then:

- 解答が表示され、表面用の編集や詳細が解答の読書を妨げない。

<a id="storybook-card-player-08"></a>

### STORYBOOK-CARD-PLAYER-08 端の Card 移動と解答クリックを分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示し、前後に別の Card がある。

When:

- 端の移動操作と解答本文のクリックを独立した操作例として選ぶ。

Then:

- 端の操作では前後の Card に移り、本文クリックでは同じ Card の表裏を切り替える。

<a id="storybook-card-player-09"></a>

### STORYBOOK-CARD-PLAYER-09 端のホイール入力でも文章をスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で長い解答を表示している。

When:

- 解答領域の端でホイールを動かす。

Then:

- 文章がスクロールされ、Card の移動や表裏切替は発生しない。

<a id="storybook-card-player-10"></a>

### STORYBOOK-CARD-PLAYER-10 操作一覧から閲覧操作を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面の操作一覧を開いている。

When:

- 一覧に表示された閲覧操作を、独立した操作例として選ぶ。

Then:

- ヘルプ、詳細、操作ボタンなど、選んだ項目の表示状態が変わり、別の項目は意図せず切り替わらない。

<a id="storybook-card-player-11"></a>

### STORYBOOK-CARD-PLAYER-11 ヘルプの再表示操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面でヘルプの表示設定を変更できる。

When:

- ヘルプを非表示にする。

Then:

- 操作一覧からヘルプを再び表示できる。

<a id="storybook-card-player-12"></a>

### STORYBOOK-CARD-PLAYER-12 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードの切替ボタンを表示している。

When:

- 閲覧モードを切り替える。

Then:

- ボタンの押下状態と実際の閲覧モードが一致する。

<a id="storybook-card-player-13"></a>

### STORYBOOK-CARD-PLAYER-13 閲覧モードと切替ボタンの表示を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で閲覧モードを有効にしている。

When:

- 閲覧モードの切替ボタンを非表示にする。

Then:

- ボタンは消えるが閲覧モードは変わらず、文章をスクロールできる。

<a id="storybook-card-player-14"></a>

### STORYBOOK-CARD-PLAYER-14 表示設定をショートカットで切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面を表示し、入力欄やモーダルにフォーカスしていない。

When:

- 操作説明にある表示切替のショートカットを選ぶ。

Then:

- 対応する表示設定だけが切り替わり、Card の内容や位置は変わらない。

<a id="storybook-card-player-15"></a>

### STORYBOOK-CARD-PLAYER-15 Card の詳細表示をまとめて切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で Card の詳細情報を表示している。

When:

- 詳細表示を切り替える。

Then:

- 対象 Card の詳細がまとまって表示・非表示になり、本文は残る。

<a id="storybook-card-player-16"></a>

### STORYBOOK-CARD-PLAYER-16 再生操作が使えない理由を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で再生操作が利用できない表示状態である。

When:

- 再生設定の説明を確認する。

Then:

- 利用できない理由を確認でき、利用不可のまま再生が始まらない。

<a id="storybook-card-player-17"></a>

### STORYBOOK-CARD-PLAYER-17 選んだ下部操作だけを表示する

カテゴリ: `render`

区分: 正常系

Given:

- Deck 閲覧画面で方向操作のみ、再生操作のみ、両方なしの設定を独立した表示例として用意する。

When:

- 下部の操作領域を確認する。

Then:

- 各設定で選んだ操作だけが表示され、非表示の操作はフォーカス対象にならない。

<a id="storybook-card-player-18"></a>

### STORYBOOK-CARD-PLAYER-18 許可されていない裏面の方向操作を無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。上下の評価操作はこの画面では利用できない。

When:

- 裏面を上下にスワイプする。

Then:

- Card の評価は表示されず、前後の Card へも移動しない。

<a id="storybook-card-player-19"></a>

### STORYBOOK-CARD-PLAYER-19 方向ボタンを隠しても表面のスワイプを使う

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、方向ボタンを非表示にしている。

When:

- 表面で有効な左右スワイプを行う。

Then:

- 前後の Card に移動し、ボタンの非表示によってジェスチャーが無効にならない。

<a id="storybook-card-player-20"></a>

### STORYBOOK-CARD-PLAYER-20 ドラッグ後にクリックを重複して扱わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示し、次の Card がある。

When:

- 左ボタンで有効な移動ドラッグをして離す。

Then:

- Card の移動は一回だけ行われ、離した操作で移動先の表裏が切り替わらない。

<a id="storybook-card-player-21"></a>

### STORYBOOK-CARD-PLAYER-21 中・右ボタンのドラッグで Card を移動しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で表面を表示している。

When:

- 中ボタンと右ボタンのドラッグを独立した操作例として実行する。

Then:

- 表示中の Card と表裏が変わらない。

<a id="storybook-card-player-22"></a>

### STORYBOOK-CARD-PLAYER-22 裏面のドラッグ後に誤操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で裏面を表示している。

When:

- 裏面でドラッグしてポインターを離す。

Then:

- その状態で許可された操作だけが行われ、追加のクリックによる表裏切替が発生しない。

<a id="storybook-card-player-23"></a>

### STORYBOOK-CARD-PLAYER-23 未評価と FSRS 難易度を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 未評価の Card と、FSRS 難易度を持つ Card がある。

When:

- Deck 閲覧画面でそれぞれの詳細を開く。

Then:

- 未評価を難易度0などの評価済み値として表示せず、評価済みの Card は難易度を確認できる。

<a id="storybook-deck-view-01"></a>

### STORYBOOK-DECK-VIEW-01 閲覧条件に一致する Card を順番に読む

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に閲覧条件に一致する Card が2枚あり、他の Deck にも Card がある。

When:

- 対象 Deck の閲覧画面を開き、表裏を切り替えて次へ進む。

Then:

- 対象の2枚だけを順番に閲覧でき、学習の復習期限では除外されない。

<a id="storybook-deck-view-02"></a>

### STORYBOOK-DECK-VIEW-02 Card がない場合に戻る操作を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card が一枚もない。

When:

- Deck 閲覧画面を開く。

Then:

- Card がない案内と戻る操作が表示され、存在しない Card の本文は表示されない。

<a id="storybook-deck-view-03"></a>

### STORYBOOK-DECK-VIEW-03 閲覧条件による0件を未作成と区別する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card はあるが、閲覧条件に一致するものはない。

When:

- Deck 閲覧画面を開く。

Then:

- 閲覧対象がないことを表示し、Card 未作成の状態と区別できる。

<a id="storybook-deck-view-04"></a>

### STORYBOOK-DECK-VIEW-04 [TODO] 閲覧条件を学習条件と Deck ごとに分離する

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

<a id="storybook-deck-view-05"></a>

### STORYBOOK-DECK-VIEW-05 [TODO] タグと一致条件による同じ閲覧対象を確認する

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

<a id="storybook-deck-view-06"></a>

### STORYBOOK-DECK-VIEW-06 [TODO] Card 未登録の Deck 閲覧から Deck 一覧へ戻れる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 未登録・フィルター未設定の Deck を閲覧できる。

When:

- View を開き一覧へ戻る操作を選ぶ。

Then:

- Card がない旨と戻る操作を表示し、Card 操作を表示しない。Deck 一覧へ戻り、保存内容と学習結果は変わらない。

<a id="storybook-deck-view-07"></a>

### STORYBOOK-DECK-VIEW-07 [TODO] フィルター解除の応答後に一覧と閲覧を全件へ戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 一覧でタグと AND 条件を選択し、別の学習用タグ条件がある。フィルター保存先は成功と解除後の条件を返す。

When:

- フィルター欄の Clear でタグを解除し、同じ Deck の閲覧画面を開く。

Then:

- タグ未選択・OR 条件となり、両画面で全 Card を表示する。学習用タグ条件は変わらない。
- 重複するフィルター解除ボタンは表示しない。

<a id="storybook-deck-view-08"></a>

### STORYBOOK-DECK-VIEW-08 [TODO] 全 Card を読めない Deck から警告を維持して戻る

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の2枚の Card が読み込めない結果を受け取っており、Deck と認証・設定は利用できる。

When:

- 対象 Deck の閲覧リンクを開き、元の Deck の Card 一覧へ戻る。

Then:

- Card がない旨、読み込めない2件と保存データを変更していない警告を表示する。
- 一覧へ戻っても警告を維持し、復旧操作だけで保存内容を変更しない。

<a id="storybook-deck-view-09"></a>

### STORYBOOK-DECK-VIEW-09 [TODO] 閲覧を先頭の表面から開始し端を越えると一覧へ戻る

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

<a id="storybook-deck-view-10"></a>

### STORYBOOK-DECK-VIEW-10 [TODO] 学習の条件に制限されず全 Card を標準順で閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 同じ Deck に学習用タグの一致・不一致、期限到達・未来期限・未学習の Card があり、閲覧フィルターは未選択である。学習の枚数上限とシャッフル・間隔反復が有効である。

When:

- 対象 Deck の View を開き全 Card の表裏を順に閲覧する。

Then:

- 全 Card を絞り込みなしの一覧と同じ標準順で表示し、総数にも全 Card を含む。末尾の次は Deck 一覧へ戻る。
- 学習条件・復習予定・進行中の学習を変更せず、新しい学習を開始しない。

<a id="storybook-deck-view-11"></a>

### STORYBOOK-DECK-VIEW-11 [TODO] 利用できない Deck の閲覧を終了する

カテゴリ: `interaction`

区分: 異常系

Given:

- 指定した閲覧 URL に対応する Deck が存在しない。

When:

- その URL を開き一覧へ戻る操作を選ぶ。

Then:

- Deck が利用できない旨と戻る操作を表示し、Card 操作を表示しない。Deck 一覧へ戻り、他の Deck の内容や学習結果を変えない。

<a id="storybook-deck-view-12"></a>

### STORYBOOK-DECK-VIEW-12 [TODO] 一枚の長い解答をタッチで読み左右の端から退出する

カテゴリ: `interaction`

区分: 正常系

Given:

- 狭い画面で表示領域より長い裏面を持つ Card 一枚の Deck を閲覧する。

When:

- 表面をタッチで開き、ホイールと縦方向のタッチで裏面をスクロールする。左 swipe で退出し、再入場後は表面から右 swipe で退出する。

Then:

- 1件中1件の位置と裏面の末尾を確認できる。縦操作は移動・誤反転を起こさず、左右のどちらの端を越えても Deck 一覧へ戻る。
- 学習結果・学習位置・設定を変えない。

<a id="storybook-deck-view-13"></a>

### STORYBOOK-DECK-VIEW-13 [TODO] 閲覧の再生を明示的に開始して停止と再開を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の Deck を閲覧でき、自動再生開始が有効、再生間隔は正の値である。匿名・通常アカウントを独立した状態例とする。

When:

- View を開いて待ち、再生ボタンまたは Space で再生・停止・再開を行う。手動移動後も待ち、末尾の自動送りと退出後の再入場を行う。

Then:

- 明示的な開始前と再入場直後は停止し、再生中は設定間隔後に次の表面へ進む。手動移動後も新たに設定間隔を待つ。
- 末尾の自動送りで Deck 一覧へ戻る。Card・学習結果・再開位置と設定を変えない。

<a id="storybook-deck-view-14"></a>

### STORYBOOK-DECK-VIEW-14 [TODO] 進捗スライダーの標準操作で閲覧位置を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の Deck を閲覧し、再生操作を表示している。

When:

- 進捗スライダーをポインター・キーボードで前後へ動かし、Card を反転して左右キーで移動してから退出・再入場する。

Then:

- 選んだ位置と本文が一致する。移動先は表面で、再入場時は先頭表面に戻る。
- スライダーにフォーカス中は標準キー操作を優先し、Card 移動を二重に実行しない。Card・学習状態・設定を変えない。

<a id="storybook-deck-view-15"></a>

### STORYBOOK-DECK-VIEW-15 [TODO] 閲覧の解答に含まれるリンクと入力部品を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の閲覧画面でリンクや入力部品を含む裏面を持つ Card を表示する。

When:

- 本文クリックで表裏を切り替え、裏面のリンク・入力部品を操作する。

Then:

- 本文クリックは表裏を切り替える。裏面は本文に集中でき、ツールバー・詳細・操作パネルを隠す。
- リンクや入力部品では誤反転せず、リンクの移動や部品の入力を利用できる。学習状態と設定を変えない。

<a id="storybook-deck-view-16"></a>

### STORYBOOK-DECK-VIEW-16 [TODO] 閲覧の上下キーと上下ドラッグを無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面を表示し、学習の方向操作割当は有効である。

When:

- 上下キー、上下ドラッグを表裏で操作する。

Then:

- Card の位置と表裏を変更せず、評価しない。Card・学習状態・設定を変えない。

<a id="storybook-deck-view-17"></a>

### STORYBOOK-DECK-VIEW-17 [TODO] 閲覧ヘルプを閉じて起動元へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で Help の起動ボタンを表示している。

When:

- Help を開き説明を確認し、背景のショートカットを入力してから閉じる。

Then:

- 左右は前後移動、上下は無効として説明し、反転・再生・表示切替・退出の操作を案内する。
- 表示中は背景のショートカットを実行せず、閉じると元の Card を維持して起動ボタンへフォーカスを戻す。Card・学習状態・設定を変えない。

<a id="storybook-deck-view-18"></a>

### STORYBOOK-DECK-VIEW-18 [TODO] 現在の閲覧 Card を編集リンクで開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 編集リンクは既定で表示されている。英語・日本語と狭い画面を独立した表示例とする。

When:

- 表面の鉛筆リンクをキーボードで開き、保存せず閲覧へ戻って裏面も表示する。

Then:

- アイコンのみのリンクが現在の Card の編集画面を開く。読み上げ名を現在の言語で提供し、狭い画面で操作が重ならない。
- 裏面では編集リンクを隠す。保存しないため Card・学習状態を変えない。

<a id="storybook-deck-view-19"></a>

### STORYBOOK-DECK-VIEW-19 [TODO] 間隔0の閲覧では再生を開始しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 再生間隔0の Deck を閲覧できる。匿名・通常アカウントを独立した状態例とする。

When:

- View を開いて待ち、Help の再生操作説明を確認する。

Then:

- 再生操作と進捗スライダーを表示せず、自動送りしない。Help は利用できない理由を表示する。Card・学習状態・設定を変えない。

<a id="storybook-deck-view-20"></a>

### STORYBOOK-DECK-VIEW-20 [TODO] ヘルプの表示中は閲覧の自動送りを止める

カテゴリ: `interaction`

区分: 正常系

Given:

- 正の間隔で Deck を自動再生中である。匿名・通常アカウントを独立した状態例とする。

When:

- Help を開いて間隔を超えて待ち、Help を閉じる。

Then:

- Help 中は同じ Card を維持し、閉じた後は再生選択を保って設定間隔後に次の Card へ進む。学習状態と設定を変えない。

<a id="storybook-deck-view-21"></a>

### STORYBOOK-DECK-VIEW-21 [TODO] 閲覧モードを保ってボタンまたは自動送りで次へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Card の閲覧で view mode が有効、再生間隔が正の値である。

When:

- 次の Card ボタンと、再生ボタンで開始する自動送りを独立した操作例として実行する。

Then:

- 次の Card へ進んでも view mode を維持し、学習状態を変更しない。

<a id="storybook-deck-view-22"></a>

### STORYBOOK-DECK-VIEW-22 [TODO] 閲覧の表示設定を学習と共有する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card の詳細・Help・方向ボタン・再生操作・閲覧の編集リンクを表示しており、同じ Deck に途中の学習がある。外部処理は利用可能な学習状態を返す。

When:

- View の操作一覧で編集リンクと他の表示設定を切り替え、同じ Deck の学習へ移動する。

Then:

- 編集リンクの切替では編集画面へ移動せず、非表示後も操作一覧から戻せる。編集リンクは閲覧だけに適用し、他の表示設定は学習にも反映される。
- 明示的に変更した表示設定以外と、Card・学習位置は変えない。

<a id="storybook-deck-view-23"></a>

### STORYBOOK-DECK-VIEW-23 [TODO] 閲覧モードで長い表面を読み Card 移動を防ぐ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面に長い表面の Card を表示している。

When:

- view mode を有効にし、ホイール・タッチ・方向キーでスクロールし、左右・上下にドラッグする。

Then:

- 本文の先頭と末尾を読める。スワイプと方向キーは Card 移動や画面退出を起こさず、view mode を維持する。学習データは変わらない。

<a id="storybook-deck-view-24"></a>

### STORYBOOK-DECK-VIEW-24 [TODO] 閲覧モードを終了して通常の表裏操作へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 閲覧画面で view mode が有効である。

When:

- タップと Enter を独立した操作例として view mode を終了し、その後に反転・裏面スクロール・タップ・左右移動を操作する。

Then:

- 終了操作だけでは表面を反転せず、終了後は通常の表裏切替・裏面スクロール・左右移動を利用できる。学習データは変わらない。

<a id="storybook-deck-view-25"></a>

### STORYBOOK-DECK-VIEW-25 [TODO] 閲覧のショートカットとフォーカス対象の標準操作を分ける

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントの Deck 閲覧画面で再生操作を表示し、裏面にはスクロール領域がある。

When:

- 本文、入力欄、ボタン、裏面のスクロール領域をそれぞれフォーカスし、Enter・Space・b を入力する。

Then:

- 本文では Enter は反転、Space は再生切替、b は方向ボタンの表示切替として動く。
- 入力欄とボタンの標準操作を妨げず、裏面のスクロール領域の Space はスクロールを優先する。明示的に切り替えた表示設定以外と学習データは変えない。
