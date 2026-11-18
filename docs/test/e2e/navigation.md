# Navigation E2E テスト仕様書

## 目的

予期しない障害や保存領域の初期化失敗から、データ消失の条件を案内し、利用者が選んだ方法でアプリを復旧できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| NAVIGATION-04 | read | 異常系 | [予期しないエラーから保存設定を保って復旧できる](#navigation-04) |
| NAVIGATION-05 | read | 異常系 | [不正な PWA キャッシュによる起動失敗時に手動復旧を案内する](#navigation-05) |
| NAVIGATION-03 | write | 異常系 | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |
| NAVIGATION-22 | batch | 異常系 | [保存データの初期化失敗からローカルデータを削除して再起動する](#navigation-22) |

<a id="navigation-04"></a>

### NAVIGATION-04 予期しないエラーから保存設定を保って復旧できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 保存済みの設定でアプリを利用できる。

When:

- 利用中に予期しないエラーが起きた後、復旧画面で Reload を選択する。

Then:

- データ削除を要求せずに復旧操作を案内し、保存済みの設定を変更しない。
- 再読み込み後に Settings を再び利用できる。

<a id="navigation-05"></a>

### NAVIGATION-05 不正な PWA キャッシュによる起動失敗時に手動復旧を案内する

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧を表示でき、設定が保存されている。
- ブラウザーの PWA キャッシュにある Tango のアプリが不正になり、起動途中でエラーになる。復旧画面は表示できる。
- サーバーから取得できるアプリは正常であり、クラウドの Deck と Card は変更されていない。

When:

- アプリを再読み込みし、起動エラー画面の Reload を選択する。

Then:

- 起動時に共通の復旧画面を表示する。Reload 後も不正なキャッシュが残り、同じエラーになる。
- サイト設定からの手動削除とデータ消失を案内し、ローカル DB の削除操作は表示しない。
- 保存済みの設定とキャッシュを保持し、クラウドの Deck と Card の内容を変更しない。
- 不正なキャッシュによるブラウザーの診断は許容する。

<a id="navigation-03"></a>

### NAVIGATION-03 共通エラー画面が現在の言語で表示され Reload で復旧する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名ユーザーが端末内に Deck と Card を作成し、日本語の Settings 画面を開いている。
- 配色の変更時に一時的な障害が発生する。
- ブラウザーに設定と追加の保存データがある。

When:

- Dark mode を変更して共通エラー画面を表示し、再読み込みを選択する。

Then:

- 見出し・説明・Reload のみを日本語で表示し、ページの言語も日本語にする。描画・ルート・認証自体の失敗にはローカル DB の削除操作を表示しない。
- 描画・ルート・初期化の失敗理由がある場合は、再読み込みの案内とともに元のエラーメッセージを表示する。
- Reload 後は元の URL の日本語の Settings へ復旧する。認証状態、匿名ユーザーの Deck・Card、設定と追加の保存データを保持し、アプリからサイトデータを削除しない。

<a id="navigation-22"></a>

### NAVIGATION-22 保存データの初期化失敗からローカルデータを削除して再起動する

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名ユーザーの Deck・Card・学習データが Firestore の永続キャッシュに保存されている。
- 保存データの初期化または購読開始時に読み込みが失敗する。
- 設定、認証、Card replica を含む IndexedDB、localStorage、sessionStorage と PWA キャッシュがある。

When:

- 保存データの読み込み失敗による復旧画面で、警告を読んでローカルデータの削除を選択する。

Then:

- Tango origin の全 IndexedDB（Firestore・認証・Card replica を含む）・localStorage・sessionStorage を削除して元の URL で起動する。
- 削除前にログアウト・設定初期化・保存データと未同期変更の消失を警告し、匿名データを復元できないことを明示する。
- 匿名ユーザーの Deck・Card・学習データは再読み込み後も復活しない。
- 以前の認証 UID・言語設定・追加データは消え、新しい匿名ユーザーと既定設定で利用できる。保存領域を再作成しても以前のデータは復元しない。
- Service Worker の登録と Cache Storage の内容は保持する。
- ローカルデータ削除やアプリの読み込みを待つ間は起動中表示を出し、完了時はアプリに切り替える。
- 削除中は復旧操作を重ねて実行できない。
