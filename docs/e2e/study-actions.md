# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する mastered、non-mastered、移動 action が、学習結果と session 位置へ一度だけ反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](#swipe-04) |
| SWIPE-05 | read | [学習中に前の Card へ戻れない](#swipe-05) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#swipe-12) |

<a id="swipe-02"></a>

### SWIPE-02 mastered action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。
- swipe feedback が有効である。

When:

- 現在の Card に mastered action を実行する。

Then:

- 現在だった Card の difficulty が mastered rule に従って 1 下がり、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- 実行した swipe 方向が、言語に依存しないアイコンとして共通 toast で短時間表示される。
- browser error が発生しない。

<a id="swipe-03"></a>

### SWIPE-03 non-mastered action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に non-mastered action を実行する。

Then:

- 現在だった Card の difficulty が non-mastered rule に従って 1 上がり、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-04"></a>

### SWIPE-04 next-card action で次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に next-card action を実行する。

Then:

- 現在だった Card の difficulty は変わらず、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-05"></a>

### SWIPE-05 学習中に前の Card へ戻れない

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の前に別の Card がある。
- 左方向には previous-card action が設定され、swipe feedback と裏面の操作領域が有効である。

When:

- previous-card action のボタン表示を確認し、対応する方向キーと swipe を入力する。
- 進捗スライダーを pointer と keyboard で現在位置より前へ動かそうとする。
- 現在の Card の裏面を開き、操作領域を確認する。

Then:

- previous-card action が設定された方向ボタンは表示されたまま disabled になり、実行できない。
- 対応する方向キーと swipe は何もせず、session の位置と Card の学習結果は変わらない。
- スライダーの後方入力は現在位置を維持し、前方への移動は引き続き利用できる。
- 裏面には previous-card action が設定された方向の操作領域が表示されない。
- 無効な操作では表裏の表示状態を変更せず、swipe feedback を表示しない。
- 方向の設定が変更された場合も previous-card action の方向だけが無効になり、別の action は利用できる。
- browser error が発生しない。

<a id="swipe-12"></a>

### SWIPE-12 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- swipe feedback が有効である。
- 前回の学習結果の保存要求が失敗し、同じ Card と session の位置が維持されている。
- 次の学習結果の保存要求は成功できる。

When:

- 現在の Card に同じ学習 action を再度実行する。

Then:

- 失敗した試行では swipe feedback が表示されず、成功した再試行だけ共通 toast が表示される。
- 再試行した学習結果が一度だけ保存される。
- session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
- 最初の保存失敗に伴う未処理の browser error が発生しない。
