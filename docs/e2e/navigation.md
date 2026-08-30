# Navigation E2E テスト仕様書

## 目的

存在しない route から復帰でき、画面ごとの keyboard shortcut で主要 route へ遷移できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |

<a id="navigation-01"></a>

### NAVIGATION-01 存在しない route から Deck 一覧へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーがアプリケーションにアクセスできる。
- Sample Deck の自動生成が無効である。

When:

- 存在しない route を直接開き、`Go home` を選択する。

Then:

- Deck 一覧へ遷移する。
- not-found 表示が残らない。
- browser error が発生しない。

<a id="navigation-02"></a>

### NAVIGATION-02 画面の keyboard shortcut で主要 route へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧と Card 一覧を利用できる。

When:

- Deck 一覧で `s` を入力して Settings を開き、Deck 一覧へ戻って `i` を入力して Import を開く。
- Card 一覧で `t` を入力して Deck 一覧を開き、Card 一覧へ戻って `s` を入力して Settings を開く。

Then:

- 各 shortcut に設定された route へ1回だけ遷移する。
- Deck と Card の永続データは変更されない。
- browser error が発生しない。