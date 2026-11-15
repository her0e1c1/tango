# Account E2E テスト仕様書

## 目的

認証失敗からの復旧と、アカウント切り替え時のデータ・学習位置の引き継ぎと分離を確認する。

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
| ACCOUNT-16 | batch | 正常系 | [アカウント切り替え中もデータを混在させない](#account-16) |
| ACCOUNT-19 | batch | 正常系 | [通知の言語を変えてもフォーカスと表示期限を保つ](#account-19) |
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

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: ログイン前の匿名データ引き継ぎ条件の説明（[PLAYWRIGHT-ACCOUNT-16](../integration/playwright/account.md#playwright-account-16)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- このブラウザーで作成した匿名ユーザーの Deck と Card があり、Google sign-in は未開始である。

When:

- Account 画面を開く。

Then:

- 新規連携では匿名データを引き継ぎ、既存の別アカウントへのログインでは引き継がないと説明する。

<a id="account-01"></a>

### ACCOUNT-01 匿名アカウントと同じ UID で Google 連携の完了を確認できる

カテゴリ: `batch`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 成功応答と認証状態の通知による同一 UID・Google 連携表示（[PLAYWRIGHT-ACCOUNT-17](../integration/playwright/account.md#playwright-account-17)）。置換実装後の E2E 目的: 実 Auth emulator の新規 Google 連携で匿名 UID が変わらない契約。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 認証完了後の新しい匿名 UID と操作表示（[PLAYWRIGHT-ACCOUNT-17](../integration/playwright/account.md#playwright-account-17)）。置換実装後の E2E 目的: 実ログアウト後の別匿名 UID の確立と同期済み状態からの切り替え。

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携済みで、Account 画面で UID を確認できる。変更は同期済みである。

When:

- Account 画面から sign-out する。

Then:

- sign-out 成功が通知される。
- Account 画面に匿名アカウントと、sign-out 前とは異なる UID が表示される。

<a id="account-05"></a>

### ACCOUNT-05 処理完了時の言語で結果が通知される

カテゴリ: `batch`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 認証待機中に変更した現在の言語で完了を表示・読み上げ（[PLAYWRIGHT-ACCOUNT-18](../integration/playwright/account.md#playwright-account-18)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントで英語の Account 画面から Google sign-in を開始し、認証 popup での操作を待っている。

When:

- 認証の完了前に Settings 画面へ移動し、Language を `日本語` に変更してから Google sign-in を完了する。

Then:

- 成功通知を日本語で表示・読み上げする。

<a id="account-06"></a>

### ACCOUNT-06 Google 連携後も Deck と Card を利用・同期できる

カテゴリ: `batch`

区分: 正常系

関連仕様: E2E維持。E2E の目的: 匿名 Deck・Card の連携後の再読み込みと実同期。

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

関連仕様: E2E維持。E2E の目的: 匿名学習位置を連携後の reload と同期先で復元。

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

関連仕様: E2E維持。E2E の目的: 匿名学習結果が連携後の本人の記録として同期される契約。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 認証 gate が新しい本人のデータの受領前に以前の内容を表示しない（[PLAYWRIGHT-ACCOUNT-24](../integration/playwright/account.md#playwright-account-24)）。置換実装後の E2E 目的: 実認証と本人別購読によるデータの切り替え・匿名データを引き継がない契約。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: キャンセル応答後も同じ匿名状態と既存 Deck・Card の画面操作を維持（[PLAYWRIGHT-ACCOUNT-19](../integration/playwright/account.md#playwright-account-19)）。置換実装後の E2E 目的: 実 Auth popup のキャンセル後も匿名認証と保存データを維持。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 別 UID への切り替え中と完了後に以前のデータを表示・操作させない（[PLAYWRIGHT-ACCOUNT-24](../integration/playwright/account.md#playwright-account-24)）。置換実装後の E2E 目的: 実ログアウトで本人別の購読・cacheを切り替え、reload後も元の学習を再開できない契約。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 認証確認中・初期データ受領前の表示を gate する（[PLAYWRIGHT-ACCOUNT-24](../integration/playwright/account.md#playwright-account-24)）。置換実装後の E2E 目的: 実認証切り替えと購読の停止・再開を通じた本人別データの分離。

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携済みで Deck と Card があり、変更は同期済みである。

When:

- Account 画面から sign-out を開始する。

Then:

- 切り替え中も、元のデータを新しいアカウントのデータとして表示しない。

<a id="account-19"></a>

### ACCOUNT-19 通知の言語を変えてもフォーカスと表示期限を保つ

カテゴリ: `batch`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 通知の翻訳・読み上げ更新でフォーカスと元の4秒期限を保つ（[PLAYWRIGHT-ACCOUNT-22](../integration/playwright/account.md#playwright-account-22)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google sign-in が完了し、Settings 画面に日本語の成功通知が表示されている。
- 通知の表示開始から4秒未満で、閉じるボタンにフォーカスがある。

When:

- 通知の表示中に Language を `English` に変更する。

Then:

- 通知の本文・成功表示・閉じるボタンの読み上げ名・通知の読み上げを英語に更新する。
- 閉じるボタンのフォーカスと元の表示期限を維持し、最初の表示から4秒後に消える。通知は重複しない。

<a id="account-04"></a>

### ACCOUNT-04 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

区分: 異常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 認証初期化失敗の案内と Reload 操作を重複表示しない（[PLAYWRIGHT-APPLICATION-09](../integration/playwright/application.md#playwright-application-09)）。置換実装後の E2E 目的: 実ブラウザー reload 後に認証を再初期化し Deck 一覧へ復旧。

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証の開始に失敗した画面に `Reload` が表示されている。
- 次の認証は成功でき、Sample Deck の自動生成は無効である。

When:

- `Reload` を選択する。

Then:

- 再試行の完了後に Deck 一覧を利用でき、認証画面や通知が重複しない。

<a id="account-18"></a>

### ACCOUNT-18 [TODO] 初回の認証初期化失敗を現在の言語で確認できる

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 初回匿名認証失敗の理由と復旧案内を現在の言語で表示（[PLAYWRIGHT-APPLICATION-09](../integration/playwright/application.md#playwright-application-09)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- アプリを初めて利用し、匿名認証を開始する。
- 表示言語は English または日本語である。

When:

- 認証の開始に失敗する。

Then:

- 再読み込みできるエラー画面に元の失敗理由と、認証・保存データの初期化に失敗し得る旨を表示する。
- 見出し・説明・`Reload` の読み上げ名は現在の言語に従う。

<a id="account-02"></a>

### ACCOUNT-02 Google sign-in のエラー表示から再試行できる

カテゴリ: `write`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: ログイン失敗後の再試行でエラーを成功通知へ置き換え、連携表示へ切り替える（[PLAYWRIGHT-ACCOUNT-10](../integration/playwright/account.md#playwright-account-10)、[PLAYWRIGHT-ACCOUNT-17](../integration/playwright/account.md#playwright-account-17)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 認証失敗後も同じ匿名状態と既存 Deck・Card の画面操作を維持（[PLAYWRIGHT-ACCOUNT-26](../integration/playwright/account.md#playwright-account-26)）。置換実装後の E2E 目的: 実 Auth 認証失敗後の匿名認証と保存データの維持。

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで作成した Deck と Card を利用できる。
- Account 画面から Google sign-in を開始している。

When:

- Google sign-in が失敗する。

Then:

- 匿名データを失わず、引き続き利用できる。

<a id="account-13"></a>

### ACCOUNT-13 [TODO] sign-in のエラー通知が期限または成功まで維持される

カテゴリ: `write`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 再試行開始時もエラー通知を保持し、成功または元の期限で切り替える（[PLAYWRIGHT-ACCOUNT-20](../integration/playwright/account.md#playwright-account-20)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名アカウントの Account 画面に Google sign-in のエラー通知が表示されている。再試行は成功できる。

When:

- エラー通知の表示中に Google sign-in を再試行する。

Then:

- エラー通知は再試行の開始だけでは消えない。
- 成功時は成功通知に置き換わる。成功前に表示開始から4秒が経過した場合は、エラー通知が自動で消える。

<a id="account-15"></a>

### ACCOUNT-15 [TODO] 未同期の変更があると sign-out を中止して同期を案内する

カテゴリ: `batch`

区分: 異常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 未同期を理由とするログアウト拒否の案内と操作復旧（[PLAYWRIGHT-ACCOUNT-21](../integration/playwright/account.md#playwright-account-21)）。置換実装後の E2E 目的: 実 Firestore cache の pending writes を検出し、未同期時の認証切り替えを拒否。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 切り替え中断後の本人復帰と古い失敗による別本人への巻き戻し防止（[PLAYWRIGHT-ACCOUNT-25](../integration/playwright/account.md#playwright-account-25)）。置換実装後の E2E 目的: 実認証準備・ネットワーク停止失敗後も元の購読・書き込み・同期を継続できる契約。

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントに連携したユーザーに閲覧・変更・同期できるデータがある。
- 対象ユーザーの変更は同期済みで、sign-out によるアカウント切り替えを開始している。

When:

- アカウントの切り替えが完了前に中断される。切り替え準備のネットワーク停止に失敗する場合も含む。

Then:

- 元のアカウントでデータの閲覧・変更・同期を続けられる。認証確認の表示に取り残されない。
- 待機中に本人が変わった場合や認証の管理処理が終了した場合は、遅れて届く失敗で元の本人を復活させない。
