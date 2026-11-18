# Card List Actions E2E テスト仕様書

## 目的

Card 一覧で保存したタグフィルターを再読み込み後も利用できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-LIST-ACTIONS-01 | write | 正常系 | [タグフィルターを保存して Card 一覧へ反映できる](#card-list-actions-01) |

<a id="card-list-actions-01"></a>

### CARD-LIST-ACTIONS-01 タグフィルターを保存して Card 一覧へ反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、タグが異なる複数の Card がある。

When:

- Card 一覧でタグフィルターを変更し、保存後に再読み込みする。

Then:

- 保存ボタンなしで自動保存し、最後のタグフィルターを復元する。
- 選択したタグが付いた Card だけを表示する。
