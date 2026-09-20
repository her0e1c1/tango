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
| CARD-22 | write | [退出後に古い Card 更新が完了しても通知しない](#card-22) |
| CARD-23 | write | [再訪後の Card 更新を古い更新の完了から保護する](#card-23) |
| CARD-24 | read | [Card を追加が新しい順に表示できる](#card-24) |
| CARD-25 | read | [Card の表示順を標準へ戻せる](#card-25) |

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
- 一覧に表示された選択済みタグのチップをキーボード操作で解除する。
- 保存完了後に画面を reload する。

Then:

- 各変更が操作順に自動保存され、保存ボタンは表示されない。
- 保存中も filter を変更でき、別画面への移動時も最新条件と保存順序を維持する。
- 選択済みタグを解除した直後も、残るチップまたは Filters の見出しへ可視フォーカスを維持し、続くキーボード操作を継続できる。
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

- 保存失敗の toast は再操作・画面遷移・アンマウントでは消去せず、最初の表示から4秒後に自動非表示になる。画面遷移後も残りの表示時間だけ表示される。
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

<a id="card-22"></a>

### CARD-22 退出後に古い Card 更新が完了しても通知しない

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 一覧を開いている。
- 対象 Card の次の保存要求は、テスト側で応答を保留した後に失敗させられる。

When:

- 対象 Card を右 swipe して更新Aを開始し、応答を保留したまま同じ操作を繰り返す。
- ヘッダーから Deck 一覧へ退出し、その後Aを失敗させる。
- 同じ Deck の Card 一覧へ戻る。

Then:

- 更新中の連続操作は追加の更新を開始しない。
- 退出は開始済みの保存を中断しないが、退出後の失敗は画面状態を変更せず、新しい toast を表示しない。
- 再訪時に古い dialog や更新中状態は残らず、操作できる。
- 未処理の browser error が発生しない。

成功する保存、および削除・一括 difficulty 変更でも、退出後の完了は画面状態や toast を変更しない。同じ不変条件の境界値として component test で確認する。

<a id="card-23"></a>

### CARD-23 再訪後の Card 更新を古い更新の完了から保護する

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 一覧を開いている。
- ある Card の difficulty 保存Aと、別の Card の削除Bの応答を個別に保留できる。Aは失敗し、Bは成功できる。

When:

- Card を右 swipe してAを開始し、応答を保留したままヘッダーから Deck 一覧へ退出する。
- 同じ Deck の Card 一覧へ戻り、別の Card の削除 dialog を開いてBを開始する。
- Bが更新中の間にAを失敗させ、Bの確認・キャンセルを再度試みる。
- Bを成功させる。

Then:

- Aの完了は新しい削除 dialog を閉じず、Bの更新中状態を解除せず、toast も表示しない。
- Bの完了前は確認とキャンセルが無効で、二重実行しない。
- Bの成功時にだけ削除 dialog が閉じ、成功通知が表示され、操作可能になる。
- 未処理の browser error が発生しない。

Aが成功する場合、およびAが削除・一括 difficulty 変更の場合も同じ保護を行う。一括変更のBでは新しい一括変更 dialog を保持する。これらは同じ不変条件の境界値として component test で確認する。

<a id="card-24"></a>

### CARD-24 Card を追加が新しい順に表示できる

カテゴリ: `read`

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- local-only Deck に追加日時が異なる Card と、追加日時が同じ Card が存在する。
- Card 一覧は標準の順序で表示され、既存の Study session がある。

When:

- キーボードで並び順の「追加が新しい順」を選択する。
- 対象 Card の解答プレビューを開いて閉じる。

Then:

- `createdAt` の降順に表示され、同値では標準の相対順序を維持する。編集日時は順序に影響しない。
- 件数と tag 選択肢、フィルターの一致集合は変わらない。
- プレビューと各行の操作は同じ Card ID を対象とし、表示順や別 Card の追加・更新・削除でも、残る操作可能な行のフォーカスとメニューを維持する。対象行が消えたらメニューを閉じる。
- 並び順はプレビュー・言語・フィルター変更や結果0件でも保持する。フィルター自動保存中も選択でき、Card 変更中のロックと dialog 背景の制限は維持する。
- 並び替え自体は永続化せず、Card・Deck と既存 Study session の ID・順序・位置を変更しない。新規 Study の選定・順序にも影響しない。
- 一括変更の承認済み Card ID と difficulty は一覧の変化や部分失敗後の再試行でも維持する（CARD-19/20）。
- browser error が発生しない。

<a id="card-25"></a>

### CARD-25 Card の表示順を標準へ戻せる

カテゴリ: `read`

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- local-only Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- キーボードで並び順の「標準」を選択する。

Then:

- その時点の標準の順序へ戻り、件数・Card・Deck・Study session は変更されない。
- Page から離脱して戻った場合や Deck を変更した場合も、並び順は標準に戻る。
- browser error が発生しない。
