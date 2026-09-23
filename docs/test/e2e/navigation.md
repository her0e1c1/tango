# Navigation E2E テスト仕様書

## 目的

存在しない route から復帰でき、画面ごとの keyboard shortcut で主要 route へ遷移できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |
| NAVIGATION-03 | write | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |
| NAVIGATION-04 | read | [初期化リクエストを読み取れなくても通常起動できる](#navigation-04) |
| NAVIGATION-05 | read | [未処理の実行時例外と Promise rejection から復旧できる](#navigation-05) |
| NAVIGATION-06 | read | [通常アプリの起動失敗から復旧できる](#navigation-06) |
| NAVIGATION-07 | write | [初期化失敗時は通常起動せず復旧画面を表示する](#navigation-07) |

<a id="navigation-01"></a>

### NAVIGATION-01 存在しない route から Deck 一覧へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーがアプリケーションにアクセスできる。
- Sample Deck の自動生成が無効である。

When:

- 存在しない route を直接開き、`Go home` を選択する。

Then:

- Deck 一覧へ遷移する。
- not-found 表示が残らない。
- browser error が発生しない。

<a id="navigation-02"></a>

### NAVIGATION-02 画面の keyboard shortcut で主要 route へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧と Card 一覧を利用できる。

When:

- Deck 一覧で `s` を入力して Settings を開き、Deck 一覧へ戻って `i` を入力して Import を開く。
- Card 一覧で `t` を入力して Deck 一覧を開き、Card 一覧へ戻って `s` を入力して Settings を開く。

Then:

- 各 shortcut に設定された route へ1回だけ遷移する。
- Deck と Card の永続データは変更されない。
- browser error が発生しない。

<a id="navigation-03"></a>

### NAVIGATION-03 共通エラー画面が現在の言語で表示され Reload で復旧する

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが日本語の Settings 画面を開いている。
- 配色反映で一度だけ例外を発生させられる。
- ブラウザーに設定、Tango の PWA キャッシュ、Tango 以外の保存データがある。

When:

- Dark mode を変更して共通エラー画面を表示し、再読み込みを選択する。
- 再び同じ障害を発生させ、キャッシュ初期化の確認を一度キャンセルしてから承認する。

Then:

- Provider 外側のエラー境界が障害を捕捉し、日本語の見出し・説明・再読み込みボタンと html[lang] を表示する。
- 初期 locale 同期前は安全な英語の既定値を使用する。
- 通常の再読み込み後は保存データを削除せず、日本語の Settings へ復旧する。
- 初期化の確認には、匿名データ・未同期の変更・設定の消失、ログアウト、再起動に通信が必要なことを明記する。キャンセル時はデータを変更しない。
- 承認した場合だけ、次の起動で認証・購読を開始する前に Firestore のキャッシュと未同期書き込みを削除し、ログアウトして設定を既定値に戻す。
- Tango の Service Worker 登録とその scope の Workbox キャッシュを削除し、トップ画面から新しい匿名状態で起動する。同期済みのクラウドデータと他アプリの保存データは削除しない。
- 初期化に失敗した場合は再読み込みを繰り返さず、再試行可能なエラー画面を表示する。復旧用 React root の成立後、通常アプリの遅延読み込み・初期化で失敗しても同じ復旧画面を表示する。

<a id="navigation-04"></a>

### NAVIGATION-04 初期化リクエストを読み取れなくても通常起動できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが日本語の Settings 画面を利用している。
- sessionStorage の初期化リクエストの読み取りで SecurityError が発生する。

When:

- Settings を再読み込みする。

Then:

- 起動失敗画面に留まらず、日本語の Settings を表示する。
- 保存済みの設定と認証状態を維持し、データの初期化や自動再読み込みを行わない。
- browser error が発生しない。

<a id="navigation-05"></a>

### NAVIGATION-05 未処理の実行時例外と Promise rejection から復旧できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings を利用している。
- タイマーの実行時例外と、Error 以外や null / undefined を含む未処理の Promise rejection を発生させられる。

When:

- タイマーからの Error と、Error・文字列・null・undefined の各 Promise rejection を順に発生させ、その都度共通画面の Reload を選択する。

Then:

- Window に通知された未処理エラーで共通の復旧画面を表示し、Reload で Settings に戻る。
- 重複通知でも復旧操作を繰り返さず、データ削除・ログアウト・自動遷移を行わない。
- 通常の resource load error と catch 済みの失敗では全画面エラーに移行しない。
- StrictMode と再マウント後も監視を重複させず、unmount 時に監視を解除する。
- ブラウザーの元のエラー診断は保持する。テストで発生させた診断だけを許容する。

<a id="navigation-06"></a>

### NAVIGATION-06 通常アプリの起動失敗から復旧できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 復旧用 React root を読み込めるが、通常アプリの遅延モジュールの読み込みまたは初期化に失敗する。
- ブラウザーには保存済みの設定がある。

When:

- アプリを開く。

Then:

- 共通の React 復旧画面から Reload と確認付き初期化を選択できる。
- locale 同期前は英語を使用し、html[lang] と一致する。
- 保存データを自動削除せず、通常アプリを描画しない。
- entry JavaScript、React、復旧画面自体や root DOM が利用できない失敗は保証の対象外とする。

<a id="navigation-07"></a>

### NAVIGATION-07 初期化失敗時は通常起動せず復旧画面を表示する

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 利用者が確認ダイアログで初期化を承認している。
- 次の document で初期化要求の消費またはキャッシュ削除に失敗する。

When:

- 初期化要求のあるアプリを開く。

Then:

- React の準備中表示から共通の復旧画面に切り替わり、自動再試行しない。
- 初期化中・初期化失敗時には通常の Auth、Firestore 購読、キャッシュ送信、Service Worker 再登録を開始しない。
- 成功時も現在の document では通常アプリを読み込まず、トップへの遷移で終了する。
- StrictMode でも要求消費や削除処理を重複実行しない。
