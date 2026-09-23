# Deck Transfer E2E テスト仕様書

## 目的

Deck の Card を外部で利用できる形式へ export できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-TRANSFER-01 | read | 正常系 | [Deck の Card を CSV で export できる](#deck-transfer-01) |

<a id="deck-transfer-01"></a>

### DECK-TRANSFER-01 Deck の Card を CSV で export できる

カテゴリ: `read`

区分: 正常系

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
