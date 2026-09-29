# ActionsMenu

汎用操作メニューの開閉、項目選択、利用不可状態。選択後の業務処理は扱わない。

Storybook: `Shared/Navigation/ActionsMenu`。

[コンポーネント](../../../src/shared/ui/actions-menu/ActionsMenu.tsx) / [Story](../../../src/shared/ui/actions-menu/ActionsMenu.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | Download・Edit・Delete の項目を持つ閉じたメニュー。 | 開くボタンを表示し、項目は表示しない。 |
| `Open` | メニューを開いた状態。 | 3項目を表示し、Delete を破壊的な操作として区別する。 |
| `Disabled` | 開く状態と無効状態を同時に指定する。 | 開くボタンを無効にし、操作可能なメニューを表示しない。 |
| `Interaction` | Story側で開閉状態を更新し、Download を選ぶ。 | 選択を通知してメニューを閉じる。ファイル生成の成功は含めない。 |
| `Mobile` | 狭い画面で開く。 | 項目とラベルを画面内で確認できる。 |
| `Dark` | 暗いテーマで開く。 | 項目と破壊的操作を判別できる。 |
| `MobileSheet` | 狭い画面でシート表示を指定して開く。 | モバイル用シートで項目を選択・閉じる操作ができる。 |
