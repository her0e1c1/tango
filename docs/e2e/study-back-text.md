# Study Back Text E2E テスト仕様書

## 目的

学習中の Card の裏面で、tap、scroll、文字選択と、設定された左右 overlay の操作が競合しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-BACK-TEXT-01 | read | [学習中の Card を表面から裏面へ切り替えられる](#study-back-text-01) |
| STUDY-BACK-TEXT-02 | read | [裏面 text を選択しても Card の状態を維持できる](#study-back-text-02) |
| STUDY-BACK-TEXT-03 | read | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](#study-back-text-03) |
| STUDY-BACK-TEXT-04 | read | [長い裏面 text を scroll しても Card の状態を維持できる](#study-back-text-04) |
| STUDY-BACK-TEXT-05 | write | [左 overlay から設定済み action を実行できる](#study-back-text-05) |
| STUDY-BACK-TEXT-06 | write | [右 overlay から設定済み action を実行できる](#study-back-text-06) |
| STUDY-BACK-TEXT-07 | read | [狭い画面でも overlay の下で裏面を全幅表示できる](#study-back-text-07) |
| STUDY-BACK-TEXT-08 | read | [overlay 上の wheel と touch で長い裏面 text を scroll できる](#study-back-text-08) |

<a id="study-back-text-01"></a>

### STUDY-BACK-TEXT-01 学習中の Card を表面から裏面へ切り替えられる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card に front text と back text が設定されている。

When:

- 学習画面に表示された現在の Card の front text を選択して裏面へ切り替える。

Then:

- 現在の Card の back text が表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-back-text-02"></a>

### STUDY-BACK-TEXT-02 裏面 text を選択しても Card の状態を維持できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card に selectable な back text が設定されている。

When:

- 現在の Card を裏面へ切り替え、primary mouse button の drag で back text を選択する。

Then:

- 選択範囲に対象 Card の back text が含まれる。
- 対象 Card の back text が引き続き表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-back-text-03"></a>

### STUDY-BACK-TEXT-03 overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- back text swipe overlay の表示設定が無効になっている。

When:

- 現在の Card を裏面へ切り替え、裏面を tap する。

Then:

- 同じ Card の front text が表示され、back text は表示されない。
- 左右の swipe overlay は表示されない。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-back-text-04"></a>

### STUDY-BACK-TEXT-04 長い裏面 text を scroll しても Card の状態を維持できる

カテゴリ: `read`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card に表示領域を超える長さの back text が設定されている。

When:

- 現在の Card を裏面へ切り替え、answer の表示領域を下方向へ scroll する。

Then:

- answer の scroll 位置が下方向へ移動する。
- 同じ Card の back text が引き続き表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-back-text-05"></a>

### STUDY-BACK-TEXT-05 左 overlay から設定済み action を実行できる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- back text swipe overlay の表示設定が有効で、左右には異なる学習 action が設定されている。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を裏面へ切り替え、左 overlay を tap する。

Then:

- 左に設定された mastered 学習結果が一度だけ保存される。
- session の位置が次の Card へ一つ進む。
- 次の Card の front text が表示され、back text は表示されない。
- overlay の tap によって通常の裏面 tap は実行されない。
- browser error が発生しない。

<a id="study-back-text-06"></a>

### STUDY-BACK-TEXT-06 右 overlay から設定済み action を実行できる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- back text swipe overlay の表示設定が有効で、左右には異なる学習 action が設定されている。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を裏面へ切り替え、右 overlay を tap する。

Then:

- 右に設定された non-mastered 学習結果が一度だけ保存される。
- session の位置が次の Card へ一つ進む。
- 次の Card の front text が表示され、back text は表示されない。
- overlay の tap によって通常の裏面 tap は実行されない。
- browser error が発生しない。

<a id="study-back-text-07"></a>

### STUDY-BACK-TEXT-07 狭い画面でも overlay の下で裏面を全幅表示できる

カテゴリ: `read`

Given:

- Fixture: [`study-back-text-overlays`](./fixture/study-back-text-overlays.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- back text swipe overlay の表示設定が有効になっている。
- viewport の幅が 320px になっている。

When:

- 現在の Card を裏面へ切り替える。

Then:

- back text の表示領域が answer region と同じ幅を維持する。
- 左右 overlay が back text の上に浮いた状態で表示される。
- 対象 Card の back text が表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="study-back-text-08"></a>

### STUDY-BACK-TEXT-08 overlay 上の wheel と touch で長い裏面 text を scroll できる

カテゴリ: `read`

Given:

- Fixture: [`study-back-text-overlays-long`](./fixture/study-back-text-overlays-long.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card に表示領域を超える長さの back text が設定されている。
- back text swipe overlay の表示設定が有効になり、左右とも前方へ進む action が設定されている。
- viewport の幅が 320px になっている。

When:

- 現在の Card を裏面へ切り替え、左 overlay 上から下方向へ wheel scroll する。
- answer の scroll 位置を先頭へ戻し、右 overlay 上から上方向へ touch 操作する。

Then:

- wheel と touch のどちらでも answer の scroll 位置が下方向へ移動する。
- 対象 Card の back text と左右 overlay が引き続き表示される。
- 右 overlay と viewport 右端の間に scrollbar を直接操作できる領域が残る。
- overlay の action は実行されない。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。
