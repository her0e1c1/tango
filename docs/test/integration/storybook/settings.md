# Settings Storybook 結合テスト仕様書

## 目的

設定入力、値の説明、言語による表示、アクセシブルな関連付けと画面のショートカットを確認する。

## 検証境界

SettingsForm と実際の React Hook Form、SettingsSection / SettingsRow / Switch。ルートのケースでは実際の SettingsPage とメモリ内 router を組み合わせる。設定の保存・再読込や別画面への反映は対象外。

関連 E2E: [settings](../../e2e/settings.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-SETTINGS-01 | render | [設定画面を日本語で表示する](#storybook-settings-01) | SettingsForm :: `Japanese` |
| STORYBOOK-SETTINGS-02 | interaction | [再生コントロールの表示設定を切り替える](#storybook-settings-02) | SettingsForm :: `Interaction` |
| STORYBOOK-SETTINGS-03 | interaction | [設定セクション内のスイッチ変更を通知する](#storybook-settings-03) | SettingsSection :: `Interaction` |
| STORYBOOK-SETTINGS-04 | render | [自動保存の設定とアカウント操作を分離する](#storybook-settings-04) | SettingsForm :: `SectionContract`（未実装） |
| STORYBOOK-SETTINGS-05 | interaction | [設定入力の変更を表示へ反映する](#storybook-settings-05) | SettingsForm :: `InputContract`（未実装） |
| STORYBOOK-SETTINGS-06 | render | [復習説明とバージョン情報を表示する](#storybook-settings-06) | SettingsForm :: `MetadataContract`（未実装） |
| STORYBOOK-SETTINGS-07 | render | [見出し・ラベル・説明を対応する領域と入力へ関連付ける](#storybook-settings-07) | SettingsSection :: `AccessibleRelationships`（未実装） |
| STORYBOOK-SETTINGS-08 | render | [日本語の操作名と読み上げ値を表示する](#storybook-settings-08) | SettingsForm :: `JapaneseValueContract`（未実装） |
| STORYBOOK-SETTINGS-09 | interaction | [最大カード数の0件指定を全件として説明する](#storybook-settings-09) | SettingsForm :: `MaximumCardsBoundary`（未実装） |
| STORYBOOK-SETTINGS-10 | interaction | [自動再生間隔の境界値を説明し他の設定を変更しない](#storybook-settings-10) | SettingsForm :: `AutoplayIntervalBoundary`（未実装） |
| STORYBOOK-SETTINGS-11 | interaction | [ルートショートカットでホームへ戻る](#storybook-settings-11) | App :: `SettingsShortcut`（未実装） |

対応ファイルは [SettingsForm.stories.tsx](../../../../src/pages/settings/ui/SettingsForm.stories.tsx)、[SettingsSection.stories.tsx](../../../../src/pages/settings/ui/SettingsSection.stories.tsx)、[App.stories.tsx](../../../../src/app/App.stories.tsx)。04 以降の named export は追加予定であり、既存 `play` の検証済み項目ではない。

<a id="storybook-settings-01"></a>

### STORYBOOK-SETTINGS-01 設定画面を日本語で表示する

カテゴリ: `render`

対応 Story: SettingsForm :: `Japanese`

Given:

- 日本語 locale で、言語設定が system のフォームを用意する。

When:

- 設定画面を描画する。

Then:

- 「設定」の見出しと「言語」の選択欄が表示され、選択欄は System を表示する。
- document の lang が ja になる。

<a id="storybook-settings-02"></a>

### STORYBOOK-SETTINGS-02 再生コントロールの表示設定を切り替える

カテゴリ: `interaction`

対応 Story: SettingsForm :: `Interaction`

Given:

- 実際の React Hook Form を持つ設定画面を表示する。

When:

- Show playback controls を押す。

Then:

- チェック状態が操作前と反対になる。

<a id="storybook-settings-03"></a>

### STORYBOOK-SETTINGS-03 設定セクション内のスイッチ変更を通知する

カテゴリ: `interaction`

対応 Story: SettingsSection :: `Interaction`

Given:

- スワイプ操作表示のスイッチが有効な設定セクションを表示する。

When:

- そのスイッチを押す。

Then:

- チェックが外れ、変更 callback が通知される。

<a id="storybook-settings-04"></a>

### STORYBOOK-SETTINGS-04 自動保存の設定とアカウント操作を分離する

カテゴリ: `render`

対応予定 Story: SettingsForm :: `SectionContract`（未実装）。元テスト: [SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `groups every auto-saved setting in the unified settings list`、[SettingsPage.spec.tsx](../../../../src/pages/settings/ui/SettingsPage.spec.tsx) :: `keeps account identity and authentication controls out of settings`。

Given:

- 通常の設定画面を用意する。

When:

- 画面を描画する。

Then:

- Settings、Changes are saved automatically、Language / Appearance / Study の各領域と Advanced を表示する。
- 送信用の form role、Account 領域、User ID、ログイン・ログアウトの操作は表示しない。
- 自動保存の案内表示は、実際の保存成功を証明するものではない。

<a id="storybook-settings-05"></a>

### STORYBOOK-SETTINGS-05 設定入力の変更を表示へ反映する

カテゴリ: `interaction`

対応予定 Story: SettingsForm :: `InputContract`（未実装）。元テスト: [SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `renders and updates switches and numeric sliders through RHF registration`。

Given:

- 再生操作表示・Card 詳細・スキップは有効、裏面操作表示は無効、言語 system、最大24枚である。

When:

- 言語を ja にし、4つの表示設定をそれぞれ切り替え、最大カード数を31へ変える。

Then:

- 各 checkbox は初期状態と反対になり、言語選択は ja / 日本語になる。
- スライダーと表示件数が31になり、読み上げ値は 31 cards になる。
- 裏面操作表示には解答表示中の左右操作を説明する文が関連付く。

<a id="storybook-settings-06"></a>

### STORYBOOK-SETTINGS-06 復習説明とバージョン情報を表示する

カテゴリ: `render`

対応予定 Story: SettingsForm :: `MetadataContract`（未実装）。元テスト: [SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `preserves scheduling descriptions and metadata`。

Given:

- 復習スケジュールを尊重する設定が有効、再生間隔7秒、version 1.2.3、commit は `0123456789abcdef0123456789abcdef01234567` とする。

When:

- フォームを描画する。

Then:

- Respect review schedule が選択され、次回復習時刻まで隠す説明を表示する。再生間隔の読み上げ値は 7 seconds になる。
- Advanced に 1.2.3 と先頭7文字の 0123456 を表示し、リンク先には完全な commit hash を使用する。
- 8文字以上の省略表示や Main branch の表示は追加しない。

<a id="storybook-settings-07"></a>

### STORYBOOK-SETTINGS-07 見出し・ラベル・説明を対応する領域と入力へ関連付ける

カテゴリ: `render`

対応予定 Story: SettingsSection :: `AccessibleRelationships`（未実装）。元テスト: [SettingsSection.spec.tsx](../../../../src/pages/settings/ui/SettingsSection.spec.tsx) :: `relates a settings section to its unique heading` / `relates a settings row label and description to its input id` / `keeps the row control reachable through its label`、[SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `keeps section heading relationships unique across multiple instances`。

Given:

- 説明付きの Appearance セクションと Dark mode 入力を用意する。複数インスタンスの条件では同じ設定フォームを二つ描画する。

When:

- 設定 UI を描画する。

Then:

- 領域は見出しから名前を得て、入力はラベルで特定でき、説明が対象入力へ関連付く。装飾アイコンは読み上げ対象から除く。
- 二つのフォームでも各 Language / Appearance / Study 領域と見出しを正しく特定できる。

<a id="storybook-settings-08"></a>

### STORYBOOK-SETTINGS-08 日本語の操作名と読み上げ値を表示する

カテゴリ: `render`

対応予定 Story: SettingsForm :: `JapaneseValueContract`（未実装）。元テスト: [SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `renders Japanese presentation and accessible value text from the active locale`。

Given:

- 日本語 locale、最大24枚、再生間隔7秒のフォームを用意する。

When:

- フォームを描画する。

Then:

- 「裏面のスワイプ操作を表示」「ダークモード」の名前で操作を特定できる。
- 読み上げ値は最大カード数が24枚、自動再生の間隔が7秒になる。

<a id="storybook-settings-09"></a>

### STORYBOOK-SETTINGS-09 最大カード数の0件指定を全件として説明する

カテゴリ: `interaction`

対応予定 Story: SettingsForm :: `MaximumCardsBoundary`（未実装、en / ja の2条件）。元テスト: [SettingsForm.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.spec.tsx) :: `explains zero and preserves positive counts in $locale`。

Given:

- 最大カード数0で英語・日本語それぞれのフォームを用意する。

When:

- スライダーを 0 → 1 → 2 → 0 と変更する。

Then:

- 範囲は0〜100である。0は All matching cards / 条件に一致するすべてのカードと表示・読み上げされ、適用条件を示す説明が付く。
- 英語の正数は 1 card / 2 cards、日本語は1枚 / 2枚となり、正数では全件の表示を出さない。
- 0へ戻すと全件の説明が復元する。実際の抽出枚数はこの UI 境界では確認しない。

<a id="storybook-settings-10"></a>

### STORYBOOK-SETTINGS-10 自動再生間隔の境界値を説明し他の設定を変更しない

カテゴリ: `interaction`

対応予定 Story: SettingsForm :: `AutoplayIntervalBoundary`（未実装）。元テスト: [SettingsForm.autoplay.spec.tsx](../../../../src/pages/settings/ui/SettingsForm.autoplay.spec.tsx) :: `explains zero and preserves autoplay=$defaultAutoPlay and playback controls=$showPlaybackControls`。

Given:

- 間隔は60秒とする。en / ja と「自動再生で開始」「再生コントロールを表示」の true/false 全4組を組み合わせ、計8条件を別々に用意する。

When:

- 間隔を0秒、1秒、60秒へ変更する。

Then:

- 範囲は0〜60で、0では自動送りなし、1・60ではその秒数を表示・読み上げする。英語の読み上げは 1 second と 60 seconds を区別する。
- 0秒では自動送りをせず再生・一時停止と進捗スライダーを隠す、という説明が入力に関連付く。
- 自動再生で開始する設定と再生コントロール表示の checkbox は、どの間隔でも元の値を保つ。
- 学習画面で実際に再生を停止・非表示にする動作は、この説明表示のテストでは確認しない。

<a id="storybook-settings-11"></a>

### STORYBOOK-SETTINGS-11 ルートショートカットでホームへ戻る

カテゴリ: `interaction`

対応予定 Story: App :: `SettingsShortcut`（未実装）。元テスト: [SettingsPage.spec.tsx](../../../../src/pages/settings/ui/SettingsPage.spec.tsx) :: `navigates home when the user presses the route shortcut`。

Given:

- 実際の SettingsPage とメモリ内 router を組み合わせ、ホームに遷移先の表示を用意して設定ルートを開く。

When:

- 入力欄を編集していない状態で t キーを押す。

Then:

- router がホームへ遷移し、遷移先の内容を表示する。単なる遷移 callback の通知だけを成功条件にしない。
