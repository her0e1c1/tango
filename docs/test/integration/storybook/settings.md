# Settings Storybook 結合テスト仕様書

## 目的

設定フォームと設定行の値の変更、日本語 locale の表示を確認する。

## 検証境界

SettingsForm と実際の React Hook Form、および SettingsSection / SettingsRow / Switch の組み合わせ。保存・再読込・他画面への反映は対象外。

関連 E2E: [settings](../../e2e/settings.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-SETTINGS-01 | render | [日本語の設定画面と System 選択を表示する](#storybook-settings-01) | [SettingsForm.stories.tsx](../../../../src/pages/settings/ui/SettingsForm.stories.tsx) :: `Japanese` |
| STORYBOOK-SETTINGS-02 | interaction | [再生操作の表示設定をフォーム上で切り替える](#storybook-settings-02) | [SettingsForm.stories.tsx](../../../../src/pages/settings/ui/SettingsForm.stories.tsx) :: `Interaction` |
| STORYBOOK-SETTINGS-03 | interaction | [設定行の Switch と変更通知を結合する](#storybook-settings-03) | [SettingsSection.stories.tsx](../../../../src/pages/settings/ui/SettingsSection.stories.tsx) :: `Interaction` |

<a id="storybook-settings-01"></a>

### STORYBOOK-SETTINGS-01 日本語の設定画面と System 選択を表示する

カテゴリ: `render`

対応 Story: [SettingsForm.stories.tsx](../../../../src/pages/settings/ui/SettingsForm.stories.tsx) :: `Japanese`

Given:

- 表示 locale は日本語で、言語選択は System の設定フォームを用意する。

When:

- 設定を描画する。

Then:

- 見出しが「設定」、言語の選択表示が System となり、document の lang が ja になる。

<a id="storybook-settings-02"></a>

### STORYBOOK-SETTINGS-02 再生操作の表示設定をフォーム上で切り替える

カテゴリ: `interaction`

対応 Story: [SettingsForm.stories.tsx](../../../../src/pages/settings/ui/SettingsForm.stories.tsx) :: `Interaction`

Given:

- 通常の設定フォームを表示し、Show playback controls の初期チェック状態を記録する。

When:

- Show playback controls を押す。

Then:

- チェック状態が初期状態の反対になる。

<a id="storybook-settings-03"></a>

### STORYBOOK-SETTINGS-03 設定行の Switch と変更通知を結合する

カテゴリ: `interaction`

対応 Story: [SettingsSection.stories.tsx](../../../../src/pages/settings/ui/SettingsSection.stories.tsx) :: `Interaction`

Given:

- Show swipe controls が有効の設定行を表示し、変更を Story 側の状態に反映する。

When:

- Show swipe controls のチェックボックスを押す。

Then:

- チェックが外れ、公開の変更 callback が一度通知される。
