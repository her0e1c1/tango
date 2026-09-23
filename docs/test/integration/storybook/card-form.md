# Card Form Storybook 結合テスト仕様書

## 目的

Card 入力、タブ間の値の保持、タグ選択、日本語エラー、解答プレビューと作成要求を確認する。

## 検証境界

CardFields / CardCreator、実際の React Hook Form、プレビュー hook と BackText。保存先や validation resolver の正当性は対象外。

関連 E2E: [card-management](../../e2e/card-management.md) / [settings](../../e2e/settings.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-CARD-FORM-01 | interaction | [面を切り替えても編集中の表面テキストを保持する](#storybook-card-form-01) |
| STORYBOOK-CARD-FORM-02 | interaction | [タグ編集で未選択のタグを選択できる](#storybook-card-form-02) |
| STORYBOOK-CARD-FORM-03 | render | [日本語の入力エラーを入力欄の説明に関連付ける](#storybook-card-form-03) |
| STORYBOOK-CARD-FORM-04 | interaction | [編集中の解答プレビュー領域を開く](#storybook-card-form-04) |
| STORYBOOK-CARD-FORM-05 | interaction | [入力後の作成操作を submit callback に通知する](#storybook-card-form-05) |

<a id="storybook-card-form-01"></a>

### STORYBOOK-CARD-FORM-01 面を切り替えても編集中の表面テキストを保持する

カテゴリ: `interaction`

Given:

- 既存 Card の入力フォームを表示する。

When:

- Front text を Updated prompt に置き換える。
- Back タブへ切り替えてから Front タブへ戻る。

Then:

- Front text の値が Updated prompt のまま保持される。

<a id="storybook-card-form-02"></a>

### STORYBOOK-CARD-FORM-02 タグ編集で未選択のタグを選択できる

カテゴリ: `interaction`

Given:

- Card の入力フォームで raw タグは未選択である。

When:

- Edit tags を開き、raw のチェックボックスを押す。

Then:

- 押す前は raw が未選択で、押した後は選択済みになる。

<a id="storybook-card-form-03"></a>

### STORYBOOK-CARD-FORM-03 日本語の入力エラーを入力欄の説明に関連付ける

カテゴリ: `render`

Given:

- 日本語 locale で、表面・裏面の入力エラーをあらかじめ渡す。

When:

- フォームを描画する。

Then:

- 表面の必須エラーが表示され、表面の入力欄の accessible description が「表面のテキストは必須です。」になる。
- document の lang が ja になる。

<a id="storybook-card-form-04"></a>

### STORYBOOK-CARD-FORM-04 編集中の解答プレビュー領域を開く

カテゴリ: `interaction`

Given:

- 通常表示と iPhone X 表示では解答 **Draft answer** と数式 $x^2$、math タグを持つ Card を用意する。
- dark 表示では、解答 const answer = 42; と typescript タグを用意する。

When:

- Back タブで Preview answer を押す。

Then:

- Answer preview の領域が表示される。表示内容のレンダリング結果や保存の有無までは、この play のアサーション対象ではない。

<a id="storybook-card-form-05"></a>

### STORYBOOK-CARD-FORM-05 入力後の作成操作を submit callback に通知する

カテゴリ: `interaction`

Given:

- 空の Card 作成フォームを用意し、submit callback を spy にする。

When:

- Front text に Hello、Back text に Hola を入力し、Create card を押す。

Then:

- submit callback が一度通知される。送信値の一致と保存完了は、この play ではアサートしない。

## 自動アサーションに含めない項目

裏面・拡大・タグ選択・拡大プレビューとそれらの表示バリエーションの Story は主に表示準備の play である。期待結果のアサーションがない項目を、値の保持や拡大プレビューの検証済みケースには数えない。
