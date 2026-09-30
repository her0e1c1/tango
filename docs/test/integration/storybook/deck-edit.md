# Deck 編集画面 Storybook 結合テスト仕様書

## 目的

Deck 編集画面を入口とした `play` で、既存 Deck の表示・編集、保存失敗時の入力保持、削除確認と取消しを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-04 | interaction | 正常系 | [確認して Deck を削除する](#storybook-deck-form-04) |
| STORYBOOK-DECK-FORM-05 | interaction | 正常系 | [削除を取り消して編集を続ける](#storybook-deck-form-05) |
| STORYBOOK-DECK-FORM-06 | interaction | 正常系 | [削除処理中は再確定と取消しを受け付けない](#storybook-deck-form-06) |
| STORYBOOK-DECK-EDIT-01 | render | 正常系 | [選んだ Deck の保存済み内容を編集する](#storybook-deck-edit-01) |
| STORYBOOK-DECK-EDIT-02 | interaction | 正常系 | [変更した名前を一覧へ反映する](#storybook-deck-edit-02) |
| STORYBOOK-DECK-EDIT-03 | interaction | 異常系 | [保存失敗後も編集値を保持する](#storybook-deck-edit-03) |

<a id="storybook-deck-form-04"></a>

### STORYBOOK-DECK-FORM-04 確認して Deck を削除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 編集画面で Japanese verbs と Card 24件を削除する確認画面が開いている。保存先は成功を返す。

When:

- 削除を確定する。

Then:

- 確認画面が閉じ、一覧に戻ると削除対象の Deck が表示されない。他の Deck は残る。

<a id="storybook-deck-form-05"></a>

### STORYBOOK-DECK-FORM-05 削除を取り消して編集を続ける

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 編集画面で削除確認を開いている。Cancel と Escape は独立した操作例とする。

When:

- 削除を取り消す。

Then:

- 確認画面が閉じ、同じ Deck の編集画面と入力が残り、削除成功の表示は出ない。

<a id="storybook-deck-form-06"></a>

### STORYBOOK-DECK-FORM-06 削除処理中は再確定と取消しを受け付けない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 編集画面で削除を確定し、保存先の応答がまだ返っていない。

When:

- 再確定、取消し、Escape による操作を試みる。

Then:

- 処理中の表示と確認画面が保たれ、確定と取消しは操作できない。

<a id="storybook-deck-edit-01"></a>

### STORYBOOK-DECK-EDIT-01 選んだ Deck の保存済み内容を編集する

カテゴリ: `render`

区分: 正常系

Given:

- 名前 Japanese verbs とカテゴリを持つ Deck があり、別の Deck も存在する。

When:

- Japanese verbs の編集画面を開く。

Then:

- 対象の名前とカテゴリが入力欄に表示され、他の Deck の値は混ざらない。

<a id="storybook-deck-edit-02"></a>

### STORYBOOK-DECK-EDIT-02 変更した名前を一覧へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 編集画面で名前を Renamed deck に変更し、保存先は成功を返す。

When:

- 保存し、一覧を開く。

Then:

- 対象の名前が Renamed deck になり、他の Deck の名前は変わらない。

<a id="storybook-deck-edit-03"></a>

### STORYBOOK-DECK-EDIT-03 保存失敗後も編集値を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 編集画面で名前を変更し、保存先は失敗を返す。

When:

- 保存する。

Then:

- 失敗が表示され、変更中の名前が残り、再試行できる。
