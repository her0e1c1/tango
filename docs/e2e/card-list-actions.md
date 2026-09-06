# Card List Actions E2E テスト仕様書

## 目的

Card 一覧上の swipe、filter、一括変更が、Card の学習状態と一覧表示へ正しく反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-05 | write | [Card の右 swipe で difficulty を下げられる](#card-05) |
| CARD-06 | write | [Card の左 swipe で difficulty を上げられる](#card-06) |
| CARD-10 | write | [difficulty と tag の filter を保存して Card 一覧へ反映できる](#card-10) |
| CARD-18 | write | [Card 一覧の difficulty 保存失敗後に再試行できる](#card-18) |
| CARD-19 | batch | [表示中の Card の difficulty をまとめて変更できる](#card-19) |
| CARD-20 | batch | [Card の一括 difficulty 変更を部分失敗後に再試行できる](#card-20) |

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

- Card 一覧で difficulty 範囲と tag filter を続けて変更する。
- 保存完了後に画面を reload する。

Then:

- 各変更が操作順に自動保存され、保存ボタンは表示されない。
- 保存中も filter を変更でき、別画面への移動時も最新条件と保存順序を維持する。
- reload 前に設定した最後の difficulty 範囲と tag filter が表示される。
- 保存失敗時はエラーを通知して選択を維持し、次の変更で全条件を再保存する。
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

<a id="card-19"></a>

### CARD-19 表示中の Card の difficulty をまとめて変更できる

カテゴリ: `batch`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck に、difficulty が異なる複数の Card が存在する。
- 保存前の difficulty filter draft に一致する Card と、一致しない Card が存在する。

When:

- Card 一覧で difficulty filter draft を変更し、一致する Card だけを表示する。
- Actions の Change difficulty から dialog を開き、10個すべて表示されたボタンで新しい difficulty を選択する。
- keyboard で dialog 内を移動した後、Escape で一度キャンセルし、再度開いて一括変更を実行する。
- 保存完了後に画面を reload する。

Then:

- 確認画面は非破壊操作の dialog として、表示中の Card 件数と選択した新しい difficulty を表示する。
- 通常時は Actions に Add card と Change difficulty の選択肢だけを表示し、難易度選択は dialog を開くまで表示しない。
- dialog を開くとキャンセルへ focus し、Tab と Shift+Tab で focus が dialog 外へ移動せず、背景の scroll を抑止する。
- Escape では変更せずに dialog を閉じ、focus と背景の scroll を一括変更の起点へ復元する。
- 確認中と保存中は画面 shortcut でほかの route へ移動しない。
- filter draft に一致していたすべての Card の difficulty が、選択した値へ変更される。
- filter draft に一致しなかった Card の difficulty は変更されない。
- browser error が発生しない。

<a id="card-20"></a>

### CARD-20 Card の一括 difficulty 変更を部分失敗後に再試行できる

カテゴリ: `batch`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck に、一括変更の対象となる複数の Card が存在する。
- 最初の一括変更では対象 Card の1件だけが保存に失敗し、ほかの対象 Card は保存に成功する。
- 次の一括変更ではすべての対象 Card を保存できる。

When:

- Actions の Change difficulty から dialog を開き、10個すべて表示されたボタンで新しい difficulty を選択して、同じ dialog から一括変更を実行する。
- 部分失敗後も保持された対象と difficulty のまま、確認 dialog から一括変更を再試行する。
- 保存完了後に画面を reload する。

Then:

- 保存中は dialog が pending 状態を示し、確認とキャンセルを無効化して focus を dialog 内に保つ。
- 最初の試行後に成功件数と失敗件数が通知され、確認 dialog は同じ対象件数と difficulty を保持し、difficulty の再選択を無効化する。
- 最初の試行で成功した Card の difficulty は保持される。
- 再試行後は対象となったすべての Card の difficulty が、最初に選択した値へ変更される。
- 変更対象ではない Card の difficulty は変更されない。
- 最初の保存失敗に伴う未処理の browser error が発生しない。
