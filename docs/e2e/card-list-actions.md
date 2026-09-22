# Card List Actions E2E テスト仕様書

## 目的

Card 一覧上のタグ filter と表示順が、教材や個人学習状態を変更せずに動作することを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-LIST-ACTIONS-01 | write | [tag の filter を保存して Card 一覧へ反映できる](#card-list-actions-01) |
| CARD-LIST-ACTIONS-02 | read | [Card を追加が新しい順に表示できる](#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | [Card の表示順を標準へ戻せる](#card-list-actions-03) |

<a id="card-list-actions-01"></a>

### CARD-LIST-ACTIONS-01 tag の filter を保存して Card 一覧へ反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に tags が異なる複数の Card が存在する。

When:

- Card 一覧で tag filter を続けて変更する。
- 一覧に表示された選択済みタグのチップをキーボード操作で解除する。
- 保存完了後に画面を reload する。

Then:

- 各変更が操作順に自動保存され、保存ボタンは表示されない。
- 保存中も filter を変更でき、別画面への移動時も最新条件と保存順序を維持する。
- 選択済みタグを解除した直後も、残るチップまたは Filters の見出しへ可視フォーカスを維持し、続くキーボード操作を継続できる。
- reload 前に設定した最後の tag filter が表示される。
- 保存失敗時はエラーを通知して選択を維持し、次の変更で全条件を再保存する。
- 両方の filter 条件に一致する Card だけが一覧に表示される。
- browser error が発生しない。

<a id="card-list-actions-02"></a>

### CARD-LIST-ACTIONS-02 Card を追加が新しい順に表示できる

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
- browser error が発生しない。

<a id="card-list-actions-03"></a>

### CARD-LIST-ACTIONS-03 Card の表示順を標準へ戻せる

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
