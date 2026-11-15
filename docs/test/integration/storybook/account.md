# アカウント画面 Storybook 結合テスト仕様書

## 目的

アカウント画面を入口とした `play` で、認証状態の表示、認証操作の結果、待機・失敗・画面再入場時の振る舞いを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | 正常系 | [匿名アカウントからログインする](#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | 正常系 | [ログアウトする](#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | interaction | 正常系 | [ログイン待機中の操作を無効にする](#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | interaction | 正常系 | [ログアウト待機中の操作を無効にする](#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | 正常系 | [アカウント画面を日本語で表示する](#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | 正常系 | [認証状態と UID を表示する](#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | 正常系 | [先行操作の完了で別操作の待機を解除しない](#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | 正常系 | [言語変更でプロフィール値を変えない](#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | 正常系 | [ショートカットでホームへ戻る](#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | 異常系 | [認証失敗後に再試行する](#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | 異常系 | [表示済みの通知を画面離脱だけで消さない](#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | 異常系 | [画面離脱後に届く失敗も通知する](#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | 正常系 | [日本語で認証成功を通知する](#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | 正常系 / 異常系 | [画面へ戻っても認証待機を保つ](#storybook-account-14) |
| STORYBOOK-ACCOUNT-15 | interaction | 異常系 | [Card 保存結果とログアウト失敗を両方確認する](#storybook-account-15) |
| STORYBOOK-ACCOUNT-16 | render | 正常系 | [ログイン前に匿名データの引き継ぎ条件を確認する](#storybook-account-16) |
| STORYBOOK-ACCOUNT-17 | interaction | 正常系 | [認証状態の変更を受けて UID と連携状態を表示する](#storybook-account-17) |
| STORYBOOK-ACCOUNT-18 | interaction | 正常系 | [認証待機中に変更した言語で完了を通知する](#storybook-account-18) |
| STORYBOOK-ACCOUNT-19 | interaction | 正常系 | [ログインをキャンセルしても匿名のデータを表示する](#storybook-account-19) |
| STORYBOOK-ACCOUNT-20 | interaction | 異常系 | [ログイン再試行中もエラー通知の元の期限を保つ](#storybook-account-20) |
| STORYBOOK-ACCOUNT-21 | interaction | 異常系 | [同期が必要なログアウト拒否を案内する](#storybook-account-21) |
| STORYBOOK-ACCOUNT-22 | interaction | 正常系 | [通知の言語変更でフォーカスと期限を保つ](#storybook-account-22) |
| STORYBOOK-ACCOUNT-23 | interaction | 異常系 | [Account を開く認証初期化失敗を現在の言語で案内する](#storybook-account-23) |
| STORYBOOK-ACCOUNT-24 | interaction | 正常系 | [Account の切り替え中に以前のデータを新しい本人へ表示しない](#storybook-account-24) |
| STORYBOOK-ACCOUNT-25 | interaction | 異常系 | [アカウント切り替え中断後に現在の本人だけを利用する](#storybook-account-25) |
| STORYBOOK-ACCOUNT-26 | interaction | 異常系 | [ログイン失敗後も匿名のデータを表示する](#storybook-account-26) |

<a id="storybook-account-01"></a>

### STORYBOOK-ACCOUNT-01 匿名アカウントからログインする

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントのアカウント画面を表示し、認証先はログイン成功を返す。

When:

- Google でのログインを選ぶ。

Then:

- ログインの成功通知が表示される。認証状態の変更が届くとログイン済みの表示へ変わる。

<a id="storybook-account-02"></a>

### STORYBOOK-ACCOUNT-02 ログアウトする

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン済みのアカウント画面を表示し、認証先はログアウト成功を返す。

When:

- ログアウトを選ぶ。

Then:

- ログアウトの成功通知が表示される。匿名状態の通知が届くとログインの操作を利用できる。

<a id="storybook-account-03"></a>

### STORYBOOK-ACCOUNT-03 ログイン待機中の操作を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントのアカウント画面で、認証先の応答を保留している。

When:

- ログインを選ぶ。

Then:

- 待機中の表示になり、同じログイン操作を再び実行できない。

<a id="storybook-account-04"></a>

### STORYBOOK-ACCOUNT-04 ログアウト待機中の操作を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン済みのアカウント画面で、認証先の応答を保留している。

When:

- ログアウトを選ぶ。

Then:

- 待機中の表示になり、同じログアウト操作を再び実行できない。

<a id="storybook-account-05"></a>

### STORYBOOK-ACCOUNT-05 アカウント画面を日本語で表示する

カテゴリ: `render`

区分: 正常系

Given:

- 日本語の表示設定でアカウントの状態を読み込んでいる。

When:

- アカウント画面を開く。

Then:

- 見出しと操作名が日本語になり、ユーザーの表示名は翻訳されない。

<a id="storybook-account-06"></a>

### STORYBOOK-ACCOUNT-06 認証状態と UID を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 匿名の anonymous-user と、表示名 Test User のログイン済み linked-user を独立した認証状態とする。

When:

- アカウント画面を開く。

Then:

- 匿名では Anonymous account、Not available、anonymous-user とログイン操作が表示される。ログイン済みでは Signed in with Google、Test User、linked-user とログアウト操作が表示される。

<a id="storybook-account-07"></a>

### STORYBOOK-ACCOUNT-07 先行操作の完了で別操作の待機を解除しない

カテゴリ: `interaction`

区分: 正常系

Given:

- アカウント画面でログインの応答を待っている間に認証状態が変わり、ログアウトも開始している。

When:

- ログイン、ログアウトの順に応答を完了し、新しい匿名状態を通知する。

Then:

- ログインの完了だけではログアウト操作は有効にならず、ログアウト完了後に新しい匿名 UID と有効なログイン操作が表示される。

<a id="storybook-account-08"></a>

### STORYBOOK-ACCOUNT-08 言語変更でプロフィール値を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語のアカウント画面に表示名 Test User、UID linked-user のログイン済み状態が表示されている。

When:

- 日本語へ変更する。

Then:

- 固定文言とログアウト操作は日本語へ変わり、Test User と linked-user はそのままである。

<a id="storybook-account-09"></a>

### STORYBOOK-ACCOUNT-09 ショートカットでホームへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- アカウント画面を表示している。

When:

- t キーを押す。

Then:

- Deck 一覧画面に遷移し、Decks の見出しが表示される。

<a id="storybook-account-10"></a>

### STORYBOOK-ACCOUNT-10 認証失敗後に再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面で認証先は失敗、成功の順に返す。ログインとログアウトを独立した操作例とする。

When:

- 認証操作を選び、失敗後に同じ操作を再試行する。

Then:

- 失敗時に操作に対応したエラーが表示され、再試行成功後はエラーが消えて成功通知が表示される。Account に留まるログアウト失敗は画面内に表示し、ログイン失敗の通知経路は変えない。

<a id="storybook-account-11"></a>

### STORYBOOK-ACCOUNT-11 表示済みの通知を画面離脱だけで消さない

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面のログインに失敗し、エラー通知が表示されている。

When:

- t キーでホームへ戻る。

Then:

- Deck 一覧画面が表示され、表示済みの認証失敗通知が画面離脱だけでは消えない。

<a id="storybook-account-12"></a>

### STORYBOOK-ACCOUNT-12 画面離脱後に届く失敗も通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- アカウント画面で認証操作の応答を待っている。ログインとログアウトを独立した操作例とする。

When:

- ホームへ移動した後、認証先から失敗が返る。

Then:

- ホームに留まったまま、元の操作に対応する認証失敗が通知される。

<a id="storybook-account-13"></a>

### STORYBOOK-ACCOUNT-13 日本語で認証成功を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 日本語のアカウント画面を表示し、認証先はログイン成功を返す。

When:

- Google でのログインを選ぶ。

Then:

- 日本語の通知領域に「ログインしました。」が表示される。

<a id="storybook-account-14"></a>

### STORYBOOK-ACCOUNT-14 画面へ戻っても認証待機を保つ

カテゴリ: `interaction`

区分: 正常系 / 異常系

Given:

- アカウント画面で認証操作の応答を保留している。ログイン・ログアウトと成功・失敗の組合せを独立した入力例とする。

When:

- ホームへ移動し、アカウント画面へ戻ってから応答を完了させる。

Then:

- 戻った直後も対象操作は無効で、完了後は結果の通知と有効な操作が表示される。その後の再実行も完了できる。

<a id="storybook-account-15"></a>

### STORYBOOK-ACCOUNT-15 Card 保存結果とログアウト失敗を両方確認する

カテゴリ: `interaction`

区分: 異常系

Given:

- Account 画面を表示し、同じアカウントの Card 保存が完了を待っている。
- Card 保存の成功・失敗、Account に留まる場合・ホームへ離れる場合を独立した入力例とする。

When:

- ログアウトを試み、Card 保存結果を受け取った後、ログアウトが拒否されて同じアカウントへ戻る。

Then:

- Card の成功または失敗結果とログアウト失敗を両方確認できる。どちらかの結果が他方を上書きしない。
- Account に留まる場合はログアウト失敗を画面内に表示する。ホームへ離れた場合はログアウト失敗も通知し、現在の画面を維持する。
- Card と離脱後の認証結果の通知は独立して閉じられ、通常の共通表示期限を保持する。
- 画面内の失敗は元の Account 訪問と本人に限り表示する。実際の画面移動や本人の変更後に再表示せず、一時的な認証確認から同じ本人へ戻る場合は維持する。
- 各通知の閉じる操作には対象文言が説明として関連付けられる。通知の追加・置換・削除時に、変更していない文言の再通知を要求しない構造を持つ。

<a id="storybook-account-16"></a>

### STORYBOOK-ACCOUNT-16 [TODO] ログイン前に匿名データの引き継ぎ条件を確認する

カテゴリ: `render`

区分: 正常系

Given:

- 匿名アカウントの Deck と Card があり、ログインを開始していない。

When:

- Account 画面を開く。

Then:

- 新規連携では匿名データを引き継ぎ、既存の別アカウントへのログインでは引き継がない旨を説明する。

<a id="storybook-account-17"></a>

### STORYBOOK-ACCOUNT-17 [TODO] 認証状態の変更を受けて UID と連携状態を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- Account 画面を表示し、認証処理の成功と認証状態の通知を外部応答として用意する。匿名から同じ UID の Google 連携済み状態への変化、連携済みから異なる UID の匿名状態への変化を独立した状態例とする。

When:

- ログインまたはログアウトを選び、成功応答と新しい認証状態の通知を受け取る。

Then:

- 成功を通知し、連携時は同じ UID と Google 連携済みの表示、ログアウト時は異なる UID と匿名状態の表示になる。該当する次の認証操作を利用できる。

<a id="storybook-account-18"></a>

### STORYBOOK-ACCOUNT-18 [TODO] 認証待機中に変更した言語で完了を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 英語の Account 画面で認証処理の応答を待っている。

When:

- Settings に移動して日本語を選択してから認証成功の応答を受け取る。

Then:

- 現在の画面を維持し、日本語の成功通知を表示・読み上げする。

<a id="storybook-account-19"></a>

### STORYBOOK-ACCOUNT-19 [TODO] ログインをキャンセルしても匿名のデータを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名アカウントで Deck と Card を利用できる。認証先はキャンセルを返し、同じ匿名認証状態を保持する。

When:

- Account からログインを開始し、キャンセルの応答後にホームから元の Deck と Card を開く。

Then:

- 匿名状態を保って元の Deck と Card の表示・操作を利用でき、別アカウントへ遷移しない。認証操作の待機が解除される。

<a id="storybook-account-20"></a>

### STORYBOOK-ACCOUNT-20 [TODO] ログイン再試行中もエラー通知の元の期限を保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- Account 画面にログイン失敗の通知があり、表示開始から4秒未満である。再試行の成功応答を保留している。

When:

- ログインを再試行する。4秒になる前に成功する場合と、応答待機中に4秒が過ぎる場合を独立した時間例とする。

Then:

- 再試行開始だけでは通知を消さず、成功時には成功通知へ置き換える。応答前に元の表示開始から4秒が過ぎる場合はエラー通知だけを自動で消す。

<a id="storybook-account-21"></a>

### STORYBOOK-ACCOUNT-21 [TODO] 同期が必要なログアウト拒否を案内する

カテゴリ: `interaction`

区分: 異常系

Given:

- 連携済みアカウントの Account 画面を表示している。認証先は未同期の変更によりログアウトを拒否し、同じ認証状態を保持する。

When:

- ログアウトを選ぶ。

Then:

- ログアウトせず、同期後の再操作を案内する。待機を解除して操作可能になり、同じアカウントの表示を保持する。

<a id="storybook-account-22"></a>

### STORYBOOK-ACCOUNT-22 [TODO] 通知の言語変更でフォーカスと期限を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Account から開始した認証が成功し、Settings 画面に日本語の成功通知が表示されている。表示開始から4秒未満で、閉じるボタンにフォーカスがある。

When:

- Language を English に変更する。

Then:

- 本文・成功表示・閉じるボタンの読み上げ名・通知の読み上げが英語へ変わる。閉じるボタンのフォーカスと最初の表示から4秒の期限を維持し、通知を重複させない。

<a id="storybook-account-23"></a>

### STORYBOOK-ACCOUNT-23 [TODO] Account を開く認証初期化失敗を現在の言語で案内する

カテゴリ: `interaction`

区分: 異常系

Given:

- Account の URL を入口に実際の認証 gate と Account 画面を結合する契約で、初回匿名認証が失敗した状態である。この結合による画面検証は未実装である。英語・日本語を独立した言語例とする。

When:

- 認証失敗を表示し、Reload を選択する。再読み込みの境界は外部処理として応答を用意する。

Then:

- 現在の言語の見出し・説明・Reload の読み上げ名と元の失敗理由を表示し、認証・保存データの初期化で失敗し得る旨を案内する。
- 再読み込みを要求でき、画面や操作を重複表示しない。実際のブラウザー再起動・認証成功はこの境界の結果としない。

<a id="storybook-account-24"></a>

### STORYBOOK-ACCOUNT-24 [TODO] Account の切り替え中に以前のデータを新しい本人へ表示しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Account を入口に実際の認証 gate とアプリのルートを結合する契約で、以前の本人の Deck・Card・途中の学習を読み込んでいる。この結合による画面検証は未実装である。
- 別アカウントへのログインと、異なる UID の匿名状態へのログアウトを独立した状態例とする。外部認証とデータ取得は待機・成功を返す。

When:

- Account の認証操作を開始し、認証確認中、次の本人のデータ取得中、新しい認証状態とデータの受領後の順に表示を進める。

Then:

- 確認と初期データの受領が完了するまでは起動中の案内を表示し、以前の Deck・Card・学習を次の本人のものとして操作できない。
- 完了後は現在の本人のデータだけを表示し、直接開いた以前の Deck・Card・学習の URL からも利用できない。

<a id="storybook-account-25"></a>

### STORYBOOK-ACCOUNT-25 [TODO] アカウント切り替え中断後に現在の本人だけを利用する

カテゴリ: `interaction`

区分: 異常系

Given:

- Account を入口に認証 gate とアプリのルートを結合する契約で、同じ本人の Deck・Card を読み込んでいる。この結合による画面検証は未実装である。
- 外部の認証切り替え準備は失敗する。元の本人へ戻る場合、待機中に別の本人へ変わる場合、認証管理を終了する場合を独立した状態例とする。

When:

- Account でログアウトを開始し、切り替え準備の失敗を受け取る。

Then:

- 元の本人が現在も利用中の場合は確認中表示に取り残されず、元の Deck・Card の閲覧・変更操作へ戻れる。
- 別の本人へ変わった後や認証管理の終了後は、遅い失敗で以前の本人とデータを復活させない。

<a id="storybook-account-26"></a>

### STORYBOOK-ACCOUNT-26 [TODO] ログイン失敗後も匿名のデータを表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 匿名アカウントの Deck と Card を利用できる。認証先は失敗を返し、同じ匿名認証状態を保持する。

When:

- Account からログインを開始し、失敗の応答後にホームから元の Deck と Card を開く。

Then:

- 元の匿名状態と Deck・Card の表示・操作を保持し、別アカウントへ遷移しない。認証操作の待機を解除し、失敗を案内して再試行できる。
