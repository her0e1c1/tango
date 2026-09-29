# ページ未検出画面 Storybook 結合テスト仕様書

## 目的

ページ未検出画面を入口とした `play` で、未知の URL の案内と、利用を再開するためのホームへの移動を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-NOT-FOUND-01 | render | 異常系 | [未知の URL を案内する](#storybook-not-found-01) |
| STORYBOOK-NOT-FOUND-02 | interaction | 異常系 | [見つからない画面からホームへ戻る](#storybook-not-found-02) |

<a id="storybook-not-found-01"></a>

### STORYBOOK-NOT-FOUND-01 [TODO] 未知の URL を案内する

カテゴリ: `render`

区分: 異常系

Given:

- アプリケーションに存在しない URL を指定する。

When:

- 画面を開く。

Then:

- ページが見つからないこととホームへ戻る操作が表示される。

<a id="storybook-not-found-02"></a>

### STORYBOOK-NOT-FOUND-02 [TODO] 見つからない画面からホームへ戻る

カテゴリ: `interaction`

区分: 異常系

Given:

- ページが見つからない画面を表示している。

When:

- ホームへ戻る操作を選ぶ。

Then:

- Deck 一覧画面が表示され、一覧の操作を利用できる。
