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

- 変更は自動保存され、保存ボタンは表示されない。
- 保存中も filter を変更できる。別画面へ移動して戻った場合も、最後に選んだ条件が以前の条件に戻らない。
- 選択済みタグを解除した直後も、残るチップまたは Filters の見出しへ可視フォーカスを維持し、続くキーボード操作を継続できる。
- reload 前に設定した最後の tag filter が表示される。
- 保存失敗時はエラーが通知され、選択は維持される。次の変更が保存できた後は、選択中のすべての条件を再表示できる。
- 両方の filter 条件に一致する Card だけが一覧に表示される。
- browser error が発生しない。

<a id="card-list-actions-02"></a>

### CARD-LIST-ACTIONS-02 Card を追加が新しい順に表示できる

カテゴリ: `read`

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck に追加日時が異なる Card と、追加日時が同じ Card が存在する。
- Card 一覧は標準の順序で表示され、既存の Study session がある。

When:

- キーボードで並び順の「追加が新しい順」を選択する。
- 対象 Card の解答プレビューを開いて閉じる。

Then:

- 追加日時が新しい Card から表示され、同じ追加日時では標準の相対順序を維持する。編集日時は順序に影響しない。
- 件数と tag 選択肢、フィルターに一致する Card は変わらない。
- 並び順が変わっても、プレビューと各行の操作は選択した Card を対象とする。別 Card が追加・更新・削除されても、残る操作可能な行のフォーカスとメニューを維持する。対象の Card が消えた場合はメニューを閉じる。
- 並び順はプレビュー・言語・フィルター変更や結果0件でも保持する。フィルター自動保存中も選択できるが、Card の変更中や dialog 表示中に禁止されている操作は引き続き実行できない。
- 並び替えによって Card・Deck の内容や既存の学習の出題順・現在位置は変わらない。新しく始める学習の対象や出題順にも影響しない。
- browser error が発生しない。

<a id="card-list-actions-03"></a>

### CARD-LIST-ACTIONS-03 Card の表示順を標準へ戻せる

カテゴリ: `read`

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- キーボードで並び順の「標準」を選択する。

Then:

- その時点の標準の順序へ戻り、件数・Card と Deck の内容・学習の出題順と現在位置は変わらない。
- 一覧画面から離れて戻った場合や Deck を変更した場合も、並び順は標準に戻る。
- browser error が発生しない。
