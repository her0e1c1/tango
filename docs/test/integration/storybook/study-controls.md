# Study Controls Storybook 結合テスト仕様書

## 目的

再生、スキップ、方向操作とヘルプのキーボード操作を確認する。

## 検証境界

Controller、StudySaveControls、SwipeButtonList、StudyHelpDialog と実際の子 UI、Story 側の表示状態、ToastViewport を組み合わせる。回答記録、FSRS 更新、実際の学習進捗の保存は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [study-controls](../../e2e/study-controls.md) と [study-actions](../../e2e/study-actions.md) を参照する。

未実装のケースは見出しの `[TODO]` で示す。ヘルプは実際の子 UI を含む CardPlayer で確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | 正常系 | [再生を要求して一時停止表示にする](#storybook-study-controls-01) |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | 正常系 | [スキップを要求する](#storybook-study-controls-02) |
| STORYBOOK-STUDY-CONTROLS-03 | interaction | 正常系 | [Enter で再生を要求する](#storybook-study-controls-03) |
| STORYBOOK-STUDY-CONTROLS-04 | interaction | 正常系 | [スライダーで表示位置を要求する](#storybook-study-controls-04) |
| STORYBOOK-STUDY-CONTROLS-05 | interaction | 正常系 | [無効な方向を Tab 移動から除く](#storybook-study-controls-05) |
| STORYBOOK-STUDY-CONTROLS-06 | interaction | 正常系 | [Enter で方向操作を要求する](#storybook-study-controls-06) |
| STORYBOOK-STUDY-CONTROLS-07 | interaction | 正常系 | [ヘルプをモーダルとして開く](#storybook-study-controls-07) |
| STORYBOOK-STUDY-CONTROLS-08 | interaction | 正常系 | [ヘルプ内にフォーカスを保ち Escape で戻る](#storybook-study-controls-08) |
| STORYBOOK-STUDY-CONTROLS-09 | interaction | 正常系 | [背景の通知を操作させない](#storybook-study-controls-09) |
| STORYBOOK-STUDY-CONTROLS-10 | interaction | 正常系 | [ヘルプを閉じて通知の操作を戻す](#storybook-study-controls-10) |

<a id="storybook-study-controls-01"></a>

### STORYBOOK-STUDY-CONTROLS-01 再生を要求して一時停止表示にする

カテゴリ: `interaction`

区分: 正常系

Given:

- 停止中で24件中の index 3 を表示し、再生切替を Story 側の状態に反映する。

When:

- Play を押す。

Then:

- 再生切替 callback が一度通知され、Pause が pressed 状態で表示される。

<a id="storybook-study-controls-02"></a>

### STORYBOOK-STUDY-CONTROLS-02 スキップを要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 保存処理中ではない。

When:

- Skip を押す。

Then:

- スキップ callback が一度通知される。

<a id="storybook-study-controls-03"></a>

### STORYBOOK-STUDY-CONTROLS-03 Enter で再生を要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 停止中の Play にフォーカスしている。

When:

- Enter を押す。

Then:

- 再生切替 callback が一度通知される。

<a id="storybook-study-controls-04"></a>

### STORYBOOK-STUDY-CONTROLS-04 スライダーで表示位置を要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 5件中の index 0 を表示している。

When:

- スライダーの値を3へ変更する。

Then:

- 表示位置変更 callback に数値3が渡される。保存結果は確認しない。

<a id="storybook-study-controls-05"></a>

### STORYBOOK-STUDY-CONTROLS-05 無効な方向を Tab 移動から除く

カテゴリ: `interaction`

区分: 正常系

Given:

- 左だけが無効なボタン列を表示する。

When:

- Swipe left を押し、ボタン列の前から Tab で移動する。

Then:

- 左ボタンは見えるが操作を通知せず、Tab は無効な左を飛ばして Swipe up に移る。

<a id="storybook-study-controls-06"></a>

### STORYBOOK-STUDY-CONTROLS-06 Enter で方向操作を要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 有効な左方向のボタンにフォーカスしている。

When:

- Enter を押す。

Then:

- 左方向の callback が一度通知される。

<a id="storybook-study-controls-07"></a>

### STORYBOOK-STUDY-CONTROLS-07 ヘルプをモーダルとして開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 上方向の評価と表裏切替を説明するヘルプが閉じている。

When:

- Open study help を押す。

Then:

- 名前と説明を持つ Study controls の dialog が `aria-modal="true"` で開く。
- Arrow Up / Swipe Up の説明が見え、Close help にフォーカスする。

<a id="storybook-study-controls-08"></a>

### STORYBOOK-STUDY-CONTROLS-08 ヘルプ内にフォーカスを保ち Escape で戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- ポインターでヘルプを開き、Close help にフォーカスしている。

When:

- Tab、Shift+Tab、Escape の順に押す。

Then:

- Tab と Shift+Tab はヘルプ内に留まり、Escape で閉じると開いたボタンへ戻る。

<a id="storybook-study-controls-09"></a>

### STORYBOOK-STUDY-CONTROLS-09 背景の通知を操作させない

カテゴリ: `interaction`

区分: 正常系

Given:

- 手動で閉じられる永続通知がある。

When:

- ヘルプを開き、その表示中に通知が外部から閉じられる。

Then:

- 背景の通知を操作対象にせず、通知が消えても Close help にフォーカスを保つ。

<a id="storybook-study-controls-10"></a>

### STORYBOOK-STUDY-CONTROLS-10 ヘルプを閉じて通知の操作を戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- Strict Mode で永続通知と開いたヘルプを表示している。

When:

- Close help を押す。

Then:

- dialog が消え、Dismiss notification が再び操作できる。
