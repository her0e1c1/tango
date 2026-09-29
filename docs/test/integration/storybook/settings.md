# 設定画面 Storybook 結合テスト仕様書

## 目的

設定画面を入口とした `play` で、設定値の表示と変更、入力に関連する説明、言語とホームへの移動を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-SETTINGS-01 | render | 正常系 | [設定画面を日本語で表示する](#storybook-settings-01) |
| STORYBOOK-SETTINGS-02 | interaction | 正常系 | [再生操作の表示設定を切り替える](#storybook-settings-02) |
| STORYBOOK-SETTINGS-03 | interaction | 正常系 | [スワイプ操作の表示設定を切り替える](#storybook-settings-03) |
| STORYBOOK-SETTINGS-04 | render | 正常系 | [設定とアカウント操作を分離する](#storybook-settings-04) |
| STORYBOOK-SETTINGS-05 | interaction | 正常系 | [入力変更を画面へ反映する](#storybook-settings-05) |
| STORYBOOK-SETTINGS-06 | render | 正常系 | [復習の説明とバージョン情報を表示する](#storybook-settings-06) |
| STORYBOOK-SETTINGS-07 | render | 正常系 | [ラベルと説明を対応する入力に関連付ける](#storybook-settings-07) |
| STORYBOOK-SETTINGS-08 | render | 正常系 | [日本語の操作名と読み上げ値を表示する](#storybook-settings-08) |
| STORYBOOK-SETTINGS-09 | interaction | 正常系 | [最大カード数0を全件として説明する](#storybook-settings-09) |
| STORYBOOK-SETTINGS-10 | interaction | 正常系 | [再生間隔の境界値を説明する](#storybook-settings-10) |
| STORYBOOK-SETTINGS-11 | interaction | 正常系 | [ショートカットでホームへ戻る](#storybook-settings-11) |

<a id="storybook-settings-01"></a>

### STORYBOOK-SETTINGS-01 [TODO] 設定画面を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、言語設定は System である。

When:

- 設定画面を開く。

Then:

- 「設定」と「言語」が表示され、選択値は System のままで、画面の言語は日本語になる。

<a id="storybook-settings-02"></a>

### STORYBOOK-SETTINGS-02 [TODO] 再生操作の表示設定を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で再生操作の表示を有効にしている。

When:

- 再生操作の表示スイッチを切り替える。

Then:

- スイッチが未選択になり、もう一度操作すると選択済みに戻る。

<a id="storybook-settings-03"></a>

### STORYBOOK-SETTINGS-03 [TODO] スワイプ操作の表示設定を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面でスワイプ操作の表示を有効にしている。

When:

- そのスイッチを選ぶ。

Then:

- スワイプ操作の表示が未選択になり、他の設定は変わらない。

<a id="storybook-settings-04"></a>

### STORYBOOK-SETTINGS-04 [TODO] 設定とアカウント操作を分離する

カテゴリ: `render`

区分: 正常系

Given:

- 通常の設定を読み込んでいる。

When:

- 設定画面を開く。

Then:

- 言語、外観、学習、詳細設定と自動保存の案内が表示される。アカウント情報とログイン・ログアウト操作はこの画面に表示されない。

<a id="storybook-settings-05"></a>

### STORYBOOK-SETTINGS-05 [TODO] 入力変更を画面へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で言語は System、最大カード数は24、再生操作・詳細・スキップは表示、裏面操作は非表示である。

When:

- 言語を日本語にし、四つの表示設定を切り替え、最大カード数を31にする。

Then:

- 変更後の選択と言語が表示され、最大カード数は31枚として確認できる。裏面操作には説明が関連付く。

<a id="storybook-settings-06"></a>

### STORYBOOK-SETTINGS-06 [TODO] 復習の説明とバージョン情報を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 復習予定を尊重する設定は有効、間隔は7秒、バージョンは1.2.3、commit は 0123456789abcdef0123456789abcdef01234567 である。

When:

- 設定画面を開く。

Then:

- 復習期限に関する説明、7秒の値、バージョン1.2.3、短縮 commit 0123456 が表示され、commit のリンク先には完全な値が使われる。

<a id="storybook-settings-07"></a>

### STORYBOOK-SETTINGS-07 [TODO] ラベルと説明を対応する入力に関連付ける

カテゴリ: `render`

区分: 正常系

Given:

- 説明付きの外観設定とダークモード入力がある。

When:

- 設定画面を開く。

Then:

- セクションは見出しで、入力はラベルで特定でき、説明が該当入力に関連付く。装飾アイコンは読み上げ対象にならない。

<a id="storybook-settings-08"></a>

### STORYBOOK-SETTINGS-08 [TODO] 日本語の操作名と読み上げ値を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、最大カード数は24、再生間隔は7秒である。

When:

- 設定画面を開く。

Then:

- 裏面操作とダークモードを日本語の操作名で特定でき、最大カード数は24枚、再生間隔は7秒として読み上げられる。

<a id="storybook-settings-09"></a>

### STORYBOOK-SETTINGS-09 [TODO] 最大カード数0を全件として説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で最大カード数は0である。英語と日本語を独立した表示例とする。

When:

- 最大カード数を0、1、2、0と変更する。

Then:

- 0は条件に一致する全件、正数はその枚数として表示・読み上げられ、0へ戻すと全件の説明が復元される。範囲は0から100である。

<a id="storybook-settings-10"></a>

### STORYBOOK-SETTINGS-10 [TODO] 再生間隔の境界値を説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面の再生間隔は60秒である。言語と自動再生・再生操作表示の有効無効を独立した表示例とする。

When:

- 間隔を0秒、1秒、60秒へ変更する。

Then:

- 0は自動送りなし、正数はその秒数として表示・読み上げられる。0秒の操作非表示の説明が付き、関連スイッチの選択は勝手に変わらない。

<a id="storybook-settings-11"></a>

### STORYBOOK-SETTINGS-11 ショートカットでホームへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面を表示し、入力欄を編集していない。

When:

- t キーを押す。

Then:

- Deck 一覧画面へ遷移し、Decks の見出しが表示される。
