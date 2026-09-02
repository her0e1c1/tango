# Card View E2E テスト仕様書

## 目的

Card 一覧と Card view で学習情報・裏面を表示し、overlay や存在しない Card から安全に復帰できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧に学習情報を表示できる](#card-01) |
| CARD-02 | read | [Card の裏面 overlay を開ける](#card-02) |
| CARD-07 | read | [開いている Card の裏面 overlay を閉じられる](#card-07) |
| CARD-11 | read | [Card view を直接開ける](#card-11) |
| CARD-12 | read | [存在しない Card から復帰できる](#card-12) |

<a id="card-01"></a>

### CARD-01 Card 一覧に学習情報を表示できる

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

<a id="card-02"></a>

### CARD-02 Card の裏面 overlay を開ける

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

<a id="card-07"></a>

### CARD-07 開いている Card の裏面 overlay を閉じられる

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

<a id="card-11"></a>

### CARD-11 Card view を直接開ける

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に back text を持つ Card が存在する。

When:

- 対象 Card の view route を直接開く。

Then:

- 対象 Card の back text が Card answer として表示される。
- application shell が表示される。
- browser error が発生しない。

<a id="card-12"></a>

### CARD-12 存在しない Card から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーの保存先に、route が参照する Card が存在しない。

When:

- 存在しない Card の view route を直接開き、Card が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。
