# Deck インポート画面 Storybook 結合テスト仕様書

## 目的

Deck インポート画面を入口とした `play` で、CSV とサンプルの選択から解析・プレビュー・確定までの画面内の振る舞いを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-IMPORT-01 | render | 正常系 | [初期画面に保存先選択を表示しない](#storybook-import-01) |
| STORYBOOK-IMPORT-02 | interaction | 正常系 | [CSV を読み込んでプレビューする](#storybook-import-02) |
| STORYBOOK-IMPORT-03 | interaction | 異常系 | [日本語の診断と無効な確定操作を表示する](#storybook-import-03) |
| STORYBOOK-IMPORT-04 | interaction | 異常系 | [プレビュー失敗を安全な日本語にする](#storybook-import-04) |
| STORYBOOK-IMPORT-05 | interaction | 異常系 | [診断を翻訳してユーザー入力を保持する](#storybook-import-05) |
| STORYBOOK-IMPORT-06 | interaction | 正常系 | [CSV 形式の説明を開く](#storybook-import-06) |
| STORYBOOK-IMPORT-07 | render | 正常系 | [インポート処理中の選択を無効にする](#storybook-import-07) |
| STORYBOOK-IMPORT-08 | interaction | 正常系 | [選んだサンプルを試す](#storybook-import-08) |
| STORYBOOK-IMPORT-09 | interaction | 正常系 | [プレビュー後もファイルを選び直す](#storybook-import-09) |
| STORYBOOK-IMPORT-10 | interaction | 正常系 | [内容確認とインポート確定を区別する](#storybook-import-10) |
| STORYBOOK-IMPORT-11 | interaction | 異常系 | [不正な行があれば確定を止める](#storybook-import-11) |
| STORYBOOK-IMPORT-12 | interaction | 異常系 | [準備失敗後もファイルを選び直す](#storybook-import-12) |

<a id="storybook-import-01"></a>

### STORYBOOK-IMPORT-01 初期画面に保存先選択を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck インポート画面でファイルをまだ選択していない。

When:

- 初期表示を確認する。

Then:

- Add a deck とファイル選択が表示され、保存先を選ぶ radio は表示されない。

<a id="storybook-import-02"></a>

### STORYBOOK-IMPORT-02 CSV を読み込んでプレビューする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面でファイルが未選択で、有効な4列1行の CSV ファイルがある。

When:

- ファイル入力で CSV を選択する。

Then:

- 選択前には Review import と保存先の radio がなく、選択後は Review import、有効1件、CSV の解答が表示される。

<a id="storybook-import-03"></a>

### STORYBOOK-IMPORT-03 日本語の診断と無効な確定操作を表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 日本語の Deck インポート画面で、有効0件・無効1件となる3列の行を含む CSV がある。

When:

- CSV を選択する。

Then:

- 日本語の診断と有効0件が表示され、追加操作は無効になる。

<a id="storybook-import-04"></a>

### STORYBOOK-IMPORT-04 プレビュー失敗を安全な日本語にする

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面で認証失敗、アカウント変更、権限不足、接続不可、容量不足、未知の失敗を独立した入力例として表示する。

When:

- 表示言語を日本語へ変更する。

Then:

- 各原因に応じた日本語の案内へ変わり、未知の例外の内部情報は表示されない。

<a id="storybook-import-05"></a>

### STORYBOOK-IMPORT-05 診断を翻訳してユーザー入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面でキー重複、列数不足、空 CSV、不正な引用符、未知の解析エラーを独立した入力例として表示する。

When:

- 英語から日本語へ変更する。

Then:

- 診断は日本語へ変わり、診断に含まれる「自作キー」「ユーザー入力」などの入力文字列は変更されない。

<a id="storybook-import-06"></a>

### STORYBOOK-IMPORT-06 CSV 形式の説明を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面でファイルをまだ選択していない。

When:

- CSV format を開く。

Then:

- 隠れていたヘッダーなし4列の説明が表示される。ファイル選択は有効なままで、プレビューはまだ表示されない。

<a id="storybook-import-07"></a>

### STORYBOOK-IMPORT-07 インポート処理中の選択を無効にする

カテゴリ: `render`

区分: 正常系

Given:

- Deck インポート画面で確定した処理がまだ完了していない。

When:

- 選択操作を確認する。

Then:

- ファイル選択と Try this example は無効になり、保存先の選択領域は表示されない。

<a id="storybook-import-08"></a>

### STORYBOOK-IMPORT-08 選んだサンプルを試す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面に Basic、Math、Markdown、Sample deck がある。各サンプルを独立した入力例とする。

When:

- サンプルを選び、Try this example を選ぶ。

Then:

- 選んだサンプルが押下状態になり、そのサンプルの内容がプレビューに表示される。Download CSV はキーボードで選べる。

<a id="storybook-import-09"></a>

### STORYBOOK-IMPORT-09 プレビュー後もファイルを選び直す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面で deck.csv のプレビューを表示している。

When:

- 異なる内容の CSV を選び直す。

Then:

- 新しいファイルの内容がプレビューへ反映され、以前の内容と混ざらない。

<a id="storybook-import-10"></a>

### STORYBOOK-IMPORT-10 内容確認とインポート確定を区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面に表面 front、裏面 back、キー key-1 の有効1件と空行1件のスキップが表示されている。

When:

- 内容を確認し、選び直しと Add 1 card を独立した操作例として選ぶ。

Then:

- プレビューには両面・キー・スキップ件数が表示される。確認や選び直しだけでは完了表示にならず、確定操作からインポートが始まる。

<a id="storybook-import-11"></a>

### STORYBOOK-IMPORT-11 不正な行があれば確定を止める

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面で有効1件と、3行目のキーが空の無効1件を含む CSV がある。

When:

- CSV を選択する。

Then:

- Row 3: Unique key is required. と修正した CSV を選ぶ案内が表示され、有効な行があっても追加操作は無効になる。

<a id="storybook-import-12"></a>

### STORYBOOK-IMPORT-12 準備失敗後もファイルを選び直す

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面でファイルの読み取りに失敗する。内部エラーには file read failed が含まれる。

When:

- 失敗表示後に別のファイルを選ぶ。

Then:

- 安全な準備失敗の案内が表示され、内部エラー文は露出しない。ファイル選択とサンプルの試用が利用でき、新しい内容をプレビューできる。
