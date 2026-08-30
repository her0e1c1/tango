# Card List Actions E2E テスト仕様書

## 目的

Card 一覧上の swipe と filter が、Card の学習状態と一覧表示へ正しく反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-05 | write | [Card の右 swipe で score を増やせる](#card-05) |
| CARD-06 | write | [Card の左 swipe で score を減らせる](#card-06) |
| CARD-10 | write | [score と tag の filter を保存して Card 一覧へ反映できる](#card-10) |

<a id="card-05"></a>

### CARD-05 Card の右 swipe で score を増やせる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score を持つ Card が存在する。

When:

- Card 一覧で対象 Card を右方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の score が swipe 前より 1 増えて表示される。
- browser error が発生しない。

<a id="card-06"></a>

### CARD-06 Card の左 swipe で score を減らせる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score を持つ Card が存在する。

When:

- Card 一覧で対象 Card を左方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の score が swipe 前より 1 減って表示される。
- browser error が発生しない。

<a id="card-10"></a>

### CARD-10 score と tag の filter を保存して Card 一覧へ反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score と tags の組み合わせが異なる複数の Card が存在する。

When:

- Card 一覧で score 範囲と tag filter を設定し、保存完了後に画面を reload する。

Then:

- reload 前に設定した score 範囲と tag filter が表示される。
- 両方の filter 条件に一致する Card だけが一覧に表示される。
- browser error が発生しない。
