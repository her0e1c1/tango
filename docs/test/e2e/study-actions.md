# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する4段階評価、スキップ、移動が、学習結果と現在位置へ一度だけ反映されることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-ACTIONS-04 | read | 正常系 | [学習中に前の Card へ戻れない](#study-actions-04) |
| STUDY-ACTIONS-01 | write | 正常系 | [good で評価して次の Card へ進む](#study-actions-01) |
| STUDY-ACTIONS-02 | write | 正常系 | [again で評価して次の Card へ進む](#study-actions-02) |
| STUDY-ACTIONS-03 | write | 正常系 | [スキップで次の Card へ進める](#study-actions-03) |
| STUDY-ACTIONS-06 | write | 正常系 | [評価以外の学習操作では回答を記録しない](#study-actions-06) |
| STUDY-ACTIONS-07 | write | 正常系 | [4方向の評価が入力手段によらず一致する](#study-actions-07) |
| STUDY-ACTIONS-08 | write | 正常系 | [保存中は競合する操作を受け付けない](#study-actions-08) |
| STUDY-ACTIONS-09 | write | 正常系 | [最後の回答の保存中は自動遷移しない](#study-actions-09) |
| STUDY-ACTIONS-11 | write | 正常系 | [オフライン中の保存は再接続後に一度だけ反映される](#study-actions-11) |
| STUDY-ACTIONS-13 | write | 正常系 | [切り替え前の操作結果を現在の学習へ反映しない](#study-actions-13) |
| STUDY-ACTIONS-16 | write | 正常系 | [明示的な学習中止の成功で一覧へ戻る](#study-actions-16) |
| STUDY-ACTIONS-05 | write | 異常系 | [回答履歴の保存失敗でも学習状態と位置を維持する](#study-actions-05) |
| STUDY-ACTIONS-10 | write | 異常系 | [匿名利用では応答を待たず次の操作を受け付ける](#study-actions-10) |
| STUDY-ACTIONS-12 | write | 異常系 | [学習位置の同期拒否後は復元された位置を表示する](#study-actions-12) |
| STUDY-ACTIONS-14 | write | 異常系 | [アカウント変更後に以前のアカウントの Card へ回答できない](#study-actions-14) |
| STUDY-ACTIONS-15 | write | 異常系 | [保存失敗後は操作待ちを解除し受信した内容を表示する](#study-actions-15) |

<a id="study-actions-04"></a>

### STUDY-ACTIONS-04 学習中に前の Card へ戻れない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の前に別の Card がある。

When:

- 学習操作と Help を確認し、ポインターとキーボードで進捗スライダーを後方へ動かそうとする。

Then:

- 前の Card へ戻る学習操作・設定・表示は存在しない。
- スライダーの後方入力は現在位置を維持し、前方への移動は引き続き利用できる。

<a id="study-actions-01"></a>

### STUDY-ACTIONS-01 good で評価して次の Card へ進む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の次に別の Card がある。
- スワイプ通知が有効である。

When:

- 現在の Card を good で評価する。

Then:

- 現在の Card に good の評価が一度だけ記録され、記憶状態と復習予定が更新される。
- Card の本文、タグ、所属 Deck、作成日時は変わらず、今回の評価が最終復習として反映される。
- 評価の保存後、次の Card の表面へ進む。
- Deck 一覧では、今回学習した Deck として学習中の並び順に反映される。
- 実行したスワイプ方向が、言語に依存しないアイコンで短時間通知される。

<a id="study-actions-02"></a>

### STUDY-ACTIONS-02 again で評価して次の Card へ進む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を again で評価する。

Then:

- 現在の Card に again の評価が一度だけ記録され、短い間隔での復習予定に更新される。同じ学習の出題には追加し直さない。
- Card の本文、タグ、所属 Deck、作成日時は変わらず、今回の評価が最終復習として反映される。
- 評価の保存後、次の Card の表面へ進む。

<a id="study-actions-03"></a>

### STUDY-ACTIONS-03 スキップで次の Card へ進める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card をスキップする。

Then:

- スキップは評価した回答として数えない。
- Card の記憶状態、復習予定、最終復習、本文やタグを変更しない。
- 学習位置だけが進み、次の Card の表面を表示する。

<a id="study-actions-06"></a>

### STUDY-ACTIONS-06 [TODO] 評価以外の学習操作では回答を記録しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 裏面表示、Help、離脱、前方スライダー、自動再生を利用できる。

When:

- 評価せず、裏面表示、Help、離脱、スライダー移動、自動再生のいずれかを行う。

Then:

- 回答として記録しない。
- Card の記憶状態、復習予定、最終復習、本文やタグを変更しない。

<a id="study-actions-07"></a>

### STUDY-ACTIONS-07 [TODO] 4方向の評価が入力手段によらず一致する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 4方向は左＝again、下＝hard、右＝good、上＝easy に割り当てられている。
- 評価ボタン、方向キー、スワイプ、裏面の操作領域を利用できる。

When:

- 各入力手段で4方向の評価を行う。

Then:

- 同じ方向は入力手段によらず同じ評価に対応する。

<a id="study-actions-08"></a>

### STUDY-ACTIONS-08 [TODO] 保存中は競合する操作を受け付けない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 回答・位置変更・中止のいずれかを保存中で、保存は成功する。

When:

- 保存中に評価、スキップ、スライダー、自動再生による移動を重ねた後、保存が成功する。

Then:

- 保存中は競合する操作を受け付けず、回答の重複や Card の飛び越しが起きない。
- 保存成功後は次の操作を受け付ける。
- 画面は受信した内容を表示する。

<a id="study-actions-09"></a>

### STUDY-ACTIONS-09 [TODO] 最後の回答の保存中は自動遷移しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で最後の回答を保存中だが、受信した内容には学習が存在しない。

When:

- 保存結果が確定する前の学習画面を確認する。

Then:

- 保存中は完了画面へ進まず、読み込み表示にする。
- 学習不在だけでは一覧へ自動遷移しない。

<a id="study-actions-11"></a>

### STUDY-ACTIONS-11 [TODO] オフライン中の保存は再接続後に一度だけ反映される

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中で、初回認証と対象 Card の読み込みが完了している。
- 通信が切れており、評価後の保存が保留される。

When:

- Card を評価し、保存待ちの間に追加の評価を試みる。再接続して保存後に再読み込みする。

Then:

- オフライン中は保存が保留され、再接続後の保存成功まで追加の評価を受け付けない。
- 再読み込み後も学習結果と現在位置を復元できる。
- 再接続だけでは新しい回答として再登録されない。

<a id="study-actions-13"></a>

### STUDY-ACTIONS-13 [TODO] 切り替え前の操作結果を現在の学習へ反映しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 学習操作の保存結果が届く前に、アカウントまたは学習対象を切り替えている。

When:

- 切り替え前の操作結果が届く。

Then:

- 以前の操作結果で現在の Card が進まず、以前の学習の通知も表示されない。

<a id="study-actions-16"></a>

### STUDY-ACTIONS-16 [TODO] 明示的な学習中止の成功で一覧へ戻る

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck の学習画面を開いている。
- 学習の中止を保存できる。

When:

- 明示的に学習を中止し、その保存が成功する。

Then:

- 一覧へ戻る。

<a id="study-actions-05"></a>

### STUDY-ACTIONS-05 回答履歴の保存失敗でも学習状態と位置を維持する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- スワイプ通知が有効である。
- 現在の Card の後に、さらに2枚以上の Card がある。
- 現在の評価では回答履歴の保存だけが失敗し、学習状態と位置は保存できる。次の Card の評価は保存できる。

When:

- 現在の Card を評価して保存失敗を確認し、画面を再読み込みする。その後、次の Card を評価する。

Then:

- 最初の評価では保存失敗を通知し、スワイプ通知は表示しない。次の評価ではスワイプ通知を表示する。
- 最初の評価では学習状態と次の位置だけが保存される。再読み込み後も次の Card を表示し、失敗した回答履歴を自動で再登録しない。
- 次の評価は一度だけ保存され、さらに次の Card の表面へ進む。回答履歴には成功した評価だけを記録する。

<a id="study-actions-10"></a>

### STUDY-ACTIONS-10 [TODO] 匿名利用では応答を待たず次の操作を受け付ける

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck の学習を開始している。
- 学習の保存開始後、snapshot またはサーバー応答の到着前である。操作待ち解除後に保存失敗が届く。

When:

- 次の学習操作を行った後に、先の保存エラーが届く。

Then:

- snapshot やサーバー応答を待たず次の操作を受け付ける。
- 保存失敗を `reportError` の診断に残し、画面は受信した内容に従う。
- 遅れたエラーで後続の操作の待機状態を変えない。

<a id="study-actions-12"></a>

### STUDY-ACTIONS-12 [TODO] 学習位置の同期拒否後は復元された位置を表示する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 評価後の学習状態と回答履歴は保存済みだが、最後の学習位置だけが後から同期拒否される。

When:

- 学習位置の同期拒否が届く。

Then:

- 同期エラーを通知し、復元された位置の Card を表示する。保存済みの学習状態と回答履歴は残る。

<a id="study-actions-14"></a>

### STUDY-ACTIONS-14 [TODO] アカウント変更後に以前のアカウントの Card へ回答できない

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck の学習画面を開いている。
- 学習画面を開いた後にアカウントが変わっている。

When:

- 以前のアカウントの Card を評価しようとする。

Then:

- 以前のアカウントの Card に回答できない。

<a id="study-actions-15"></a>

### STUDY-ACTIONS-15 [TODO] 保存失敗後は操作待ちを解除し受信した内容を表示する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中である。
- 回答・位置変更・中止のいずれかを保存中で、保存失敗と変更の巻き戻しが届く。

When:

- 保存が失敗し、変更の巻き戻しが届く。

Then:

- 保存失敗時に操作待ちを解除し、受信した内容を表示する。巻き戻しを待って操作を制限し続けない。
