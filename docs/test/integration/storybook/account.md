# Account Storybook 結合テスト仕様書

## 目的

アカウント情報、認証操作の待機・再試行、言語変更、画面をまたぐ通知と待機状態を確認する。

## 検証境界

AccountView の表示・callback と、実際の AccountPage / ToastViewport / メモリ内 router を組み合わせるケースを分ける。認証 SDK の応答と認証状態を Story 側で制御し、本物の Google ログイン、UID の生成・維持やデータ移行は検証しない。画面に渡された UID の表示は UI 契約に含める。

関連 E2E: [account](../../e2e/account.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | [匿名アカウントからログインを要求する](#storybook-account-01) | AccountView :: `Anonymous` |
| STORYBOOK-ACCOUNT-02 | interaction | [ログイン済みアカウントからログアウトを要求する](#storybook-account-02) | AccountView :: `SignedIn` |
| STORYBOOK-ACCOUNT-03 | render | [ログイン処理中の操作を無効にする](#storybook-account-03) | AccountView :: `SigningIn` |
| STORYBOOK-ACCOUNT-04 | render | [ログアウト処理中の操作を無効にする](#storybook-account-04) | AccountView :: `SigningOut` |
| STORYBOOK-ACCOUNT-05 | render | [日本語のアカウント画面を表示する](#storybook-account-05) | AccountView :: `Japanese` |
| STORYBOOK-ACCOUNT-06 | render | [渡された認証状態と UID を表示する](#storybook-account-06) | App :: `AccountIdentityContract`（未実装） |
| STORYBOOK-ACCOUNT-07 | interaction | [先行操作の完了で別の認証操作の待機を解除しない](#storybook-account-07) | App :: `AccountOverlappingOperations`（未実装） |
| STORYBOOK-ACCOUNT-08 | interaction | [言語変更でプロフィールの値を変えない](#storybook-account-08) | App :: `AccountLocaleChange`（未実装） |
| STORYBOOK-ACCOUNT-09 | interaction | [ショートカットでホームへ戻る](#storybook-account-09) | App :: `AccountShortcut`（未実装） |
| STORYBOOK-ACCOUNT-10 | interaction | [認証操作の失敗後に再試行する](#storybook-account-10) | App :: `AccountRetry`（未実装） |
| STORYBOOK-ACCOUNT-11 | interaction | [表示済みの失敗通知を画面離脱だけで消さない](#storybook-account-11) | App :: `AccountNotificationAfterLeave`（未実装） |
| STORYBOOK-ACCOUNT-12 | interaction | [画面離脱後に到着した認証失敗も通知する](#storybook-account-12) | App :: `AccountLateFailure`（未実装） |
| STORYBOOK-ACCOUNT-13 | interaction | [日本語で認証結果を通知する](#storybook-account-13) | App :: `AccountJapaneseFeedback`（未実装） |
| STORYBOOK-ACCOUNT-14 | interaction | [画面へ戻っても認証操作の待機を維持する](#storybook-account-14) | App :: `AccountPendingReturn`（未実装） |

対応ファイルは [AccountView.stories.tsx](../../../../src/pages/account/ui/AccountView.stories.tsx) と [App.stories.tsx](../../../../src/app/App.stories.tsx)。06 以降の named export は追加予定であり、既存 `play` の検証済み項目ではない。App の追加予定 Story は AccountPage の実際の model/action を使い、認証境界のみを差し替える。

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 匿名アカウントからログインを要求する

カテゴリ: `interaction`

対応 Story: AccountView :: `Anonymous`

Given:

- 匿名アカウントで表示名がなく、処理中ではない。

When:

- Sign in with Google を押す。

Then:

- Anonymous account と Not available を表示し、ログイン callback が一度通知される。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 ログイン済みアカウントからログアウトを要求する

カテゴリ: `interaction`

対応 Story: AccountView :: `SignedIn`

Given:

- 表示名 Maya のログイン済みアカウントで、処理中ではない。

When:

- Sign out を押す。

Then:

- Signed in with Google と Maya を表示し、ログアウト callback が一度通知される。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 ログイン処理中の操作を無効にする

カテゴリ: `render`

対応 Story: AccountView :: `SigningIn`

Given:

- 匿名アカウントでログイン処理中である。

When:

- 画面を描画する。

Then:

- ログインボタンが無効で、aria-busy が true になる。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 ログアウト処理中の操作を無効にする

カテゴリ: `render`

対応 Story: AccountView :: `SigningOut`

Given:

- ログイン済みアカウントでログアウト処理中である。

When:

- 画面を描画する。

Then:

- ログアウトボタンが無効で、aria-busy が true になる。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 日本語のアカウント画面を表示する

カテゴリ: `render`

対応 Story: AccountView :: `Japanese`

Given:

- 日本語 locale、表示名 Maya のログイン済みアカウントを用意する。

When:

- 画面を描画する。

Then:

- 「アカウント」の見出しと有効な「ログアウト」を表示する。

<a id="storybook-account-06"></a>

### STORYBOOK-ACCOUNT-06 渡された認証状態と UID を表示する

カテゴリ: `render`

対応予定 Story: App :: `AccountIdentityContract`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `shows the anonymous identity and offers Google sign-in` / `shows the linked identity and offers sign-out`。

Given:

- 匿名・表示名なし・UID anonymous-user と、Google 連携済み・表示名 Test User・UID linked-user の2条件を用意する。

When:

- AccountPage を描画する。

Then:

- 前者は Anonymous account / Not available / anonymous-user と有効なログイン操作、後者は Signed in with Google / Test User / linked-user と有効なログアウト操作を表示する。
- UID が認証サービス上でも同じであることは確認しない。

<a id="storybook-account-07"></a>

### STORYBOOK-ACCOUNT-07 先行操作の完了で別の認証操作の待機を解除しない

カテゴリ: `interaction`

対応予定 Story: App :: `AccountOverlappingOperations`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `keeps sign-out pending when the earlier sign-in finishes during an auth transition`。

Given:

- 匿名状態からログインを開始して応答を保留する。Story 側から連携済みの状態を供給した後、ログアウトも開始して保留する。

When:

- 先にログインを完了させ、その後ログアウトを完了して新しい匿名状態を供給する。

Then:

- ログイン完了時は Signed in. を表示しても、ログアウトボタンは無効のままである。
- ログアウト完了後は Signed out. と供給した匿名アカウントの UID を表示し、ログイン操作が再び有効になる。

<a id="storybook-account-08"></a>

### STORYBOOK-ACCOUNT-08 言語変更でプロフィールの値を変えない

カテゴリ: `interaction`

対応予定 Story: App :: `AccountLocaleChange`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `updates fixed copy in place without translating linked identity data`。

Given:

- 英語で表示名 Test User、UID linked-user の連携済みアカウントを表示する。

When:

- 日本語へ変更する。

Then:

- 見出し、プロフィール、Google ログインの説明、表示名とユーザーIDのラベル、ログアウト操作が日本語になる。
- Test User と linked-user の値は変わらず、ログアウト操作は有効なままである。

<a id="storybook-account-09"></a>

### STORYBOOK-ACCOUNT-09 ショートカットでホームへ戻る

カテゴリ: `interaction`

対応予定 Story: App :: `AccountShortcut`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `navigates home when the user presses the route shortcut`。

Given:

- 実際の AccountPage をメモリ内 router のアカウントルートで表示し、ホームに遷移先の内容を用意する。

When:

- t キーを押す。

Then:

- ホームへ遷移して遷移先の内容を表示する。

<a id="storybook-account-10"></a>

### STORYBOOK-ACCOUNT-10 認証操作の失敗後に再試行する

カテゴリ: `interaction`

対応予定 Story: App :: `AccountRetry`（未実装、ログイン / ログアウトの2条件）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `lets the user retry a failed sign-in` / `lets the user retry a failed sign-out`。

Given:

- 対象操作が可能なアカウントを用意し、外部認証境界は最初に失敗、次に成功を返す。

When:

- 認証操作を実行し、失敗通知の後でもう一度同じ操作を実行する。

Then:

- 初回は Unable to sign in. / Unable to sign out. の alert を表示する。
- 再試行の成功時は alert がなくなり、Signed in. / Signed out. の status を表示する。

<a id="storybook-account-11"></a>

### STORYBOOK-ACCOUNT-11 表示済みの失敗通知を画面離脱だけで消さない

カテゴリ: `interaction`

対応予定 Story: App :: `AccountNotificationAfterLeave`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `keeps a handled sign-in failure visible globally after leaving the Account page`。

Given:

- ログインが失敗し、グローバルな ToastViewport に失敗の alert を表示している。

When:

- 通知の表示期間内に t キーでホームへ移動する。

Then:

- ホームを表示しても Unable to sign in. の通知は残る。通知を無期限に保持するという契約ではない。

<a id="storybook-account-12"></a>

### STORYBOOK-ACCOUNT-12 画面離脱後に到着した認証失敗も通知する

カテゴリ: `interaction`

対応予定 Story: App :: `AccountLateFailure`（未実装、ログイン / ログアウトの2条件）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `shows a sign-in failure that arrives after leaving the Account page` / `shows a sign-out failure that arrives after leaving the Account page`。

Given:

- 外部認証応答を保留したまま認証操作を開始する。

When:

- t キーでホームへ移動し、その後保留していた操作を失敗させる。

Then:

- ホームに留まったまま、該当操作の Unable to sign in. / Unable to sign out. をグローバルな alert に表示する。

<a id="storybook-account-13"></a>

### STORYBOOK-ACCOUNT-13 日本語で認証結果を通知する

カテゴリ: `interaction`

対応予定 Story: App :: `AccountJapaneseFeedback`（未実装）。元テスト: [AccountPage.spec.tsx](../../../../src/pages/account/ui/AccountPage.spec.tsx) :: `shows localized Japanese toast messages when active language is set to ja`。

Given:

- 日本語の匿名アカウント画面を用意し、認証境界は成功を返す。

When:

- Googleでログイン を押す。

Then:

- 「トースト通知」という名前の status に「ログインしました。」を表示する。

<a id="storybook-account-14"></a>

### STORYBOOK-ACCOUNT-14 画面へ戻っても認証操作の待機を維持する

カテゴリ: `interaction`

対応予定 Story: App :: `AccountPendingReturn`（未実装、操作2種 × 結果2種の計4条件）。元テスト: [AccountPage.pending.spec.tsx](../../../../src/pages/account/ui/AccountPage.pending.spec.tsx) :: `keeps pending across remounts until %s and allows another attempt`。

Given:

- ログインまたはログアウトが可能な状態で、外部認証応答を保留する。成功・失敗をそれぞれ独立に準備する。

When:

- 操作を開始し、ホームへ移動してからアカウント画面へ戻る。保留結果を返し、もう一度操作して成功させる。

Then:

- 戻った直後も対象ボタンは無効で、完了するまで再操作できない。
- 完了後は有効になり、結果に応じた status または alert を表示する。
- 次の操作は受け付けられ、成功時には alert ではなく成功通知を表示する。
