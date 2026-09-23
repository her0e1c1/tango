# Import Storybook 結合テスト仕様書

## 目的

CSV の選択、プレビュー、明示的な確定、診断表示、失敗からの復帰と処理中の操作抑止を確認する。

## 検証境界

ルート Story は実際の画面・ファイル読取・CSV 解析・プレビューを組み合わせる。DeckImportView の Story は解析結果とエラーを入力境界にし、実際の UI と callback を確認する。Firestore の保存、Google 認証や実際のダウンロードファイルの内容は対象外。

関連 E2E: [import](../../e2e/import.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-IMPORT-01 | render | [初期画面に保存先選択を表示しない](#storybook-import-01) | DeckImportView :: `Default` |
| STORYBOOK-IMPORT-02 | interaction | [CSV を読み込んでプレビューする](#storybook-import-02) | App :: `Import` |
| STORYBOOK-IMPORT-03 | render | [日本語の診断と無効な確定操作を表示する](#storybook-import-03) | DeckImportView :: `JapaneseDiagnostics` |
| STORYBOOK-IMPORT-04 | interaction | [プレビューの失敗を安全な日本語へ切り替える](#storybook-import-04) | DeckImportView :: `PreviewErrorLocale`（未実装） |
| STORYBOOK-IMPORT-05 | interaction | [診断文を翻訳しユーザーの入力文字列は保持する](#storybook-import-05) | DeckImportView :: `DiagnosticLocaleChange`（未実装） |
| STORYBOOK-IMPORT-06 | interaction | [CSV 形式の説明を必要なときだけ開く](#storybook-import-06) | DeckImportView :: `FormatDisclosure`（未実装） |
| STORYBOOK-IMPORT-07 | render | [処理中はファイルと例の選択を無効にする](#storybook-import-07) | DeckImportView :: `PendingContract`（未実装） |
| STORYBOOK-IMPORT-08 | interaction | [各サンプルのプレビューとダウンロードを要求する](#storybook-import-08) | DeckImportView :: `ExampleActions`（未実装） |
| STORYBOOK-IMPORT-09 | interaction | [レビュー後もファイルを選び直せる](#storybook-import-09) | DeckImportView :: `FileReselection`（未実装） |
| STORYBOOK-IMPORT-10 | interaction | [内容を確認するだけでは保存を要求しない](#storybook-import-10) | DeckImportView :: `ExplicitConfirmation`（未実装） |
| STORYBOOK-IMPORT-11 | render | [一部の行が不正なら全体の確定を止める](#storybook-import-11) | DeckImportView :: `PartiallyInvalidContract`（未実装） |
| STORYBOOK-IMPORT-12 | render | [準備失敗後もファイルと例の選択を残す](#storybook-import-12) | DeckImportView :: `PreparationFailureContract`（未実装） |

対応ファイルは [DeckImportView.stories.tsx](../../../../src/pages/deck-import/ui/DeckImportView.stories.tsx) と [App.stories.tsx](../../../../src/app/App.stories.tsx)。04 以降の named export は追加予定であり、既存 `play` の検証済み項目ではない。

<a id="storybook-import-01"></a>

### STORYBOOK-IMPORT-01 初期画面に保存先選択を表示しない

カテゴリ: `render`

対応 Story: DeckImportView :: `Default`

Given:

- インポート対象をまだ選択していない。

When:

- 初期画面を描画する。

Then:

- Add a deck の見出しが表示され、保存先の radio は存在しない。

<a id="storybook-import-02"></a>

### STORYBOOK-IMPORT-02 CSV を読み込んでプレビューする

カテゴリ: `interaction`

対応 Story: App :: `Import`

Given:

- 実際のインポートルートを開き、4列の有効な1行を持つ storybook-import.csv を用意する。

When:

- ファイル入力で CSV を選択する。

Then:

- 選択前に保存先の radio はなく、選択後は Review import、有効1件、解答の内容が表示される。
- 保存完了は、この play では確認しない。

<a id="storybook-import-03"></a>

### STORYBOOK-IMPORT-03 日本語の診断と無効な確定操作を表示する

カテゴリ: `render`

対応 Story: DeckImportView :: `JapaneseDiagnostics`

Given:

- 日本語 locale で、有効0件・無効1件、2行目が3列という診断を渡す。

When:

- プレビューを描画する。

Then:

- 日本語の alert と0件の件数を表示し、追加ボタンは無効になる。
- document の lang が ja になる。

<a id="storybook-import-04"></a>

### STORYBOOK-IMPORT-04 プレビューの失敗を安全な日本語へ切り替える

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `PreviewErrorLocale`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `localizes preview failure %s and updates it in place`。

Given:

- 英語でエラーを表示する。authentication、account-changed、permission-denied、unavailable、QuotaExceededError、未知の例外の6条件を個別に用意する。

When:

- 日本語へ変更する。

Then:

- 同じエラー表示が、それぞれ認証が必要、アカウント変更後の再選択、権限不足、接続確認と再試行、空き容量確保と再試行、プレビュー準備失敗を案内する日本語へ変わる。
- 未知の例外の private server details のような内部情報は表示しない。

<a id="storybook-import-05"></a>

### STORYBOOK-IMPORT-05 診断文を翻訳しユーザーの入力文字列は保持する

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `DiagnosticLocaleChange`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `localizes each cached diagnostic while keeping literal user context`。

Given:

- uniqueKey「自作キー」の重複と context「ユーザー入力」、2列の行、空 CSV、不正な閉じ引用符、未知の parser エラーを診断として渡す。

When:

- 日本語へ変更する。

Then:

- 重複、4列必要、空ファイル、引用符不正、一般的な解析失敗を区別した日本語の診断を表示する。
- 自作キーとユーザー入力の文字列は改変しない。

<a id="storybook-import-06"></a>

### STORYBOOK-IMPORT-06 CSV 形式の説明を必要なときだけ開く

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `FormatDisclosure`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `shows file selection first and keeps format details optional`。

Given:

- 対象未選択の初期画面を表示する。

When:

- CSV format を開く。

Then:

- ファイル選択は最初から有効で、Review import はまだ表示しない。
- 最初は隠れていた、ヘッダーなし4列という説明が見えるようになる。

<a id="storybook-import-07"></a>

### STORYBOOK-IMPORT-07 処理中はファイルと例の選択を無効にする

カテゴリ: `render`

対応予定 Story: DeckImportView :: `PendingContract`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `locks file selection while importing and has no storage selector`。

Given:

- インポート処理中の状態を渡す。

When:

- 画面を描画する。

Then:

- ファイル選択と Try this example が無効になり、Save to の選択領域は表示しない。

<a id="storybook-import-08"></a>

### STORYBOOK-IMPORT-08 各サンプルのプレビューとダウンロードを要求する

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `ExampleActions`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `uses the same preview and download controls for %s`。

Given:

- Basic / Math / Markdown / Sample deck の4条件を個別に用意する。対応 ID は basic / math / markdown / deck である。

When:

- 対象サンプルを選択して Try this example を押し、Download CSV にフォーカスして Enter を押す。

Then:

- 選択サンプルは pressed 状態になる。
- プレビューとダウンロードの各 callback に、そのサンプルの ID を渡す。ダウンロード内容は確認しない。

<a id="storybook-import-09"></a>

### STORYBOOK-IMPORT-09 レビュー後もファイルを選び直せる

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `FileReselection`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `forwards selected files and allows selecting a corrected file after review`。

Given:

- 初期画面にファイル選択 callback を渡す。

When:

- deck.csv を選択し、Story からプレビューを渡した後、ファイル選択をもう一度行う。

Then:

- 初回とプレビュー後のどちらでも、選択された File を callback に渡す。

<a id="storybook-import-10"></a>

### STORYBOOK-IMPORT-10 内容を確認するだけでは保存を要求しない

カテゴリ: `interaction`

対応予定 Story: DeckImportView :: `ExplicitConfirmation`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `shows card contents and requires explicit confirmation`。

Given:

- 表面 front、裏面 back、uniqueKey key-1 の有効1件と、空行を1件スキップしたプレビューを渡す。

When:

- 内容を確認し、Choose file or example と Add 1 card をそれぞれ操作する。

Then:

- 両面、uniqueKey、空行1件のスキップを表示し、サンプル試用ボタンは表示しない。
- 確認画面を表示するだけではインポートを要求しない。
- 選び直しと確定は別の callback を通知し、確定したときだけインポートを要求する。

<a id="storybook-import-11"></a>

### STORYBOOK-IMPORT-11 一部の行が不正なら全体の確定を止める

カテゴリ: `render`

対応予定 Story: DeckImportView :: `PartiallyInvalidContract`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `blocks all cards when any row is invalid and explains how to recover`。

Given:

- 有効1件に加え、3行目の uniqueKey が空という無効1件を渡す。

When:

- プレビューを描画する。

Then:

- alert に Row 3: Unique key is required. と、修正済み CSV を選ぶ案内を表示する。
- 有効な Card があっても Add 1 card は無効である。

<a id="storybook-import-12"></a>

### STORYBOOK-IMPORT-12 準備失敗後もファイルと例の選択を残す

カテゴリ: `render`

対応予定 Story: DeckImportView :: `PreparationFailureContract`（未実装）。元テスト: [DeckImportView.spec.tsx](../../../../src/pages/deck-import/ui/DeckImportView.spec.tsx) :: `explains preparation failures and leaves selection available`。

Given:

- プレビューの準備に失敗した状態を渡す。

When:

- 画面を描画する。

Then:

- The import preview could not be prepared. を表示し、内部の file read failed は表示しない。
- ファイル選択と Try this example は有効なままである。

## 自動アサーションに含めない項目

既存の `Invalid`、`Pending`、`PreviewError` は表示専用 Story である。追加予定ケースを記載しても、これらに操作抑止や復帰のアサーションを実装したことにはならない。
