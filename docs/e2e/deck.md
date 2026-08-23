# Deck E2E テスト仕様書

## 目的

Deck 管理の主要導線が、ブラウザ上で画面遷移・状態更新まで破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から詳細へ遷移できる](#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して一覧に戻れる](#deck-02) |
| DECK-03 | write | [Deck を削除できる](#deck-03) |

<a id="deck-01"></a>

### DECK-01 Deck 一覧から詳細へ遷移できる

カテゴリ: `read`

Given:

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

When:

- Deck 一覧を開き、deck 名を選択する。

Then:

- 一覧に deck 名が表示される。
- deck 詳細画面に遷移する。
- card 一覧に card が表示される。
- browser error が発生しない。

<a id="deck-02"></a>

### DECK-02 Deck 編集内容を保存して一覧に戻れる

カテゴリ: `write`

Given:

- `docs/e2e/seed.md` の Deck が localStorage に保存されている。

When:

- deck name を編集して保存する。

Then:

- Deck 一覧に戻る。
- 一覧に変更後の deck 名が表示される。
- browser error が発生しない。

<a id="deck-03"></a>

### DECK-03 Deck を削除できる

カテゴリ: `write`

Given:

- `docs/e2e/seed.md` の Deck が localStorage に保存されている。

When:

- Deck 一覧から deck を削除する。

Then:

- 一覧に deck が表示されない。
- browser error が発生しない。
