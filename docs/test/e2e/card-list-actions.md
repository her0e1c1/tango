# Card List Actions E2E テスト仕様書

## 目的

Card 一覧上のタグ filter と表示順が、教材や個人学習状態を変更せずに動作することを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-LIST-ACTIONS-02 | read | 正常系 | [Card を追加が新しい順に表示できる](#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | 正常系 | [Card の表示順を標準へ戻せる](#card-list-actions-03) |
| CARD-LIST-ACTIONS-07 | read | 正常系 | [並び替え後も選択した Card のプレビューと行操作を利用できる](#card-list-actions-07) |
| CARD-LIST-ACTIONS-08 | read | 正常系 | [別 Card の変更後も行のフォーカスとメニューを維持できる](#card-list-actions-08) |
| CARD-LIST-ACTIONS-10 | read | 正常系 | [filter 保存中も並び替えでき、禁止中の操作は実行できない](#card-list-actions-10) |
| CARD-LIST-ACTIONS-11 | read | 正常系 | [画面を離れるか Deck を変更すると並び順が標準に戻る](#card-list-actions-11) |
| CARD-LIST-ACTIONS-01 | write | 正常系 | [tag の filter を保存して Card 一覧へ反映できる](#card-list-actions-01) |
| CARD-LIST-ACTIONS-04 | write | 正常系 | [選択済みタグをキーボードで解除して操作を続けられる](#card-list-actions-04) |
| CARD-LIST-ACTIONS-05 | write | 正常系 | [filter 保存中に変更しても最後の選択を維持できる](#card-list-actions-05) |
| CARD-LIST-ACTIONS-09 | write | 正常系 | [言語やフィルターを変更しても並び順を保持できる](#card-list-actions-09) |
| CARD-LIST-ACTIONS-06 | write | 異常系 | [filter 保存失敗後も選択を維持して次の変更を保存できる](#card-list-actions-06) |

<a id="card-list-actions-02"></a>

### CARD-LIST-ACTIONS-02 Card を追加が新しい順に表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck に追加日時が異なる Card と、追加日時が同じ Card が存在する。
- Card 一覧は標準の順序で表示され、既存の Study session がある。

When:

- キーボードで並び順の「追加が新しい順」を選択する。

Then:

- 追加日時が新しい Card から表示され、同じ追加日時では標準の相対順序を維持する。編集日時は順序に影響しない。
- 件数と tag 選択肢、フィルターに一致する Card は変わらない。
- Card・Deck の内容や既存の学習の出題順・現在位置は変わらない。
- 新しく始める学習の対象や出題順にも影響しない。

<a id="card-list-actions-03"></a>

### CARD-LIST-ACTIONS-03 Card の表示順を標準へ戻せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。
- 対象 Deck に既存の Study session がある。

When:

- キーボードで並び順の「標準」を選択する。

Then:

- その時点の標準の順序へ戻り、件数・Card と Deck の内容・学習の出題順と現在位置は変わらない。

<a id="card-list-actions-07"></a>

### CARD-LIST-ACTIONS-07 並び替え後も選択した Card のプレビューと行操作を利用できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 対象 Card の解答プレビューを開いて閉じるか、行の操作を選択する。

Then:

- プレビューと各行の操作は選択した Card を対象とする。
- プレビューを開いて閉じても並び順を保持する。

<a id="card-list-actions-08"></a>

### CARD-LIST-ACTIONS-08 [TODO] 別 Card の変更後も行のフォーカスとメニューを維持できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。
- 操作可能な行にフォーカスがあるか、対象 Card のメニューを開いている。

When:

- 別 Card が追加・更新・削除されるか、メニューの対象 Card が削除される。

Then:

- 別 Card の変更では、残る操作可能な行のフォーカスとメニューを維持する。
- 対象の Card が消えた場合はメニューを閉じる。

<a id="card-list-actions-10"></a>

### CARD-LIST-ACTIONS-10 [TODO] filter 保存中も並び替えでき、禁止中の操作は実行できない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧を開いている。
- フィルター自動保存中、Card の変更中、または dialog 表示中である。

When:

- 並び順や、その状態で禁止されている行の操作を選択しようとする。

Then:

- フィルター自動保存中も並び順を選択できる。
- Card の変更中や dialog 表示中に禁止されている操作は引き続き実行できない。

<a id="card-list-actions-11"></a>

### CARD-LIST-ACTIONS-11 画面を離れるか Deck を変更すると並び順が標準に戻る

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 一覧画面から離れて戻るか、表示する Deck を変更する。

Then:

- 並び順は標準に戻る。

<a id="card-list-actions-01"></a>

### CARD-LIST-ACTIONS-01 tag の filter を保存して Card 一覧へ反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に tags が異なる複数の Card が存在する。

When:

- Card 一覧で tag filter を変更し、保存完了後に画面を reload する。

Then:

- 変更は自動保存され、保存ボタンは表示されない。
- reload 前に設定した最後の tag filter が表示される。
- 両方の filter 条件に一致する Card だけが一覧に表示される。

<a id="card-list-actions-04"></a>

### CARD-LIST-ACTIONS-04 選択済みタグをキーボードで解除して操作を続けられる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 一覧で tag filter を選択し、選択済みタグのチップを表示している。
- 解除するチップにキーボードのフォーカスがある。

When:

- キーボードで選択済みタグのチップを解除する。

Then:

- 解除直後も、残るチップまたは最後のチップを解除した場合は Filters の見出しへ可視フォーカスを維持する。
- 続くキーボード操作を継続できる。

<a id="card-list-actions-05"></a>

### CARD-LIST-ACTIONS-05 [TODO] filter 保存中に変更しても最後の選択を維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 一覧で tag filter の変更を保存中である。

When:

- 保存中に tag filter を続けて変更し、別画面へ移動してから戻る。

Then:

- 保存中も filter を変更できる。
- 最後に選んだ条件が以前の条件に戻らない。

<a id="card-list-actions-09"></a>

### CARD-LIST-ACTIONS-09 [TODO] 言語やフィルターを変更しても並び順を保持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 通常ログインのユーザーが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 言語またはフィルターを変更し、フィルターでは結果0件となる条件も選択する。

Then:

- 言語・フィルター変更後や結果0件でも、選択した並び順を保持する。

<a id="card-list-actions-06"></a>

### CARD-LIST-ACTIONS-06 [TODO] filter 保存失敗後も選択を維持して次の変更を保存できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 一覧を開いている。
- 次の tag filter の変更は保存に失敗し、その後の変更は保存できる。

When:

- tag filter を変更し、保存失敗後にもう一度条件を変更して保存後に再表示する。

Then:

- 保存失敗時はエラーが通知され、選択は維持される。
- 次の変更が保存できた後は、選択中のすべての条件を再表示できる。
