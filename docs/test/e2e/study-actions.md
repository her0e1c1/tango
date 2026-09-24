# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する4段階評価、スキップ、移動が、学習結果と現在位置へ一度だけ反映されることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-ACTIONS-01 | write | 正常系 | [good action で学習結果を保存して次の Card へ進める](#study-actions-01) |
| STUDY-ACTIONS-02 | write | 正常系 | [again action で学習結果を保存して次の Card へ進める](#study-actions-02) |
| STUDY-ACTIONS-03 | write | 正常系 | [スキップで次の Card へ進める](#study-actions-03) |
| STUDY-ACTIONS-04 | read | 正常系 | [学習中に前の Card へ戻れない](#study-actions-04) |
| STUDY-ACTIONS-05 | write | 異常系 | [学習結果の保存失敗後に同じ Card から再試行できる](#study-actions-05) |

<a id="study-actions-01"></a>

### STUDY-ACTIONS-01 good action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。
- swipe feedback が有効である。

When:

- 現在の Card に good action を実行する。

Then:

- 現在の Card に good の評価が一度だけ記録され、記憶状態と復習予定が更新される。
- Card の本文、タグ、所属 Deck、作成日時は変わらず、今回の評価が最終復習として反映される。
- 評価の保存が完了すると、session の位置が次の Card へ一つ進む。
- Deck 一覧では、今回学習した Deck として学習中の並び順に反映される。
- 次の Card の front text が表示される。
- 実行した swipe 方向が、言語に依存しないアイコンで短時間通知される。
- 保存中の連続入力で回答が重複したり、複数の Card を飛ばしたりしない。

<a id="study-actions-02"></a>

### STUDY-ACTIONS-02 again action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に again action を実行する。

Then:

- 現在の Card に again の評価が一度だけ記録され、短い間隔での復習予定に更新される。同じ session の出題には追加し直さない。
- Card の本文、タグ、所属 Deck、作成日時は変わらず、今回の評価が最終復習として反映される。
- 評価の保存が完了すると、session の位置が次の Card へ一つ進む。
- 次の Card の front text が表示される。

<a id="study-actions-03"></a>

### STUDY-ACTIONS-03 スキップで次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card をスキップする。

Then:

- スキップは評価した回答として数えない。
- Card の記憶状態、復習予定、最終復習、本文やタグを変更しない。裏面表示、Help、離脱、スライダー、自動再生も評価の代わりにはならない。
- session の位置だけが次の Card へ進む。
- 次の Card の front text が表示される。

<a id="study-actions-04"></a>

### STUDY-ACTIONS-04 学習中に前の Card へ戻れない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の前に別の Card がある。
- 4方向は左＝again、下＝hard、右＝good、上＝easy に割り当てられている。

When:

- 学習操作と Help の表示を確認する。
- 進捗スライダーを pointer と keyboard で現在位置より前へ動かそうとする。

Then:

- 前の Card へ戻る学習操作・設定・表示は存在しない。
- スライダーの後方入力は現在位置を維持し、前方への移動は引き続き利用できる。
- ボタン・方向キー・swipe・裏面の操作領域は同じ評価に対応する。

<a id="study-actions-05"></a>

### STUDY-ACTIONS-05 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- swipe feedback が有効である。
- 前回の学習結果の保存に失敗し、同じ Card と session の位置が維持されている。
- 次の保存は成功できる。

When:

- 保存失敗後に同じ Card に評価を再度実行する。

Then:

- 失敗した試行では swipe feedback が表示されず、成功した再試行だけ通知される。
- 保存中は評価、スキップ、スライダー、自動再生による移動ができない。
- オフラインでも保存できれば次へ進め、再読み込み後も学習結果と現在位置を復元できる。
- 最後の回答が後から同期拒否された場合は、完了画面ではなく回答が受け付けられていない Card に戻り、復元された学習状態から再試行できる。
- アカウントや学習対象を切り替えた後に、以前の操作結果で現在の Card が進んだり、以前の学習の結果通知が表示されたりしない。
- 学習画面を開いた後にアカウントが変わった場合も、前のアカウントの Card に回答できない。
- 同期エラーは通知され、再接続だけでは新しい回答として再登録されない。
- 成功した再試行では session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
