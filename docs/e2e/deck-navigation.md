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

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に Card が存在する。
- 追加の local-only ケースとして、通常の英数字 ID と、その ID に query／fragment の区切り文字を含む接尾辞を付けた Deck が共存し、それぞれ異なる名前と Card 本文を持つ。これらは現在のスキーマが受け付ける保存済みデータであり、作成フォームによる ID 指定ではない。

When:

- Deck 一覧上部の「アクション」を開き、作成とインポートの項目を確認する。
- keyboard の矢印キーで項目を移動し、Escape で閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。
- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存操作をせず一覧へ戻る。
- 対象 Deck を選択する。
- local-only ケースでは各 Deck を一覧から開き、生成された URL の直接表示と reload も行う。

Then:

- 一覧のアクションには作成とインポートが表示され、一覧が空の場合も利用できる。
- Escape でメニューが閉じ、開いたボタンに focus が戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- 作成とインポートの項目は、それぞれ既存の作成画面とインポート画面へ遷移する。
- 対象 Deck の Card 一覧へ遷移する。
- 対象 Card の front text が表示される。
- local-only ケースでは選択した完全な ID の Card だけが表示され、同じ接頭辞の別 Deck の Card は表示されない。
- ID 内の `?` と `#` は1つのパスパラメーターの値としてエンコードされ、query と fragment は空のままとなる。直接表示と reload 後も対象と内容が一致する。
- 表示と遷移によって保存済み Deck・Card の ID や内容は変更されない。
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
