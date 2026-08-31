# Card List Actions E2E テスト仕様書

## 目的

Card 一覧上の swipe と filter が、Card の学習状態と一覧表示へ正しく反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-05 | write | [Card の右 swipe で difficulty を下げられる](#card-05) |
| CARD-06 | write | [Card の左 swipe で difficulty を上げられる](#card-06) |
| CARD-10 | write | [difficulty と tag の filter を保存して Card 一覧へ反映できる](#card-10) |
| CARD-18 | write | [Card 一覧の difficulty 保存失敗後に再試行できる](#card-18) |

<a id="card-05"></a>

### CARD-05 Card の右 swipe で difficulty を下げられる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に difficulty を持つ Card が存在する。

When:

- Card 一覧で対象 Card を右方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の difficulty が swipe 前より 1 下がって表示される。
- browser error が発生しない。

<a id="card-06"></a>

### CARD-06 Card の左 swipe で difficulty を上げられる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に difficulty を持つ Card が存在する。

When:

- Card 一覧で対象 Card を左方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の difficulty が swipe 前より 1 上がって表示される。
- browser error が発生しない。

<a id="card-10"></a>

### CARD-10 difficulty と tag の filter を保存して Card 一覧へ反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に difficulty と tags の組み合わせが異なる複数の Card が存在する。

When:

- Card 一覧で difficulty 範囲と tag filter を設定し、保存完了後に画面を reload する。

Then:

- reload 前に設定した difficulty 範囲と tag filter が表示される。
- 両方の filter 条件に一致する Card だけが一覧に表示される。
- browser error が発生しない。

<a id="card-18"></a>

### CARD-18 Card 一覧の difficulty 保存失敗後に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に difficulty を持つ Card と、変更対象ではない別の Card が存在する。
- 対象 Card の最初の difficulty 保存要求が失敗し、失敗が画面内で処理されている。
- 次の difficulty 保存要求は成功できる。

When:

- 対象 Card を最初の操作と同じ右方向に swipe して再試行し、保存完了後に画面を reload する。

Then:

- 保存失敗の feedback が消える。
- 対象 Card の difficulty が最初の操作前より 1 下がって表示される。
- 変更対象ではない Card の difficulty は変更されない。
- 最初の保存失敗に伴う未処理の browser error が発生しない。
