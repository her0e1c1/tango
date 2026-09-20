# Deck Navigation E2E テスト仕様書

## 目的

Deck と Card 一覧の主要な route を開き、存在しない Deck から利用可能な画面へ復帰できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-01) |
| DECK-06 | read | [存在しない Deck から復帰できる](#deck-06) |

<a id="deck-01"></a>

### DECK-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に Card が存在する。

When:

- Deck 一覧上部の「アクション」を開き、作成とインポートの項目を確認する。
- keyboard の矢印キーで項目を移動し、Escape で閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。
- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存操作をせず一覧へ戻る。
- 対象 Deck を選択する。

Then:

- 一覧のアクションには作成とインポートが表示され、一覧が空の場合も利用できる。
- Escape でメニューが閉じ、開いたボタンに focus が戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- 作成とインポートの項目は、それぞれ既存の作成画面とインポート画面へ遷移する。
- 対象 Deck の Card 一覧へ遷移する。
- 対象 Card の front text が表示される。
- browser error が発生しない。

<a id="deck-06"></a>

### DECK-06 存在しない Deck から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーの保存先に、route が参照する Deck が存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。
