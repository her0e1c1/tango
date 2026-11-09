# Deck 遷移 RTL 結合テスト仕様書

## 目的

Deck 一覧の操作、router、読み込み済みの Entity 状態を組み合わせ、似た識別子を持つ Deck を取り違えず Card 一覧へ遷移することを確認する。認証と Firestore の通信・保存は対象外とする。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| RTL-NAVIGATION-01 | read | 正常系 | [特殊文字を含む識別子でも選んだ Deck の Card を表示する](#rtl-navigation-01) |

<a id="rtl-navigation-01"></a>

### RTL-NAVIGATION-01 特殊文字を含む識別子でも選んだ Deck の Card を表示する

カテゴリ: `read`

区分: 正常系

Given:

- 匿名認証済みで、Sample Deck の自動生成を無効にしている。
- 識別子が `plan`、`plan?draft=1`、`plan#draft` の3つの Deck と、それぞれに属する Card が読み込み済みである。各 Deck の名前と Card 本文は異なる。
- 実際の App、router、Entity 状態を使用し、認証 provider、Firestore 購読と保存の境界はテスト側で置き換える。

When:

- 各 Deck の「Open cards in …」を選び、その遷移先を初期 URL として App と router を再マウントして直接入場する。

Then:

- 一覧からの遷移と直接入場のどちらでも、選択した Deck の Card だけを表示し、他の2つの Deck の Card を表示しない。
- `plan` は `/deck/plan`、`plan?draft=1` は `/deck/plan%3Fdraft%3D1`、`plan#draft` は `/deck/plan%23draft` に遷移し、search と hash は空である。直接入場後も同じ経路を保持する。
- 読み込み済みの Deck・Card の内容と Card に含まれる学習状態は変わらない。
- [代表的な利用導線](../../e2e/deck-list.md#deck-list-01) と役割を分ける。このケースはブラウザー再読み込みや永続データの復元を確認しない。
