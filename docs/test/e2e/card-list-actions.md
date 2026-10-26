# Card List Actions E2E テスト仕様書

## 目的

Card 一覧のタグフィルター・並び順・行操作が、教材と学習状態を保って動作することを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-LIST-ACTIONS-02 | read | 正常系 | [Card を追加が新しい順に表示できる](#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | 正常系 | [Card の表示順を標準へ戻せる](#card-list-actions-03) |
| CARD-LIST-ACTIONS-07 | read | 正常系 | [並び替え後も選択した Card のプレビューと行操作を利用できる](#card-list-actions-07) |
| CARD-LIST-ACTIONS-08 | read | 正常系 | [別 Card の変更後も行のフォーカスとメニューを維持できる](#card-list-actions-08) |
| CARD-LIST-ACTIONS-10 | read | 正常系 | [フィルター保存中も並び替えでき、禁止中の操作は実行できない](#card-list-actions-10) |
| CARD-LIST-ACTIONS-11 | read | 正常系 | [画面を離れるか Deck を変更すると並び順が標準に戻る](#card-list-actions-11) |
| CARD-LIST-ACTIONS-01 | write | 正常系 | [タグフィルターを保存して Card 一覧へ反映できる](#card-list-actions-01) |
| CARD-LIST-ACTIONS-04 | write | 正常系 | [選択済みタグをキーボードで解除して操作を続けられる](#card-list-actions-04) |
| CARD-LIST-ACTIONS-05 | write | 正常系 | [フィルター保存中に変更しても最後の選択を維持できる](#card-list-actions-05) |
| CARD-LIST-ACTIONS-09 | write | 正常系 | [言語やフィルターを変更しても並び順を保持できる](#card-list-actions-09) |
| CARD-LIST-ACTIONS-06 | write | 異常系 | [フィルター保存失敗後も選択を維持して次の変更を保存できる](#card-list-actions-06) |

<a id="card-list-actions-02"></a>

### CARD-LIST-ACTIONS-02 Card を追加が新しい順に表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck に追加日時が異なる Card と、追加日時が同じ Card が存在する。
- Card 一覧は標準の順序で表示され、既存の学習セッションがある。

When:

- キーボードで並び順の「追加が新しい順」を選択する。

Then:

- 追加日時が新しい Card から表示され、同じ追加日時では標準の相対順序を維持する。編集日時は順序に影響しない。
- 件数とタグ候補、フィルターに一致する Card は変わらない。
- Card・Deck の内容や既存の学習の出題順・現在位置は変わらない。
- 新しく始める学習の対象や出題順にも影響しない。

<a id="card-list-actions-03"></a>

### CARD-LIST-ACTIONS-03 Card の表示順を標準へ戻せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。
- 対象 Deck に既存の学習セッションがある。

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
- ログイン中のアカウントが所有する Deck の Card 一覧を「追加が新しい順」で表示している。

When:

- 対象 Card の解答プレビューを開閉するか、行操作を選択する。

Then:

- プレビューと行操作は選択した Card を対象とし、プレビュー開閉後も並び順を保つ。

<a id="card-list-actions-08"></a>

### CARD-LIST-ACTIONS-08 [TODO] 別 Card の変更後も行のフォーカスとメニューを維持できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧を「追加が新しい順」で表示している。
- 操作可能な行にフォーカスがあるか、対象 Card のメニューを開いている。

When:

- 別 Card が追加・更新・削除されるか、メニュー対象の Card が削除される。

Then:

- 別 Card の変更では、残る行のフォーカスとメニューを保つ。対象 Card が削除された場合はメニューを閉じる。

<a id="card-list-actions-10"></a>

### CARD-LIST-ACTIONS-10 [TODO] フィルター保存中も並び替えでき、禁止中の操作は実行できない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧を開いている。
- フィルター自動保存中、Card の変更中、またはダイアログ表示中である。

When:

- 並び順や、その状態で禁止されている行の操作を選択しようとする。

Then:

- フィルター自動保存中も並び順を選択できる。
- Card の変更中やダイアログ表示中に禁止されている操作は引き続き実行できない。

<a id="card-list-actions-11"></a>

### CARD-LIST-ACTIONS-11 画面を離れるか Deck を変更すると並び順が標準に戻る

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 一覧画面から離れて戻るか、表示する Deck を変更する。

Then:

- 並び順は標準に戻る。

<a id="card-list-actions-01"></a>

### CARD-LIST-ACTIONS-01 タグフィルターを保存して Card 一覧へ反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に、タグが異なる複数の Card がある。

When:

- Card 一覧でタグフィルターを変更し、保存後に再読み込みする。

Then:

- 保存ボタンなしで自動保存し、最後のタグフィルターを復元する。
- 両方のフィルター条件に一致する Card だけを表示する。

<a id="card-list-actions-04"></a>

### CARD-LIST-ACTIONS-04 選択済みタグをキーボードで解除して操作を続けられる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧でタグフィルターを選択し、選択済みチップにフォーカスがある。

When:

- キーボードでチップを解除する。

Then:

- 残るチップに可視フォーカスを維持する。最後のチップを解除した場合は Filters 見出しに移り、キーボード操作を続けられる。

<a id="card-list-actions-05"></a>

### CARD-LIST-ACTIONS-05 [TODO] フィルター保存中に変更しても最後の選択を維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧でタグフィルターを保存中である。

When:

- 保存中に条件を続けて変更し、別画面へ移動して戻る。

Then:

- 保存中も変更でき、最後の選択が以前の条件に戻らない。

<a id="card-list-actions-09"></a>

### CARD-LIST-ACTIONS-09 [TODO] 言語やフィルターを変更しても並び順を保持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 言語またはフィルターを変更し、フィルターでは結果0件となる条件も選択する。

Then:

- 言語・フィルター変更後や結果0件でも、選択した並び順を保持する。

<a id="card-list-actions-06"></a>

### CARD-LIST-ACTIONS-06 [TODO] フィルター保存失敗後も選択を維持して次の変更を保存できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 一覧を開いている。次のタグフィルター保存は失敗し、その後は成功する。

When:

- 条件を変更し、保存失敗後に再度変更して、保存後に再表示する。

Then:

- 保存失敗を通知し、選択を維持する。次の保存に成功すると選択中の全条件を再表示できる。
