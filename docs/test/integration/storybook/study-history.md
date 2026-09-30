# 学習履歴画面 Storybook 結合テスト仕様書

## 目的

学習履歴画面を入口とした `play` で、期間の選択と、集計・グラフ・日別表・セッション一覧の連動を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-HISTORY-01 | interaction | 正常系 | [期間プリセットを集計表示へ反映する](#storybook-study-history-01) |
| STORYBOOK-STUDY-HISTORY-02 | interaction | 正常系 | [任意期間を入力する](#storybook-study-history-02) |
| STORYBOOK-STUDY-HISTORY-03 | interaction | 正常系 | [日別表を30日単位で開く](#storybook-study-history-03) |
| STORYBOOK-STUDY-HISTORY-04 | interaction | 正常系 | [日別表の古い日付へ進む](#storybook-study-history-04) |
| STORYBOOK-STUDY-HISTORY-05 | render | 正常系 | [セッションの終了状態を区別する](#storybook-study-history-05) |
| STORYBOOK-STUDY-HISTORY-06 | render | 正常系 | [セッションの状態を日本語で表示する](#storybook-study-history-06) |
| STORYBOOK-STUDY-HISTORY-07 | interaction | 正常系 | [最近のセッションをすべて展開する](#storybook-study-history-07) |
| STORYBOOK-STUDY-HISTORY-08 | render | 正常系 | [30日分の集計グラフを表示する](#storybook-study-history-08) |
| STORYBOOK-STUDY-HISTORY-09 | render | 正常系 | [90日分のグラフに集約単位を示す](#storybook-study-history-09) |

<a id="storybook-study-history-01"></a>

### STORYBOOK-STUDY-HISTORY-01 期間プリセットを集計表示へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に選択期間の内外の記録がある。

When:

- 別の期間プリセットを選ぶ。

Then:

- 選択状態と表示期間が変わり、その期間の記録に対応する集計が表示される。

<a id="storybook-study-history-02"></a>

### STORYBOOK-STUDY-HISTORY-02 任意期間を入力する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で期間プリセットを表示している。

When:

- 任意期間を選ぶ。

Then:

- 開始日と終了日の入力欄が表示され、指定した期間を選べる。

<a id="storybook-study-history-03"></a>

### STORYBOOK-STUDY-HISTORY-03 日別表を30日単位で開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に30日を超える日別データがあり、日別表は折りたたまれている。

When:

- 日別表を開く。

Then:

- 30日分の日別行と、残りの日付を確認する操作が表示される。

<a id="storybook-study-history-04"></a>

### STORYBOOK-STUDY-HISTORY-04 日別表の古い日付へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面の日別表に30日を超えるデータがある。

When:

- 古い日付のページへ進む。

Then:

- 現在のページと異なる古い日付の行が表示され、日付に対応した値を確認できる。

<a id="storybook-study-history-05"></a>

### STORYBOOK-STUDY-HISTORY-05 セッションの終了状態を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中断など異なる終了状態の学習セッションがある。

When:

- 学習履歴画面を開く。

Then:

- 最近のセッションにそれぞれの状態が区別して表示される。

<a id="storybook-study-history-06"></a>

### STORYBOOK-STUDY-HISTORY-06 セッションの状態を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 日本語の表示設定で、終了状態の異なる学習セッションがある。

When:

- 学習履歴画面を開く。

Then:

- 状態は日本語で表示され、Deck 名などのユーザー入力は変更されない。

<a id="storybook-study-history-07"></a>

### STORYBOOK-STUDY-HISTORY-07 最近のセッションをすべて展開する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で最近のセッションの一部が折りたたまれている。

When:

- 全件を表示する操作を選ぶ。

Then:

- 隠れていたセッションも表示され、各セッションの内容を確認できる。

<a id="storybook-study-history-08"></a>

### STORYBOOK-STUDY-HISTORY-08 30日分の集計グラフを表示する

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の対象期間は30日で、期間内に記録がある。

When:

- グラフを確認する。

Then:

- 対象期間の集計を示すグラフと、期間・値を理解できる表示がある。

<a id="storybook-study-history-09"></a>

### STORYBOOK-STUDY-HISTORY-09 90日分のグラフに集約単位を示す

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の対象期間は90日で、期間内に記録がある。

When:

- グラフを確認する。

Then:

- 集約されたグラフに集約単位が表示され、1日分の値と誤認しない。
