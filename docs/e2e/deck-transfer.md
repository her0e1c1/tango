# Deck Transfer E2E テスト仕様書

## 目的

Deck と Card の保存先を local-only から remote へ移行し、Deck の Card を外部で利用できる形式へ export できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-07 | batch | [local-only Deck と Card を remote へ移行できる](#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](#deck-08) |

<a id="deck-07"></a>

### DECK-07 local-only Deck と Card を remote へ移行できる

カテゴリ: `batch`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 認証済みユーザーの browser storage に local-only Deck が存在する。
- 対象 Deck に複数の local-only Card が存在する。

When:

- 対象 Deck の Local only を無効にして保存し、画面を reload する。

Then:

- Deck の更新成功が共通 toast で表示される。
- 対象 Deck とすべての Card が remote から読み込まれて表示される。
- browser storage に移行前の Deck と Card の duplicate が残らない。
- browser error が発生しない。

<a id="deck-08"></a>

### DECK-08 Deck の Card を CSV で export できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text、back text、tags、unique key を持つ Card が複数存在する。

When:

- Deck 一覧から対象 Deck の CSV download を実行する。

Then:

- 対象 Deck の name に対応する CSV file が download される。
- CSV に各 Card の front text、back text、tags、unique key が Card ごとの row として含まれる。
- browser error が発生しない。
