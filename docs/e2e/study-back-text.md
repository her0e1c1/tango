# Study Back Text E2E テスト仕様書

## 目的

学習中の Card の裏面で、tap、scroll、文字選択と、設定された左右 overlay の操作が競合しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-01 | read | [学習中の Card を表面から裏面へ切り替えられる](#swipe-01) |
| SWIPE-15 | read | [裏面 text を選択しても Card の状態を維持できる](#swipe-15) |
| SWIPE-18 | read | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](#swipe-18) |
| SWIPE-19 | read | [長い裏面 text を scroll しても Card の状態を維持できる](#swipe-19) |
| SWIPE-20 | write | [左 overlay から設定済み action を実行できる](#swipe-20) |
| SWIPE-21 | write | [右 overlay から設定済み action を実行できる](#swipe-21) |

<a id="swipe-01"></a>

### SWIPE-01 学習中の Card を表面から裏面へ切り替えられる

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

<a id="swipe-15"></a>

### SWIPE-15 裏面 text を選択しても Card の状態を維持できる

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

<a id="swipe-18"></a>

### SWIPE-18 overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる

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

<a id="swipe-19"></a>

### SWIPE-19 長い裏面 text を scroll しても Card の状態を維持できる

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

<a id="swipe-20"></a>

### SWIPE-20 左 overlay から設定済み action を実行できる

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

<a id="swipe-21"></a>

### SWIPE-21 右 overlay から設定済み action を実行できる

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
