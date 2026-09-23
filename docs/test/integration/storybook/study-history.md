# Study History Storybook 結合テスト仕様書

## 目的

期間指定、日別表、最近のセッション、集計グラフの表示と開閉を確認する。
表示用の履歴データと公開 callback を境界とし、履歴の実取得、集計データの正しさ、期間変更後の再取得は対象外とする。

関連 E2E: [study-session](../../e2e/study-session.md)。

書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-HISTORY-01 | interaction | 正常系 | [プリセットの選択要求を通知する](#storybook-study-history-01) |
| STORYBOOK-STUDY-HISTORY-02 | interaction | 正常系 | [任意期間の入力欄を開く](#storybook-study-history-02) |
| STORYBOOK-STUDY-HISTORY-03 | interaction | 正常系 | [折りたたんだ日別表を30日単位で開く](#storybook-study-history-03) |
| STORYBOOK-STUDY-HISTORY-04 | interaction | 正常系 | [日別表の古い日付のページへ進む](#storybook-study-history-04) |
| STORYBOOK-STUDY-HISTORY-05 | render | 正常系 | [最近のセッションの終了状態を区別する](#storybook-study-history-05) |
| STORYBOOK-STUDY-HISTORY-06 | render | 正常系 | [最近のセッションの状態を日本語で表示する](#storybook-study-history-06) |
| STORYBOOK-STUDY-HISTORY-07 | interaction | 正常系 | [最近のセッションを全件展開する](#storybook-study-history-07) |
| STORYBOOK-STUDY-HISTORY-08 | render | 正常系 | [30日分の集計グラフを表示する](#storybook-study-history-08) |
| STORYBOOK-STUDY-HISTORY-09 | render | 正常系 | [90日分のグラフに集約単位を表示する](#storybook-study-history-09) |

<a id="storybook-study-history-01"></a>

### STORYBOOK-STUDY-HISTORY-01 プリセットの選択要求を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 30 days が選択済みの期間選択を表示し、そのボタンの aria-pressed は true である。

When:

- 7 days を押す。

Then:

- 公開された期間選択 callback に 7 が渡される。
- この通知だけで、履歴の再取得や呼出側から与えられる選択状態の更新を保証しない。

<a id="storybook-study-history-02"></a>

### STORYBOOK-STUDY-HISTORY-02 [TODO] 任意期間の入力欄を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 開始日は2026-09-01、終了日は2026-09-22であり、任意期間の入力を閉じている。

When:

- Custom range を押す。

Then:

- Start date と End date の入力欄が表示される。
- 開く前の開始日と終了日がそれぞれの入力欄に保たれる。

<a id="storybook-study-history-03"></a>

### STORYBOOK-STUDY-HISTORY-03 折りたたんだ日別表を30日単位で開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 開始・完了が各1件の日別データ90日分があり、日別表は閉じている。

When:

- Show daily counts · 90 days を押す。

Then:

- 見出し行1行と日別データ30行が表示される。

<a id="storybook-study-history-04"></a>

### STORYBOOK-STUDY-HISTORY-04 [TODO] 日別表の古い日付のページへ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 日付と開始・完了件数を区別できる90日分の日別表があり、最初の30日分を表示している。

When:

- Older dates を押す。

Then:

- 31–60 of 90 days の範囲表示になる。
- 古い日付側の次の30日分が表示され、日付と開始・完了件数は与えられた日別データに一致する。
- 前のページの30日分が残ったり、同じ日付が重複したりしない。

<a id="storybook-study-history-05"></a>

### STORYBOOK-STUDY-HISTORY-05 最近のセッションの終了状態を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中止・未完了の3セッションがあり、未完了の終了日時はない。

When:

- 最近のセッションを表示する。

Then:

- 3件の項目と Completed、Abandoned、Unfinished が表示される。
- 終了日時がない項目に対応する — が表示される。

<a id="storybook-study-history-06"></a>

### STORYBOOK-STUDY-HISTORY-06 最近のセッションの状態を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中止・未完了の3セッションがあり、日本語のモバイル表示を使用している。

When:

- 最近のセッションを表示する。

Then:

- 「最近のセッション」「未完了」「完了」「中止」が表示される。

<a id="storybook-study-history-07"></a>

### STORYBOOK-STUDY-HISTORY-07 最近のセッションを全件展開する

カテゴリ: `interaction`

区分: 正常系

Given:

- 完了セッション10件があり、初期状態は3件に折りたたまれている。

When:

- Show all 10 sessions を押す。

Then:

- 表示件数が3件から10件になる。
- Show fewer sessions は展開済みで、aria-controls が表示中の list の ID を参照する。

<a id="storybook-study-history-08"></a>

### STORYBOOK-STUDY-HISTORY-08 30日分の集計グラフを表示する

カテゴリ: `render`

区分: 正常系

Given:

- 30日分のグラフ用データと開始2件・完了3件の集計値がある。

When:

- 集計を表示する。

Then:

- img role のグラフが表示される。各点の座標や集計の計算自体はこの表示契約の対象外とする。

<a id="storybook-study-history-09"></a>

### STORYBOOK-STUDY-HISTORY-09 90日分のグラフに集約単位を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 90日分のグラフ用データと開始90件・完了45件の集計値がある。

When:

- 集計を表示する。

Then:

- Study counts per 7 days が表示される。
