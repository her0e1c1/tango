# アカウント画面 Storybook 結合テスト仕様書

## 目的

アカウント画面を入口とした `play` で、認証状態の表示、認証操作の結果、待機・失敗・画面再入場時の振る舞いを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | 正常系 | [匿名アカウントからログインする](#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | 正常系 | [ログアウトする](#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | interaction | 正常系 | [ログイン待機中の操作を無効にする](#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | interaction | 正常系 | [ログアウト待機中の操作を無効にする](#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | 正常系 | [アカウント画面を日本語で表示する](#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | 正常系 | [認証状態と UID を表示する](#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | 正常系 | [先行操作の完了で別操作の待機を解除しない](#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | 正常系 | [言語変更でプロフィール値を変えない](#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | 正常系 | [ショートカットでホームへ戻る](#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | 異常系 | [認証失敗後に再試行する](#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | 異常系 | [表示済みの通知を画面離脱だけで消さない](#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | 異常系 | [画面離脱後に届く失敗も通知する](#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | 正常系 | [日本語で認証成功を通知する](#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | 正常系 / 異常系 | [画面へ戻っても認証待機を保つ](#storybook-account-14) |

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 [TODO] 匿名アカウントからログインする

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントのアカウント画面を表示し、認証先はログイン成功を返す。

When:

- Google でのログインを選ぶ。

Then:

- ログインの成功通知が表示される。認証状態の変更が届くとログイン済みの表示へ変わる。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 [TODO] ログアウトする

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン済みのアカウント画面を表示し、認証先はログアウト成功を返す。

When:

- ログアウトを選ぶ。

Then:

- ログアウトの成功通知が表示される。匿名状態の通知が届くとログインの操作を利用できる。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 [TODO] ログイン待機中の操作を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントのアカウント画面で、認証先の応答を保留している。

When:

- ログインを選ぶ。

Then:

- 待機中の表示になり、同じログイン操作を再び実行できない。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 [TODO] ログアウト待機中の操作を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン済みのアカウント画面で、認証先の応答を保留している。

When:

- ログアウトを選ぶ。

Then:

- 待機中の表示になり、同じログアウト操作を再び実行できない。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 [TODO] アカウント画面を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 日本語の表示設定でアカウントの状態を読み込んでいる。

When:

- アカウント画面を開く。

Then:

- 見出しと操作名が日本語になり、ユーザーの表示名は翻訳されない。

<a id="storybook-account-06"></a>

### STORYBOOK-ACCOUNT-06 認証状態と UID を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 匿名の anonymous-user と、表示名 Test User のログイン済み linked-user を独立した認証状態とする。

When:

- アカウント画面を開く。

Then:

- 匿名では Anonymous account、Not available、anonymous-user とログイン操作が表示される。ログイン済みでは Signed in with Google、Test User、linked-user とログアウト操作が表示される。

<a id="storybook-account-07"></a>

### STORYBOOK-ACCOUNT-07 先行操作の完了で別操作の待機を解除しない

カテゴリ: `interaction`

区分: 正常系

Given:

- アカウント画面でログインの応答を待っている間に認証状態が変わり、ログアウトも開始している。

When:

- ログイン、ログアウトの順に応答を完了し、新しい匿名状態を通知する。

Then:

- ログインの完了だけではログアウト操作は有効にならず、ログアウト完了後に新しい匿名 UID と有効なログイン操作が表示される。

<a id="storybook-account-08"></a>

### STORYBOOK-ACCOUNT-08 言語変更でプロフィール値を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語のアカウント画面に表示名 Test User、UID linked-user のログイン済み状態が表示されている。

When:

- 日本語へ変更する。

Then:

- 固定文言とログアウト操作は日本語へ変わり、Test User と linked-user はそのままである。

<a id="storybook-account-09"></a>

### STORYBOOK-ACCOUNT-09 ショートカットでホームへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- アカウント画面を表示している。

When:

- t キーを押す。

Then:

- Deck 一覧画面に遷移し、Decks の見出しが表示される。

<a id="storybook-account-10"></a>

### STORYBOOK-ACCOUNT-10 認証失敗後に再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面で認証先は失敗、成功の順に返す。ログインとログアウトを独立した操作例とする。

When:

- 認証操作を選び、失敗後に同じ操作を再試行する。

Then:

- 失敗時に操作に対応したエラーが表示され、再試行成功後はエラーが消えて成功通知が表示される。

<a id="storybook-account-11"></a>

### STORYBOOK-ACCOUNT-11 表示済みの通知を画面離脱だけで消さない

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面のログインに失敗し、エラー通知が表示されている。

When:

- t キーでホームへ戻る。

Then:

- Deck 一覧画面が表示され、表示済みの認証失敗通知が画面離脱だけでは消えない。

<a id="storybook-account-12"></a>

### STORYBOOK-ACCOUNT-12 画面離脱後に届く失敗も通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面で認証操作の応答を待っている。ログインとログアウトを独立した操作例とする。

When:

- ホームへ移動した後、認証先から失敗が返る。

Then:

- ホームに留まったまま、元の操作に対応する認証失敗が通知される。

<a id="storybook-account-13"></a>

### STORYBOOK-ACCOUNT-13 日本語で認証成功を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 日本語のアカウント画面を表示し、認証先はログイン成功を返す。

When:

- Google でのログインを選ぶ。

Then:

- 日本語の通知領域に「ログインしました。」が表示される。

<a id="storybook-account-14"></a>

### STORYBOOK-ACCOUNT-14 画面へ戻っても認証待機を保つ

カテゴリ: `interaction`

区分: 正常系 / 異常系

Given:

- アカウント画面で認証操作の応答を保留している。ログイン・ログアウトと成功・失敗の組合せを独立した入力例とする。

When:

- ホームへ移動し、アカウント画面へ戻ってから応答を完了させる。

Then:

- 戻った直後も対象操作は無効で、完了後は結果の通知と有効な操作が表示される。その後の再実行も完了できる。
