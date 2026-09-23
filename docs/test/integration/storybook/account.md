# Account Storybook 結合テスト仕様書

## 目的

アカウント表示、認証操作の待機・再試行、言語変更と画面をまたぐ通知を確認する。

## 検証境界

AccountView の表示・callback と、実際の AccountPage / ToastViewport / メモリ内 router の結合を扱う。認証 SDK の応答と認証状態は外部境界で制御し、本物の Google 認証、UID の生成・維持、データ移行は検証しない。

書式・実行前提は [README](./README.md)、関連 E2E は [account](../../e2e/account.md) を参照する。

06〜14 は Vitest から追加した契約である。対応先の App :: Account は実際の画面を表示する既存 Story だが、以下の操作・状態を準備する `play` とアサーションは未実装である。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | [匿名アカウントからログインを要求する](#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | [ログアウトを要求する](#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | render | [ログイン待機中の操作を無効にする](#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | render | [ログアウト待機中の操作を無効にする](#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | [日本語の画面を表示する](#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | [認証状態と UID を表示する](#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | [先行操作の完了で別操作の待機を解除しない](#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | [言語変更でプロフィール値を変えない](#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | [ショートカットでホームへ戻る](#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | [認証失敗後に再試行する](#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | [表示済みの通知を画面離脱だけで消さない](#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | [画面離脱後に届く失敗も通知する](#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | [日本語で認証結果を通知する](#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | [画面へ戻っても待機状態を保つ](#storybook-account-14) |

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 匿名アカウントからログインを要求する

カテゴリ: `interaction`

Given:

- 匿名アカウントで表示名がなく、処理中ではない。

When:

- Sign in with Google を押す。

Then:

- Anonymous account / Not available を表示し、ログイン callback が一度通知される。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 ログアウトを要求する

カテゴリ: `interaction`

Given:

- 表示名 Maya の連携済みアカウントで、処理中ではない。

When:

- Sign out を押す。

Then:

- Signed in with Google / Maya を表示し、ログアウト callback が一度通知される。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 ログイン待機中の操作を無効にする

カテゴリ: `render`

Given:

- 匿名アカウントでログイン処理中である。

When:

- 画面を描画する。

Then:

- ログインボタンは無効で、aria-busy は true になる。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 ログアウト待機中の操作を無効にする

カテゴリ: `render`

Given:

- 連携済みアカウントでログアウト処理中である。

When:

- 画面を描画する。

Then:

- ログアウトボタンは無効で、aria-busy は true になる。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 日本語の画面を表示する

カテゴリ: `render`

Given:

- 日本語 locale、表示名 Maya の連携済みアカウントを用意する。

When:

- 画面を描画する。

Then:

- 「アカウント」の見出しと有効な「ログアウト」を表示する。

<a id="storybook-account-06"></a>

### STORYBOOK-ACCOUNT-06 [TODO] 認証状態と UID を表示する

カテゴリ: `render`

Given:

- 匿名・表示名なし・UID anonymous-user と、連携済み・Test User・UID linked-user の2条件を用意する。

When:

- AccountPage を描画する。

Then:

- 前者は Anonymous account / Not available / anonymous-user とログイン操作、後者は Signed in with Google / Test User / linked-user とログアウト操作を表示する。
- 渡した UID の表示を確認し、認証サービス上の UID の同一性は確認しない。

<a id="storybook-account-07"></a>

### STORYBOOK-ACCOUNT-07 [TODO] 先行操作の完了で別操作の待機を解除しない

カテゴリ: `interaction`

Given:

- 匿名状態からログインを開始して応答を保留する。連携済み状態を供給した後、ログアウトも開始して保留する。

When:

- ログインを先に完了し、その後ログアウトを完了して新しい匿名状態を供給する。

Then:

- ログイン完了時に Signed in. を表示しても、ログアウトは無効のままである。
- ログアウト完了後は Signed out. と供給した匿名 UID を表示し、ログインが再び有効になる。

<a id="storybook-account-08"></a>

### STORYBOOK-ACCOUNT-08 [TODO] 言語変更でプロフィール値を変えない

カテゴリ: `interaction`

Given:

- 英語で Test User / linked-user の連携済みアカウントを表示する。

When:

- 日本語へ変更する。

Then:

- 見出し、プロフィールのラベル、認証の説明とログアウト操作が日本語になる。Test User / linked-user は変わらず、操作は有効なままである。

<a id="storybook-account-09"></a>

### STORYBOOK-ACCOUNT-09 [TODO] ショートカットでホームへ戻る

カテゴリ: `interaction`

Given:

- 実際の AccountPage とメモリ内 router を使い、ホームに遷移先の内容を用意する。

When:

- t キーを押す。

Then:

- ホームへ遷移して遷移先を表示する。遷移 callback の通知だけでは成功としない。

<a id="storybook-account-10"></a>

### STORYBOOK-ACCOUNT-10 [TODO] 認証失敗後に再試行する

カテゴリ: `interaction`

Given:

- ログインとログアウトを別条件にし、外部認証境界は失敗、成功の順に返す。

When:

- 認証操作を実行し、失敗通知後に同じ操作をもう一度実行する。

Then:

- 初回は対象操作の失敗を alert に表示し、再試行成功時は alert が消えて Signed in. / Signed out. の status になる。

<a id="storybook-account-11"></a>

### STORYBOOK-ACCOUNT-11 [TODO] 表示済みの通知を画面離脱だけで消さない

カテゴリ: `interaction`

Given:

- ログインが失敗し、グローバルな ToastViewport に alert を表示している。

When:

- 通知の表示期間内に t キーでホームへ移動する。

Then:

- ホームでも Unable to sign in. を保持する。無期限に通知を残す契約ではない。

<a id="storybook-account-12"></a>

### STORYBOOK-ACCOUNT-12 [TODO] 画面離脱後に届く失敗も通知する

カテゴリ: `interaction`

Given:

- ログインとログアウトを別条件にし、操作の応答を保留する。

When:

- ホームへ移動し、その後保留していた操作を失敗させる。

Then:

- ホームに留まったまま、該当する Unable to sign in. / Unable to sign out. をグローバルな alert に表示する。

<a id="storybook-account-13"></a>

### STORYBOOK-ACCOUNT-13 [TODO] 日本語で認証結果を通知する

カテゴリ: `interaction`

Given:

- 日本語の匿名アカウントを表示し、認証境界は成功を返す。

When:

- Googleでログイン を押す。

Then:

- 「トースト通知」という名前の status に「ログインしました。」を表示する。

<a id="storybook-account-14"></a>

### STORYBOOK-ACCOUNT-14 [TODO] 画面へ戻っても待機状態を保つ

カテゴリ: `interaction`

Given:

- ログイン / ログアウトと成功 / 失敗の計4条件を用意し、認証応答を保留する。

When:

- 操作を開始し、ホームへ移動してアカウント画面へ戻る。保留結果を返した後、もう一度操作して成功させる。

Then:

- 戻った直後も対象ボタンは無効で、完了後に有効となって結果の status / alert を表示する。
- 次の操作を受け付け、その成功時は alert ではなく成功通知を表示する。
