# Study Back Text E2E テスト仕様書

## 目的

裏面のタップ・スクロール・文字選択と、左右の操作領域による評価が競合しないことを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-BACK-TEXT-01 | read | 正常系 | [学習中の Card を表面から裏面へ切り替えられる](#study-back-text-01) |
| STUDY-BACK-TEXT-02 | read | 正常系 | [裏面の本文を選択しても Card の状態を維持できる](#study-back-text-02) |
| STUDY-BACK-TEXT-03 | read | 正常系 | [操作領域が OFF なら裏面タップで表面へ戻る](#study-back-text-03) |
| STUDY-BACK-TEXT-04 | read | 正常系 | [裏面をスクロールしても学習状態は変わらない](#study-back-text-04) |
| STUDY-BACK-TEXT-07 | read | 正常系 | [狭い画面でも裏面を全幅で表示する](#study-back-text-07) |
| STUDY-BACK-TEXT-08 | read | 正常系 | [左の操作領域から裏面をホイールでスクロールできる](#study-back-text-08) |
| STUDY-BACK-TEXT-09 | read | 正常系 | [右の操作領域から裏面をタッチでスクロールできる](#study-back-text-09) |
| STUDY-BACK-TEXT-05 | write | 正常系 | [左の操作領域で設定した操作を実行する](#study-back-text-05) |
| STUDY-BACK-TEXT-06 | write | 正常系 | [右の操作領域で設定した操作を実行する](#study-back-text-06) |

<a id="study-back-text-01"></a>

### STUDY-BACK-TEXT-01 学習中の Card を表面から裏面へ切り替えられる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card に表裏の本文がある。

When:

- 表示中の Card の表面を選択する。

Then:

- 同じ Card の裏面を表示する。

<a id="study-back-text-02"></a>

### STUDY-BACK-TEXT-02 裏面の本文を選択しても Card の状態を維持できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card の裏面に選択可能な本文がある。

When:

- 裏面を開き、マウスの主ボタンで本文をドラッグ選択する。

Then:

- 裏面を表示したまま本文を選択できる。

<a id="study-back-text-03"></a>

### STUDY-BACK-TEXT-03 操作領域が OFF なら裏面タップで表面へ戻る

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 裏面のスワイプ操作領域の表示設定が無効になっている。

When:

- 裏面を開いてタップする。

Then:

- 同じ Card の表面だけを表示する。
- 左右のスワイプ操作領域は表示されない。

<a id="study-back-text-04"></a>

### STUDY-BACK-TEXT-04 裏面をスクロールしても学習状態は変わらない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card の裏面は表示領域より長い。

When:

- 裏面を開き、解答領域を下へスクロールする。

Then:

- 同じ Card の裏面を表示したまま、下側の本文を読める。

<a id="study-back-text-07"></a>

### STUDY-BACK-TEXT-07 狭い画面でも裏面を全幅で表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 裏面のスワイプ操作領域の表示設定が有効になっている。
- 画面幅は 320px である。

When:

- 現在の Card を裏面へ切り替える。

Then:

- 裏面の本文は解答領域と同じ幅で表示され、左右の操作領域が本文に重なる。

<a id="study-back-text-08"></a>

### STUDY-BACK-TEXT-08 左の操作領域から裏面をホイールでスクロールできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-overlays-long`](./fixture/study-back-text-overlays-long.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card の裏面は表示領域より長い。
- 裏面の操作領域は ON で、左右とも前方移動が設定されている。
- 画面幅は 320px である。
- 裏面を開き、解答領域の先頭を表示している。

When:

- 左の操作領域上から下方向へホイールでスクロールする。

Then:

- 同じ Card の裏面と左右の操作領域を表示したまま、下側の本文を読める。
- 右の操作領域と画面端の間でスクロールバーを直接操作できる。
- 操作領域に設定された評価や移動は行われない。

<a id="study-back-text-09"></a>

### STUDY-BACK-TEXT-09 右の操作領域から裏面をタッチでスクロールできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-back-text-overlays-long`](./fixture/study-back-text-overlays-long.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 現在の Card の裏面は表示領域より長い。
- 裏面の操作領域は ON で、左右とも前方移動が設定されている。
- 画面幅は 320px である。
- 裏面を開き、解答領域の先頭を表示している。

When:

- 右の操作領域上から上方向へタッチ操作する。

Then:

- 同じ Card の裏面と左右の操作領域を表示したまま、下側の本文を読める。
- 右の操作領域と画面端の間でスクロールバーを直接操作できる。
- 操作領域に設定された評価や移動は行われない。

<a id="study-back-text-05"></a>

### STUDY-BACK-TEXT-05 左の操作領域で設定した操作を実行する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 裏面の操作領域は ON で、左右に異なる操作が設定されている。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を裏面へ切り替え、左の操作領域をタップする。

Then:

- 左に設定した good の評価を一度だけ保存する。
- Card の内容と作成日時は変わらず、今回の評価が記憶状態と最終復習に反映される。
- 次の Card の表面へ一つ進む。操作領域のタップで次の Card は裏返らない。

<a id="study-back-text-06"></a>

### STUDY-BACK-TEXT-06 右の操作領域で設定した操作を実行する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 裏面の操作領域は ON で、左右に異なる操作が設定されている。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を裏面へ切り替え、右の操作領域をタップする。

Then:

- 右に設定した again の評価を一度だけ保存する。
- Card の内容と作成日時は変わらず、今回の評価が記憶状態と最終復習に反映される。
- 次の Card の表面へ一つ進む。操作領域のタップで次の Card は裏返らない。
