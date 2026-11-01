# Card 一覧 E2E テスト仕様書

## 目的

Card 一覧の本文・タグ、裏面のプレビュー、Card 未登録時の追加導線と、存在しない Deck からの復帰を確認する。タグによる絞り込みは [Card Filter](./card-filter.md)、並び順・フィルター操作・行操作は [Card List Actions](./card-list-actions.md) で確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-LIST-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](#card-list-01) |
| CARD-LIST-02 | read | 正常系 | [Card の裏面オーバーレイを開ける](#card-list-02) |
| CARD-LIST-03 | read | 正常系 | [Card の裏面オーバーレイを閉じられる](#card-list-03) |
| CARD-LIST-04 | read | 正常系 | [Card 未登録の一覧から Card の追加へ進める](#card-list-04) |
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

### CARD-LIST-02 Card の裏面オーバーレイを開ける

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、両面の本文を持つ Card がある。

When:

- Card 一覧で対象 Card を選択する。

Then:

- 対象 Card の裏面の本文をオーバーレイに表示する。

<a id="card-list-03"></a>

### CARD-LIST-03 Card の裏面オーバーレイを閉じられる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で、裏面のオーバーレイを開いている。

When:

- オーバーレイを閉じる。

Then:

- オーバーレイが閉じ、一覧に対象 Card の表面の本文を表示する。Card の内容と学習結果は変わらない。

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
