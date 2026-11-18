# Account E2E テスト仕様書

## 目的

認証失敗からの復旧と、アカウント切り替え時のデータ・学習位置の引き継ぎと分離を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| ACCOUNT-01 | batch | 正常系 | [匿名アカウントと同じ UID で Google 連携の完了を確認できる](#account-01) |
| ACCOUNT-03 | batch | 正常系 | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |
| ACCOUNT-06 | batch | 正常系 | [Google 連携後も Deck と Card を利用・同期できる](#account-06) |
| ACCOUNT-07 | batch | 正常系 | [Google 連携後も同じ位置から学習を再開できる](#account-07) |
| ACCOUNT-08 | batch | 正常系 | [Google 連携後も以前の学習結果を利用できる](#account-08) |
| ACCOUNT-10 | batch | 正常系 | [既存の別アカウントへログインするとそのデータだけを利用できる](#account-10) |
| ACCOUNT-11 | batch | 正常系 | [Google sign-in をキャンセルしても匿名データを利用できる](#account-11) |
| ACCOUNT-14 | batch | 正常系 | [sign-out 後に以前のアカウントのデータを利用できない](#account-14) |
| ACCOUNT-16 | batch | 正常系 | [アカウント切り替え中もデータを混在させない](#account-16) |
| ACCOUNT-04 | read | 異常系 | [認証初期化失敗から Reload で復帰できる](#account-04) |
| ACCOUNT-02 | write | 異常系 | [Google sign-in のエラー表示から再試行できる](#account-02) |
| ACCOUNT-12 | batch | 異常系 | [Google sign-in に失敗しても匿名データを利用できる](#account-12) |
| ACCOUNT-15 | batch | 異常系 | [未同期の変更があると sign-out を中止して同期を案内する](#account-15) |
| ACCOUNT-17 | batch | 異常系 | [アカウント切り替えの中断後も元のデータを利用できる](#account-17) |

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
- Google アカウントに連携済みで、Account 画面で UID を確認できる。変更は同期済みである。

When:

- Account 画面から sign-out する。

Then:

- sign-out 成功が通知される。
- Account 画面に匿名アカウントと、sign-out 前とは異なる UID が表示される。

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

- 連携前の Deck と Card を再読み込み後も利用でき、同期後は連携先アカウントのデータとして利用できる。

<a id="account-07"></a>

### ACCOUNT-07 Google 連携後も同じ位置から学習を再開できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- Deck に進行中の学習があり、現在の Card と再開位置を確認できる。
- Google アカウントへ新規連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- 再読み込み後も連携前と同じ Card・位置から学習を再開でき、同期後は連携先アカウントでも同じ位置を利用できる。

<a id="account-08"></a>

### ACCOUNT-08 [TODO] Google 連携後も以前の学習結果を利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- 連携前に Card へ回答し、学習結果を確認できる。
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
- データを持つ既存の別の Google アカウントへログインできる。

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

- 匿名データを失わず、引き続き利用できる。

<a id="account-14"></a>

### ACCOUNT-14 sign-out 後に以前のアカウントのデータを利用できない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携済みで、Deck・Card の閲覧と進行中の学習を利用できる。変更は同期済みである。

When:

- Account 画面から sign-out して新しい匿名アカウントに切り替える。

Then:

- 元のアカウントの Deck・Card は表示されず、直接開いても利用できない。
- 元の学習は再読み込み後も再開できない。

<a id="account-16"></a>

### ACCOUNT-16 [TODO] アカウント切り替え中もデータを混在させない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携済みで Deck と Card があり、変更は同期済みである。

When:

- Account 画面から sign-out を開始する。

Then:

- 切り替え中も、元のデータを新しいアカウントのデータとして表示しない。

<a id="account-04"></a>

### ACCOUNT-04 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証の開始に失敗した画面に `Reload` が表示されている。
- 次の認証は成功でき、Sample Deck の自動生成は無効である。

When:

- `Reload` を選択する。

Then:

- 再試行の完了後に Deck 一覧を利用でき、認証画面や通知が重複しない。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in のエラー表示から再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントの Account 画面に Google sign-in の失敗が通知されている。再試行は成功できる。

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

- 匿名データを失わず、引き続き利用できる。

<a id="account-15"></a>

### ACCOUNT-15 [TODO] 未同期の変更があると sign-out を中止して同期を案内する

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- 未同期の変更がある Google アカウントで Account 画面を開いている。

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

- アカウントの切り替えが完了前に中断される。切り替え準備のネットワーク停止に失敗する場合も含む。

Then:

- 元のアカウントでデータの閲覧・変更・同期を続けられる。認証確認の表示に取り残されない。
- 待機中に本人が変わった場合や認証の管理処理が終了した場合は、遅れて届く失敗で元の本人を復活させない。
