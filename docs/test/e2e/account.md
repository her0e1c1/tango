# Account E2E テスト仕様書

## 目的

認証の失敗から復旧でき、匿名アカウントと Google アカウントの切り替えで、利用できるデータと学習の再開位置が正しく引き継がれる、または分離されることを確認する。

## 実行中の操作

以下は ACCOUNT-01、ACCOUNT-02、ACCOUNT-03 に共通する。

- sign-in / sign-out の実行中は、同じ操作のボタンが無効になり、二重実行できない。
- 操作が完了する前に Account 画面を離れて戻っても、その操作の実行中表示が維持される。
- 成功・失敗のどちらでも完了時に操作可能になり、結果が通知される。失敗後は再試行できる。
- 一方の操作が完了しても、まだ完了していない別の操作を重ねて実行できる状態にはならない。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |
| ACCOUNT-04 | read | [認証初期化失敗から Reload で復帰できる](#account-04) |
| ACCOUNT-05 | batch | [処理中と通知表示中の言語変更を通知に反映できる](#account-05) |

<a id="account-01"></a>

### ACCOUNT-01 匿名アカウントを Google アカウントに連携してデータを維持できる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- 対象 Deck に進行中の学習 session が存在する。
- Account 画面で匿名アカウントの UID を確認できる。
- Google アカウントへ連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- sign-in 成功が通知される。
- Account 画面に Google アカウントとの連携状態が表示される。
- 匿名アカウントと同じ UID が表示される。
- 連携前の Deck、Card、学習 session を引き続き利用でき、同じ位置から学習を再開できる。
- 連携前の学習結果も失われず、同期後は連携したアカウントのデータとして利用できる。
- 操作前に、新規連携では匿名データを引き継ぐことと、既存の別アカウントへのログインでは引き継がないことが説明される。
- 既存の別アカウントへログインした場合は、そのアカウントのデータだけが表示される。キャンセルや失敗だけでは匿名データを失わない。
- browser error が発生しない。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in のエラー表示から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗が通知され、Account 画面から再度 sign-in できる。
- 再試行では Google sign-in に成功できる。

When:

- `Sign in with Google` を選択して Google sign-in を再試行する。

Then:

- エラー通知は表示開始から4秒後に自動で消える。再試行の開始だけでは消えず、成功時は成功通知に置き換わる。
- sign-in 成功が通知される。
- Account 画面に Google アカウントとの連携状態が表示される。
- browser error が発生しない。

<a id="account-03"></a>

### ACCOUNT-03 sign-out 後に新しい匿名アカウントへ切り替えられる

カテゴリ: `batch`

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーに Deck と Card が存在する。
- 対象ユーザーに進行中の学習 session が存在する。

When:

- Account 画面から sign-out する。

Then:

- sign-out 成功が通知される。
- Account 画面に匿名アカウントが表示される。
- sign-out 前とは異なる UID が表示される。
- 未同期の変更が残る場合は sign-out せず、同期後に再操作するよう案内される。
- アカウントの切り替え中に、切り替え前のデータが新しいアカウントのデータとして表示されない。
- 切り替えが中断された場合は、元のアカウントでデータの閲覧・変更・同期を続けられる。
- sign-out 前のアカウントに属する Deck と Card が表示されない。
- sign-out 前のアカウントで開始した学習 session を利用できない。
- browser error が発生しない。

<a id="account-04"></a>

### ACCOUNT-04 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証の開始に失敗した画面に `Reload` が表示されている。
- 次の認証は成功でき、Sample Deck の自動生成は無効である。

When:

- 認証初期化失敗画面に表示された `Reload` を選択する。

Then:

- 失敗の見出し・説明・Reload の読み上げ名は現在の言語で表示される。
- 初回の匿名認証に失敗した場合も、空画面ではなく再読み込みできるエラー画面が表示される。
- 再試行の完了後に Deck 一覧を利用でき、認証画面や通知が重複しない。
- 未処理の browser error が発生しない。

<a id="account-05"></a>

### ACCOUNT-05 処理中と通知表示中の言語変更を通知に反映できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで English language の Account 画面を開いている。
- Google sign-in を開始し、認証 popup での操作を待っている。

When:

- 認証の完了前に Settings 画面へ移動し、Language を `日本語` に変更してから Google sign-in を完了する。
- 成功通知が表示されている間に通知の閉じるボタンへ focus を移し、Language を `English` に戻す。

Then:

- 処理完了時の成功通知は、その時点の言語である日本語で表示・読み上げされる。
- 表示中の通知の本文、成功を示す表示、閉じるボタンの読み上げ名と通知の読み上げ内容が English へ更新される。
- 言語変更そのものでは閉じるボタンの focus や、通知の元の表示時間はリセットされない。
- 通知は最初の表示から4秒後に消え、言語変更によって重複しない。
- browser error が発生しない。
