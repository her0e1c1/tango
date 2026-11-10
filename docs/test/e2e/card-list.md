# Card 一覧 E2E テスト仕様書

## 目的

Card 一覧の本文・タグ、裏面のプレビュー、Card 未登録時の追加導線と、存在しない Deck からの復帰を確認する。タグによる絞り込みは [Card Filter](./card-filter.md)、並び順・フィルター操作・行操作は [Card List Actions](./card-list-actions.md) で確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-LIST-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](#card-list-01) |
| CARD-LIST-02 | read | 正常系 | [Card の解答プレビューを開ける](#card-list-02) |
| CARD-LIST-03 | read | 正常系 | [Card の解答プレビューを閉じて一覧へ戻れる](#card-list-03) |
| CARD-LIST-04 | read | 正常系 | [Card 未登録の一覧から Card の追加へ進める](#card-list-04) |
| CARD-LIST-06 | read | 正常系 | [解答の文章を選択できる](#card-list-06) |
| CARD-LIST-07 | read | 正常系 | [解答のリンクと脚注をたどれる](#card-list-07) |
| CARD-LIST-08 | read | 正常系 | [解答の本文をキーボードで縦にスクロールできる](#card-list-08) |
| CARD-LIST-09 | read | 正常系 | [解答のコードをキーボードで横にスクロールできる](#card-list-09) |
| CARD-LIST-10 | read | 正常系 | [解答の数式をキーボードで横にスクロールできる](#card-list-10) |
| CARD-LIST-05 | read | 異常系 | [存在しない Deck から復帰できる](#card-list-05) |

<a id="card-list-01"></a>

### CARD-LIST-01 Card 一覧に学習情報を表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、タグ付きの Card がある。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の表面の本文とタグを表示する。

<a id="card-list-02"></a>

### CARD-LIST-02 Card の解答プレビューを開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、両面の本文を持つ Card がある。

When:

- Card 一覧の対象 Card へキーボードで移動し、表示を選ぶ。

Then:

- 対象 Card の名前付き解答プレビューを表示し、フォーカスがプレビュー内へ移る。
- タイトル・閉じる操作・本文へキーボードで移動でき、Tab と Shift+Tab はプレビュー内を循環する。長いタイトルもキーボードでスクロールできる。
- 本文を読む間は背景の一覧・フィルター・並び順・画面移動の操作へ移らない。

<a id="card-list-03"></a>

### CARD-LIST-03 Card の解答プレビューを閉じて一覧へ戻れる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で、解答プレビューを開いている。

When:

- 本文とは独立した「カードを閉じる」操作、または Escape でプレビューを閉じる。

Then:

- プレビューが閉じ、接続済みで操作可能な起点へフォーカスが戻る。起点がなくなっている場合は、別の Card へ移さず一覧の並び順操作へ戻る。
- 一覧の絞り込みと並び順、Card の内容と学習結果は変わらず、一覧を再び操作できる。

<a id="card-list-04"></a>

### CARD-LIST-04 Card 未登録の一覧から Card の追加へ進める

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card 未登録・フィルター未設定の Deck の Card 一覧を開いている。

When:

- Card の追加操作を選択する。

Then:

- 対象 Deck の Card 作成画面へ移動する。

<a id="card-list-06"></a>

### CARD-LIST-06 解答の文章を選択できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-answer-preview`](./fixture/card-answer-preview.yaml)
- ログイン中のアカウントが所有する Card の解答プレビューに、選択できる文章を表示している。

When:

- ポインターをドラッグして解答の文章を選択する。

Then:

- 文章が選択され、プレビューは開いたままである。

<a id="card-list-07"></a>

### CARD-LIST-07 解答のリンクと脚注をたどれる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-answer-preview`](./fixture/card-answer-preview.yaml)
- 解答プレビューに脚注へのリンクと注番号、脚注から本文へ戻るリンクがある。

When:

- 解答のリンクと注番号から脚注へ移動し、それぞれ本文へ戻る。

Then:

- 脚注と元の注番号が表示範囲へ移り、プレビューは開いたままである。

<a id="card-list-08"></a>

### CARD-LIST-08 解答の本文をキーボードで縦にスクロールできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-answer-preview`](./fixture/card-answer-preview.yaml)
- 解答プレビューに縦に長い本文を表示している。

When:

- 解答の本文へフォーカスし、PageDown を押す。

Then:

- 本文の下方へ読み取り位置が移り、プレビューは開いたままである。

<a id="card-list-09"></a>

### CARD-LIST-09 解答のコードをキーボードで横にスクロールできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-answer-preview`](./fixture/card-answer-preview.yaml)
- 解答プレビューに横に長いコードを表示している。

When:

- コードへフォーカスし、右矢印キーを押す。

Then:

- コードの右方へ読み取り位置が移り、プレビューは開いたままである。

<a id="card-list-10"></a>

### CARD-LIST-10 解答の数式をキーボードで横にスクロールできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-answer-preview`](./fixture/card-answer-preview.yaml)
- 解答プレビューに横に長い数式を表示している。

When:

- 数式へフォーカスし、右矢印キーを押す。

Then:

- 数式の右方へ読み取り位置が移り、プレビューは開いたままである。

<a id="card-list-05"></a>

### CARD-LIST-05 存在しない Deck から復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 開こうとしている URL の Deck は存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。
