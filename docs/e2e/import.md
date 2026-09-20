# Import E2E テスト仕様書

## 目的

CSV の検証からUID の cache への import、失敗後の再試行、Sample Deck の明示的な追加と自動初期生成までが、重複や意図しない永続化を起こさずに完了することを確認する。

## 共通の操作・結果契約（IMPORT-01〜IMPORT-06）

- CSV の検証、import、例の選択は同時に一つだけ実行でき、処理中は競合する操作を受け付けない。
- 処理中に画面を離れて再入場しても処理中の表示と排他は維持され、完了後に操作可能になる。
- 保存の成功・失敗は一回の処理につき一つの App 所有の共通 toast で通知する。画面離脱を理由に結果を抑止・消去しない。
- 完了時に開始元の画面が離脱済みなら、自動的に Deck 一覧へ移動しない。
- CSV の読み取り失敗は画面内に表示され、ファイルを再選択して回復できる。空の CSV は保存しない。
- 保存先選択はない。匿名・通常ユーザーとも現在の UID の Firestore cache に保存する。
- 認証ユーザーが読み取り中に変わった場合は選択を破棄し、preview の準備後に変わった場合は別ユーザーの import を実行しない。
- 同名の Deck が存在しても新しい CSV の import は既存の Deck・Card を上書きしない。
- import 成功後は preview を破棄し、失敗後は同じ Deck・Card の識別子で再試行できる。
- 基本・数式・マークダウン・サンプルデッキは同じ preview と保存フローを利用し、選択だけでは保存しない。
- 確認画面から選択した内容を維持したままファイル・例の選択へ戻れる。処理中は選び直せない。
- どの例も CSV をダウンロードでき、記述・タグ・改行・識別キーが内容表示と一致する。
- 新たに例を選んで確定すると新しい Deck を作成する。同じ処理の失敗後の再試行では識別子を維持する。
- 例を選んで追加しても自動初期生成の設定は変更しない。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| IMPORT-01 | read | [有効な CSV を永続化せずに preview できる](#import-01) |
| IMPORT-02 | read | [不正な行を含む CSV の import を阻止できる](#import-02) |
| IMPORT-03 | batch | [CSV を remote に import して reload 後も利用できる](#import-03) |
| IMPORT-04 | batch | [CSV を local-only に import して reload 後に学習できる](#import-04) |
| IMPORT-05 | batch | [queued import の同期拒否を通知できる](#import-05) |
| IMPORT-06 | batch | [4種類の例を同じ確認・保存フローで追加できる](#import-06) |
| IMPORT-07 | batch | [Sample Deck を一度だけ初期生成できる](#import-07) |
| IMPORT-08 | batch | [Sample deck の全内容を local-only に取り込んで学習できる](#import-08) |
| IMPORT-09 | batch | [通常ユーザーの Sample deck を同期できる](#import-09) |
| IMPORT-10 | batch | [Google 未ログインの Sample deck を local-only に維持できる](#import-10) |

<a id="import-01"></a>

### IMPORT-01 有効な CSV を永続化せずに preview できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の列と一意な uniqueKey を持つ有効な CSV がある。
- CSV に対応する Deck と Card は選択する保存先に存在しない。

When:

- Import 画面でファイル選択欄へフォーカスし、Tab と Shift+Tab で前後の操作へ移動する。
- CSV を選択し、Import を実行せずに検証の完了を待つ。

Then:

- Tab／Shift+Tab でファイル選択欄に移動すると、可視のアップロード領域に共通フォーカストークンの枠が表示され、前後の操作へ移動すると消える。広い画面・狭い画面と明暗両テーマで位置を判別できる。
- native file input の通常の Tab 順序と CSV 選択を維持する。
- Deck 名、検証件数、Card の内容を含む preview が表示される。
- Import 操作が有効になる。
- 選択した保存先に Deck と Card は作成されない。
- 未処理の browser error が発生しない。

<a id="import-02"></a>

### IMPORT-02 不正な行を含む CSV の import を阻止できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の uniqueKey が空の行を含む CSV がある。
- CSV に対応する Deck と Card は選択する保存先に存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 不正な行と理由が validation error として画面内に表示される。
- Import 操作は無効のままになる。
- 選択した保存先に Deck と Card は作成されない。
- 未処理の browser error が発生しない。

<a id="import-03"></a>

### IMPORT-03 CSV を remote に import して reload 後も利用できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する remote の Deck と Card は現在の UID に存在しない。

When:

- Import 画面で CSV の preview を確認して import した後、Deck 一覧を reload して import した Deck を開く。

Then:

- import 件数を含む成功結果が共通 toast で表示される。
- preview に含まれていた Deck とすべての Card が現在の UID の remote data として表示される。
- reload 後も Deck と Card の内容が維持される。
- 未処理の browser error が発生しない。

<a id="import-04"></a>

### IMPORT-04 CSV を local-only に import して reload 後に学習できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は local storage に存在しない。

When:

- Import 画面で CSV の preview を確認して import した後、reload して import した Deck の学習を開始する。

Then:

- 保存先選択は表示せず、匿名 UID の cache に保存し、同期は停止する。
- import 件数を含む成功結果が共通 toast で表示される。
- import した Deck とすべての Card が local storage に維持される。
- 対応する Deck と Card は remote data に作成されない。
- 学習画面に import した Card が表示される。
- 未処理の browser error が発生しない。

<a id="import-05"></a>

### IMPORT-05 queued import の同期拒否を通知できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 有効な CSV の Card 書き込みをクラウドが拒否する。

When:

- CSV を確認して追加し、同期結果を待って reload する。

Then:

- cache 反映で操作を完了し、後から検出した同期失敗は共通 toast で表示する。
- 拒否された Card を成功済みとして再送しない。保存済み Deck を重複作成しない。
- 未処理の browser error を発生させない。
- cache 保存中の失敗では preview と固定 ID を維持し、ユーザーの明示的な再送信を受け付ける。

<a id="import-06"></a>

### IMPORT-06 4種類の例を同じ確認・保存フローで追加できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 例に対応する Deck と Card は選択した保存先に存在しない。

When:

- 各種類の例を切り替え、表裏の表示と CSV の記述を確認し、CSV をダウンロードする。
- 各例について `Try this example` を実行し、preview を確認して追加を確定する。
- Deck 一覧を reload して追加した Deck を開く。

Then:

- 4種類で同じ操作、確認手順を利用できる。
- ダウンロードには表示した種類の全カードが含まれ、数式・Markdown・複数タグ・引用符内の改行は失われない。
- 例の選択だけでは保存せず、件数・Deck 名・表裏の内容を preview できる。
- 処理中は例の選択、ファイル選択、追加確定が排他になる。再入場後も処理状態を維持する。
- 明示的な確定後に選択した保存先へ全カードを保存し、共通 toast で件数を通知して Deck 一覧へ戻る。
- reload 後もカードを表示できる。local-only の例は remote に保存されない。
- 新たに同じ例を選んで追加しても既存の Deck や Card は上書きせず、新しい Deck になる。
- 失敗後は同じ preview と識別子で再試行できる。認証ユーザーの変更時は別ユーザーへの保存を阻止する。
- 未処理の browser error が発生しない。

<a id="import-07"></a>

### IMPORT-07 Sample Deck を一度だけ初期生成できる

カテゴリ: `batch`

Given:

- Fixture: [`sample-bootstrap`](./fixture/sample-bootstrap.yaml)
- 認証済みユーザーに Deck がなく、Sample Deck の初期生成が有効である。

When:

- Deck 一覧を開いて初期生成の完了を待ち、ページを reload する。

Then:

- Sample Deck とその Card 群が利用できる。
- Sample Deck とその Card 群は reload 後も重複しない。
- browser error が発生しない。

<a id="import-08"></a>

### IMPORT-08 Sample deck の全内容を local-only に取り込んで学習できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Import 画面の Sample deck をまだ取り込んでいない。

When:

- 匿名 UID で Sample deck の preview を開き、追加を確定する。
- reload 後に取り込んだ Deck を開き、学習を開始して解答を表示する。

Then:

- preview を開くだけでは Deck と Card は保存されない。
- 件数を含む成功通知が表示される。
- 追加成功後は reload を待たずに Deck 一覧へ遷移し、取り込んだ Deck が表示される。
- 生成済み sample の全 Card の表裏、複数タグ、uniqueKey、引用符と改行が reload 後も完全に維持される。
- Deck と Card は local-only に保存され、remote には作成されない。
- Card 一覧と学習画面で取り込んだ内容を利用でき、解答を表示できる。
- 未処理の browser error が発生しない。

<a id="import-09"></a>

### IMPORT-09 通常ユーザーの Sample deck を同期できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。

When:

- Sample deck の preview を開き、追加を確定して reload する。

Then:

- cache 反映後に Deck 一覧へ遷移し、件数を共通 toast で通知する。
- 現在の UID の remote data に全 Card が一つずつ保存される。
- sample の表裏、タグ、uniqueKey、引用符と改行を維持する。
- cache と remote は同じ ID を使い、別の保存先を作らない。
- 未処理の browser error が発生しない。

<a id="import-10"></a>

### IMPORT-10 Google 未ログインの Sample deck を local-only に維持できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 新しい browser context で Google にログインしていない。
- 認証応答を模擬せず、Auth emulator によるアプリの匿名認証と Firestore emulator を利用する。

When:

- Import 画面を直接開き、既定の local-only の保存先で Sample deck の追加を確定する。
- アカウント画面で匿名状態を確認し、Deck 一覧へ戻って reload する。

Then:

- Google ログイン操作なしで import が成功する。
- 保存先選択は表示しない。
- 保存成功後は reload を待たずに Deck 一覧へ遷移し、対象の Deck と成功通知が表示される。
- Deck と全 Card は browser storage に保存され、実際に発行された匿名 UID の remote data は作成されない。
- reload 後も対象 Deck を開いて全 Card を表示できる。
- 未処理の browser error が発生しない。
