# Study Controls E2E テスト仕様書

## 目的

学習画面の pointer 操作と Help dialog が、設定された action を正しく案内・実行し、意図しない Card 状態変更を起こさないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-13 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](#swipe-13) |
| SWIPE-14 | read | [non-primary mouse の drag を無視できる](#swipe-14) |
| SWIPE-16 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](#swipe-16) |
| SWIPE-24 | read | [Help dialog に現在の操作 mapping を表示できる](#swipe-24) |
| SWIPE-25 | write | [Help button の表示設定を reload 後も維持できる](#swipe-25) |

<a id="swipe-13"></a>

### SWIPE-13 remote Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-drag`](./fixture/study-session-start-drag.yaml)
- 認証済みユーザーが所有する remote Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は mastered action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の mastered 学習結果が保存される。
- 次の Card の front text が表示され、back text は表示されない。
- drag 後の click によって次の Card が裏面へ切り替わらない。
- browser error が発生しない。

<a id="swipe-14"></a>

### SWIPE-14 non-primary mouse の drag を無視できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。

When:

- non-primary mouse button で現在の Card を swipe action に対応する方向へ drag する。

Then:

- 現在の Card の front text が引き続き表示される。
- Card の学習結果と session の位置が変更されない。
- browser error が発生しない。

<a id="swipe-16"></a>

### SWIPE-16 local-only Deck で primary mouse の上方向 drag により次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- browser storage に、複数の Card を含む local-only Deck と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は mastered action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag する。

Then:

- 現在だった Card の mastered 学習結果が browser storage に保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示され、back text は表示されない。
- browser error が発生しない。

<a id="swipe-24"></a>

### SWIPE-24 Help dialog に現在の操作 mapping を表示できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- 方向操作には既定値と異なる action が設定され、操作ボタンの一部は非表示に設定されている。
- document locale は English に設定されている。

When:

- 学習画面から Help dialog を開く。
- dialog 内で方向キーと操作ボタン表示切り替えキーを入力し、focus を移動する。
- Escape で Help dialog を閉じる。

Then:

- Help dialog に現在設定されている方向操作の意味が semantic label で表示される。
- Card の表示、autoplay、操作ボタン表示、Card details、Deck 一覧へ戻る操作が表示される。
- 非表示の操作ボタンは現在の設定と一致する説明で表示される。
- dialog 内のキー入力で Card、学習結果、session の位置が変更されない。
- focus が dialog 内に維持され、閉じた後は Help trigger へ戻る。
- browser error が発生しない。

<a id="swipe-25"></a>

### SWIPE-25 Help button の表示設定を reload 後も維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-help`](./fixture/study-session-help.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session が存在する。
- Help button の表示設定は既定値の ON である。

When:

- 学習画面の Study actions から Help button の表示を OFF にする。
- 学習画面を reload する。

Then:

- Help button は既定で省略ボタンの左側に表示される。
- 表示を OFF にすると Help button は非表示になる。
- reload 後も Help button の表示設定は OFF のまま維持される。
- browser error が発生しない。
