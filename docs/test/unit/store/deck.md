# Deck Store 単体テスト仕様書

## 目的

取得済みデックの一覧が最新の結果に切り替わり、クリア後に以前のデックを参照できないことを確認する。Firestore の通信、document の検証、論理削除の除外、認証ライフサイクルは対象外とする。

関連 E2E: [CARD-LIST-ACTIONS-01](../../e2e/card-list-actions.md#card-list-actions-01)、[ACCOUNT-04](../../e2e/account.md#account-04)

共通の検証前提は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| UNIT-STORE-DECK-01 | state-change | 正常系 | [最新の取得結果だけをデック一覧として提供する](#unit-store-deck-01) |
| UNIT-STORE-DECK-02 | scope-reset | 正常系 | [デックのクリア後は以前のデックを参照できない](#unit-store-deck-02) |

<a id="unit-store-deck-01"></a>

### UNIT-STORE-DECK-01 [TODO] 最新の取得結果だけをデック一覧として提供する

カテゴリ: `state-change`

区分: 正常系

Given:

次の変更前のデックを保持している。各行を独立して検証する。

| 変更前のデック | 新しい取得結果 |
| --- | --- |
| なし | A、B |
| A（名前が旧名称）、B | A（名前が新名称）、C |
| A、B | なし |

When:

新しい取得結果をデックモデルへ反映する。

Then:

参照できるデックの ID と内容は新しい取得結果に一致する。以前だけ存在した B や A の旧名称は残らず、空の結果を受け取った場合は以前のデックを参照できない。

<a id="unit-store-deck-02"></a>

### UNIT-STORE-DECK-02 [TODO] デックのクリア後は以前のデックを参照できない

カテゴリ: `scope-reset`

区分: 正常系

Given:

デック A、B を保持している場合と、デックを保持していない場合を用意する。

When:

デックモデルのクリア操作を行う。

Then:

どちらの場合もデック一覧は空となり、以前のデックを参照できない。既に空であっても操作は失敗しない。
