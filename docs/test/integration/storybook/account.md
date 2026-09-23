# Account Storybook 結合テスト仕様書

## 目的

アカウント表示、認証操作の待機・再試行、言語変更と画面をまたぐ通知を確認する。

表示・公開 callback・通知・画面遷移を対象とする。外部から受け取った認証状態と操作結果に対する UI の振る舞いを確認し、本物の Google 認証、UID の生成・維持、データ移行は検証しない。

書式・実行前提は [AGENTS.md](./AGENTS.md)、関連 E2E は [account](../../e2e/account.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | 正常系 | [匿名アカウントからログインを要求する](#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | 正常系 | [ログアウトを要求する](#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | render | 正常系 | [ログイン待機中の操作を無効にする](#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | render | 正常系 | [ログアウト待機中の操作を無効にする](#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | 正常系 | [日本語の画面を表示する](#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | 正常系 | [認証状態と UID を表示する](#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | 正常系 | [先行操作の完了で別操作の待機を解除しない](#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | 正常系 | [言語変更でプロフィール値を変えない](#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | 正常系 | [ショートカットでホームへ戻る](#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | 異常系 | [認証失敗後に再試行する](#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | 異常系 | [表示済みの通知を画面離脱だけで消さない](#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | 異常系 | [画面離脱後に届く失敗も通知する](#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | 正常系 | [日本語で認証結果を通知する](#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | 正常系 / 異常系 | [画面へ戻っても待機状態を保つ](#storybook-account-14) |

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 匿名アカウントからログインを要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントで表示名がなく、処理中ではない。

When:

- Sign in with Google を押す。

Then:

- Anonymous account / Not available を表示し、ログイン callback が一度通知される。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 ログアウトを要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- 表示名 Maya の連携済みアカウントで、処理中ではない。

When:

- Sign out を押す。

Then:

- Signed in with Google / Maya を表示し、ログアウト callback が一度通知される。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 ログイン待機中の操作を無効にする

カテゴリ: `render`

区分: 正常系

Given:

- 匿名アカウントでログイン処理中である。

When:

- 画面を描画する。

Then:

- ログインボタンは無効で、aria-busy は true になる。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 ログアウト待機中の操作を無効にする

カテゴリ: `render`

区分: 正常系

Given:

- 連携済みアカウントでログアウト処理中である。

When:

- 画面を描画する。

Then:

- ログアウトボタンは無効で、aria-busy は true になる。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 日本語の画面を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語が日本語で、表示名 Maya の連携済みアカウントである。

When:

- 画面を描画する。

Then:

- 「アカウント」の見出しと有効な「ログアウト」を表示する。

<a id="storybook-account-06"></a>

### STORYBOOK-ACCOUNT-06 認証状態と UID を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 匿名・表示名なし・UID anonymous-user と、連携済み・Test User・UID linked-user を、それぞれ独立した認証状態の例とする。

When:

- アカウント画面を表示する。

Then:

- 前者は Anonymous account / Not available / anonymous-user とログイン操作、後者は Signed in with Google / Test User / linked-user とログアウト操作を表示する。
- 表示する UID は今回の認証状態に一致する。認証サービス上の UID の生成・維持を保証するものではない。

<a id="storybook-account-07"></a>

### STORYBOOK-ACCOUNT-07 先行操作の完了で別操作の待機を解除しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名状態から開始したログインの完了を待っている。認証状態は先に連携済みへ変わっており、その後に開始したログアウトも未完了である。

When:

- 先行するログインが完了し、その後ログアウトが完了して新しい匿名アカウントの認証状態になる。

Then:

- ログイン完了時に Signed in. を表示しても、ログアウトは無効のままである。
- ログアウト完了後は Signed out. と今回の匿名 UID を表示し、ログインが再び有効になる。

<a id="storybook-account-08"></a>

### STORYBOOK-ACCOUNT-08 言語変更でプロフィール値を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語で Test User / linked-user の連携済みアカウントを表示する。

When:

- 日本語へ変更する。

Then:

- 見出し、プロフィールのラベル、認証の説明とログアウト操作が日本語になる。Test User / linked-user は変わらず、操作は有効なままである。

<a id="storybook-account-09"></a>

### STORYBOOK-ACCOUNT-09 ショートカットでホームへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- アカウント画面を表示しており、移動先のホームには識別できる内容がある。

When:

- t キーを押す。

Then:

- ホームへ遷移して遷移先を表示する。遷移 callback の通知だけでは成功としない。

<a id="storybook-account-10"></a>

### STORYBOOK-ACCOUNT-10 認証失敗後に再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- ログインとログアウトを、それぞれ独立した操作例とする。外部の認証処理は初回に失敗し、再試行では成功する条件である。

When:

- 認証操作を実行し、失敗通知後に同じ操作をもう一度実行する。

Then:

- 初回は対象操作の失敗を alert に表示し、再試行成功時は alert が消えて Signed in. / Signed out. の status になる。

<a id="storybook-account-11"></a>

### STORYBOOK-ACCOUNT-11 表示済みの通知を画面離脱だけで消さない

カテゴリ: `interaction`

区分: 異常系

Given:

- ログインが失敗し、画面共通の通知領域に失敗の alert を表示している。

When:

- 通知の表示期間内に t キーでホームへ移動する。

Then:

- ホームでも Unable to sign in. を保持する。無期限に通知を残す契約ではない。

<a id="storybook-account-12"></a>

### STORYBOOK-ACCOUNT-12 画面離脱後に届く失敗も通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- ログインとログアウトを、それぞれ独立した操作例とする。対象の操作は開始済みで、認証処理の応答を待っている。

When:

- ホームへ移動した後、開始済みの認証操作の失敗が通知される。

Then:

- ホームに留まったまま、該当する Unable to sign in. / Unable to sign out. をグローバルな alert に表示する。

<a id="storybook-account-13"></a>

### STORYBOOK-ACCOUNT-13 日本語で認証結果を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 表示言語が日本語の匿名アカウントで、ログインできる状態である。

When:

- Googleでログイン を押し、認証操作が成功する。

Then:

- 「トースト通知」という名前の status に「ログインしました。」を表示する。

<a id="storybook-account-14"></a>

### STORYBOOK-ACCOUNT-14 画面へ戻っても待機状態を保つ

カテゴリ: `interaction`

区分: 正常系 / 異常系

Given:

- ログイン / ログアウトと成功 / 失敗の計4条件を、独立した入力例とする。認証処理の完了前にホームとアカウント画面を往復できる。

When:

- 操作を開始し、完了前にホームへ移動してアカウント画面へ戻る。対象の成功 / 失敗が通知された後、もう一度操作して成功する。

Then:

- 戻った直後も対象ボタンは無効で、完了後に有効となって結果の status / alert を表示する。
- 次の操作を受け付け、その成功時は alert ではなく成功通知を表示する。
