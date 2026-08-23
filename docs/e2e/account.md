# Account E2E テスト仕様書

## 目的

匿名アカウントと Google アカウントの切り替えで、アカウント状態、UID、ユーザーデータ、学習 session の境界が保たれることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |

<a id="account-01"></a>

### ACCOUNT-01 匿名アカウントを Google アカウントに連携してデータを維持できる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 匿名アカウントに Deck と Card が存在する。
- 対象 Deck に進行中の学習 session が存在する。
- Google アカウントへ連携できる。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- Account 画面に Google アカウントとの連携状態が表示される。
- 匿名アカウントと同じ UID が表示される。
- 連携前の Deck、Card、学習 session を引き続き利用できる。
- browser error が発生しない。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in のエラー表示から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗が画面内で処理され、`Retry` が表示されている。
- 再試行では Google sign-in に成功できる。

When:

- `Retry` を選択して Google sign-in を再試行する。

Then:

- 再試行後にエラー表示が残らない。
- Account 画面に Google アカウントとの連携状態が表示される。
- browser error が発生しない。

<a id="account-03"></a>

### ACCOUNT-03 sign-out 後に新しい匿名アカウントへ切り替えられる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- Google アカウントに連携したユーザーに Deck と Card が存在する。
- 対象ユーザーに進行中の学習 session が存在する。

When:

- Account 画面から sign-out し、匿名認証の完了を待つ。

Then:

- Account 画面に匿名アカウントが表示される。
- sign-out 前とは異なる UID が表示される。
- sign-out 前のアカウントに属する Deck と Card が表示されない。
- sign-out 前のアカウントで開始した学習 session を利用できない。
- browser error が発生しない。
