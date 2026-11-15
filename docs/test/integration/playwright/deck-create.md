# Deck 作成画面 Playwright 結合テスト仕様書

## 目的

Deck 作成画面を入口とした Playwright テストで、新しい Deck の入力、利用可能な設定、入力エラーと作成結果を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力する](#playwright-deck-form-01) |
| PLAYWRIGHT-DECK-FORM-02 | render | 正常系 | [効果のない改行変換設定を表示しない](#playwright-deck-form-02) |
| PLAYWRIGHT-DECK-CREATE-01 | interaction | 正常系 | [作成の成功後に新しい Deck を確認する](#playwright-deck-create-01) |
| PLAYWRIGHT-DECK-CREATE-02 | interaction | 異常系 | [作成に失敗しても入力を保持する](#playwright-deck-create-02) |
| PLAYWRIGHT-DECK-CREATE-03 | interaction | 異常系 | [空欄と空白のみの名前に現在の言語でエラーを表示する](#playwright-deck-create-03) |
| PLAYWRIGHT-DECK-CREATE-04 | interaction | 異常系 | [表示中の名前エラーを言語変更に追従させる](#playwright-deck-create-04) |
| PLAYWRIGHT-DECK-CREATE-05 | interaction | 正常系 | [各認証状態で空の Deck の作成結果を表示する](#playwright-deck-create-05) |
| PLAYWRIGHT-DECK-CREATE-06 | interaction | 異常系 | [作成結果を待ってから失敗を通知する](#playwright-deck-create-06) |

<a id="playwright-deck-form-01"></a>

### PLAYWRIGHT-DECK-FORM-01 [TODO] 名前とカテゴリを入力する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 作成画面で名前とカテゴリを未入力にしている。

When:

- 名前に New deck を入力し、カテゴリ math を選ぶ。

Then:

- 名前の入力値は New deck、カテゴリの選択値は math になる。

<a id="playwright-deck-form-02"></a>

### PLAYWRIGHT-DECK-FORM-02 [TODO] 効果のない改行変換設定を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck 作成画面を開いている。

When:

- 利用可能な入力項目を確認する。

Then:

- 名前と表示形式を入力できる。
- 改行変換の操作・説明と、空の詳細設定欄は表示されない。

<a id="playwright-deck-create-01"></a>

### PLAYWRIGHT-DECK-CREATE-01 [TODO] 作成の成功後に新しい Deck を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 作成画面で名前 New deck と有効なカテゴリを入力し、保存先は成功を返す。

When:

- 作成を選び、一覧を開く。

Then:

- 新しい Deck 名が一覧に表示され、その Deck を選べる。サーバーへの実保存はこの結果だけで保証しない。

<a id="playwright-deck-create-02"></a>

### PLAYWRIGHT-DECK-CREATE-02 [TODO] 作成に失敗しても入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で有効な名前とカテゴリを入力し、保存先は失敗を返す。

When:

- 作成を選ぶ。

Then:

- 失敗が表示され、名前とカテゴリを失わず再試行できる。

<a id="playwright-deck-create-03"></a>

### PLAYWRIGHT-DECK-CREATE-03 [TODO] 空欄と空白のみの名前に現在の言語でエラーを表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で英語または日本語を使用し、名前は空文字または空白のみ、表示形式は math にしている。各言語と各入力は独立した操作例とする。

When:

- 作成を選ぶ。

Then:

- 英語では `Deck name is required.`、日本語では `デッキ名は必須です。` が表示され、名前の入力欄は不正な値としてこのエラーを説明に持つ。
- 名前と表示形式の入力が保持され、保存先への操作は開始されない。

<a id="playwright-deck-create-04"></a>

### PLAYWRIGHT-DECK-CREATE-04 [TODO] 表示中の名前エラーを言語変更に追従させる

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で System 言語設定を使用している。ブラウザー言語は英語、名前は空白のみ、表示形式は math で、作成を選んだ後に名前の必須エラーが表示されている。名前の入力欄にフォーカスがある。

When:

- ブラウザー言語を日本語へ変更し、その後英語へ戻す。再送信はしない。

Then:

- 表示中のエラーと入力欄の説明が、日本語では `デッキ名は必須です。`、英語では `Deck name is required.` に切り替わる。
- 同じ名前入力欄、エラーとの関連付け、フォーカス、名前と表示形式の入力が保持され、保存先への操作は開始されない。

<a id="playwright-deck-create-05"></a>

### PLAYWRIGHT-DECK-CREATE-05 [TODO] 各認証状態で空の Deck の作成結果を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 通常アカウントと匿名利用を独立した条件とし、対象 Deck は存在しない。保存先は成功を返し、新しい Deck が利用可能な状態になる。

When:

- 作成画面で名前と表示形式を入力して保存し、一覧と作成した Deck の編集画面を開く。

Then:

- 保存先の選択肢と改行変換の操作・説明は表示しない。作成成功を通知し、空の Deck を一覧に一つ表示する。
- 編集画面に入力した名前と表示形式を表示する。

<a id="playwright-deck-create-06"></a>

### PLAYWRIGHT-DECK-CREATE-06 [TODO] 作成結果を待ってから失敗を通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- 通常アカウントで有効な名前と表示形式を入力している。保存先は一時的な追加後に拒否を返し、拒否後は対象 Deck を利用できない状態になる。

When:

- 作成を選び、保留されている結果が失敗するまで待つ。

Then:

- 保留中は成功扱いにせず、失敗時は入力を保持して失敗を通知する。拒否された Deck を利用可能な一覧へ残さず、利用者の操作なしに繰り返し作成しない。
