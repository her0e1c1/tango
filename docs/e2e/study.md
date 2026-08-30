# Study E2E テスト仕様書

## 目的

Deck の学習画面で、Card の表示、学習結果の保存、session の移動・再開・完了、各入力操作が破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](#swipe-04) |
| SWIPE-05 | write | [previous-card action で前の Card へ戻れる](#swipe-05) |
| SWIPE-06 | write | [filter と学習上限を反映して session を開始できる](#swipe-06) |
| SWIPE-07 | read | [filter に一致する Card がない場合は session を開始できない](#swipe-07) |
| SWIPE-08 | write | [学習画面から戻った後に同じ位置から Continue できる](#swipe-08) |
| SWIPE-09 | write | [Restart で新しい session を先頭から開始できる](#swipe-09) |
| SWIPE-10 | write | [最後の Card を完了して completion screen を表示できる](#swipe-10) |
| SWIPE-11 | batch | [複数 Deck の学習 session を独立して維持できる](#swipe-11) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#swipe-12) |
| SWIPE-13 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](#swipe-13) |
| SWIPE-14 | read | [non-primary mouse の drag を無視できる](#swipe-14) |
| SWIPE-16 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](#swipe-16) |
| SWIPE-17 | write | [local-only Deck の学習結果と session を reload 後も維持できる](#swipe-17) |
| SWIPE-24 | read | [Help dialog に現在の操作 mapping を表示できる](#swipe-24) |

<a id="swipe-02"></a>

### SWIPE-02 mastered action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に mastered action を実行する。

Then:

- 現在だった Card の score が mastered rule に従って増加し、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
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

- 現在だった Card の score が non-mastered rule に従って減少し、学習回数が 1 増えて保存される。
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

- 現在だった Card の score は変わらず、学習回数が 1 増えて保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-05"></a>

### SWIPE-05 previous-card action で前の Card へ戻れる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の前に別の Card がある。

When:

- 現在の Card に previous-card action を実行する。

Then:

- 現在だった Card の score は変わらず、学習回数が 1 増えて保存される。
- session の位置が前の Card へ戻る。
- 前の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-06"></a>

### SWIPE-06 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、score と tags の組み合わせが異なる複数の Card が存在する。
- 対象 Deck に score と tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- 対象 Deck の学習開始画面から session を開始する。

Then:

- session には保存済み filter に一致する Card だけが含まれる。
- session の Card 数が設定済みの学習上限を超えない。
- session の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-07"></a>

### SWIPE-07 filter に一致する Card がない場合は session を開始できない

カテゴリ: `read`

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 認証済みユーザーが所有する Deck に Card が存在する。
- 学習開始画面の score と tag の filter に一致する Card が存在しない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- filter に一致する Card がないことが表示される。
- session の start action が無効になる。
- 対象 Deck の学習 session が作成されない。
- browser error が発生しない。

<a id="swipe-08"></a>

### SWIPE-08 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- 学習画面から Deck 一覧へ戻り、同じ Deck の Continue を実行する。

Then:

- Deck 一覧へ戻る前と同じ学習 session が維持される。
- Deck 一覧へ戻る前に表示されていた Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-09"></a>

### SWIPE-09 Restart で新しい session を先頭から開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で session を開始する。

Then:

- 以前とは異なる新しい学習 session が保存される。
- 新しい session の位置が先頭になる。
- 新しい session の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-10"></a>

### SWIPE-10 最後の Card を完了して completion screen を表示できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- 認証済みユーザーが所有する Deck の学習 session で、最後の Card が表示されている。

When:

- 最後の Card に学習結果を保存する action を実行する。

Then:

- 最後の Card の学習結果が保存される。
- 対象 Deck の学習 session が削除される。
- Study completion screen に完了 message と学習した Card 数が表示される。
- Deck 一覧へ automatic redirect せず、Deck 一覧へ戻る action が利用できる。
- Deck 一覧へ戻った後、対象 Deck に Continue action が表示されない。
- browser error が発生しない。

<a id="swipe-11"></a>

### SWIPE-11 複数 Deck の学習 session を独立して維持できる

カテゴリ: `batch`

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する複数の Deck に、それぞれ異なる位置の学習 session が存在する。

When:

- 一方の Deck で学習 action を実行して Deck 一覧へ戻り、もう一方の Deck を Continue する。

Then:

- 最初の Deck の学習結果と session の位置が保存される。
- もう一方の Deck は操作前の session と位置から再開する。
- 各 Deck の Card と session が混在しない。
- browser error が発生しない。

<a id="swipe-12"></a>

### SWIPE-12 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 前回の学習結果の保存要求が失敗し、同じ Card と session の位置が維持されている。
- 次の学習結果の保存要求は成功できる。

When:

- 現在の Card に同じ学習 action を再度実行する。

Then:

- 再試行した学習結果が一度だけ保存される。
- session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
- 最初の保存失敗に伴う未処理の browser error が発生しない。

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

<a id="swipe-17"></a>

### SWIPE-17 local-only Deck の学習結果と session を reload 後も維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- browser storage に、複数の Card を含む local-only Deck と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は mastered action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag し、次の Card への遷移完了後にページを reload する。

Then:

- 現在だった Card の mastered 学習結果が browser storage に維持されている。
- session の位置が次の Card に維持されている。
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
