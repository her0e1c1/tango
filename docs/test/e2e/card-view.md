# Card View E2E テスト仕様書

## 目的

Card の本文・タグ・記憶状態を表示し、裏面のプレビューや閲覧エラーから復帰できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-VIEW-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](#card-view-01) |
| CARD-VIEW-02 | read | 正常系 | [Card の裏面オーバーレイを開ける](#card-view-02) |
| CARD-VIEW-03 | read | 正常系 | [Card の裏面オーバーレイを閉じられる](#card-view-03) |
| CARD-VIEW-04 | read | 正常系 | [Card 閲覧画面を直接開ける](#card-view-04) |
| CARD-VIEW-07 | read | 正常系 | [Card の閲覧 URL の変更に表示が追従する](#card-view-07) |
| CARD-VIEW-08 | read | 正常系 | [未評価の Card に推定した記憶状態を表示しない](#card-view-08) |
| CARD-VIEW-09 | read | 正常系 | [Card の切り替え・再表示で記憶状態を更新する](#card-view-09) |
| CARD-VIEW-06 | write | 正常系 | [評価後の記憶状態を確認できる](#card-view-06) |
| CARD-VIEW-05 | read | 異常系 | [存在しない Card から復帰できる](#card-view-05) |
| CARD-VIEW-10 | read | 異常系 | [読み込めない記憶状態を未評価として表示しない](#card-view-10) |

<a id="card-view-01"></a>

### CARD-VIEW-01 Card 一覧に学習情報を表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、タグ付きの Card がある。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の表面の本文とタグを表示する。

<a id="card-view-02"></a>

### CARD-VIEW-02 Card の裏面オーバーレイを開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、両面の本文を持つ Card がある。

When:

- Card 一覧で対象 Card を選択する。

Then:

- 対象 Card の裏面の本文をオーバーレイに表示する。

<a id="card-view-03"></a>

### CARD-VIEW-03 Card の裏面オーバーレイを閉じられる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で、裏面のオーバーレイを開いている。

When:

- オーバーレイを閉じる。

Then:

- オーバーレイが閉じ、一覧に対象 Card の表面の本文を表示する。Card の内容と学習結果は変わらない。

<a id="card-view-04"></a>

### CARD-VIEW-04 Card 閲覧画面を直接開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、裏面の本文を持つ Card がある。

When:

- 対象 Card の閲覧 URL を直接開く。

Then:

- 裏面の本文を Card answer に表示し、共通ヘッダーとナビゲーションも表示する。

<a id="card-view-07"></a>

### CARD-VIEW-07 Card の閲覧 URL の変更に表示が追従する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、裏面の本文を持つ複数の Card があり、その1枚を閲覧している。

When:

- 同じ画面で別 Card の閲覧 URL を開く。

Then:

- Card answer を遷移先の裏面の本文に更新し、共通ヘッダーとナビゲーションも表示する。

<a id="card-view-08"></a>

### CARD-VIEW-08 未評価の Card に推定した記憶状態を表示しない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Deck に未評価の Card がある。

When:

- 未評価の Card の閲覧画面を開く。

Then:

- FSRS 未開始と表示し、以前の復習予定や閲覧回数から推定した数値は表示しない。

<a id="card-view-09"></a>

### CARD-VIEW-09 Card の切り替え・再表示で記憶状態を更新する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Deck に複数の Card があり、評価済み Card の記憶状態を表示している。

When:

- 別 Card を開くか、閲覧画面を離れて戻る。

Then:

- 現在の基準時刻を表示し、別 Card の曲線を残さない。

<a id="card-view-06"></a>

### CARD-VIEW-06 評価後の記憶状態を確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、まだ評価していない Card がある。
- 表示言語は英語または日本語で、モバイル表示やダークモード、復習間隔の ON / OFF でも利用する。

When:

- 学習画面で Card を評価してから Card 閲覧画面を開き、再読み込みやオフラインでの閲覧を行う。

Then:

- 評価後は「追加で復習しなかった場合の FSRS による推定」として想起率と忘却曲線を表示する。
- 最終復習、基準時刻、次回の復習予定と目標保持率を区別して示す。
- 想起率は最終復習直後に100%で、追加で復習しない限り、分・時間の経過によって増えない。
- 基準時刻の数値とマーカーは一致し、次回の復習予定に達したかどうかも同じ基準時刻で示す。
- 同時刻のマーカーも識別でき、短期・長期の範囲の曲線を確認できる。
- 再読み込み後や匿名・オフラインの利用中も、一度読み込んだ記憶状態を確認できる。復習間隔の ON / OFF では記憶状態の表示を失わない。
- 英語・日本語、モバイル、ダークモードでテキストと読み上げ名・説明を確認できる。

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

<a id="card-view-10"></a>

### CARD-VIEW-10 [TODO] 読み込めない記憶状態を未評価として表示しない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Deck に記憶状態を読み込めない Card があるか、取得が失敗する。

When:

- 対象 Card の閲覧画面を開く。

Then:

- 読み込み不能や取得失敗を未評価として表示しない。
