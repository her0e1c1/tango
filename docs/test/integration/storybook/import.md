# Import Storybook 結合テスト仕様書

## 目的

CSV 選択、プレビュー、明示的な確定、診断表示と失敗・処理中の操作を確認する。

## 検証境界

ルート Story は実際のファイル読取・解析・プレビューを組み合わせる。DeckImportView の Story は解析結果とエラーを入力境界にする。実認証、Firestore の保存、ダウンロードファイルの内容は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [import](../../e2e/import.md) を参照する。

04〜12 は Vitest から追加した契約で、対応 Story は追加先である。各ケースの状態準備とアサーションは未実装であり、表示専用 Story の存在だけで検証済みとしない。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-IMPORT-01 | render | [初期画面に保存先選択を表示しない](#storybook-import-01) |
| STORYBOOK-IMPORT-02 | interaction | [CSV を読み込んでプレビューする](#storybook-import-02) |
| STORYBOOK-IMPORT-03 | render | [日本語の診断と無効な確定操作を表示する](#storybook-import-03) |
| STORYBOOK-IMPORT-04 | interaction | [プレビュー失敗を安全な日本語にする](#storybook-import-04) |
| STORYBOOK-IMPORT-05 | interaction | [診断を翻訳しユーザー入力は保持する](#storybook-import-05) |
| STORYBOOK-IMPORT-06 | interaction | [形式の説明を必要なときだけ開く](#storybook-import-06) |
| STORYBOOK-IMPORT-07 | render | [処理中の選択を無効にする](#storybook-import-07) |
| STORYBOOK-IMPORT-08 | interaction | [各サンプルの操作を要求する](#storybook-import-08) |
| STORYBOOK-IMPORT-09 | interaction | [レビュー後もファイルを選び直せる](#storybook-import-09) |
| STORYBOOK-IMPORT-10 | interaction | [内容確認だけでは保存を要求しない](#storybook-import-10) |
| STORYBOOK-IMPORT-11 | render | [一部の行が不正なら確定を止める](#storybook-import-11) |
| STORYBOOK-IMPORT-12 | render | [準備失敗後も選び直せる](#storybook-import-12) |

<a id="storybook-import-01"></a>

### STORYBOOK-IMPORT-01 初期画面に保存先選択を表示しない

カテゴリ: `render`

Given:

- 対象ファイルをまだ選択していない。

When:

- 初期画面を描画する。

Then:

- Add a deck を表示し、保存先の radio は存在しない。

<a id="storybook-import-02"></a>

### STORYBOOK-IMPORT-02 CSV を読み込んでプレビューする

カテゴリ: `interaction`

Given:

- 実際のインポートルートと、有効な4列1行の storybook-import.csv を用意する。Story の再実行・再入場時も未選択状態から開始する。

When:

- ファイル入力で CSV を選択する。

Then:

- 選択前には Review import と保存先の radio がなく、選択後は Review import、有効1件、解答を表示する。保存完了は確認しない。

<a id="storybook-import-03"></a>

### STORYBOOK-IMPORT-03 日本語の診断と無効な確定操作を表示する

カテゴリ: `render`

Given:

- 日本語 locale で有効0件・無効1件、2行目が3列という診断を渡す。

When:

- プレビューを描画する。

Then:

- 日本語の alert と0件の件数を表示し、追加ボタンは無効、document の lang は ja になる。

<a id="storybook-import-04"></a>

### STORYBOOK-IMPORT-04 [TODO] プレビュー失敗を安全な日本語にする

カテゴリ: `interaction`

Given:

- authentication、account-changed、permission-denied、unavailable、QuotaExceededError、未知の例外を英語で個別に表示する。

When:

- 日本語へ変更する。

Then:

- 認証、アカウント変更後の再選択、権限、接続確認、容量確保、一般的な準備失敗を区別した日本語へ変わる。未知の例外の内部情報は表示しない。

<a id="storybook-import-05"></a>

### STORYBOOK-IMPORT-05 [TODO] 診断を翻訳しユーザー入力は保持する

カテゴリ: `interaction`

Given:

- uniqueKey「自作キー」の重複と context「ユーザー入力」、2列の行、空 CSV、不正な閉じ引用符、未知の parser エラーを渡す。

When:

- 英語から日本語へ変更する。

Then:

- 各診断を区別した日本語を表示し、自作キーとユーザー入力の文字列は改変しない。

<a id="storybook-import-06"></a>

### STORYBOOK-IMPORT-06 [TODO] 形式の説明を必要なときだけ開く

カテゴリ: `interaction`

Given:

- 対象未選択の初期画面を表示する。

When:

- CSV format を開く。

Then:

- ファイル選択は最初から有効で、Review import は表示しない。初期状態では隠れていた、ヘッダーなし4列の説明が見える。

<a id="storybook-import-07"></a>

### STORYBOOK-IMPORT-07 [TODO] 処理中の選択を無効にする

カテゴリ: `render`

Given:

- インポート処理中の状態を渡す。

When:

- 画面を描画する。

Then:

- ファイル選択と Try this example は無効になり、Save to の選択領域は表示しない。

<a id="storybook-import-08"></a>

### STORYBOOK-IMPORT-08 [TODO] 各サンプルの操作を要求する

カテゴリ: `interaction`

Given:

- Basic / Math / Markdown / Sample deck の4条件を用意する。対応 ID は basic / math / markdown / deck である。

When:

- サンプルを選んで Try this example を押し、Download CSV にフォーカスして Enter を押す。

Then:

- 選択サンプルは pressed となり、プレビューとダウンロードの callback に対象 ID を渡す。ファイル内容は確認しない。

<a id="storybook-import-09"></a>

### STORYBOOK-IMPORT-09 [TODO] レビュー後もファイルを選び直せる

カテゴリ: `interaction`

Given:

- ファイル選択 callback を渡す。

When:

- deck.csv を選択し、プレビューを渡した後、再度ファイルを選択する。

Then:

- 初回・レビュー後のどちらでも、選択された File を callback に渡す。

<a id="storybook-import-10"></a>

### STORYBOOK-IMPORT-10 [TODO] 内容確認だけでは保存を要求しない

カテゴリ: `interaction`

Given:

- 表面 front、裏面 back、uniqueKey key-1 の有効1件と空行1件スキップのプレビューを渡す。

When:

- 内容を確認し、Choose file or example と Add 1 card の操作をそれぞれ行う。

Then:

- 両面、uniqueKey、スキップ件数を表示し、サンプル試用ボタンは表示しない。
- プレビューを表示するだけではインポートを要求しない。選び直しと確定を別の callback に通知し、確定時だけインポートを要求する。

<a id="storybook-import-11"></a>

### STORYBOOK-IMPORT-11 [TODO] 一部の行が不正なら確定を止める

カテゴリ: `render`

Given:

- 英語 locale で有効1件と、3行目の uniqueKey が空という無効1件を渡す。

When:

- プレビューを描画する。

Then:

- alert に Row 3: Unique key is required. と修正済み CSV を選ぶ案内を表示する。有効な Card があっても Add 1 card は無効である。

<a id="storybook-import-12"></a>

### STORYBOOK-IMPORT-12 [TODO] 準備失敗後も選び直せる

カテゴリ: `render`

Given:

- プレビュー準備に失敗した状態を渡す。

When:

- 画面を描画する。

Then:

- The import preview could not be prepared. を表示し、内部の file read failed は表示しない。ファイル選択と Try this example は有効なままである。
