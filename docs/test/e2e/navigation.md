# Navigation E2E テスト仕様書

## 目的

存在しない route から復帰でき、画面ごとの keyboard shortcut で主要 route へ遷移できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |
| NAVIGATION-03 | write | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |
| NAVIGATION-04 | read | [未処理の実行時例外と Promise rejection から復旧できる](#navigation-04) |
| NAVIGATION-05 | write | [不正な PWA キャッシュによる起動失敗から復旧できる](#navigation-05) |

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
- 再び同じ障害を発生させ、キャッシュを削除して再読み込みする。

Then:

- Provider 外側のエラー境界が障害を捕捉し、日本語の見出し・説明・再読み込みボタンと html[lang] を表示する。
- 初期 locale 同期前は安全な英語の既定値を使用する。
- 通常の再読み込み後は保存データを削除せず、日本語の Settings へ復旧する。
- Tango の Service Worker 登録とその scope の Workbox キャッシュだけを削除して、現在の URL を再読み込みする。
- 認証状態、Firestore persistence と未同期書き込み、設定、他アプリの保存データは保持する。
- キャッシュ削除に失敗した場合はエラーを通知し、自動再読み込みせず復旧画面から再試行できる。

<a id="navigation-04"></a>

### NAVIGATION-04 未処理の実行時例外と Promise rejection から復旧できる

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

<a id="navigation-05"></a>

### NAVIGATION-05 不正な PWA キャッシュによる起動失敗から復旧できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧を表示でき、設定が保存されている。
- ブラウザーの PWA キャッシュにあるアプリの JavaScript が不正になり、起動中に復旧画面で捕捉可能な実行時エラーが発生する。
- サーバーから取得できるアプリは正常であり、クラウドの Deck と Card は変更されていない。

When:

- アプリを再読み込みして起動エラーを表示する。
- 通常の Reload を試してから、Clear cache and reload を選択する。

Then:

- 実際の Service Worker が不正なキャッシュを返し、起動時に共通の復旧画面が表示される。
- 通常の Reload だけでは不正なキャッシュが残り、同じ起動エラーになる。
- キャッシュクリア後は正常なアプリを読み込み、元の URL で Deck 一覧を表示する。
- 復旧画面は消え、不正な JavaScript はキャッシュに残らない。
- 保存済みの設定と認証 UID を保持し、クラウドの Deck と Card の内容を変更しない。
- テストで意図的に壊したキャッシュによる診断だけを許容し、復旧後に予期しない browser error が発生しない。
