# E2E テスト仕様書

## テストケース

### Deck

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から詳細へ遷移できる](./deck.md#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して一覧に戻れる](./deck.md#deck-02) |
| DECK-03 | write | [Deck を削除できる](./deck.md#deck-03) |

### Card

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧を表示できる](./card.md#card-01) |
| CARD-02 | read | [Card の裏面を overlay で確認できる](./card.md#card-02) |
| CARD-03 | write | [Card 編集内容を保存して前画面に戻れる](./card.md#card-03) |
| CARD-04 | write | [Card を削除できる](./card.md#card-04) |
| CARD-05 | write | [Card の swipe 操作で score を更新できる](./card.md#card-05) |

### Swipe

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-01 | read | [Deck 学習画面で card の表面と裏面を表示できる](./swipe.md#swipe-01) |
| SWIPE-02 | write | [Deck 学習画面で mastered swipe を実行できる](./swipe.md#swipe-02) |

## 前提

- Playwright で実行する。
- 実行コマンドは `mise run e2e`。
- テストデータは localStorage に seed し、Firebase 実環境には依存しない。
- 並列実行時のデータ競合を避けるため、read のテストと write のテストは分ける。
