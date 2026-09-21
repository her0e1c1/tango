# Card View E2E テスト仕様書

## 目的

Card 一覧と Card view で学習情報・裏面を表示し、overlay や存在しない Card から安全に復帰できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-VIEW-01 | read | [Card 一覧に学習情報を表示できる](#card-view-01) |
| CARD-VIEW-02 | read | [Card の裏面 overlay を開ける](#card-view-02) |
| CARD-VIEW-03 | read | [開いている Card の裏面 overlay を閉じられる](#card-view-03) |
| CARD-VIEW-04 | read | [Card view を直接開ける](#card-view-04) |
| CARD-VIEW-05 | read | [存在しない Card から復帰できる](#card-view-05) |

<a id="card-view-01"></a>

### CARD-VIEW-01 Card 一覧に学習情報を表示できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に difficulty、学習回数、tags を持つ Card が存在する。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の front text、difficulty、学習回数、tags が表示される。
- browser error が発生しない。

<a id="card-view-02"></a>

### CARD-VIEW-02 Card の裏面 overlay を開ける

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text と back text を持つ Card が存在する。

When:

- Card 一覧で対象 Card を選択する。

Then:

- 対象 Card の back text が overlay に表示される。
- browser error が発生しない。

<a id="card-view-03"></a>

### CARD-VIEW-03 開いている Card の裏面 overlay を閉じられる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card 一覧で、対象 Card の back text overlay が開いている。

When:

- overlay の close action を実行する。

Then:

- back text overlay が閉じる。
- Card 一覧に対象 Card の front text が表示される。
- Card の永続データが変更されない。
- browser error が発生しない。

<a id="card-view-04"></a>

### CARD-VIEW-04 Card view を直接開ける

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に back text を持つ Card が存在する。

When:

- 対象 Card の view route を直接開く。
- 同じ画面を開いたまま別の Card の view route へ遷移する。

Then:

- 対象 Card の back text が Card answer として表示される。
- URL の Card ID が変わると、遷移先の Card の back text に表示が更新される。
- application shell が表示される。
- browser error が発生しない。

<a id="card-view-05"></a>

### CARD-VIEW-05 存在しない Card から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーの保存先に、route が参照する Card が存在しない。

When:

- 存在しない Card の view route を直接開き、Card が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。
