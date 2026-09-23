# Deck Form and Deletion Storybook 結合テスト仕様書

## 目的

Deck フォームの入力保持、エラー表示と削除確認の通知を確認する。

## 検証境界

DeckForm と実際の React Hook Form、および DeckDeletionDialog。エラーは Story から渡し、validation rule の実行や永続化は検証しない。

関連 E2E: [deck-management](../../e2e/deck-management.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力できる](#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | interaction | 正常系 | [詳細設定を閉じて開き直しても入力を保持する](#storybook-deck-form-02) |
| STORYBOOK-DECK-FORM-03 | render | 異常系 | [詳細項目のエラーを見える状態で表示する](#storybook-deck-form-03) |
| STORYBOOK-DECK-FORM-04 | interaction | 正常系 | [削除確認から確定 callback を通知する](#storybook-deck-form-04) |

<a id="storybook-deck-form-01"></a>

### STORYBOOK-DECK-FORM-01 名前とカテゴリを入力できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前とカテゴリが空の作成フォームを、実際の React Hook Form で表示する。

When:

- Name に New deck を入力し、カテゴリ math を選択する。

Then:

- 名前の入力値が New deck、カテゴリの選択値が math になる。

<a id="storybook-deck-form-02"></a>

### STORYBOOK-DECK-FORM-02 詳細設定を閉じて開き直しても入力を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- 作成フォームの More settings が閉じている。

When:

- More settings を開き、Source URL に https://example.com/deck.csv を入力する。
- Convert line breaks を有効にし、More settings を閉じてから再度開く。

Then:

- 閉じている間は Source URL が見えない。
- 再度開くと URL と Convert line breaks の選択が保持されている。

<a id="storybook-deck-form-03"></a>

### STORYBOOK-DECK-FORM-03 詳細項目のエラーを見える状態で表示する

カテゴリ: `render`

区分: 異常系

Given:

- 名前と URL にフォームエラーを設定した作成フォームを用意する。

When:

- フォームを描画する。

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

- 削除確定 callback が一度通知される。

## 自動アサーションに含めない項目

詳細設定を開くだけの Story には、期待結果のアサーションはない。作成中・保存中・削除処理中の Story は表示専用であり、二重送信防止や取消しの検証済みケースには数えない。
