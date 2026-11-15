# 学習画面 Storybook 結合テスト仕様書

## 目的

学習画面を入口とした `play` で、セッション内の表示、回答・スキップ・再生・位置変更・完了とヘルプを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | 正常系 | [再生を開始して一時停止表示にする](#storybook-study-controls-01) |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | 正常系 | [Card を評価せずスキップする](#storybook-study-controls-02) |
| STORYBOOK-STUDY-CONTROLS-03 | interaction | 正常系 | [Enter で再生を開始する](#storybook-study-controls-03) |
| STORYBOOK-STUDY-CONTROLS-04 | interaction | 正常系 | [スライダーで表示位置を変える](#storybook-study-controls-04) |
| STORYBOOK-STUDY-CONTROLS-05 | interaction | 正常系 | [無効な方向操作を Tab 移動から除く](#storybook-study-controls-05) |
| STORYBOOK-STUDY-CONTROLS-06 | interaction | 正常系 | [Enter で有効な方向操作を実行する](#storybook-study-controls-06) |
| STORYBOOK-STUDY-CONTROLS-07 | interaction | 正常系 | [学習ヘルプをモーダルとして開く](#storybook-study-controls-07) |
| STORYBOOK-STUDY-CONTROLS-08 | interaction | 正常系 | [ヘルプ内にフォーカスを保ち Escape で戻る](#storybook-study-controls-08) |
| STORYBOOK-STUDY-CONTROLS-09 | interaction | 正常系 | [ヘルプ表示中は背景の通知を操作させない](#storybook-study-controls-09) |
| STORYBOOK-STUDY-CONTROLS-10 | interaction | 正常系 | [ヘルプを閉じて通知の操作を戻す](#storybook-study-controls-10) |
| STORYBOOK-STUDY-SESSION-01 | interaction | 正常系 | [解答を確認して評価すると次へ進む](#storybook-study-session-01) |
| STORYBOOK-STUDY-SESSION-02 | interaction | 正常系 | [最後の Card を終えると完了を表示する](#storybook-study-session-02) |
| STORYBOOK-STUDY-SESSION-03 | interaction | 異常系 | [回答処理の失敗を成功と扱わない](#storybook-study-session-03) |
| STORYBOOK-STUDY-SESSION-04 | interaction | 正常系 | [方向ボタンの名前が言語と現在の操作に追従する](#storybook-study-session-04) |
| STORYBOOK-STUDY-SESSION-05 | interaction | 正常系 | [主ボタンの上ドラッグで一つ先の表面へ進む](#storybook-study-session-05) |
| STORYBOOK-STUDY-SESSION-06 | interaction | 正常系 | [主ボタン以外のドラッグでは進まない](#storybook-study-session-06) |
| STORYBOOK-STUDY-SESSION-07 | interaction | 正常系 | [Help の説明を割り当てとボタン表示に合わせる](#storybook-study-session-07) |
| STORYBOOK-STUDY-SESSION-08 | interaction | 正常系 | [閲覧モードで本文を読む操作を学習操作から分離する](#storybook-study-session-08) |
| STORYBOOK-STUDY-SESSION-09 | interaction | 正常系 | [Space と b の長押しでは一度だけ切り替える](#storybook-study-session-09) |
| STORYBOOK-STUDY-SESSION-10 | interaction | 正常系 | [Help 内の入力と通知変化で背景を操作しない](#storybook-study-session-10) |
| STORYBOOK-STUDY-SESSION-11 | interaction | 正常系 | [閲覧モードのピンチ拡大では学習が進まない](#storybook-study-session-11) |
| STORYBOOK-STUDY-SESSION-12 | interaction | 正常系 | [Help ボタンの表示を切り替える](#storybook-study-session-12) |
| STORYBOOK-STUDY-SESSION-13 | interaction | 正常系 | [閲覧モードを終了する入力で Card を裏返さない](#storybook-study-session-13) |
| STORYBOOK-STUDY-SESSION-14 | interaction | 正常系 | [閲覧モードでも評価と自動再生の移動を利用する](#storybook-study-session-14) |
| STORYBOOK-STUDY-SESSION-15 | interaction | 正常系 | [閲覧モードとボタン表示を閲覧画面と共有する](#storybook-study-session-15) |
| STORYBOOK-STUDY-SESSION-16 | interaction | 正常系 | [短い横向き画面でも本文と各操作へ到達する](#storybook-study-session-16) |
| STORYBOOK-STUDY-SESSION-17 | interaction | 正常系 | [方向ボタンの名前と Help を現在の操作に一致させる](#storybook-study-session-17) |
| STORYBOOK-STUDY-SESSION-18 | interaction | 正常系 | [方向キーを押し続けても次の Card を評価しない](#storybook-study-session-18) |
| STORYBOOK-STUDY-SESSION-19 | interaction | 正常系 | [修飾付き入力を学習ショートカットと扱わない](#storybook-study-session-19) |
| STORYBOOK-STUDY-SESSION-20 | interaction | 正常系 | [Card・表裏・モードの変更でスクロールを戻す](#storybook-study-session-20) |
| STORYBOOK-STUDY-SESSION-21 | interaction | 正常系 | [裏面の表示・文字選択・タップを区別する](#storybook-study-session-21) |
| STORYBOOK-STUDY-SESSION-22 | interaction | 正常系 | [狭い裏面でも操作領域上から本文を読める](#storybook-study-session-22) |
| STORYBOOK-STUDY-SESSION-23 | interaction | 正常系 | [裏面の左右領域で割り当てた操作だけを実行する](#storybook-study-session-23) |
| STORYBOOK-STUDY-SESSION-24 | interaction | 正常系 | [スライダーの後方入力で前の Card へ戻らない](#storybook-study-session-24) |
| STORYBOOK-STUDY-SESSION-25 | interaction | 正常系 | [入力手段と方向の評価を一致させる](#storybook-study-session-25) |
| STORYBOOK-STUDY-SESSION-26 | interaction | 正常系 | [評価以外の操作で回答と記憶状態を変えない](#storybook-study-session-26) |
| STORYBOOK-STUDY-SESSION-27 | interaction | 正常系 | [保存結果の待機中は競合操作を受け付けない](#storybook-study-session-27) |
| STORYBOOK-STUDY-SESSION-28 | interaction | 正常系 | [古い学習の結果で現在の画面を変更しない](#storybook-study-session-28) |
| STORYBOOK-STUDY-SESSION-29 | interaction | 正常系 | [明示的な学習中止の成功で一覧へ戻る](#storybook-study-session-29) |
| STORYBOOK-STUDY-SESSION-30 | interaction | 異常系 | [一部の保存失敗を通知して後続の評価を続ける](#storybook-study-session-30) |
| STORYBOOK-STUDY-SESSION-31 | interaction | 異常系 | [匿名の操作受付後に届く診断で後続操作を妨げない](#storybook-study-session-31) |
| STORYBOOK-STUDY-SESSION-32 | interaction | 異常系 | [同期失敗と復元位置を受け取るとその Card を表示する](#storybook-study-session-32) |
| STORYBOOK-STUDY-SESSION-33 | interaction | 正常系 | [完了時は回答数によらず対象枚数を表示する](#storybook-study-session-33) |
| STORYBOOK-STUDY-SESSION-34 | interaction | 正常系 | [学習 URL の読み込み中と後から届く学習を表示する](#storybook-study-session-34) |
| STORYBOOK-STUDY-SESSION-35 | interaction | 正常系 | [間隔0では自動送りを止めて手動学習を続ける](#storybook-study-session-35) |
| STORYBOOK-STUDY-SESSION-36 | interaction | 正常系 | [間隔を戻して同じ学習の再生を利用する](#storybook-study-session-36) |
| STORYBOOK-STUDY-SESSION-37 | interaction | 異常系 | [狭い画面で復旧警告と正常な Card を操作する](#storybook-study-session-37) |
| STORYBOOK-STUDY-SESSION-38 | interaction | 異常系 | [保存失敗後は巻き戻しを待たず操作待ちを解除する](#storybook-study-session-38) |
| STORYBOOK-STUDY-SESSION-39 | interaction | 異常系 | [学習不在を案内し後から届く学習を表示する](#storybook-study-session-39) |

<a id="storybook-study-controls-01"></a>

### STORYBOOK-STUDY-CONTROLS-01 再生を開始して一時停止表示にする

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で24件中の4件目を表示し、自動再生は停止している。

When:

- Play を選ぶ。

Then:

- 再生状態になり、Pause が押下状態として表示される。

<a id="storybook-study-controls-02"></a>

### STORYBOOK-STUDY-CONTROLS-02 Card を評価せずスキップする

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に次の Card があり、保存処理中ではない。

When:

- Skip を選ぶ。

Then:

- 次の Card が表示され、スキップした Card の評価結果は表示されない。

<a id="storybook-study-controls-03"></a>

### STORYBOOK-STUDY-CONTROLS-03 Enter で再生を開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で停止中の Play にフォーカスしている。

When:

- Enter を押す。

Then:

- 再生状態へ切り替わり、一時停止の操作が表示される。

<a id="storybook-study-controls-04"></a>

### STORYBOOK-STUDY-CONTROLS-04 スライダーで表示位置を変える

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で5件のうち先頭を表示している。

When:

- スライダーで別の表示位置を選ぶ。

Then:

- スライダーの位置、進捗の表示、表示中の Card が同じ学習位置を示す。

<a id="storybook-study-controls-05"></a>

### STORYBOOK-STUDY-CONTROLS-05 無効な方向操作を Tab 移動から除く

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で左方向の操作だけが無効である。

When:

- 左方向の操作を試み、操作列の前から Tab で移動する。

Then:

- 左方向の操作は実行されず、Tab は無効な操作を飛ばして次の有効な操作へ移る。

<a id="storybook-study-controls-06"></a>

### STORYBOOK-STUDY-CONTROLS-06 Enter で有効な方向操作を実行する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で有効な左方向の操作にフォーカスしている。

When:

- Enter を押す。

Then:

- 操作説明に対応する学習画面の変化が起き、一回の操作で二重に処理されない。

<a id="storybook-study-controls-07"></a>

### STORYBOOK-STUDY-CONTROLS-07 学習ヘルプをモーダルとして開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で上方向の評価と表裏切替が利用でき、ヘルプは閉じている。

When:

- ヘルプを開く。

Then:

- 名前と説明を持つモーダルが開き、Arrow Up / Swipe Up の説明が表示され、閉じる操作へフォーカスが移る。

<a id="storybook-study-controls-08"></a>

### STORYBOOK-STUDY-CONTROLS-08 ヘルプ内にフォーカスを保ち Escape で戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習ヘルプを開き、閉じる操作にフォーカスしている。

When:

- Tab、Shift+Tab、Escape の順に押す。

Then:

- Tab 移動はヘルプ内に留まり、Escape で閉じるとヘルプを開いた操作へフォーカスが戻る。

<a id="storybook-study-controls-09"></a>

### STORYBOOK-STUDY-CONTROLS-09 ヘルプ表示中は背景の通知を操作させない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に手動で閉じられる通知がある。

When:

- ヘルプを開き、その表示中に通知が消える。

Then:

- ヘルプ表示中は背景の通知を操作できず、通知が消えてもヘルプ内のフォーカスは保たれる。

<a id="storybook-study-controls-10"></a>

### STORYBOOK-STUDY-CONTROLS-10 ヘルプを閉じて通知の操作を戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に通知とヘルプが表示されている。

When:

- ヘルプを閉じる。

Then:

- ヘルプが消え、通知を閉じる操作を再び利用できる。

<a id="storybook-study-session-01"></a>

### STORYBOOK-STUDY-SESSION-01 解答を確認して評価すると次へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に評価していない Card が2枚あり、回答の保存先は成功を返す。

When:

- 解答を表示し、Good に対応する操作で評価する。

Then:

- 次の Card と更新後の学習位置が表示される。回答の実保存や FSRS 計算の正しさはこの画面だけでは保証しない。

<a id="storybook-study-session-02"></a>

### STORYBOOK-STUDY-SESSION-02 最後の Card を終えると完了を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で最後の Card を表示し、回答の保存先は成功を返す。

When:

- 最後の Card を評価する。

Then:

- 学習完了の表示になり、存在しない次の Card を操作させない。
- 対象 Card 数を「Session: 2 cards」と表示し、完了見出しにフォーカスが移る。件数は回答数や閲覧数ではなく、session に含まれる Card 数を表す。

<a id="storybook-study-session-03"></a>

### STORYBOOK-STUDY-SESSION-03 回答処理の失敗を成功と扱わない

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習画面で解答を表示し、回答の保存先は失敗を返す。

When:

- 評価操作を行う。

Then:

- 失敗が利用者に示され、成功した回答として完了画面に進まない。

<a id="storybook-study-session-04"></a>

### STORYBOOK-STUDY-SESSION-04 方向ボタンの名前が言語と現在の操作に追従する

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語の学習画面で、既定の評価を持つ4方向ボタンと Card の表面を表示している。

When:

- 左方向ボタンへフォーカスを移し、日本語へ切り替える。
- 上を学習終了、下を操作なし、左をスキップ、右を Hard の有効な割り当てへ切り替える。

Then:

- 各方向ボタンの名前に翻訳済みの方向と現在の caption が含まれ、言語と割り当ての変更に追従する。
- 同じ左方向ボタンへフォーカスが残り、Card と学習位置は変わらない。
- 操作なしのボタンは表示されたまま無効になる。名前の更新による回答の保存は発生しない。

<a id="storybook-study-session-05"></a>

### STORYBOOK-STUDY-SESSION-05 [TODO] 主ボタンの上ドラッグで一つ先の表面へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に複数の Card があり、現在の表面を表示している。上方向は Easy に割り当てられ、保存先は成功を返す。匿名・通常アカウントのそれぞれで確認する。

When:

- 主ボタンで Card を上方向へドラッグする。

Then:

- Easy の評価に対応する結果となり、次の Card の表面へ一つ進む。ドラッグ後のクリックで次の Card を裏返さない。

<a id="storybook-study-session-06"></a>

### STORYBOOK-STUDY-SESSION-06 [TODO] 主ボタン以外のドラッグでは進まない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で現在の Card の表面を表示している。

When:

- マウスの主ボタン以外で Card を操作方向へドラッグする。

Then:

- 同じ Card の表面と学習位置を維持し、回答や記憶状態を変更しない。

<a id="storybook-study-session-07"></a>

### STORYBOOK-STUDY-SESSION-07 [TODO] Help の説明を割り当てとボタン表示に合わせる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の方向操作は既定と異なる割り当てで、一部のボタンは非表示である。英語・日本語と、通常・閲覧モードのそれぞれで確認する。

When:

- Help を開く。

Then:

- 方向操作・表裏・再生・ボタン表示・Card details・一覧へ戻る説明が現在の割り当てと表示設定に一致する。
- 4段階評価の意味、スキップ、学習終了、操作なし、学習を保持して離れる Exit を区別する。前の Card へ戻る操作は示さない。

<a id="storybook-study-session-08"></a>

### STORYBOOK-STUDY-SESSION-08 [TODO] 閲覧モードで本文を読む操作を学習操作から分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に数式を含む長い表面があり、閲覧モードは ON である。

When:

- ホイール・タッチ・方向キー・Space・PageUp／PageDown でスクロールし、全方向へのドラッグと文字選択を行う。

Then:

- 文字サイズと数式を保って末尾まで読め、本文と操作部が重ならない。
- 評価、Card 移動、表裏切り替え、再生開始、モード終了は起こらず、回答・記憶状態・学習位置を維持する。

<a id="storybook-study-session-09"></a>

### STORYBOOK-STUDY-SESSION-09 [TODO] Space と b の長押しでは一度だけ切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面は閲覧モード OFF、表面表示、自動再生停止、方向ボタン表示である。操作中に自動で Card が移らない再生間隔を使う。
- Space では再生状態、b では方向ボタン表示を確認する。

When:

- 対象キーを押して保持し、離して再び押す。

Then:

- 最初の押下で対象状態が切り替わり、保持中は維持され、再押下でもう一度切り替わる。Card、回答、記憶状態、学習位置は変わらない。

<a id="storybook-study-session-10"></a>

### STORYBOOK-STUDY-SESSION-10 [TODO] Help 内の入力と通知変化で背景を操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で Help を開き、Close help にフォーカスがある。背景には閉じることができる通知がある。

When:

- 方向キーとボタン表示切替キーを入力し、通知の表示・消去・置き換え中にもフォーカスを移動して、Help を閉じる。

Then:

- Card、回答、記憶状態、学習位置、ボタン表示設定を変更しない。通知に誤操作やフォーカス移動は起きず、Help 内にフォーカスを保つ。
- 閉じると Help の起動ボタンへフォーカスが戻り、残った通知を再び操作できる。

<a id="storybook-study-session-11"></a>

### STORYBOOK-STUDY-SESSION-11 [TODO] 閲覧モードのピンチ拡大では学習が進まない

カテゴリ: `interaction`

区分: 正常系

Given:

- タッチ入力に対応するブラウザーの学習画面で長い表面を表示し、閲覧モードは ON である。

When:

- 本文を2本指でピンチ拡大する。

Then:

- 表示倍率が上がり、評価・Card 移動・モード終了は起こらない。

<a id="storybook-study-session-12"></a>

### STORYBOOK-STUDY-SESSION-12 [TODO] Help ボタンの表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に Help ボタンと省略ボタンが重ならず表示されている。

When:

- Study actions から Help ボタンの表示を OFF にする。

Then:

- Help ボタンが消え、他の操作と学習位置は維持される。

<a id="storybook-study-session-13"></a>

### STORYBOOK-STUDY-SESSION-13 [TODO] 閲覧モードを終了する入力で Card を裏返さない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で Card の表面を表示し、閲覧モードは ON である。タップと Enter のそれぞれで確認する。

When:

- 本文をタップするか、修飾なしの Enter を押して保持し、離して再び Enter を押す。

Then:

- タップまたは最初の Enter は表面を維持して閲覧モードだけを OFF にする。保持中は裏返らず、次の Enter で裏面へ切り替わる。

<a id="storybook-study-session-14"></a>

### STORYBOOK-STUDY-SESSION-14 [TODO] 閲覧モードでも評価と自動再生の移動を利用する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に複数の Card があり、閲覧モードは ON で本文をスクロールしている。保存先は成功を返し、自動再生間隔は正の値である。
- 評価ボタンと自動再生のそれぞれで確認する。

When:

- 評価ボタンで進むか、再生を開始して次の Card へ進む。

Then:

- 次の Card の表面を表示し、閲覧モードは ON のまま、本文のスクロール位置は先頭になる。

<a id="storybook-study-session-15"></a>

### STORYBOOK-STUDY-SESSION-15 [TODO] 閲覧モードとボタン表示を閲覧画面と共有する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で閲覧モードは ON、閲覧モードボタンは表示されている。

When:

- 省略メニューで閲覧モードボタンを非表示にして Deck 閲覧へ移動し、再表示して学習画面へ戻る。閲覧モードの ON / OFF の反映も確認する。

Then:

- 両画面で同じアイコンからボタン表示を切り替えられ、表示設定と閲覧モードが共有される。表示切替と画面移動だけでは閲覧モードと学習位置を変えず、他の設定も維持する。

<a id="storybook-study-session-16"></a>

### STORYBOOK-STUDY-SESSION-16 [TODO] 短い横向き画面でも本文と各操作へ到達する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の viewport は568×320で長い表面を表示し、閲覧モード、Card 情報・評価・再生・Skip は ON である。

When:

- 省略メニューを開き、本文と各操作部をスクロールする。

Then:

- 本文は画面高の半分以上の領域で末尾まで読め、評価・再生・Skip もスクロールして操作できる。評価・Card 移動・モード終了は起こらない。

<a id="storybook-study-session-17"></a>

### STORYBOOK-STUDY-SESSION-17 [TODO] 方向ボタンの名前と Help を現在の操作に一致させる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に4方向ボタンがあり、英語・日本語、既定の評価割り当てと上＝学習終了・下＝操作なし・左＝スキップ・右＝Hard の条件で確認する。

When:

- 読み上げ名、キャプション、Help の説明を確認し、言語と割り当てを変更する。

Then:

- 方向と現在の操作を含む名前となり、既定の上方向は「Swipe up: Easy」または「上へスワイプ: Easy」となる。Help とキャプションも一致する。
- 名前の更新でフォーカス・Card・回答・学習位置・他の設定を変えず、矢印・キャプション・ボタンの順序を維持する。操作なしは無効のまま表示し、Tab の対象外にする。

<a id="storybook-study-session-18"></a>

### STORYBOOK-STUDY-SESSION-18 [TODO] 方向キーを押し続けても次の Card を評価しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に未評価 Card が複数あり、閲覧モードは OFF、方向キーには4段階評価が割り当てられている。保存先は成功を返す。

When:

- 方向キーを押し、次の Card が操作可能になっても保持し、離して再び押す。

Then:

- 最初の押下で割当どおりの評価と一つ先への移動を行う。保持中は次の Card の回答・記憶状態・復習予定・位置を変えず、再押下で初めて次の評価を行う。

<a id="storybook-study-session-19"></a>

### STORYBOOK-STUDY-SESSION-19 [TODO] 修飾付き入力を学習ショートカットと扱わない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の表面を表示している。閲覧モード OFF と ON のそれぞれで確認し、自動再生は停止している。

When:

- Ctrl・Meta・Alt を伴う方向キー・Enter・Space・b を入力する。Shift 併用も含め、続けて修飾なしの Enter と方向キーを入力する。

Then:

- 修飾付き入力で表裏・再生・モード・ボタン表示・回答・記憶状態・復習予定・位置を変更しない。通常の Enter と方向キーは現在のモードと割当どおり動作する。
- 無視した入力の既定動作と伝播を妨げず、入力欄・contenteditable・ボタン・スライダー・読取領域を操作できる。Shift 単独の割り当ては維持する。

<a id="storybook-study-session-20"></a>

### STORYBOOK-STUDY-SESSION-20 [TODO] Card・表裏・モードの変更でスクロールを戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の長い本文を先頭以外までスクロールしている。

When:

- Card、表裏、閲覧モードのいずれかを変更する。

Then:

- 変更後の本文はスクロール位置が先頭になる。

<a id="storybook-study-session-21"></a>

### STORYBOOK-STUDY-SESSION-21 [TODO] 裏面の表示・文字選択・タップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の Card に表裏の本文がある。操作領域の表示 ON / OFF のそれぞれで確認する。

When:

- 表面から裏面へ切り替え、裏面の本文を主ボタンでドラッグ選択する。操作領域 OFF の場合は裏面をタップする。

Then:

- 表面の選択で同じ Card の裏面になり、文字選択では裏面を維持する。
- 操作領域 OFF では左右領域を表示せず、裏面タップで同じ Card の表面へ戻る。これらの操作で回答・記憶状態・学習位置を変えない。

<a id="storybook-study-session-22"></a>

### STORYBOOK-STUDY-SESSION-22 [TODO] 狭い裏面でも操作領域上から本文を読める

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の裏面は表示領域より長い。幅320pxで左右操作領域を ON とし、両領域に前方移動を割り当てた条件と、領域なしの条件で確認する。

When:

- 裏面の解答領域をスクロールする。領域 ON では左領域上のホイールと右領域上のタッチで確認する。

Then:

- 本文は解答領域と同じ全幅で、左右領域は本文に重なる。下側の本文を読め、右領域と画面端の間のスクロールバーも操作できる。
- 同じ Card の裏面を維持し、設定した評価・移動は実行せず、回答・記憶状態・学習位置を変えない。

<a id="storybook-study-session-23"></a>

### STORYBOOK-STUDY-SESSION-23 [TODO] 裏面の左右領域で割り当てた操作だけを実行する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に次の Card があり、裏面操作領域は ON、左＝Good・右＝Again である。保存先は成功を返す。左右を独立した状態で確認する。

When:

- 裏面を開き、対象側の操作領域をタップする。

Then:

- 対象側に割り当てた評価として処理し、次の Card の表面へ一つ進む。タップの伝播で次の Card を裏返さない。

<a id="storybook-study-session-24"></a>

### STORYBOOK-STUDY-SESSION-24 [TODO] スライダーの後方入力で前の Card へ戻らない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で先頭より後の Card を表示している。

When:

- 学習操作と Help を確認し、ポインターとキーボードで進捗スライダーを後方へ動かそうとする。

Then:

- 前の Card へ戻る操作・設定・表示はなく、後方入力では現在位置を維持する。前方移動は引き続き利用できる。

<a id="storybook-study-session-25"></a>

### STORYBOOK-STUDY-SESSION-25 [TODO] 入力手段と方向の評価を一致させる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の4方向は左＝Again・下＝Hard・右＝Good・上＝Easy で、各方向を独立した Card で確認する。
- 評価ボタン・方向キー・スワイプ・裏面操作領域を利用でき、保存先は成功を返す。スワイプ通知は ON である。

When:

- 対象の入力手段で各方向の評価を行う。

Then:

- どの入力手段でも同じ方向は同じ評価に対応し、選んだ評価とその記憶状態・復習予定を保存境界へ渡して次の表面へ進む。本文・タグ・所属・作成日時は維持する。
- Again でも同じ学習の末尾へ追加し直さない。実行方向は言語に依存しないアイコンで短時間通知する。

<a id="storybook-study-session-26"></a>

### STORYBOOK-STUDY-SESSION-26 [TODO] 評価以外の操作で回答と記憶状態を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に次の Card があり、裏面・Help・離脱・前方スライダー・自動再生・Skip を利用できる。必要な位置保存は成功を返す。

When:

- 評価せずに対象操作を行う。各操作は独立した状態で確認する。

Then:

- 回答を追加せず、Card の記憶状態・復習予定・最終復習・本文・タグを変更しない。Skip・前方スライダー・自動再生では対象の次の表面へ移動し、裏面表示と Help では学習位置も維持する。

<a id="storybook-study-session-27"></a>

### STORYBOOK-STUDY-SESSION-27 [TODO] 保存結果の待機中は競合操作を受け付けない

カテゴリ: `interaction`

区分: 正常系

Given:

- 通常アカウントの学習画面で、回答・位置変更・中止のいずれかの保存先が未完了である。最後の回答では、先に学習不在の状態が届く条件も確認する。

When:

- 保存中に評価・Skip・スライダー・自動再生移動を重ね、その後に成功結果が届く。

Then:

- 保存中は回答の重複や飛び越しを防ぎ、最後の保存中は読み込み表示として完了・一覧へ自動遷移しない。
- 成功の確定後は操作待ちを解除して受信内容を表示する。

<a id="storybook-study-session-28"></a>

### STORYBOOK-STUDY-SESSION-28 [TODO] 古い学習の結果で現在の画面を変更しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の保存結果が届く前にアカウントまたは学習対象が切り替わっている。

When:

- 以前の保存結果が届き、以前の Card への評価を試みる。

Then:

- 以前の結果で現在の Card を進めず、以前の学習の通知を表示しない。以前のアカウントの Card を評価できない。

<a id="storybook-study-session-29"></a>

### STORYBOOK-STUDY-SESSION-29 [TODO] 明示的な学習中止の成功で一覧へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面に未完了の学習があり、中止の保存先は成功を返す。

When:

- 明示的に学習を中止する。

Then:

- 成功後に Deck 一覧へ戻る。完了メッセージとして表示しない。

<a id="storybook-study-session-30"></a>

### STORYBOOK-STUDY-SESSION-30 [TODO] 一部の保存失敗を通知して後続の評価を続ける

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習画面に現在の Card の後ろに2枚以上がある。回答履歴だけは失敗を返し、学習状態と位置は成功を返す。次の評価はすべて成功を返す。スワイプ通知は ON である。

When:

- 現在の Card を評価し、失敗の表示後に次の Card を評価する。

Then:

- 最初は失敗を通知してスワイプ通知は表示しない。受信済みの次の位置を表示し、失敗した回答を画面側で自動再登録しない。
- 次の評価はさらに次の表面へ進み、成功した方向のスワイプ通知を表示する。

<a id="storybook-study-session-31"></a>

### STORYBOOK-STUDY-SESSION-31 [TODO] 匿名の操作受付後に届く診断で後続操作を妨げない

カテゴリ: `interaction`

区分: 異常系

Given:

- 匿名の学習画面で保存境界は受付済みとして応答し、表示状態は別に届く。次の操作中に先の保存エラー診断が届く。

When:

- 次の学習操作を行い、その後に以前の保存エラー診断が届く。

Then:

- 先のサーバー応答や表示状態の到着だけを待って次の操作を拒まない。古い診断で後続操作の待機状態を変えず、画面は受信内容に従う。

<a id="storybook-study-session-32"></a>

### STORYBOOK-STUDY-SESSION-32 [TODO] 同期失敗と復元位置を受け取るとその Card を表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習画面では評価後の学習状態と回答履歴が成功を返した後、位置の失敗と復元された学習位置を受け取れる。

When:

- 位置の失敗と復元された状態が届く。

Then:

- 失敗を通知し、復元された位置の Card を表示する。成功済みの学習状態と回答履歴を画面側で取り消さない。

<a id="storybook-study-session-33"></a>

### STORYBOOK-STUDY-SESSION-33 [TODO] 完了時は回答数によらず対象枚数を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で最後の Card を表示し、対象は1枚または複数枚で、途中を Skip・スライダーで通過した条件も確認する。英語・日本語で保存先は成功を返す。

When:

- 最後の Card を評価して完了し、Deck 一覧へ戻る。

Then:

- 対象枚数を「対象カード: ○枚」、1枚は「Session: 1 card」、複数は「Session: ○ cards」と表示する。回答数・閲覧数に置き換えない。
- 完了見出しへフォーカスを移し、自動で遷移せず一覧へ戻る操作を示す。戻ると対象 Deck の Continue は表示しない。

<a id="storybook-study-session-34"></a>

### STORYBOOK-STUDY-SESSION-34 [TODO] 学習 URL の読み込み中と後から届く学習を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面の URL を直接開き、学習は読込中である。その後に利用可能な学習が届く。

When:

- 学習画面を開き、利用可能な学習と現在位置の状態が届く。

Then:

- 読込中に一覧へ戻らず、待機だけでは Start / Restart を無効にしない。
- 学習が届くと、その順序と現在位置の Card を表示する。

<a id="storybook-study-session-35"></a>

### STORYBOOK-STUDY-SESSION-35 [TODO] 間隔0では自動送りを止めて手動学習を続ける

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習画面で間隔は0、シャッフルは OFF、「自動再生で開始」と「再生操作を表示」は ON である。

When:

- 時間が経過し、Help を開閉して Space を押してから手動で次の Card へ進む。

Then:

- 自動送りを行わず、再生・一時停止・進捗スライダーを表示しない。Help は利用不可を説明する。
- Space で設定を変更せず、手動の移動は利用でき、学習の進行を維持する。

<a id="storybook-study-session-36"></a>

### STORYBOOK-STUDY-SESSION-36 [TODO] 間隔を戻して同じ学習の再生を利用する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔0で手動移動した位置の学習があり、「自動再生で開始」と「再生操作を表示」は ON である。学習画面への再入場時は間隔が正の値に変更されている。

When:

- 同じ学習画面へ入り、再生を一時停止する。

Then:

- 同じ対象・出題順・位置で再開し、再生操作を表示する。入場時は自動再生設定に従い、一時停止してもその設定を無効にしない。
- 他の設定と Deck・Card 内容は変わらず、手動移動後の位置を保持する。

<a id="storybook-study-session-37"></a>

### STORYBOOK-STUDY-SESSION-37 [TODO] 狭い画面で復旧警告と正常な Card を操作する

カテゴリ: `interaction`

区分: 異常系

Given:

- 匿名の学習画面で正常な Card 1枚と読取不能な Card 1枚の判定結果、および復旧警告がある。viewport は390×844で、既定の評価・再生操作を表示している。保存先は成功を返す。

When:

- スクロールせずに再生・停止を操作し、正常な Card を評価して完了する。

Then:

- 初期 viewport 内に警告・正常な本文・評価・再生操作が収まり、警告によって操作が隠れない。正常な Card で完了し、「Session: 1 card」を表示する。

<a id="storybook-study-session-38"></a>

### STORYBOOK-STUDY-SESSION-38 [TODO] 保存失敗後は巻き戻しを待たず操作待ちを解除する

カテゴリ: `interaction`

区分: 異常系

Given:

- 通常アカウントの学習画面で回答・位置変更・中止のいずれかの保存先が未完了で、その後に失敗を返す。

When:

- 保存失敗が届き、その後に復元された表示状態が届く。

Then:

- 失敗を通知して操作待ちを解除する。巻き戻しを待つだけで操作を制限し続けず、復元状態が届くとその内容を表示する。

<a id="storybook-study-session-39"></a>

### STORYBOOK-STUDY-SESSION-39 [TODO] 学習不在を案内し後から届く学習を表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習画面で読込完了を受け取ったが、対象の学習は存在しない。

When:

- 学習画面を確認し、その後に利用可能な学習が届く。

Then:

- 利用できない旨と一覧へ戻る操作を示し、自動遷移しない。学習が届くと、その内容と現在位置の Card を表示する。
