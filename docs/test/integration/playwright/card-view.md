# Card 閲覧画面 Playwright 結合テスト仕様書

## 目的

Card 閲覧画面を入口とした Playwright テストで、指定した一枚の Card の閲覧、編集への移動、存在しない場合の案内を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-CARD-VIEW-01 | interaction | 正常系 | [指定した Card の両面を読む](#playwright-card-view-01) |
| PLAYWRIGHT-CARD-VIEW-02 | interaction | 正常系 | [表示している Card を編集する](#playwright-card-view-02) |
| PLAYWRIGHT-CARD-VIEW-03 | render | 異常系 | [存在しない Card を案内する](#playwright-card-view-03) |
| PLAYWRIGHT-CARD-VIEW-04 | interaction | 正常系 | [Card 閲覧画面を直接開ける](#playwright-card-view-04) |
| PLAYWRIGHT-CARD-VIEW-05 | interaction | 正常系 | [Card の閲覧 URL の変更に表示が追従する](#playwright-card-view-05) |
| PLAYWRIGHT-CARD-VIEW-06 | render | 正常系 | [未評価の Card に推定した記憶状態を表示しない](#playwright-card-view-06) |
| PLAYWRIGHT-CARD-VIEW-07 | interaction | 正常系 | [Card の切り替え・再表示で記憶状態を更新する](#playwright-card-view-07) |
| PLAYWRIGHT-CARD-VIEW-08 | interaction | 正常系 | [評価済み Card の記憶状態を現在の基準時刻で表示する](#playwright-card-view-08) |
| PLAYWRIGHT-CARD-VIEW-09 | interaction | 異常系 | [利用できない Card のリンクから警告を保って戻る](#playwright-card-view-09) |
| PLAYWRIGHT-CARD-VIEW-10 | interaction | 異常系 | [存在しない Card から復帰できる](#playwright-card-view-10) |
| PLAYWRIGHT-CARD-VIEW-11 | render | 異常系 | [読み込めない記憶状態を未評価として表示しない](#playwright-card-view-11) |

<a id="playwright-card-view-01"></a>

### PLAYWRIGHT-CARD-VIEW-01 [TODO] 指定した Card の両面を読む

カテゴリ: `interaction`

区分: 正常系

Given:

- 表面 Hello、裏面 Hola の Card と、別の内容の Card がある。

When:

- Hello の Card 閲覧画面を開き、表裏を切り替える。

Then:

- Hello と Hola を確認でき、他の Card の内容は表示されない。

<a id="playwright-card-view-02"></a>

### PLAYWRIGHT-CARD-VIEW-02 [TODO] 表示している Card を編集する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 閲覧画面で表面と編集操作が表示されている。

When:

- 編集を選ぶ。

Then:

- 同じ Card の表面・裏面を持つ編集画面が表示される。

<a id="playwright-card-view-03"></a>

### PLAYWRIGHT-CARD-VIEW-03 [TODO] 存在しない Card を案内する

カテゴリ: `render`

区分: 異常系

Given:

- 指定した Card が存在しない。

When:

- その Card の閲覧画面を開く。

Then:

- 見つからないことと戻る操作が表示され、別の Card を代わりに表示しない。

<a id="playwright-card-view-04"></a>

### PLAYWRIGHT-CARD-VIEW-04 [TODO] Card 閲覧画面を直接開ける

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck に、裏面の本文を持つ Card がある。

When:

- 対象 Card の閲覧 URL を直接開く。

Then:

- 裏面の本文を Card answer に表示し、共通ヘッダーとナビゲーションも表示する。

<a id="playwright-card-view-05"></a>

### PLAYWRIGHT-CARD-VIEW-05 [TODO] Card の閲覧 URL の変更に表示が追従する

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck に、裏面の本文を持つ複数の Card があり、その1枚を閲覧している。

When:

- 同じ画面で別 Card の閲覧 URL を開く。

Then:

- Card answer を遷移先の裏面の本文に更新し、共通ヘッダーとナビゲーションも表示する。

<a id="playwright-card-view-06"></a>

### PLAYWRIGHT-CARD-VIEW-06 [TODO] 未評価の Card に推定した記憶状態を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- 匿名で利用中の Deck に未評価の Card がある。

When:

- 未評価の Card の閲覧画面を開く。

Then:

- FSRS 未開始と表示し、以前の復習予定や閲覧回数から推定した数値は表示しない。

<a id="playwright-card-view-07"></a>

### PLAYWRIGHT-CARD-VIEW-07 [TODO] Card の切り替え・再表示で記憶状態を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名で利用中の Deck に複数の Card があり、評価済み Card の記憶状態を表示している。

When:

- 別 Card を開くか、閲覧画面を離れて戻る。

Then:

- 現在の基準時刻を表示し、別 Card の曲線を残さない。

<a id="playwright-card-view-08"></a>

### PLAYWRIGHT-CARD-VIEW-08 [TODO] 評価済み Card の記憶状態を現在の基準時刻で表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 評価済みの記憶状態を持つ Card を読み込み済みで、最終復習時刻・次回の予定・目標保持率と判定時刻が固定されている。
- 英語・日本語、モバイル・通常幅、light・dark、復習間隔 ON / OFF を独立した表示例として用意する。

When:

- 対象 Card の閲覧画面を開き、分・時間の経過と短期・長期の表示範囲を切り替える。

Then:

- 「追加で復習しなかった場合の FSRS による推定」として想起率と忘却曲線を表示し、最終復習・基準時刻・次回の予定・目標保持率を区別する。
- 最終復習直後の想起率は100%で、追加の復習をしない時間経過によって増えない。基準時刻の数値とマーカーと期限到達が一致する。
- 同時刻のマーカーを識別でき、短期・長期の曲線を確認できる。復習間隔 OFF でも表示を失わず、各表示例で文言と読み上げ名・説明を確認できる。

<a id="playwright-card-view-09"></a>

### PLAYWRIGHT-CARD-VIEW-09 [TODO] 利用できない Card のリンクから警告を保って戻る

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck に正常な Card が1枚と読み込めない Card が1枚あり、認証と設定は利用できる。表示リンクを利用する。

When:

- 読み込めない Card の表示リンクを開き、復旧操作で元の Deck の一覧へ戻る。

Then:

- 対象 Card が利用できない旨、読み込めない件数、保存データを変更していない警告を表示する。
- 一覧へ戻っても警告を維持し、別の Card を代わりに表示しない。

<a id="playwright-card-view-10"></a>

### PLAYWRIGHT-CARD-VIEW-10 [TODO] 存在しない Card から復帰できる

カテゴリ: `interaction`

区分: 異常系

Given:

- 閲覧 URL が示す Card は存在しない。

When:

- 存在しない Card の閲覧 URL を直接開き、Card が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。

<a id="playwright-card-view-11"></a>

### PLAYWRIGHT-CARD-VIEW-11 [TODO] 読み込めない記憶状態を未評価として表示しない

カテゴリ: `render`

区分: 異常系

Given:

- 記憶状態が読み込めない Card、または取得失敗の結果を受け取っている。

When:

- 対象 Card の閲覧画面を開く。

Then:

- 読み込み不能や取得失敗を未評価として表示しない。
