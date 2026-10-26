# Account E2E テスト仕様書

## 目的

認証の失敗から復旧でき、匿名アカウントと Google アカウントの切り替えで、利用できるデータと学習の再開位置が正しく引き継がれる、または分離されることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| ACCOUNT-09 | read | 正常系 | [sign-in 前に匿名データの引き継ぎ条件を確認できる](#account-09) |
| ACCOUNT-01 | batch | 正常系 | [匿名アカウントと同じ UID で Google 連携の完了を確認できる](#account-01) |
| ACCOUNT-03 | batch | 正常系 | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |
| ACCOUNT-05 | batch | 正常系 | [処理完了時の言語で結果が通知される](#account-05) |
| ACCOUNT-06 | batch | 正常系 | [Google 連携後も Deck と Card を利用・同期できる](#account-06) |
| ACCOUNT-07 | batch | 正常系 | [Google 連携後も同じ位置から学習を再開できる](#account-07) |
| ACCOUNT-08 | batch | 正常系 | [Google 連携後も以前の学習結果を利用できる](#account-08) |
| ACCOUNT-10 | batch | 正常系 | [既存の別アカウントへログインするとそのデータだけを利用できる](#account-10) |
| ACCOUNT-11 | batch | 正常系 | [Google sign-in をキャンセルしても匿名データを利用できる](#account-11) |
| ACCOUNT-14 | batch | 正常系 | [sign-out 後に以前のアカウントのデータを利用できない](#account-14) |
| ACCOUNT-16 | batch | 正常系 | [アカウント切り替え中に以前のデータを新しいアカウントのデータとして表示しない](#account-16) |
| ACCOUNT-19 | batch | 正常系 | [表示中の通知は言語変更後も focus と表示期限を維持する](#account-19) |
| ACCOUNT-04 | read | 異常系 | [認証初期化失敗から Reload で復帰できる](#account-04) |
| ACCOUNT-18 | read | 異常系 | [初回の認証初期化失敗を現在の言語で確認できる](#account-18) |
| ACCOUNT-02 | write | 異常系 | [Google sign-in のエラー表示から再試行できる](#account-02) |
| ACCOUNT-12 | batch | 異常系 | [Google sign-in に失敗しても匿名データを利用できる](#account-12) |
| ACCOUNT-13 | write | 異常系 | [sign-in のエラー通知が期限または成功まで維持される](#account-13) |
| ACCOUNT-15 | batch | 異常系 | [未同期の変更があると sign-out を中止して同期を案内する](#account-15) |
| ACCOUNT-17 | batch | 異常系 | [アカウント切り替えの中断後も元のデータを利用できる](#account-17) |

<a id="account-09"></a>

### ACCOUNT-09 [TODO] sign-in 前に匿名データの引き継ぎ条件を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- まだ Google sign-in を開始していない。

When:

- Account 画面を開く。

Then:

- 操作前に、新規連携では匿名データを引き継ぐことと、既存の別アカウントへのログインでは引き継がないことが説明される。

<a id="account-01"></a>

### ACCOUNT-01 匿名アカウントと同じ UID で Google 連携の完了を確認できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名アカウントで Account 画面を開き、UID を確認できる。
- Google アカウントへ新規連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- sign-in 成功が通知される。
- Account 画面に Google アカウントとの連携状態と、匿名アカウントと同じ UID が表示される。

<a id="account-03"></a>

### ACCOUNT-03 sign-out 後に新しい匿名アカウントへ切り替えられる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーが Account 画面で UID を確認できる。
- 対象ユーザーの変更は同期済みである。

When:

- Account 画面から sign-out する。

Then:

- sign-out 成功が通知される。
- Account 画面に匿名アカウントと、sign-out 前とは異なる UID が表示される。

<a id="account-05"></a>

### ACCOUNT-05 処理完了時の言語で結果が通知される

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで English language の Account 画面を開いている。
- Google sign-in を開始し、認証 popup での操作を待っている。

When:

- 認証の完了前に Settings 画面へ移動し、Language を `日本語` に変更してから Google sign-in を完了する。

Then:

- 処理完了時の成功通知は、その時点の言語である日本語で表示・読み上げされる。

<a id="account-06"></a>

### ACCOUNT-06 Google 連携後も Deck と Card を利用・同期できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- Google アカウントへ新規連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- 連携前の Deck と Card を再読み込み後も引き続き利用できる。
- 同期後は同じ内容を連携したアカウントのデータとして利用できる。

<a id="account-07"></a>

### ACCOUNT-07 Google 連携後も同じ位置から学習を再開できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- 対象 Deck に進行中の学習 session があり、現在のカードと再開位置を確認できる。
- Google アカウントへ新規連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- 連携前の学習 session を再読み込み後も利用でき、同じカード・位置から学習を再開できる。
- 同期後も同じ学習の再開位置を連携したアカウントで利用できる。

<a id="account-08"></a>

### ACCOUNT-08 [TODO] Google 連携後も以前の学習結果を利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- 連携前にカードへ回答し、学習結果を確認できる。
- Google アカウントへ新規連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- 連携前の学習結果が失われず、同期後は連携したアカウントのデータとして利用できる。

<a id="account-10"></a>

### ACCOUNT-10 [TODO] 既存の別アカウントへログインするとそのデータだけを利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- 匿名ユーザーとは異なる既存の Google アカウントにデータがある。
- その Google アカウントへログインできる。

When:

- Account 画面から既存の別アカウントへログインする。

Then:

- ログインしたアカウントのデータだけが表示され、匿名データは引き継がれない。

<a id="account-11"></a>

### ACCOUNT-11 [TODO] Google sign-in をキャンセルしても匿名データを利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- Account 画面から Google sign-in を開始している。

When:

- Google sign-in をキャンセルする。

Then:

- キャンセルだけでは匿名データを失わず、引き続き利用できる。

<a id="account-14"></a>

### ACCOUNT-14 sign-out 後に以前のアカウントのデータを利用できない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーに Deck と Card が存在し、閲覧できる。
- 対象ユーザーに進行中の学習 session が存在し、学習を続けられる。
- 対象ユーザーの変更は同期済みである。

When:

- Account 画面から sign-out して新しい匿名アカウントに切り替える。

Then:

- sign-out 前のアカウントに属する Deck と Card が表示されず、直接開いても利用できない。
- sign-out 前のアカウントで開始した学習 session を利用できず、再読み込み後も利用できない。

<a id="account-16"></a>

### ACCOUNT-16 [TODO] アカウント切り替え中に以前のデータを新しいアカウントのデータとして表示しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーに Deck と Card が存在する。
- 対象ユーザーの変更は同期済みである。

When:

- Account 画面から sign-out を開始する。

Then:

- 切り替えが完了するまで、切り替え前のデータが新しいアカウントのデータとして表示されない。

<a id="account-19"></a>

### ACCOUNT-19 表示中の通知は言語変更後も focus と表示期限を維持する

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google sign-in が完了し、Settings 画面に日本語の成功通知が表示されている。
- 通知の閉じるボタンに focus がある。
- 通知の最初の表示から4秒が経過していない。

When:

- 通知の表示中に Language を `English` に変更する。

Then:

- 表示中の通知の本文、成功を示す表示、閉じるボタンの読み上げ名と通知の読み上げ内容が English へ更新される。
- 言語変更そのものでは閉じるボタンの focus や、通知の元の表示時間はリセットされない。
- 通知は最初の表示から4秒後に消え、言語変更によって重複しない。

<a id="account-04"></a>

### ACCOUNT-04 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証の開始に失敗した画面に `Reload` が表示されている。
- 次の認証は成功でき、Sample Deck の自動生成は無効である。

When:

- 認証初期化失敗画面に表示された `Reload` を選択する。

Then:

- 再試行の完了後に Deck 一覧を利用でき、認証画面や通知が重複しない。

<a id="account-18"></a>

### ACCOUNT-18 [TODO] 初回の認証初期化失敗を現在の言語で確認できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- アプリを初めて利用し、匿名認証を開始する。
- 表示言語は English または日本語である。

When:

- 認証の開始に失敗する。

Then:

- 空画面ではなく再読み込みできるエラー画面が表示される。
- 起動失敗画面に元の失敗理由を表示し、認証だけでなく保存データの初期化にも失敗し得る旨を案内する。
- 失敗の見出し・説明・`Reload` の読み上げ名は現在の言語で表示される。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in のエラー表示から再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗が通知され、Account 画面から再度 sign-in できる。
- 再試行では Google sign-in に成功できる。

When:

- `Sign in with Google` を選択して Google sign-in を再試行する。

Then:

- エラー通知に代わって sign-in 成功が通知される。
- Account 画面に Google アカウントとの連携状態が表示される。

<a id="account-12"></a>

### ACCOUNT-12 [TODO] Google sign-in に失敗しても匿名データを利用できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- Account 画面から Google sign-in を開始している。

When:

- Google sign-in が失敗する。

Then:

- 失敗だけでは匿名データを失わず、引き続き利用できる。

<a id="account-13"></a>

### ACCOUNT-13 [TODO] sign-in のエラー通知が期限または成功まで維持される

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗によるエラー通知が表示されている。
- 再試行は成功できる。

When:

- エラー通知の表示中に Google sign-in を再試行する。

Then:

- エラー通知は再試行の開始だけでは消えない。
- 成功時は成功通知に置き換わる。成功前に表示開始から4秒が経過した場合は、エラー通知が自動で消える。

<a id="account-15"></a>

### ACCOUNT-15 [TODO] 未同期の変更があると sign-out を中止して同期を案内する

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーが Account 画面を開いている。
- 対象ユーザーに未同期の変更が残っている。

When:

- Account 画面から sign-out する。

Then:

- sign-out せず、同期後に再操作するよう案内される。

<a id="account-17"></a>

### ACCOUNT-17 [TODO] アカウント切り替えの中断後も元のデータを利用できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーに閲覧・変更・同期できるデータがある。
- 対象ユーザーの変更は同期済みで、sign-out によるアカウント切り替えを開始している。

When:

- アカウントの切り替えが完了前に中断される。

Then:

- 元のアカウントでデータの閲覧・変更・同期を続けられる。
