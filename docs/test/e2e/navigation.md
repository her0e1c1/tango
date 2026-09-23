# Navigation E2E テスト仕様書

## 目的

存在しない画面や予期しない障害から復帰でき、画面ごとの keyboard shortcut で主要画面へ遷移できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |
| NAVIGATION-03 | write | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |
| NAVIGATION-04 | read | [処理中の予期しないエラーから復旧できる](#navigation-04) |
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

- 各 shortcut に設定された画面へ1回だけ遷移する。
- Deck と Card の内容は変更されない。
- browser error が発生しない。

<a id="navigation-03"></a>

### NAVIGATION-03 共通エラー画面が現在の言語で表示され Reload で復旧する

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが日本語の Settings 画面を開いている。
- 配色の変更時に一時的な障害が発生する。
- ブラウザーに設定、Tango の PWA キャッシュ、Tango 以外の保存データがある。

When:

- Dark mode を変更して共通エラー画面を表示し、再読み込みを選択する。
- 再び同じ障害が発生した後、キャッシュを削除して再読み込みする。

Then:

- 日本語の見出し・説明・再読み込みボタンが表示され、ページの言語も日本語になる。
- 保存した言語をまだ利用できない場合は、英語のエラー画面を表示する。
- 通常の再読み込み後は保存データを削除せず、日本語の Settings へ復旧する。
- キャッシュ削除では、このブラウザーに残る Tango の古いアプリを再利用せず、現在の URL を再読み込みする。
- 認証状態、端末内の Deck・Card・学習データと未同期の変更、設定、他アプリの保存データは保持する。
- キャッシュ削除に失敗した場合はエラーを通知し、自動再読み込みせず復旧画面から再試行できる。

<a id="navigation-04"></a>

### NAVIGATION-04 処理中の予期しないエラーから復旧できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings を利用している。
- 画面の利用中または操作後の待ち時間に、予期しないエラーが発生する。エラーの詳細がある場合とない場合がある。

When:

- それぞれのエラーが発生した後、共通の復旧画面で Reload を選択する。

Then:

- エラーの詳細の有無にかかわらず共通の復旧画面が表示され、Reload で Settings に戻る。
- 同じ障害が重ねて通知されても復旧画面や操作が重複せず、データ削除・ログアウト・自動遷移を行わない。
- 個別の画像などの読み込み失敗や、画面内で案内済みの操作失敗だけでは、画面全体を復旧画面に置き換えない。
- 画面を開き直した後も、一つの障害に対して復旧操作を一度だけ実行できる。
- ブラウザーの元のエラー診断は保持する。想定した障害以外の browser error は発生しない。

<a id="navigation-05"></a>

### NAVIGATION-05 不正な PWA キャッシュによる起動失敗から復旧できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧を表示でき、設定が保存されている。
- ブラウザーの PWA キャッシュにある Tango のアプリが不正になり、起動途中でエラーになる。復旧画面は表示できる。
- サーバーから取得できるアプリは正常であり、クラウドの Deck と Card は変更されていない。

When:

- アプリを再読み込みして起動エラーを表示する。
- 通常の Reload を試してから、Clear cache and reload を選択する。

Then:

- 保存済みの不正なアプリを開くと、起動時に共通の復旧画面が表示される。
- 通常の Reload だけでは不正なキャッシュが残り、同じ起動エラーになる。
- キャッシュクリア後は正常なアプリを読み込み、元の URL で Deck 一覧を表示する。
- 復旧画面は消え、再読み込みしても不正なアプリによる起動エラーが再発しない。
- 保存済みの設定と認証 UID を保持し、クラウドの Deck と Card の内容を変更しない。
- 不正なキャッシュによる診断以外の browser error は発生せず、復旧後は通常の操作を利用できる。
