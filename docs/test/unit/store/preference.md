# Preference Store 単体テスト仕様書

## 目的

ユーザー設定ストア (`preferencesStore`) の初期デフォルト値、設定更新アクション、`tango-config` キーでの localStorage 永続化、スキーマ検証およびバージョン異動・不正データのハイドレーション処理を確認する。

対応ファイル: [`store.ts`](../../../../src/entities/preference/model/store.ts) / [`defaults.ts`](../../../../src/entities/preference/model/defaults.ts) / [`schema.ts`](../../../../src/entities/preference/model/schema.ts) / [`actions/updatePreferences.ts`](../../../../src/entities/preference/model/actions/updatePreferences.ts) / [`store.spec.ts`](../../../../src/entities/preference/model/store.spec.ts)

関連 E2E: [STUDY-CONTROLS-09](../../e2e/study-controls.md#study-controls-09)、[SETTINGS-06](../../e2e/settings.md#settings-06)、[DECK-NAVIGATION-09](../../e2e/deck-navigation.md#deck-navigation-09)

## 共通前提

テスト実行ごとにメモリ内 Storage を初期化し、`updatePreferences(defaultPreferences)` で `preferencesStore` をデフォルト設定へ復元する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-PREF-01 | persistence | [View Mode の切替状態を永続化できる](#unit-store-pref-01) |
| UNIT-STORE-PREF-02 | persistence | [編集リンク表示の切り替えを保存・復元できる](#unit-store-pref-02) |
| UNIT-STORE-PREF-03 | initial | [Skip コントロール表示のデフォルト値を確認する](#unit-store-pref-03) |
| UNIT-STORE-PREF-04 | initial | [裏面テキストスワイプオーバーレイのデフォルト値を確認する](#unit-store-pref-04) |
| UNIT-STORE-PREF-05 | initial | [Help ショートカット表示のデフォルト値を確認する](#unit-store-pref-05) |
| UNIT-STORE-PREF-06 | state-change | [他設定をリセットせずに各グループを更新できる](#unit-store-pref-06) |
| UNIT-STORE-PREF-07 | persistence | [言語設定の変更と JSON 永続化を行える](#unit-store-pref-07) |
| UNIT-STORE-PREF-08 | validation | [設定更新時の数値範囲外入力を拒否し初期値を維持する](#unit-store-pref-08) |
| UNIT-STORE-PREF-09 | state-change | [公開ヘルパー関数経由で個別設定を一括変更できる](#unit-store-pref-09) |
| UNIT-STORE-PREF-10 | persistence | [設定更新による永続化ストレージの保存内容を確認する](#unit-store-pref-10) |
| UNIT-STORE-PREF-11 | persistence | [バージョン1の保存設定から未定義フィールドを補完復元する](#unit-store-pref-11) |
| UNIT-STORE-PREF-12 | persistence | [バージョン1のスワイプ設定マッピングを正しく互換復元する](#unit-store-pref-12) |
| UNIT-STORE-PREF-13 | persistence | [未対応のバージョン2データを破棄しデフォルト復帰する](#unit-store-pref-13) |
| UNIT-STORE-PREF-14 | persistence | [不正な JSON やスキーマ不一致データを破棄しデフォルト復帰する](#unit-store-pref-14) |

<a id="unit-store-pref-01"></a>

### UNIT-STORE-PREF-01 View Mode の切替状態を永続化できる

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] persists view mode without changing other preferences`

Given:

- `preferencesStore` がデフォルト状態で存在する。

When:

- `toggleViewMode()` を呼び出し、再ハイドレーション `rehydrate()` を実行する。

Then:

- `controls.viewMode` が `true` に反転し保存される。再度実行すると `false` に戻る。

<a id="unit-store-pref-02"></a>

### UNIT-STORE-PREF-02 編集リンク表示の切り替えを保存・復元できる

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] persists hiding and restoring the view edit link`

Given:

- `controls.showEditLink` は初期値 `true` である。

When:

- `toggleShowEditLink()` を実行して再ハイドレーションを行う。

Then:

- `controls.showEditLink` が `false` になり、再度実行すると `true` に復元される。

<a id="unit-store-pref-03"></a>

### UNIT-STORE-PREF-03 Skip コントロール表示のデフォルト値を確認する

カテゴリ: `initial`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] shows the study skip control by default`

Given:

- `defaultPreferences` オブジェクトが存在する。

When:

- `controls.showSkip` のデフォルト値を確認する。

Then:

- `defaultPreferences.controls.showSkip` は `true` である。

<a id="unit-store-pref-04"></a>

### UNIT-STORE-PREF-04 裏面テキストスワイプオーバーレイのデフォルト値を確認する

カテゴリ: `initial`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] keeps back text swipe overlays off by default`

Given:

- `defaultPreferences` オブジェクトが存在する。

When:

- `controls.showBackTextSwipeOverlays` のデフォルト値を確認する。

Then:

- `defaultPreferences.controls.showBackTextSwipeOverlays` は `false` である。

<a id="unit-store-pref-05"></a>

### UNIT-STORE-PREF-05 Help ショートカット表示のデフォルト値を確認する

カテゴリ: `initial`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] shows the study Help shortcut by default`

Given:

- `defaultPreferences` オブジェクトが存在する。

When:

- `controls.showHelp` のデフォルト値を確認する。

Then:

- `defaultPreferences.controls.showHelp` は `true` である。

<a id="unit-store-pref-06"></a>

### UNIT-STORE-PREF-06 他設定をリセットせずに各グループを更新できる

カテゴリ: `state-change`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] updates each preference group without resetting other settings`

Given:

- デフォルト状態の `preferencesStore` が存在する。

When:

- `updatePreferences` を複数回呼び出し、`study` や `controls` などの部分更新を行う。

Then:

- 指定されたフィールドのみが更新され、未指定の他フィールドは初期値を維持する。

<a id="unit-store-pref-07"></a>

### UNIT-STORE-PREF-07 言語設定の変更と JSON 永続化を行える

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] updates and persists the %s language without resetting other preferences`

Given:

- `system` / `en` / `ja` の各言語コードを用意する。

When:

- `updatePreferences({ language })` を呼び出す。

Then:

- ストア内の `language` が更新され、`tango-config` キーの localStorage 内 JSON に正しく保存される。

<a id="unit-store-pref-08"></a>

### UNIT-STORE-PREF-08 設定更新時の数値範囲外入力を拒否し初期値を維持する

カテゴリ: `validation`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] validates numeric ranges during updates`

Given:

- デフォルト状態の `preferencesStore` が存在する。

When:

- 範囲外の値（`maxNumberOfCardsToLearn: 101`, `cardInterval: -1`, `sizeBackText: -1`）を渡して `updatePreferences` を呼ぶ。

Then:

- 不正な値は無視され、各フィールドはデフォルト値を保持する。

<a id="unit-store-pref-09"></a>

### UNIT-STORE-PREF-09 公開ヘルパー関数経由で個別設定を一括変更できる

カテゴリ: `state-change`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] updates preferences through the public helpers`

Given:

- デフォルト状態の `preferencesStore` が存在する。

When:

- `setDarkMode`, `toggleShowSwipeButtonList`, `toggleShowPlaybackControls`, `toggleShowCardDetails`, `toggleShowHelp`, `toggleShowSkip` などのヘルパー関数を実行する。

Then:

- ストアの設定が対応する値に正常に更新される。

<a id="unit-store-pref-10"></a>

### UNIT-STORE-PREF-10 設定更新による永続化ストレージの保存内容を確認する

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] persists preference changes`

Given:

- `useMemoryStorage` を初期化する。

When:

- `updatePreferences` を呼び出して設定を変更する。

Then:

- `tango-config` 内に新しい設定値およびバージョン番号 `1` が JSON 形式で正しく構造化されて書き込まれる。

<a id="unit-store-pref-11"></a>

### UNIT-STORE-PREF-11 バージョン1の保存設定から未定義フィールドを補完復元する

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] hydrates version 1 preferences with defaults for additive fields`

Given:

- 新設フィールド（`language`, `showHelp`, `showEditLink` 等）を含まない旧バージョン1のストレージ文字列を用意する。

When:

- `rehydrate()` を実行する。

Then:

- ストレージの値が読み込まれつつ、欠落しているフィールドにはデフォルト値が補完適用される。

<a id="unit-store-pref-12"></a>

### UNIT-STORE-PREF-12 バージョン1のスワイプ設定マッピングを正しく互換復元する

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] hydrates the version-1 mapping with up=$up without resetting other preferences`

Given:

- 旧スワイプアクション設定（例: `cardSwipeUp: "GoToNextCardMastered"`）を含むバージョン1のストレージ用意。

When:

- `rehydrate()` を実行する。

Then:

- スワイプ設定が互換性のある新しいアクションキー（例: `RateEasy`）へ正規化変換されて復元される。

<a id="unit-store-pref-13"></a>

### UNIT-STORE-PREF-13 未対応のバージョン2データを破棄しデフォルト復帰する

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] discards version 2 preferences without migration`

Given:

- バージョン `2` として保存されたストレージデータが存在する。

When:

- `rehydrate()` を実行する。

Then:

- バージョン不一致によりデータは拒否され、ストアは `defaultPreferences` にリセットされる。

<a id="unit-store-pref-14"></a>

### UNIT-STORE-PREF-14 不正な JSON やスキーマ不一致データを破棄しデフォルト復帰する

カテゴリ: `persistence`

対応テスト: `[STUDY-CONTROLS-09] [SETTINGS-06] [DECK-NAVIGATION-09] uses current defaults for %s`

Given:

- 不正な JSON 文字列や、Zod スキーマの型構造に合致しないストレージ値を用意する。

When:

- `rehydrate()` を実行する。

Then:

- エラーにならず安全にフォールバックし、ストアは `defaultPreferences` のまま維持される。
