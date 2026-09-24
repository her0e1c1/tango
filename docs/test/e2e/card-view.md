# Card View E2E テスト仕様書

## 目的

Card 一覧と Card view で学習情報・裏面を表示し、overlay や存在しない Card から安全に復帰できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-VIEW-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](#card-view-01) |
| CARD-VIEW-02 | read | 正常系 | [Card の裏面 overlay を開ける](#card-view-02) |
| CARD-VIEW-03 | read | 正常系 | [開いている Card の裏面 overlay を閉じられる](#card-view-03) |
| CARD-VIEW-04 | read | 正常系 | [Card view を直接開ける](#card-view-04) |
| CARD-VIEW-05 | read | 異常系 | [存在しない Card から復帰できる](#card-view-05) |
| CARD-VIEW-06 | write | 正常系 | [評価後の記憶状態を確認できる](#card-view-06) |

<a id="card-view-01"></a>

### CARD-VIEW-01 Card 一覧に学習情報を表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に tags を持つ Card が存在する。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の front text、tags が表示される。

<a id="card-view-02"></a>

### CARD-VIEW-02 Card の裏面 overlay を開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text と back text を持つ Card が存在する。

When:

- Card 一覧で対象 Card を選択する。

Then:

- 対象 Card の back text が overlay に表示される。

<a id="card-view-03"></a>

### CARD-VIEW-03 開いている Card の裏面 overlay を閉じられる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card 一覧で、対象 Card の back text overlay が開いている。

When:

- overlay の close action を実行する。

Then:

- back text overlay が閉じる。
- Card 一覧に対象 Card の front text が表示される。
- Card の内容と学習結果は変わらない。

<a id="card-view-04"></a>

### CARD-VIEW-04 Card view を直接開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に back text を持つ Card が存在する。

When:

- 対象 Card の閲覧 URL を直接開く。
- 同じ画面で別の Card の閲覧 URL を開く。

Then:

- 対象 Card の back text が Card answer として表示される。
- URL の対象を変えると、遷移先の Card の back text に表示が更新される。
- アプリ共通のヘッダーとナビゲーションが表示される。

<a id="card-view-05"></a>

### CARD-VIEW-05 存在しない Card から復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 閲覧 URL が示す Card は存在しない。

When:

- 存在しない Card の閲覧 URL を直接開き、Card が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。

<a id="card-view-06"></a>

### CARD-VIEW-06 評価後の記憶状態を確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、まだ評価していない Card がある。

When:

- Card view で未評価の表示を確認し、学習画面で Card を評価してから Card view を開く。
- 再読み込みし、オフラインでも同じ Card view を開く。

Then:

- 評価前は FSRS 未開始と表示され、以前の復習予定や閲覧回数から推定した数値を表示しない。
- 評価後は「追加で復習しなかった場合の FSRS による推定」として想起率と忘却曲線を表示する。
- 最終復習、基準時刻、次回の復習予定と目標保持率を区別して示す。
- 想起率は最終復習直後に100%で、追加で復習しない限り、分・時間の経過によって増えない。
- 基準時刻の数値とマーカーは一致し、次回の復習予定に達したかどうかも同じ基準時刻で示す。
- 同時刻のマーカーも識別でき、短期・長期の範囲の曲線を確認できる。
- 別の Card を開いた場合や画面へ戻った場合は現在の基準時刻を表示し、別 Card の曲線を残さない。
- 再読み込み後や匿名・オフラインの利用中も、一度読み込んだ記憶状態を確認できる。復習間隔の ON / OFF では記憶状態の表示を失わない。
- 読み込めない記憶状態や取得失敗を、未評価の Card として表示しない。
- 英語・日本語、モバイル、dark mode でテキストと読み上げ名・説明を確認できる。
