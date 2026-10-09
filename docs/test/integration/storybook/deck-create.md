# Deck 作成画面 Storybook 結合テスト仕様書

## 目的

Deck 作成画面を入口とした `play` で、新しい Deck の入力、詳細設定、入力エラーと作成結果を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力する](#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | interaction | 正常系 | [詳細設定を開き直しても入力を保持する](#storybook-deck-form-02) |
| STORYBOOK-DECK-FORM-03 | interaction | 異常系 | [詳細項目の入力エラーを表示する](#storybook-deck-form-03) |
| STORYBOOK-DECK-CREATE-01 | interaction | 正常系 | [作成の成功後に新しい Deck を確認する](#storybook-deck-create-01) |
| STORYBOOK-DECK-CREATE-02 | interaction | 異常系 | [作成に失敗しても入力を保持する](#storybook-deck-create-02) |
| STORYBOOK-DECK-CREATE-03 | interaction | 異常系 | [空欄と空白のみの名前に現在の言語でエラーを表示する](#storybook-deck-create-03) |
| STORYBOOK-DECK-CREATE-04 | interaction | 異常系 | [表示中の名前エラーを言語変更に追従させる](#storybook-deck-create-04) |

<a id="storybook-deck-form-01"></a>

### STORYBOOK-DECK-FORM-01 名前とカテゴリを入力する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 作成画面で名前とカテゴリを未入力にしている。

When:

- 名前に New deck を入力し、カテゴリ math を選ぶ。

Then:

- 名前の入力値は New deck、カテゴリの選択値は math になる。

<a id="storybook-deck-form-02"></a>

### STORYBOOK-DECK-FORM-02 詳細設定を開き直しても入力を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 作成画面で詳細設定を開き、Source URL に `https://example.com/deck.csv` を入力し、改行変換を有効にしている。

When:

- 詳細設定を閉じ、再び開く。

Then:

- 閉じている間は詳細項目が隠れ、開くと URL と改行変換の選択が保持されている。

<a id="storybook-deck-form-03"></a>

### STORYBOOK-DECK-FORM-03 詳細項目の入力エラーを表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で名前を入力し、Source URL に不正な URL を入力している。

When:

- 作成を選ぶ。

Then:

- Source URL と有効な URL を求めるエラーが表示され、作成成功として扱われない。

<a id="storybook-deck-create-01"></a>

### STORYBOOK-DECK-CREATE-01 作成の成功後に新しい Deck を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 作成画面で名前 New deck と有効なカテゴリを入力し、保存先は成功を返す。

When:

- 作成を選び、一覧を開く。

Then:

- 新しい Deck 名が一覧に表示され、その Deck を選べる。サーバーへの実保存はこの結果だけで保証しない。

<a id="storybook-deck-create-02"></a>

### STORYBOOK-DECK-CREATE-02 作成に失敗しても入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で有効な名前とカテゴリを入力し、保存先は失敗を返す。

When:

- 作成を選ぶ。

Then:

- 失敗が表示され、名前とカテゴリを失わず再試行できる。

<a id="storybook-deck-create-03"></a>

### STORYBOOK-DECK-CREATE-03 空欄と空白のみの名前に現在の言語でエラーを表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で英語または日本語を使用し、名前は空文字または空白のみ、表示形式は math にしている。各言語と各入力は独立した操作例とする。

When:

- 作成を選ぶ。

Then:

- 英語では `Deck name is required.`、日本語では `デッキ名は必須です。` が表示され、名前の入力欄は不正な値としてこのエラーを説明に持つ。
- 名前と表示形式の入力が保持され、保存先への操作は開始されない。

<a id="storybook-deck-create-04"></a>

### STORYBOOK-DECK-CREATE-04 表示中の名前エラーを言語変更に追従させる

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck 作成画面で System 言語設定を使用している。ブラウザー言語は英語、名前は空白のみ、表示形式は math で、作成を選んだ後に名前の必須エラーが表示されている。名前の入力欄にフォーカスがある。

When:

- ブラウザー言語を日本語へ変更し、その後英語へ戻す。再送信はしない。

Then:

- 表示中のエラーと入力欄の説明が、日本語では `デッキ名は必須です。`、英語では `Deck name is required.` に切り替わる。
- 同じ名前入力欄、エラーとの関連付け、フォーカス、名前と表示形式の入力が保持され、保存先への操作は開始されない。
