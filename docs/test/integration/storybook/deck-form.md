# Deck Form and Deletion Storybook 結合テスト仕様書

## 目的

Deck フォームの入力保持、エラー表示と削除確認の公開 callback の通知を確認する。フォームへ与えられたエラーの表示を対象とし、validation rule の実行や永続化は検証しない。削除確定の通知だけで、保存済み Deck が削除されたとは判断しない。

関連 E2E: [deck-management](../../e2e/deck-management.md)。

書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力できる](#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | interaction | 正常系 | [詳細設定を閉じて開き直しても入力を保持する](#storybook-deck-form-02) |
| STORYBOOK-DECK-FORM-03 | render | 異常系 | [詳細項目のエラーを見える状態で表示する](#storybook-deck-form-03) |
| STORYBOOK-DECK-FORM-04 | interaction | 正常系 | [削除確認から確定 callback を通知する](#storybook-deck-form-04) |
| STORYBOOK-DECK-FORM-05 | interaction | 正常系 | [削除を確定せずに取消しを通知する](#storybook-deck-form-05) |
| STORYBOOK-DECK-FORM-06 | interaction | 正常系 | [削除処理中は再確定と取消しを通知しない](#storybook-deck-form-06) |

<a id="storybook-deck-form-01"></a>

### STORYBOOK-DECK-FORM-01 名前とカテゴリを入力できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前とカテゴリが空の作成フォームを表示している。

When:

- Name に New deck を入力し、カテゴリ math を選択する。

Then:

- 名前の入力値が New deck、カテゴリの選択値が math になる。

<a id="storybook-deck-form-02"></a>

### STORYBOOK-DECK-FORM-02 詳細設定を閉じて開き直しても入力を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- 作成フォームの More settings が開いている。
- Source URL に `https://example.com/deck.csv` を入力し、Convert line breaks を有効にしている。

When:

- More settings を閉じてから再度開く。

Then:

- 閉じている間は Source URL が見えない。
- 再度開くと URL と Convert line breaks の選択が保持されている。

<a id="storybook-deck-form-03"></a>

### STORYBOOK-DECK-FORM-03 詳細項目のエラーを見える状態で表示する

カテゴリ: `render`

区分: 異常系

Given:

- URL にフォームエラーがある。

When:

- 作成フォームを表示する。

Then:

- Source URL の入力欄と Enter a valid URL. のエラーが表示される。

<a id="storybook-deck-form-04"></a>

### STORYBOOK-DECK-FORM-04 削除確認から確定 callback を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- Japanese verbs と Card 24件を削除対象とする確認ダイアログを表示し、処理中ではない。

When:

- Delete deck を押す。

Then:

- 公開された削除確定 callback を通じて、削除の確定が一度通知される。

<a id="storybook-deck-form-05"></a>

### STORYBOOK-DECK-FORM-05 [TODO] 削除を確定せずに取消しを通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 削除確認ダイアログが開いており、削除を開始していない。
- Cancel ボタンと、ダイアログ内での Escape を独立した操作例とする。

When:

- 対象の操作で削除の取消しを選ぶ。

Then:

- 公開された取消し callback を通じて、取消しが一度通知される。
- 削除確定は通知されない。保存済みデータの状態や、親画面によるダイアログの終了はこの通知だけでは保証しない。

<a id="storybook-deck-form-06"></a>

### STORYBOOK-DECK-FORM-06 [TODO] 削除処理中は再確定と取消しを通知しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 削除の確定を一度通知済みで、処理が完了していない確認ダイアログを表示している。

When:

- 処理中に確定ボタン・Cancel・Escape による操作を試みる。

Then:

- 処理中であることを示し、確定ボタンと Cancel は操作できない。
- 追加の削除確定や取消しを通知せず、処理中のダイアログが操作によって閉じることはない。
