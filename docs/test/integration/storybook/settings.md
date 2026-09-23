# Settings Storybook 結合テスト仕様書

## 目的

設定入力、境界値の説明、言語変更、読み上げ上の関連付けとショートカットを確認する。

## 検証境界

SettingsForm と実際の React Hook Form、SettingsSection / SettingsRow / Switch を組み合わせる。遷移のケースは実際の SettingsPage とメモリ内 router を使う。設定の実保存、再読込後の復元、別画面への反映は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [settings](../../e2e/settings.md) を参照する。

04〜11 は Vitest から追加した契約で、各ケースの準備とアサーションは未実装である。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-SETTINGS-01 | render | [設定を日本語で表示する](#storybook-settings-01) |
| STORYBOOK-SETTINGS-02 | interaction | [再生操作の表示設定を切り替える](#storybook-settings-02) |
| STORYBOOK-SETTINGS-03 | interaction | [セクション内のスイッチ変更を通知する](#storybook-settings-03) |
| STORYBOOK-SETTINGS-04 | render | [設定とアカウント操作を分離する](#storybook-settings-04) |
| STORYBOOK-SETTINGS-05 | interaction | [入力変更を表示に反映する](#storybook-settings-05) |
| STORYBOOK-SETTINGS-06 | render | [復習説明とバージョン情報を表示する](#storybook-settings-06) |
| STORYBOOK-SETTINGS-07 | render | [ラベルと説明を対応する UI に関連付ける](#storybook-settings-07) |
| STORYBOOK-SETTINGS-08 | render | [日本語の操作名と読み上げ値を表示する](#storybook-settings-08) |
| STORYBOOK-SETTINGS-09 | interaction | [最大カード数0を全件として説明する](#storybook-settings-09) |
| STORYBOOK-SETTINGS-10 | interaction | [再生間隔の境界値を説明する](#storybook-settings-10) |
| STORYBOOK-SETTINGS-11 | interaction | [ショートカットでホームへ戻る](#storybook-settings-11) |

<a id="storybook-settings-01"></a>

### STORYBOOK-SETTINGS-01 設定を日本語で表示する

カテゴリ: `render`


Given:

- 日本語 locale、言語設定 system のフォームを用意する。

When:

- 設定画面を描画する。

Then:

- 「設定」の見出しと「言語」の選択欄を表示し、選択は System、document の lang は ja になる。

<a id="storybook-settings-02"></a>

### STORYBOOK-SETTINGS-02 再生操作の表示設定を切り替える

カテゴリ: `interaction`


Given:

- 実際の React Hook Form を持つ設定画面を表示する。

When:

- Show playback controls を押す。

Then:

- チェック状態が操作前と反対になる。

<a id="storybook-settings-03"></a>

### STORYBOOK-SETTINGS-03 セクション内のスイッチ変更を通知する

カテゴリ: `interaction`


Given:

- スワイプ操作表示のスイッチが有効である。

When:

- スイッチを押す。

Then:

- チェックが外れ、変更 callback が通知される。

<a id="storybook-settings-04"></a>

### STORYBOOK-SETTINGS-04 設定とアカウント操作を分離する

カテゴリ: `render`

検証状況: 未実装


Given:

- 通常の設定画面を用意する。

When:

- 画面を描画する。

Then:

- Settings、Changes are saved automatically、Language / Appearance / Study と Advanced を表示する。
- form role、Account 領域、User ID、ログイン・ログアウト操作は表示しない。自動保存の案内を実保存の成功とはみなさない。

<a id="storybook-settings-05"></a>

### STORYBOOK-SETTINGS-05 入力変更を表示に反映する

カテゴリ: `interaction`

検証状況: 未実装


Given:

- 再生操作・Card 詳細・スキップは表示、裏面操作は非表示、言語 system、最大24枚である。

When:

- 言語を ja にし、4つの表示設定を切り替え、最大カード数を31に変える。

Then:

- 各 checkbox は反対の状態になり、言語は ja / 日本語、カード数は31、読み上げ値は 31 cards になる。
- 裏面操作には解答表示中の左右操作の説明が関連付く。

<a id="storybook-settings-06"></a>

### STORYBOOK-SETTINGS-06 復習説明とバージョン情報を表示する

カテゴリ: `render`

検証状況: 未実装


Given:

- 復習予定を尊重する設定は有効、間隔7秒、version 1.2.3、commit は `0123456789abcdef0123456789abcdef01234567` である。

When:

- フォームを描画する。

Then:

- Respect review schedule を選択済みとし、次回復習時刻まで隠す説明と 7 seconds の読み上げ値を表示する。
- Advanced は 1.2.3 と7文字の 0123456 を表示し、リンク先には完全な hash を使う。Main branch の表示は追加しない。

<a id="storybook-settings-07"></a>

### STORYBOOK-SETTINGS-07 ラベルと説明を対応する UI に関連付ける

カテゴリ: `render`

検証状況: 未実装


Given:

- 説明付きの Appearance セクションと Dark mode 入力を用意する。別条件では設定フォームを二つ描画する。

When:

- 設定 UI を描画する。

Then:

- 領域は見出しから名前を得て、入力はラベルで特定でき、説明が対象入力に関連付く。装飾アイコンは読み上げ対象から除く。
- 複数フォームでも各 Language / Appearance / Study 領域と対応する見出しを正しく特定できる。

<a id="storybook-settings-08"></a>

### STORYBOOK-SETTINGS-08 日本語の操作名と読み上げ値を表示する

カテゴリ: `render`

検証状況: 未実装


Given:

- 日本語 locale、最大24枚、再生間隔7秒である。

When:

- フォームを描画する。

Then:

- 裏面操作の表示とダークモードを日本語の名前で特定できる。読み上げ値は最大カード数が24枚、再生間隔が7秒になる。

<a id="storybook-settings-09"></a>

### STORYBOOK-SETTINGS-09 最大カード数0を全件として説明する

カテゴリ: `interaction`

検証状況: 未実装


Given:

- 英語・日本語を別条件とし、最大カード数は0である。

When:

- スライダーを 0 → 1 → 2 → 0 と変更する。

Then:

- 範囲は0〜100で、0は All matching cards / 条件に一致するすべてのカードと表示・読み上げされ、適用条件の説明が付く。
- 正数は英語で 1 card / 2 cards、日本語で1枚 / 2枚になり、0へ戻すと全件の説明が復元する。実際の抽出枚数は確認しない。

<a id="storybook-settings-10"></a>

### STORYBOOK-SETTINGS-10 再生間隔の境界値を説明する

カテゴリ: `interaction`

検証状況: 未実装


Given:

- 間隔は60秒とする。en / ja と、自動再生で開始・再生操作表示の true/false 全4組を組み合わせた8条件を個別に用意する。

When:

- 間隔を0秒、1秒、60秒へ変更する。

Then:

- 範囲は0〜60で、0は自動送りなし、正数はその秒数を表示・読み上げする。英語は 1 second / 60 seconds を区別する。
- 0秒では自動送りをせず、再生操作と進捗スライダーを隠す説明が入力に関連付く。
- 自動再生で開始・再生操作表示の checkbox は元の値を保つ。学習画面での実際の停止・非表示はこの説明表示のテストでは確認しない。

<a id="storybook-settings-11"></a>

### STORYBOOK-SETTINGS-11 ショートカットでホームへ戻る

カテゴリ: `interaction`

検証状況: 未実装


Given:

- 実際の SettingsPage とメモリ内 router を使い、ホームに遷移先を用意する。

When:

- 入力欄を編集していない状態で t キーを押す。

Then:

- ホームへ遷移し、遷移先の内容を表示する。遷移 callback の通知だけで成功としない。
