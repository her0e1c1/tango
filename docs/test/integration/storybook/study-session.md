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
