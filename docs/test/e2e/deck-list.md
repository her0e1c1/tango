# Deck 一覧 E2E テスト仕様書

## 目的

保存済みの学習を Deck 一覧から同じ位置で再開できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-LIST-13 | write | 正常系 | [Deck 一覧の Continue から既存の学習を再開できる](#deck-list-13) |

<a id="deck-list-13"></a>

### DECK-LIST-13 Deck 一覧の Continue から既存の学習を再開できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- Deck に既存の学習があり、Deck 一覧に Continue が表示されている。

When:

- Deck 一覧で Continue を選択する。

Then:

- 既存の学習を再開する。
- 一覧表示と再開によって、Deck・Card の内容や学習結果・現在位置を変更しない。
