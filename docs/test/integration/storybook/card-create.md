# Card 作成画面 Storybook 結合テスト仕様書

## 目的

Card 作成画面を入口とした `play` で、対象 Deck への Card 作成、解答プレビュー、作成中・失敗後の操作を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-05 | interaction | 正常系 | [入力した両面で Card を作成する](#storybook-card-form-05) |
| STORYBOOK-CARD-FORM-17 | interaction | 正常系 | [作成成功を画面で通知する](#storybook-card-form-17) |
| STORYBOOK-CARD-FORM-18 | interaction | 異常系 | [作成失敗後に入力を保って再試行する](#storybook-card-form-18) |
| STORYBOOK-CARD-FORM-19 | interaction | 正常系 | [作成中の連続操作を抑止する](#storybook-card-form-19) |
| STORYBOOK-CARD-CREATE-01 | interaction | 異常系 | [未入力のまま Card を作成しない](#storybook-card-create-01) |
| STORYBOOK-CARD-CREATE-02 | interaction | 正常系 | [下書きを保存せず解答を確認する](#storybook-card-create-02) |

<a id="storybook-card-form-05"></a>

### STORYBOOK-CARD-FORM-05 入力した両面で Card を作成する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 作成画面を開き、保存先は成功を返す。

When:

- 表面 Hello と裏面 Hola を入力して作成する。

Then:

- 作成成功が表示され、対象 Deck の一覧から Hello の Card を選んで Hola を確認できる。

<a id="storybook-card-form-17"></a>

### STORYBOOK-CARD-FORM-17 作成成功を画面で通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で Front value と Back value を入力し、保存先は成功を返す。

When:

- Create card を選ぶ。

Then:

- 成功応答を受けた後に Created card “Front value”. が表示される。

<a id="storybook-card-form-18"></a>

### STORYBOOK-CARD-FORM-18 作成失敗後に入力を保って再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 作成画面で有効な両面を入力し、保存先は失敗、成功の順に返す。

When:

- 作成し、失敗後にもう一度作成する。

Then:

- 失敗時は再試行の案内と両面の入力が残り、再試行成功後は成功通知が表示される。

<a id="storybook-card-form-19"></a>

### STORYBOOK-CARD-FORM-19 作成中の連続操作を抑止する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で両面を入力し、作成の完了を待っている。

When:

- 作成を続けて選び、保留中の処理を完了させる。

Then:

- 待機中は Creating… が無効になり、完了後は Create card が再び有効になる。同じ送信で複数の Card が一覧に増えない。

<a id="storybook-card-create-01"></a>

### STORYBOOK-CARD-CREATE-01 未入力のまま Card を作成しない

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の Card 作成画面で両面を未入力にしている。

When:

- 作成を選ぶ。

Then:

- 必須入力のエラーが表示され、作成成功の通知は出ない。入力を修正して再び操作できる。

<a id="storybook-card-create-02"></a>

### STORYBOOK-CARD-CREATE-02 下書きを保存せず解答を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 作成画面で裏面に太字と数式を入力している。

When:

- 解答プレビューを開き、閉じる。

Then:

- 入力内容がプレビューに描画され、閉じても下書きが残り、作成成功の通知は出ない。
