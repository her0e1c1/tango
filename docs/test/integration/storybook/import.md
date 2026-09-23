# Deck Import Storybook 結合テスト仕様書

## 目的

CSV 選択からプレビューまでの画面結合と、日本語の診断表示を確認する。

## 検証境界

ルート Story では実際のアプリルート、ページ、CSV の読み取り・解析・プレビュー UI を組み合わせる。View の診断 Story は解析結果を渡して表示を確認する。保存・Firestore・Auth emulator はこの仕様の検証境界ではない。

関連 E2E: [import](../../e2e/import.md) / [settings](../../e2e/settings.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-IMPORT-01 | render | [保存先を選ばずインポートを開始できる画面を表示する](#storybook-import-01) | [DeckImportView.stories.tsx](../../../../src/pages/deck-import/ui/DeckImportView.stories.tsx) :: `Default` |
| STORYBOOK-IMPORT-02 | interaction | [ルート上のファイル選択から有効行のプレビューを表示する](#storybook-import-02) | [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `Import` |
| STORYBOOK-IMPORT-03 | render | [列数エラーを日本語で表示して追加を無効にする](#storybook-import-03) | [DeckImportView.stories.tsx](../../../../src/pages/deck-import/ui/DeckImportView.stories.tsx) :: `JapaneseDiagnostics` |

<a id="storybook-import-01"></a>

### STORYBOOK-IMPORT-01 保存先を選ばずインポートを開始できる画面を表示する

カテゴリ: `render`

対応 Story: [DeckImportView.stories.tsx](../../../../src/pages/deck-import/ui/DeckImportView.stories.tsx) :: `Default`

Given:

- ファイル未選択のインポート画面にサンプル例を渡す。

When:

- 画面を描画する。

Then:

- Add a deck の見出しが表示され、保存先を選ぶ radio は存在しない。

<a id="storybook-import-02"></a>

### STORYBOOK-IMPORT-02 ルート上のファイル選択から有効行のプレビューを表示する

カテゴリ: `interaction`

対応 Story: [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `Import`

Given:

- インポートの実際のルートを、Story 用の認証・アプリ状態で開く。
- storybook-import.csv に4列の1行 "storybook prompt","storybook answer","story","storybook-import" を用意する。

When:

- Upload a csv file にそのファイルを選択する。

Then:

- ファイル選択前に保存先を選ぶ radio がない。
- Review import、1 valid、storybook answer が表示される。

<a id="storybook-import-03"></a>

### STORYBOOK-IMPORT-03 列数エラーを日本語で表示して追加を無効にする

カテゴリ: `render`

対応 Story: [DeckImportView.stories.tsx](../../../../src/pages/deck-import/ui/DeckImportView.stories.tsx) :: `JapaneseDiagnostics`

Given:

- 日本語 locale で、有効行0件・不正行1件、2行目の列数が3の解析結果を渡す。

When:

- 診断画面を描画する。

Then:

- alert に「列数は4列である必要があります（現在は3列）。」が表示される。
- 「0枚のカードを追加」ボタンが無効で、document の lang が ja になる。

## 自動アサーションに含めない項目

`Invalid`、`Pending`、`PreviewError` などの表示専用 Story と、CSV を保存して再読込する E2E を混同しない。
