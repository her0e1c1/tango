# Account E2E テスト仕様書

## 目的

認証の初期化失敗から復旧でき、匿名アカウントと Google アカウントの切り替えで、アカウント状態、UID、ユーザーデータ、学習 session の境界が保たれることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](#account-03) |
| ACCOUNT-04 | read | [認証初期化失敗から Reload で復帰できる](#account-04) |
| ACCOUNT-05 | batch | [画面遷移後に失敗した sign-out を再試行できる](#account-05) |
| ACCOUNT-06 | write | [Account 画面で sign-in の再実行を重複なく完了できる](#account-06) |
| ACCOUNT-07 | batch | [Account 画面で sign-out の再実行を重複なく完了できる](#account-07) |
| ACCOUNT-08 | write | [表示済みの sign-in 失敗を画面遷移後も再試行できる](#account-08) |
| ACCOUNT-09 | batch | [表示済みの sign-out 失敗を画面遷移後も再試行できる](#account-09) |
| ACCOUNT-10 | write | [再試行に失敗した sign-in を新しい Retry で復旧できる](#account-10) |
| ACCOUNT-11 | batch | [再試行に失敗した sign-out を新しい Retry で復旧できる](#account-11) |

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

- sign-in 成功が共通 toast で表示される。
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
- Google sign-in の popup を開いている間は処理が完了していない。
- popup を閉じると Google sign-in が失敗する。
- 再試行では Google sign-in に成功できる。

When:

- Google sign-in を開始し、popup を開いたまま Account 画面から Deck 一覧へ移動する。
- popup を閉じ、画面遷移後に表示された `Retry` を選択して Google sign-in を再試行する。
- Account 画面を再び開く。

Then:

- route replacement 後に失敗 toast と `Retry` が表示される。
- 再試行後にエラー表示が残らない。
- sign-in 成功が共通 toast で表示される。
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

- Account 画面から sign-out し、匿名認証の完了を待つ。

Then:

- sign-out 成功が共通 toast で表示される。
- Account 画面に匿名アカウントが表示される。
- sign-out 前とは異なる UID が表示される。
- sign-out 前のアカウントに属する Deck と Card が表示されない。
- sign-out 前のアカウントで開始した学習 session を利用できない。
- browser error が発生しない。

<a id="account-04"></a>

### ACCOUNT-04 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証初期化失敗が画面内で処理され、認証初期化失敗画面に `Reload` が表示されている。
- 次の認証初期化は成功でき、Sample Deck の自動生成は無効である。

When:

- 認証初期化失敗画面に表示された `Reload` を選択する。

Then:

- 再初期化が完了し、Deck 一覧を利用できる。
- 未処理の browser error が発生しない。

<a id="account-05"></a>

### ACCOUNT-05 画面遷移後に失敗した sign-out を再試行できる

カテゴリ: `batch`

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーで Account 画面を開いている。
- 最初の sign-out は Account 画面から離れた後に失敗し、再試行では成功できる。

When:

- sign-out を開始し、処理中に Account 画面から Deck 一覧へ移動する。
- 画面遷移後に表示された `Retry` を選択して sign-out を再試行する。
- Account 画面を再び開く。

Then:

- route replacement 後に失敗 toast と `Retry` が表示される。
- 再試行後にエラー表示が残らない。
- sign-out 成功が共通 toast で表示される。
- Account 画面に新しい匿名アカウントが表示される。
- browser error が発生しない。

<a id="account-06"></a>

### ACCOUNT-06 Account 画面で sign-in の再実行を重複なく完了できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- 最初の Google sign-in と通常ボタンからの再実行は popup を閉じると失敗する。
- `Retry` からの再実行では Google sign-in に成功できる。

When:

- 最初の失敗 toast が表示された状態で Deck 一覧へ移動し、Account 画面を再び開く。
- 再表示された通常の sign-in ボタンから再実行する。
- 次の失敗 toast に表示された `Retry` から再実行する。
- それぞれの再実行中に Account 画面の sign-in ボタンを確認する。

Then:

- Account 画面を再表示しても、直前の失敗 toast と通常ボタンは同じ認証操作を所有する。
- 再実行を開始するたびに直前の失敗 toast と `Retry` が取り除かれる。
- 再実行中は sign-in ボタンが busy かつ無効になり、認証操作を重複実行できない。
- sign-in 成功が共通 toast で表示される。
- browser error が発生しない。

<a id="account-07"></a>

### ACCOUNT-07 Account 画面で sign-out の再実行を重複なく完了できる

カテゴリ: `batch`

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーで Account 画面を開いている。
- 最初の sign-out と `Retry` からの再実行は失敗し、通常ボタンからの次の再実行は成功できる。

When:

- 最初の失敗 toast が表示された状態で Deck 一覧へ移動し、Account 画面を再び開く。
- 表示中の `Retry` から sign-out を再実行する。
- 再実行中に Account 画面の sign-out ボタンを確認する。
- 再実行の失敗後、通常の sign-out ボタンから再実行する。

Then:

- Account 画面を再表示しても、直前の失敗 toast と通常ボタンは同じ認証操作を所有する。
- 再実行を開始するたびに直前の失敗 toast と `Retry` が取り除かれる。
- 再実行中は sign-out ボタンが busy かつ無効になり、認証操作を重複実行できない。
- sign-out 成功が共通 toast で表示される。
- Account 画面に新しい匿名アカウントが表示される。
- browser error が発生しない。

<a id="account-08"></a>

### ACCOUNT-08 表示済みの sign-in 失敗を画面遷移後も再試行できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- Google sign-in の失敗 toast と `Retry` が表示されている。
- 再試行では Google sign-in に成功できる。

When:

- Account 画面から Deck 一覧へ移動する。
- 表示中の `Retry` を選択して Google sign-in を再試行する。

Then:

- route replacement 後も表示済みの失敗 toast と `Retry` を利用できる。
- sign-in 成功が共通 toast で表示される。
- browser error が発生しない。

<a id="account-09"></a>

### ACCOUNT-09 表示済みの sign-out 失敗を画面遷移後も再試行できる

カテゴリ: `batch`

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーで Account 画面を開いている。
- sign-out の失敗 toast と `Retry` が表示されている。
- 再試行では sign-out に成功できる。

When:

- Account 画面から Deck 一覧へ移動する。
- 表示中の `Retry` を選択して sign-out を再試行する。

Then:

- route replacement 後も表示済みの失敗 toast と `Retry` を利用できる。
- sign-out 成功が共通 toast で表示される。
- browser error が発生しない。

<a id="account-10"></a>

### ACCOUNT-10 再試行に失敗した sign-in を新しい Retry で復旧できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで Account 画面を開いている。
- 最初の Google sign-in と最初の再試行は失敗し、次の再試行は成功できる。

When:

- 最初の失敗 toast に表示された `Retry` から再実行し、popup を閉じる。
- 再実行の失敗後に表示された新しい `Retry` から再実行する。

Then:

- 最初の `Retry` は自身の失敗 toast だけを閉じる。
- 再実行に失敗すると、新しい失敗 toast と `Retry` が表示される。
- 新しい `Retry` から sign-in に成功できる。
- browser error が発生しない。

<a id="account-11"></a>

### ACCOUNT-11 再試行に失敗した sign-out を新しい Retry で復旧できる

カテゴリ: `batch`

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーで Account 画面を開いている。
- 最初の sign-out と最初の再試行は失敗し、次の再試行は成功できる。

When:

- 最初の失敗 toast に表示された `Retry` から再実行する。
- 再実行の失敗後に表示された新しい `Retry` から再実行する。

Then:

- 最初の `Retry` は自身の失敗 toast だけを閉じる。
- 再実行に失敗すると、新しい失敗 toast と `Retry` が表示される。
- 新しい `Retry` から sign-out に成功できる。
- browser error が発生しない。
