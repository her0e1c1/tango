# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する4段階評価、スキップ、移動が、学習結果と現在位置へ一度だけ反映されることを確認する。

## 評価と移動の共通の期待結果

- 単一タブで順に学習する使い方を対象とする。同じ学習を複数タブ・複数端末から同時に変更する場合の競合は対象外とする。
- 評価は `again`、`hard`、`good`、`easy` の4種類であり、選んだ評価が変更されずに記録される。
- 評価すると記憶状態と次の復習予定が更新される。間隔反復の設定が OFF でも、評価による記憶状態の更新は行う。
- 初めて評価する Card は未評価の状態から学習を始める。再読み込み後に再評価する場合は、それまでの学習結果を引き継ぐ。
- Card の新規作成・複製では学習を引き継がず、本文編集や既存 Card を更新するインポートでは記憶状態を維持する。
- 評価の保存が完了するまで次の操作を受け付けない。回答が保存されていないのに学習位置だけが進む状態にならない。
- 初回認証と対象 Card の読み込みが済んでいれば、オフラインでも学習を進められる。再読み込みや再接続で同じ回答が増えたり、復習予定が再び変更されたりしない。
- それぞれの Card に1回答ずつ行った場合は、その回答数だけを記録する。再開だけでは回答を追加せず、別の学習で同じ Card を評価した記録も失わない。
- 学習を離れたり中止したりしても、それまでに保存した回答は失われない。最後の回答を保存したときだけ、その学習を完了として扱う。
- 個人の回答は本人だけが利用でき、Deck を公開しても回答は公開されない。保存した回答を後から編集・削除する操作は提供しない。
- 保存・同期に失敗した場合は通知される。匿名利用の学習結果はこのブラウザーだけに保持される。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-ACTIONS-01 | write | [good action で学習結果を保存して次の Card へ進める](#study-actions-01) |
| STUDY-ACTIONS-02 | write | [again action で学習結果を保存して次の Card へ進める](#study-actions-02) |
| STUDY-ACTIONS-03 | write | [スキップで次の Card へ進める](#study-actions-03) |
| STUDY-ACTIONS-04 | read | [学習中に前の Card へ戻れない](#study-actions-04) |
| STUDY-ACTIONS-05 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#study-actions-05) |

<a id="study-actions-01"></a>

### STUDY-ACTIONS-01 good action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

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
- browser error が発生しない。

<a id="study-actions-02"></a>

### STUDY-ACTIONS-02 again action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

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
- browser error が発生しない。

<a id="study-actions-03"></a>

### STUDY-ACTIONS-03 スキップで次の Card へ進める

カテゴリ: `write`

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
- browser error が発生しない。

<a id="study-actions-04"></a>

### STUDY-ACTIONS-04 学習中に前の Card へ戻れない

カテゴリ: `read`

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
- browser error が発生しない。

<a id="study-actions-05"></a>

### STUDY-ACTIONS-05 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

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
- 最初の保存失敗に伴う未処理の browser error が発生しない。
