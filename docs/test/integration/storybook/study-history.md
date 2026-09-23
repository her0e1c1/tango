# Study History Storybook 結合テスト仕様書

## 目的

期間指定、日別表、最近のセッション、集計グラフの表示と開閉を確認する。

## 検証境界

実際の履歴 UI、フォームと表示用 chart query。履歴取得や集計データの正しさ、期間変更後の再取得は対象外。

関連 E2E: [study-session](../../e2e/study-session.md)。

書式・実行前提は [README](./README.md) を参照する。

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

- 30 days が選択済みの期間選択を表示する。

When:

- 7 days を押す。

Then:

- 操作前の 30 days は aria-pressed が true である。
- 期間選択 callback に 7 が渡される。再取得や選択表示の更新は、この play ではアサートしない。

<a id="storybook-study-history-02"></a>

### STORYBOOK-STUDY-HISTORY-02 任意期間の入力欄を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 期間選択に開始日2026-09-01と終了日2026-09-22のフォームを用意し、任意期間の入力を閉じている。

When:

- Custom range を押す。

Then:

- Start date の入力欄が表示される。

<a id="storybook-study-history-03"></a>

### STORYBOOK-STUDY-HISTORY-03 折りたたんだ日別表を30日単位で開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 開始・完了が各1件の日別データ90日分を用意する。

When:

- Show daily counts · 90 days を押す。

Then:

- 操作前は日別表が見えず、開くと見出し行1行と日別データ30行が表示される。

<a id="storybook-study-history-04"></a>

### STORYBOOK-STUDY-HISTORY-04 日別表の古い日付のページへ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 90日分の日別表を開き、最初の30日分を表示している。

When:

- Older dates を押す。

Then:

- 31–60 of 90 days の範囲表示になる。各行の値の一致までは、この play ではアサートしない。

<a id="storybook-study-history-05"></a>

### STORYBOOK-STUDY-HISTORY-05 最近のセッションの終了状態を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中止・未完了の3セッションを用意し、未完了の終了日時はない。

When:

- 最近のセッションを描画する。

Then:

- 3件の項目と Completed、Abandoned、Unfinished が表示される。
- 終了日時がない項目に対応する — が表示される。

<a id="storybook-study-history-06"></a>

### STORYBOOK-STUDY-HISTORY-06 最近のセッションの状態を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中止・未完了の3セッションを日本語 locale と iPhone X 表示で用意する。

When:

- 最近のセッションを描画する。

Then:

- 「最近のセッション」「未完了」「完了」「中止」が表示される。

<a id="storybook-study-history-07"></a>

### STORYBOOK-STUDY-HISTORY-07 最近のセッションを全件展開する

カテゴリ: `interaction`

区分: 正常系

Given:

- 完了セッション10件を用意し、初期状態は3件に折りたたまれている。

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

- 30日分の chart と開始2件・完了3件の集計値を渡す。

When:

- 集計を描画する。

Then:

- img role のグラフが表示される。件数やグラフ座標の数値一致までは、この play ではアサートしない。

<a id="storybook-study-history-09"></a>

### STORYBOOK-STUDY-HISTORY-09 90日分のグラフに集約単位を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 90日分の chart と開始90件・完了45件の集計値を渡す。

When:

- 集計を描画する。

Then:

- Study counts per 7 days が表示される。

## 自動アサーションに含めない項目

日本語・モバイル表示の日別表の Story は開く操作だけで期待結果のアサーションがない。不正な期間・各空状態・dark 表示だけの Story も、該当する契約の検証済みケースには数えない。
