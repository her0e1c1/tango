# 学習履歴画面 Playwright 結合テスト仕様書

## 目的

学習履歴画面を入口とした Playwright テストで、期間の選択と、集計・グラフ・日別表・セッション一覧の連動を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-STUDY-HISTORY-01 | interaction | 正常系 | [期間プリセットを集計表示へ反映する](#playwright-study-history-01) |
| PLAYWRIGHT-STUDY-HISTORY-02 | interaction | 正常系 | [任意期間を入力する](#playwright-study-history-02) |
| PLAYWRIGHT-STUDY-HISTORY-03 | interaction | 正常系 | [日別表を30日単位で開く](#playwright-study-history-03) |
| PLAYWRIGHT-STUDY-HISTORY-04 | interaction | 正常系 | [日別表の古い日付へ進む](#playwright-study-history-04) |
| PLAYWRIGHT-STUDY-HISTORY-05 | render | 正常系 | [セッションの終了状態を区別する](#playwright-study-history-05) |
| PLAYWRIGHT-STUDY-HISTORY-06 | render | 正常系 | [セッションの状態を日本語で表示する](#playwright-study-history-06) |
| PLAYWRIGHT-STUDY-HISTORY-07 | interaction | 正常系 | [最近のセッションをすべて展開する](#playwright-study-history-07) |
| PLAYWRIGHT-STUDY-HISTORY-08 | render | 正常系 | [30日分の集計グラフを表示する](#playwright-study-history-08) |
| PLAYWRIGHT-STUDY-HISTORY-09 | render | 正常系 | [90日分のグラフに集約単位を示す](#playwright-study-history-09) |
| PLAYWRIGHT-STUDY-HISTORY-10 | interaction | 正常系 | [Deck 選択と URL を履歴移動で一致させる](#playwright-study-history-10) |
| PLAYWRIGHT-STUDY-HISTORY-11 | interaction | 正常系 | [記録がなくても期間と日別表を連動させる](#playwright-study-history-11) |
| PLAYWRIGHT-STUDY-HISTORY-12 | render | 正常系 | [cache の記録を全履歴と区別して案内する](#playwright-study-history-12) |
| PLAYWRIGHT-STUDY-HISTORY-13 | interaction | 正常系 | [暦日の両端を含めて期間と Deck を表示する](#playwright-study-history-13) |
| PLAYWRIGHT-STUDY-HISTORY-14 | interaction | 正常系 | [条件切替後に古い取得結果を表示しない](#playwright-study-history-14) |
| PLAYWRIGHT-STUDY-HISTORY-15 | interaction | 正常系 | [日付変更で相対期間だけを更新する](#playwright-study-history-15) |
| PLAYWRIGHT-STUDY-HISTORY-16 | interaction | 正常系 | [開始と完了の記録を30日分の表示へ反映する](#playwright-study-history-16) |
| PLAYWRIGHT-STUDY-HISTORY-17 | render | 正常系 | [中止と削除済み Deck の記録を完了数へ加えない](#playwright-study-history-17) |
| PLAYWRIGHT-STUDY-HISTORY-18 | interaction | 異常系 | [取得失敗では部分集計を表示せず再試行する](#playwright-study-history-18) |
| PLAYWRIGHT-STUDY-HISTORY-19 | interaction | 異常系 | [無効な日付を適用しても現在の期間を変えない](#playwright-study-history-19) |
| PLAYWRIGHT-STUDY-HISTORY-20 | interaction | 異常系 | [無効な URL 期間を選び直して復帰する](#playwright-study-history-20) |
| PLAYWRIGHT-STUDY-HISTORY-21 | render | 異常系 | [存在しない Deck 指定を全 Deck に読み替えない](#playwright-study-history-21) |

<a id="playwright-study-history-01"></a>

### PLAYWRIGHT-STUDY-HISTORY-01 [TODO] 期間プリセットを集計表示へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に選択期間の内外の記録がある。

When:

- 別の期間プリセットを選ぶ。

Then:

- 選択状態と表示期間が変わり、その期間の記録に対応する集計が表示される。

<a id="playwright-study-history-02"></a>

### PLAYWRIGHT-STUDY-HISTORY-02 [TODO] 任意期間を入力する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で期間プリセットを表示している。

When:

- 任意期間を選ぶ。

Then:

- 開始日と終了日の入力欄が表示され、指定した期間を選べる。

<a id="playwright-study-history-03"></a>

### PLAYWRIGHT-STUDY-HISTORY-03 [TODO] 日別表を30日単位で開く

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に30日を超える日別データがあり、日別表は折りたたまれている。

When:

- 日別表を開く。

Then:

- 30日分の日別行と、残りの日付を確認する操作が表示される。

<a id="playwright-study-history-04"></a>

### PLAYWRIGHT-STUDY-HISTORY-04 [TODO] 日別表の古い日付へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面の日別表に30日を超えるデータがある。

When:

- 古い日付のページへ進む。

Then:

- 現在のページと異なる古い日付の行が表示され、日付に対応した値を確認できる。

<a id="playwright-study-history-05"></a>

### PLAYWRIGHT-STUDY-HISTORY-05 [TODO] セッションの終了状態を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中断など異なる終了状態の学習セッションがある。

When:

- 学習履歴画面を開く。

Then:

- 最近のセッションにそれぞれの状態が区別して表示される。

<a id="playwright-study-history-06"></a>

### PLAYWRIGHT-STUDY-HISTORY-06 [TODO] セッションの状態を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 日本語の表示設定で、終了状態の異なる学習セッションがある。

When:

- 学習履歴画面を開く。

Then:

- 状態は日本語で表示され、Deck 名などのユーザー入力は変更されない。

<a id="playwright-study-history-07"></a>

### PLAYWRIGHT-STUDY-HISTORY-07 [TODO] 最近のセッションをすべて展開する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で最近のセッションの一部が折りたたまれている。

When:

- 全件を表示する操作を選ぶ。

Then:

- 隠れていたセッションも表示され、各セッションの内容を確認できる。

<a id="playwright-study-history-08"></a>

### PLAYWRIGHT-STUDY-HISTORY-08 [TODO] 30日分の集計グラフを表示する

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の対象期間は30日で、期間内に記録がある。

When:

- グラフを確認する。

Then:

- 対象期間の集計を示すグラフと、期間・値を理解できる表示がある。

<a id="playwright-study-history-09"></a>

### PLAYWRIGHT-STUDY-HISTORY-09 [TODO] 90日分のグラフに集約単位を示す

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の対象期間は90日で、期間内に記録がある。

When:

- グラフを確認する。

Then:

- 集約されたグラフに集約単位が表示され、1日分の値と誤認しない。

<a id="playwright-study-history-10"></a>

### PLAYWRIGHT-STUDY-HISTORY-10 [TODO] Deck 選択と URL を履歴移動で一致させる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に自分の Deck があり、記録は0件である。

When:

- Deck を選択してすべての Deck へ戻し、router の戻る・進むを行う。

Then:

- URL と選択が一致し、0件のサマリー・グラフ・表と記録なしの案内を表示する。

<a id="playwright-study-history-11"></a>

### PLAYWRIGHT-STUDY-HISTORY-11 [TODO] 記録がなくても期間と日別表を連動させる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面に自分の Deck があり、記録は0件である。

When:

- 7日・90日を選び、日別表を開いて古い日付へ進む。

Then:

- 合計・グラフ・最近の学習・日別表は同じ Deck と期間で0件を表示する。7日は日ごと、90日は7日ごとのグラフとし、日別表は30日ずつ確認できる。
- 選んだ期間を URL の days に反映する。

<a id="playwright-study-history-12"></a>

### PLAYWRIGHT-STUDY-HISTORY-12 [TODO] cache の記録を全履歴と区別して案内する

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の取得境界から cache の記録が届く。通常アカウントの通信断と匿名の未同期記録のそれぞれで確認する。

When:

- 学習記録を表示する。

Then:

- 読み込み済みの記録を表示し、クラウドの全履歴とは断定しない。匿名ではこのブラウザーの未同期データである旨を表示する。

<a id="playwright-study-history-13"></a>

### PLAYWRIGHT-STUDY-HISTORY-13 [TODO] 暦日の両端を含めて期間と Deck を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面の取得境界から期間内外の開始・完了記録が届く。1日・月またぎ・年またぎ・夏時間切替を含み、開始が範囲外でも完了は範囲内となる記録がある。
- America/Santiago の2026年9月6日は記録なし、7日正午は1開始・1完了である。

When:

- 開始日と終了日を適用して Deck を変更し、router の戻る・進むで期間を復元する。9月6日〜7日と5日〜6日も確認する。

Then:

- 合計・グラフ・最近の学習・日別表は Deck と期間に一致し、URL の days または start / end に反映する。Deck 変更で期間を変えない。
- 端末の暦日で両端を含め、範囲外の開始・完了は除外し、範囲内の完了は開始日が範囲外でも数える。
- 9月6日〜7日では7日の1開始・1完了を含む。5日〜6日では両日だけを表示して7日0時以降を含まない。

<a id="playwright-study-history-14"></a>

### PLAYWRIGHT-STUDY-HISTORY-14 [TODO] 条件切替後に古い取得結果を表示しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で以前の Deck・アカウント・期間の取得結果がまだ届いていない。各条件を独立して確認する。

When:

- 対象条件を切り替えた後に以前の条件の結果が届く。

Then:

- 切替直後にも遅れて届いた時にも、以前の条件の集計・グラフ・最近の学習・日別表を混ぜない。

<a id="playwright-study-history-15"></a>

### PLAYWRIGHT-STUDY-HISTORY-15 [TODO] 日付変更で相対期間だけを更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面で今日基準の期間と開始日・終了日を指定した期間のそれぞれを表示する。

When:

- 画面を開いたまま端末の日付が変わる。

Then:

- 相対期間と入力可能な最終日を更新する。指定期間では両端の日付と表示済みの結果を維持する。

<a id="playwright-study-history-16"></a>

### PLAYWRIGHT-STUDY-HISTORY-16 [TODO] 開始と完了の記録を30日分の表示へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習履歴画面の取得境界から、今日開始して完了した1件の記録と、それ以外の日の0件が届く。

When:

- 学習履歴画面を表示し、日別表を開く。

Then:

- 今日の開始・完了はそれぞれ1件で、期間合計・グラフ・日別表が一致する。記録なしの日も含む30日分と延べ数の説明を表示する。
- 日別表を閉じた状態でも最近の学習に完了した1件を表示する。

<a id="playwright-study-history-17"></a>

### PLAYWRIGHT-STUDY-HISTORY-17 [TODO] 中止と削除済み Deck の記録を完了数へ加えない

カテゴリ: `render`

区分: 正常系

Given:

- 学習履歴画面の取得境界から、未完了を明示的に中止した記録と、削除済み Deck の記録が届く。

When:

- 対象期間の学習記録を表示する。

Then:

- 中止だけでは完了数を増やさない。削除済み Deck は集計と最近の学習から除外する。

<a id="playwright-study-history-18"></a>

### PLAYWRIGHT-STUDY-HISTORY-18 [TODO] 取得失敗では部分集計を表示せず再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習履歴画面で集計に必要な結果の一部が失敗を返す。期間プリセットと開始日・終了日の指定をそれぞれ確認し、再試行は成功を返す。

When:

- 失敗を確認して再試行する。

Then:

- 一部成功した値を0件や全体集計として表示しない。失敗を案内し、再試行では選んだ期間を保持して最新の全体集計を表示する。

<a id="playwright-study-history-19"></a>

### PLAYWRIGHT-STUDY-HISTORY-19 [TODO] 無効な日付を適用しても現在の期間を変えない

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習履歴画面に有効な期間の結果が表示されている。

When:

- 未入力・存在しない日付・終了日が開始日前・未来の終了日をそれぞれ入力して適用する。

Then:

- 入力エラーを示し、適用中の期間とその結果を維持する。

<a id="playwright-study-history-20"></a>

### PLAYWRIGHT-STUDY-HISTORY-20 [TODO] 無効な URL 期間を選び直して復帰する

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習履歴画面を無効な期間を指定した URL で開く。

When:

- エラーを確認して、有効な期間を選び直す。

Then:

- 無効な期間を別期間へ読み替えずエラーを示す。有効な期間を選び直すとその結果を表示できる。

<a id="playwright-study-history-21"></a>

### PLAYWRIGHT-STUDY-HISTORY-21 [TODO] 存在しない Deck 指定を全 Deck に読み替えない

カテゴリ: `render`

区分: 異常系

Given:

- 学習履歴画面の URL に、自分の表示対象に存在しない Deck が指定され、Deck の読み込みは完了している。

When:

- その URL の学習記録を表示する。

Then:

- Deck を表示できない旨とすべての Deck へ戻る操作を示す。URL の Deck 指定を保ち、別 Deck・全 Deck の結果へ自動で切り替えない。
