# Deck Transfer E2E テスト仕様書

## 目的

Deck の Card を外部で利用できる形式へ export できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-TRANSFER-01 | read | 正常系 | [Deck の Card を CSV で export できる](#deck-transfer-01) |
| DECK-TRANSFER-02 | read | 正常系 | [特殊文字とタグなしの Card を内容を失わず CSV へ出力する](#deck-transfer-02) |

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

<a id="deck-transfer-02"></a>

### DECK-TRANSFER-02 [TODO] 特殊文字とタグなしの Card を内容を失わず CSV へ出力する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-transfer-special-text`](./fixture/deck-transfer-special-text.yaml)
- 対象 Deck に、日本語・カンマ・二重引用符・改行を含む Card と、タグなしの Card が保存されている。
- 別の Deck にも Card が保存されている。

When:

- Deck 一覧から対象 Deck の CSV download を実行する。

Then:

- CSV をその形式に従って読み取ると、対象 Deck の各 Card が一つずつのレコードとして得られる。
- front text、back text、tags、unique key が保存値と一致し、特殊文字や本文中の改行が余分な列・レコードにならない。
- タグなしの Card はタグが空のまま含まれ、後続の unique key の列がずれない。
- 別の Deck の Card は含まれない。
- ダウンロードによって両 Deck の Card の内容・件数は変更されない。
