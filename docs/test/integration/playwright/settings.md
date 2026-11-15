# 設定画面 Playwright 結合テスト仕様書

## 目的

設定画面を入口とした Playwright テストで、設定値の表示と変更、入力に関連する説明、言語とホームへの移動を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-SETTINGS-01 | render | 正常系 | [設定画面を日本語で表示する](#playwright-settings-01) |
| PLAYWRIGHT-SETTINGS-02 | interaction | 正常系 | [再生操作の表示設定を切り替える](#playwright-settings-02) |
| PLAYWRIGHT-SETTINGS-03 | interaction | 正常系 | [スワイプ操作の表示設定を切り替える](#playwright-settings-03) |
| PLAYWRIGHT-SETTINGS-04 | render | 正常系 | [設定とアカウント操作を分離する](#playwright-settings-04) |
| PLAYWRIGHT-SETTINGS-05 | interaction | 正常系 | [入力変更を画面へ反映する](#playwright-settings-05) |
| PLAYWRIGHT-SETTINGS-06 | render | 正常系 | [復習の説明とバージョン情報を表示する](#playwright-settings-06) |
| PLAYWRIGHT-SETTINGS-07 | render | 正常系 | [ラベルと説明を対応する入力に関連付ける](#playwright-settings-07) |
| PLAYWRIGHT-SETTINGS-08 | render | 正常系 | [日本語の操作名と読み上げ値を表示する](#playwright-settings-08) |
| PLAYWRIGHT-SETTINGS-09 | interaction | 正常系 | [最大カード数0を全件として説明する](#playwright-settings-09) |
| PLAYWRIGHT-SETTINGS-10 | interaction | 正常系 | [再生間隔の境界値を説明する](#playwright-settings-10) |
| PLAYWRIGHT-SETTINGS-11 | interaction | 正常系 | [ショートカットでホームへ戻る](#playwright-settings-11) |
| PLAYWRIGHT-SETTINGS-12 | interaction | 正常系 | [詳細設定をキーボードで開閉する](#playwright-settings-12) |
| PLAYWRIGHT-SETTINGS-13 | interaction | 正常系 | [配色だけを変更して他の設定を保つ](#playwright-settings-13) |
| PLAYWRIGHT-SETTINGS-14 | interaction | 正常系 | [Language の選択を画面とページの言語へ反映する](#playwright-settings-14) |
| PLAYWRIGHT-SETTINGS-15 | interaction | 正常系 | [学習条件の変更を次の開始へ渡す](#playwright-settings-15) |
| PLAYWRIGHT-SETTINGS-16 | interaction | 正常系 | [間隔スライダーの両端をキーボードで選んでも他の設定を保つ](#playwright-settings-16) |

<a id="playwright-settings-01"></a>

### PLAYWRIGHT-SETTINGS-01 [TODO] 設定画面を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、言語設定は System である。

When:

- 設定画面を開く。

Then:

- 「設定」と「言語」が表示され、選択値は System のままで、画面の言語は日本語になる。

<a id="playwright-settings-02"></a>

### PLAYWRIGHT-SETTINGS-02 [TODO] 再生操作の表示設定を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で再生操作の表示を有効にしている。

When:

- 再生操作の表示スイッチを切り替える。

Then:

- スイッチが未選択になり、もう一度操作すると選択済みに戻る。

<a id="playwright-settings-03"></a>

### PLAYWRIGHT-SETTINGS-03 [TODO] スワイプ操作の表示設定を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面でスワイプ操作の表示を有効にしている。

When:

- そのスイッチを選ぶ。

Then:

- スワイプ操作の表示が未選択になり、他の設定は変わらない。

<a id="playwright-settings-04"></a>

### PLAYWRIGHT-SETTINGS-04 [TODO] 設定とアカウント操作を分離する

カテゴリ: `render`

区分: 正常系

Given:

- 通常の設定を読み込んでいる。

When:

- 設定画面を開く。

Then:

- 言語、外観、学習、詳細設定と自動保存の案内が表示される。アカウント情報とログイン・ログアウト操作はこの画面に表示されない。

<a id="playwright-settings-05"></a>

### PLAYWRIGHT-SETTINGS-05 [TODO] 入力変更を画面へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で言語は System、最大カード数は24、再生操作・詳細・スキップは表示、裏面操作は非表示である。

When:

- 言語を日本語にし、四つの表示設定を切り替え、最大カード数を31にする。

Then:

- 変更後の選択と言語が表示され、最大カード数は31枚として確認できる。裏面操作には説明が関連付く。

<a id="playwright-settings-06"></a>

### PLAYWRIGHT-SETTINGS-06 [TODO] 復習の説明とバージョン情報を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 復習予定を尊重する設定は有効、間隔は7秒、バージョンは1.2.3、commit は 0123456789abcdef0123456789abcdef01234567 である。

When:

- 設定画面を開く。

Then:

- 復習期限に関する説明、7秒の値、バージョン1.2.3、短縮 commit 0123456 が表示され、commit のリンク先には完全な値が使われる。

<a id="playwright-settings-07"></a>

### PLAYWRIGHT-SETTINGS-07 [TODO] ラベルと説明を対応する入力に関連付ける

カテゴリ: `render`

区分: 正常系

Given:

- 説明付きの外観設定とダークモード入力がある。

When:

- 設定画面を開く。

Then:

- セクションは見出しで、入力はラベルで特定でき、説明が該当入力に関連付く。装飾アイコンは読み上げ対象にならない。

<a id="playwright-settings-08"></a>

### PLAYWRIGHT-SETTINGS-08 [TODO] 日本語の操作名と読み上げ値を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、最大カード数は24、再生間隔は7秒である。

When:

- 設定画面を開く。

Then:

- 裏面操作とダークモードを日本語の操作名で特定でき、最大カード数は24枚、再生間隔は7秒として読み上げられる。

<a id="playwright-settings-09"></a>

### PLAYWRIGHT-SETTINGS-09 [TODO] 最大カード数0を全件として説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面で最大カード数は0である。英語と日本語を独立した表示例とする。

When:

- 最大カード数を0、1、2、0と変更する。

Then:

- 0は条件に一致する全件、正数はその枚数として表示・読み上げられ、0へ戻すと全件の説明が復元される。範囲は0から100である。

<a id="playwright-settings-10"></a>

### PLAYWRIGHT-SETTINGS-10 [TODO] 再生間隔の境界値を説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面の再生間隔は60秒である。言語と自動再生・再生操作表示の有効無効を独立した表示例とする。

When:

- 間隔を0秒、1秒、60秒へ変更する。

Then:

- 0は自動送りなし、正数はその秒数として表示・読み上げられる。0秒の操作非表示の説明が付き、関連スイッチの選択は勝手に変わらない。

<a id="playwright-settings-11"></a>

### PLAYWRIGHT-SETTINGS-11 [TODO] ショートカットでホームへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 設定画面を表示し、入力欄を編集していない。

When:

- t キーを押す。

Then:

- Deck 一覧画面へ遷移し、Decks の見出しが表示される。

<a id="playwright-settings-12"></a>

### PLAYWRIGHT-SETTINGS-12 [TODO] 詳細設定をキーボードで開閉する

カテゴリ: `interaction`

区分: 正常系

Given:

- 詳細設定が閉じている Settings 画面を、狭い・広い画面と明暗両テーマで表示する。commit 情報がある・ない場合を独立した表示例とする。

When:

- Tab と Shift+Tab で間隔スライダーと詳細設定見出しを往復し、Enter・Space で開閉する。開いた状態で commit リンクがある場合は Tab で進んで戻る。

Then:

- 見出しの四辺にフォーカス枠を表示し、余分な停止位置を作らない。開閉後も見出し名とバージョン・commit 表示を維持する。
- commit 情報がある場合は完全な commit を指すリンク、ない場合は unknown を表示してリンクは作らない。設定・認証・Deck・Card・学習位置を変えない。

<a id="playwright-settings-13"></a>

### PLAYWRIGHT-SETTINGS-13 [TODO] 配色だけを変更して他の設定を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Settings の Maximum cards は0、再生間隔は3秒である。

When:

- Dark mode を現在と異なる状態へ切り替える。

Then:

- チェック状態とアプリの配色が切り替わり、Maximum cards は0、間隔は3秒を維持し、他の設定を変えない。

<a id="playwright-settings-14"></a>

### PLAYWRIGHT-SETTINGS-14 [TODO] Language の選択を画面とページの言語へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語の Settings を表示している。日本語を選択する場合と、ブラウザーが ja-JP の環境で System を選択する場合を独立した入力例とする。

When:

- Language を指定した値へ切り替え、Deck 一覧も開く。

Then:

- 選んだ値を表示し、見出し・言語入力の読み上げ名・ページの言語が日本語へ変わる。Deck 一覧の見出しと作成操作も日本語になる。

<a id="playwright-settings-15"></a>

### PLAYWRIGHT-SETTINGS-15 [TODO] 学習条件の変更を次の開始へ渡す

カテゴリ: `interaction`

区分: 正常系

Given:

- Settings で Maximum cards と Respect review schedule を変更できる。

When:

- 正の上限・1・0と、復習予定尊重の有効・無効を独立した設定例として変更し、対象 Deck の学習開始画面へ進む。

Then:

- Settings の選択と、学習開始で使用する条件が一致する。0は全件を意味し、タグ条件・復習条件を無効にしない。
- この操作だけでは進行中の学習の Card・順序・現在位置を変更しない。

<a id="playwright-settings-16"></a>

### PLAYWRIGHT-SETTINGS-16 [TODO] 間隔スライダーの両端をキーボードで選んでも他の設定を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- 認証済みユーザーで、自動再生の間隔は初期設定から変更していない。
- 「自動再生で開始」と「再生操作を表示」が有効・無効の場合を独立した状態例とし、他の設定の選択を確認できる。

When:

- Settings を開き、間隔スライダーを Home で0へ変更してから、End で正の上限へ戻す。

Then:

- 間隔の既定値は60、スライダーの範囲は0〜60であり、Home で0、End で60を選択できる。
- 0では英語・日本語とも自動送りがないことと再生・一時停止・進捗スライダーが非表示になる説明を表示・読み上げ、正の値へ戻すと秒数表示に戻る。
- 間隔以外の設定と「自動再生で開始」「再生操作を表示」の選択を維持する。
