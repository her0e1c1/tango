# Account E2E テスト仕様書

## 目的

匿名アカウントと Google アカウントの切り替えが、認証情報、ユーザーデータ、cache、学習 session の境界を保つことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](#account-01) |
| ACCOUNT-02 | write | [Google sign-in 失敗後に再試行できる](#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |

<a id="account-01"></a>

### ACCOUNT-01 匿名アカウントを Google アカウントに連携してデータを維持できる

カテゴリ: `batch`

Given:

- 匿名アカウントに Deck と Card が存在する。
- 対象 Deck に進行中の学習 session が存在する。
- 連携する Google アカウントは別の Firebase Auth ユーザーに紐づいていない。

When:

- Account 画面から Google アカウントへ sign-in する。

Then:

- Account 画面に Google アカウントとの連携状態が表示される。
- 匿名アカウントと同じ UID が維持される。
- 連携前の Deck、Card、学習 session を引き続き利用できる。
- browser error が発生しない。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in 失敗後に再試行できる

カテゴリ: `write`

Given:

- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗が画面内で処理され、`Retry` が表示されている。
- 再試行では Google sign-in に成功できる。

When:

- `Retry` を選択して Google sign-in を再試行する。

Then:

- 再試行後にエラー表示が残らない。
- Account 画面に Google アカウントとの連携状態が表示される。
- 未処理の browser error が発生しない。

<a id="account-03"></a>

### ACCOUNT-03 sign-out 後に新しい匿名アカウントへ切り替えられる

カテゴリ: `batch`

Given:

- Google アカウントに連携したユーザーの remote Deck と Card が query cache に存在する。
- 対象ユーザーに進行中の学習 session が存在する。

When:

- Account 画面から sign-out し、匿名認証の完了を待つ。

Then:

- Account 画面に新しい匿名アカウントと連携前とは異なる UID が表示される。
- 前の UID に属する remote Deck と Card が query cache や画面に残らない。
- 前の UID で開始した学習 session を利用できない。
- browser error が発生しない。
