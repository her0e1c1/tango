# Account Storybook 結合テスト仕様書

## 目的

認証状態に応じた表示、ログイン・ログアウトの要求と処理中のボタン状態を確認する。

## 検証境界

AccountView と実際のボタン・表示 UI。認証状態は props、通知先は spy とし、Google 認証・UID 切替・データ移行は対象外。

関連 E2E: [account](../../e2e/account.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | [匿名状態を表示してログインを要求する](#storybook-account-01) | [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `Anonymous` |
| STORYBOOK-ACCOUNT-02 | interaction | [ログイン済み状態を表示してログアウトを要求する](#storybook-account-02) | [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SignedIn` |
| STORYBOOK-ACCOUNT-03 | render | [ログイン処理中のボタンを無効にする](#storybook-account-03) | [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SigningIn` |
| STORYBOOK-ACCOUNT-04 | render | [ログアウト処理中のボタンを無効にする](#storybook-account-04) | [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SigningOut` |
| STORYBOOK-ACCOUNT-05 | render | [ログイン済みの操作を日本語で表示する](#storybook-account-05) | [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `Japanese` |

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 匿名状態を表示してログインを要求する

カテゴリ: `interaction`

対応 Story: [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `Anonymous`

Given:

- 匿名アカウントで表示名がなく、認証操作は処理中ではない。

When:

- Sign in with Google を押す。

Then:

- Anonymous account と表示名の代替表示 Not available が表示される。
- ログイン callback が通知される。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 ログイン済み状態を表示してログアウトを要求する

カテゴリ: `interaction`

対応 Story: [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SignedIn`

Given:

- Google 連携済みで表示名は Maya Tanaka、認証操作は処理中ではない。

When:

- Sign out を押す。

Then:

- Signed in with Google と Maya Tanaka が表示される。
- ログアウト callback が通知される。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 ログイン処理中のボタンを無効にする

カテゴリ: `render`

対応 Story: [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SigningIn`

Given:

- 匿名状態でログイン処理中である。

When:

- アカウント画面を描画する。

Then:

- Sign in with Google が disabled で、aria-busy が true になる。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 ログアウト処理中のボタンを無効にする

カテゴリ: `render`

対応 Story: [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `SigningOut`

Given:

- ログイン済みでログアウト処理中である。

When:

- アカウント画面を描画する。

Then:

- Sign out が disabled で、aria-busy が true になる。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 ログイン済みの操作を日本語で表示する

カテゴリ: `render`

対応 Story: [AccountView.stories.tsx](../../../src/pages/account/ui/AccountView.stories.tsx) :: `Japanese`

Given:

- 日本語 locale で、Maya Tanaka としてログイン済み、認証操作は処理中ではない。

When:

- アカウント画面を描画する。

Then:

- 「アカウント」と Maya Tanaka が表示され、「ログアウト」ボタンが有効になる。
