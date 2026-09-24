# Import E2E テスト仕様書

## 目的

CSV の内容を確認して取り込み、失敗後も再試行できることを確認する。Sample Deck の明示的な追加と自動初期生成でも、重複や確認前の保存を起こさない。

## 共通の操作・結果契約（DECK-IMPORT-01〜DECK-IMPORT-06）

- CSV の検証、import、例の選択は同時に一つだけ実行でき、処理中は競合する操作を受け付けない。
- 処理中に画面を離れて再入場しても処理中の表示が維持され、完了後に操作可能になる。
- ブラウザー内で確定した保存の成功・失敗は一回の処理につき一つの通知で知らせる。ローカル反映後にクラウドから拒否された変更は Firestore の rollback で反映し、遅延した同期拒否のための独自通知は行わない。
- 完了時に開始元の画面を離れている場合は、自動的に Deck 一覧へ移動しない。
- CSV の読み取り失敗は画面内に表示され、ファイルを再選択して回復できる。空の CSV は保存しない。
- 対応する文字コードは UTF-8 と形式説明に表示する。不正な UTF-8 は受け付けず、英語・日本語で UTF-8 での再保存と再選択を案内する。preview を表示せず、Deck・Card を作成せず、以前の選択にも戻らない。有効なファイルを選び直すと続行できる。
- 有効な UTF-8 の日本語と文字として含まれる U+FFFD は preview・import・reload を通じて保持する。文字コードの推測や自動変換はしない。
- 保存先の選択肢はない。ログイン中はそのアカウントの Deck として、匿名利用中はこのブラウザーだけで利用できる Deck として追加される。
- 読み取り中にアカウントを変更した場合は選択が解除される。preview の表示後に変更した場合も、以前のアカウントで選んだ内容を別アカウントへ保存できない。
- 同名の Deck が存在しても、新しい CSV の import は既存の Deck・Card を上書きしない。
- import 成功後は preview が残らない。保存に失敗した場合は同じ内容で再試行でき、同じ取り込みの再試行で Deck・Card を重複作成しない。
- 基本・数式・マークダウン・サンプルデッキは同じ確認手順を利用でき、選択だけでは保存しない。
- 確認画面から選択した内容を維持したままファイル・例の選択へ戻れる。処理中は選び直せない。
- どの例も CSV をダウンロードでき、記述・タグ・改行・識別キーが内容表示と一致する。
- 新たに同じ例を選んで追加を確定した場合は、新しい Deck として追加される。失敗した取り込みの再試行とは区別する。
- 例を選んで追加しても自動初期生成の設定は変更しない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-IMPORT-01 | read | 正常系 | [有効な CSV を保存せずに preview できる](#deck-import-01) |
| DECK-IMPORT-02 | read | 異常系 | [不正な行を含む CSV の import を阻止できる](#deck-import-02) |
| DECK-IMPORT-03 | batch | 正常系 | [ログイン中に CSV を import して reload 後も利用できる](#deck-import-03) |
| DECK-IMPORT-04 | batch | 正常系 | [匿名で CSV を import して reload 後に学習できる](#deck-import-04) |
| DECK-IMPORT-05 | batch | 異常系 | [取り込んだ内容の同期拒否を反映できる](#deck-import-05) |
| DECK-IMPORT-06 | batch | 正常系 | [4種類の例を同じ確認・保存の手順で追加できる](#deck-import-06) |
| DECK-IMPORT-07 | batch | 正常系 | [Sample Deck を一度だけ初期生成できる](#deck-import-07) |
| DECK-IMPORT-08 | batch | 正常系 | [Sample deck の全内容を匿名で取り込んで学習できる](#deck-import-08) |
| DECK-IMPORT-09 | batch | 正常系 | [通常ユーザーの Sample deck を同期できる](#deck-import-09) |
| DECK-IMPORT-10 | batch | 正常系 | [Google 未ログインの Sample deck をこのブラウザーだけに維持できる](#deck-import-10) |

<a id="deck-import-01"></a>

### DECK-IMPORT-01 有効な CSV を保存せずに preview できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の列と一意な uniqueKey を持つ有効な CSV がある。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面でファイル選択欄へフォーカスし、Tab と Shift+Tab で前後の操作へ移動する。
- CSV を選択し、Import を実行せずに検証の完了を待つ。

Then:

- Tab／Shift+Tab でファイル選択欄に移動すると、表示されたアップロード領域にフォーカス枠が表示され、前後の操作へ移動すると消える。広い画面・狭い画面と明暗両テーマで位置を判別できる。
- 通常の Tab 順序でファイル選択欄へ移動し、CSV を選択できる。
- Deck 名、検証件数、Card の内容を含む preview が表示される。
- Import 操作が有効になる。
- Deck と Card はまだ追加されない。
- 未処理の browser error が発生しない。

<a id="deck-import-02"></a>

### DECK-IMPORT-02 不正な行を含む CSV の import を阻止できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の uniqueKey が空の行を含む CSV がある。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 不正な行と理由が入力エラーとして画面内に表示される。
- Import 操作は無効のままになる。
- Deck と Card は追加されない。
- 未処理の browser error が発生しない。

<a id="deck-import-03"></a>

### DECK-IMPORT-03 ログイン中に CSV を import して reload 後も利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は、このアカウントにまだ存在しない。

When:

- Import 画面で CSV の preview を確認して import した後、Deck 一覧を reload して import した Deck を開く。

Then:

- import 件数を含む成功結果が通知される。
- preview に含まれていた Deck とすべての Card を、ログイン中のアカウントのデータとして利用できる。
- reload 後も Deck と Card の内容が維持される。
- 未処理の browser error が発生しない。

<a id="deck-import-04"></a>

### DECK-IMPORT-04 匿名で CSV を import して reload 後に学習できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は、このブラウザーにまだ存在しない。

When:

- Import 画面で CSV の preview を確認して import した後、reload して import した Deck の学習を開始する。

Then:

- 保存先の選択肢は表示されない。
- import 件数を含む成功結果が通知される。
- import した Deck とすべての Card が、同じブラウザーで reload した後も利用できる。
- 取り込んだ Deck と Card はクラウドへ追加されない。
- 学習画面に import した Card が表示される。
- 未処理の browser error が発生しない。

<a id="deck-import-05"></a>

### DECK-IMPORT-05 取り込んだ内容の同期拒否を反映できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 有効な CSV に含まれる Card のクラウド保存が拒否される。

When:

- CSV を確認して追加し、同期結果を待って reload する。

Then:

- ブラウザー内でローカル反映できればクラウドの応答を待たずに操作が完了する。
- クラウドから拒否された Card は Firestore の rollback により利用できる Card として表示されない。保存できた Deck が再読み込みや同期によって重複しない。遅延した同期拒否のための独自通知は行わない。
- 未処理の browser error が発生しない。

<a id="deck-import-06"></a>

### DECK-IMPORT-06 4種類の例を同じ確認・保存の手順で追加できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 各種類を独立した状態で確認し、その例に対応する Deck と Card はまだ存在しない。

When:

- 各種類の例を切り替え、表裏の表示と CSV の記述を確認し、CSV をダウンロードする。
- 各例について `Try this example` を実行し、preview を確認して追加を確定する。
- Deck 一覧を reload して追加した Deck を開く。

Then:

- 4種類で同じ操作、確認手順を利用できる。
- ダウンロードには表示した種類の全 Card が含まれ、数式・Markdown・複数タグ・引用符内の改行は失われない。
- 例の選択だけでは保存せず、件数・Deck 名・表裏の内容を preview できる。
- 処理中は例の選択、ファイル選択、追加確定を重ねて実行できない。再入場後も処理中の表示が維持される。
- 明示的な確定後に選んだ全 Card が追加され、件数が通知されて Deck 一覧へ戻る。
- reload 後も Card を表示できる。匿名で追加した場合はクラウドに保存されない。
- 新たに同じ例を選んで追加しても既存の Deck や Card は上書きせず、新しい Deck になる。
- 保存に失敗した場合は同じ preview の内容で再試行でき、同じ取り込みが重複しない。アカウントが変わった場合は、以前の選択内容を別アカウントへ保存できない。
- 未処理の browser error が発生しない。

<a id="deck-import-07"></a>

### DECK-IMPORT-07 Sample Deck を一度だけ初期生成できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`sample-bootstrap`](./fixture/sample-bootstrap.yaml)
- 認証済みユーザーに Deck がなく、Sample Deck の初期生成が有効である。

When:

- Deck 一覧を開いて初期生成の完了を待ち、ページを reload する。

Then:

- Sample Deck とその Card 群が利用できる。
- Sample Deck とその Card 群は reload 後も重複しない。
- browser error が発生しない。

<a id="deck-import-08"></a>

### DECK-IMPORT-08 Sample deck の全内容を匿名で取り込んで学習できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名ユーザーで、Import 画面の Sample deck をまだ取り込んでいない。

When:

- Sample deck の preview を開き、追加を確定する。
- reload 後に取り込んだ Deck を開き、学習を開始して解答を表示する。

Then:

- preview を開くだけでは Deck と Card は追加されない。
- 件数を含む成功通知が表示される。
- 追加成功後は reload を待たずに Deck 一覧へ遷移し、取り込んだ Deck が表示される。
- Sample deck の全 Card の表裏、複数タグ、uniqueKey、引用符と改行が reload 後も維持される。
- Deck と Card はこのブラウザーだけで利用でき、クラウドには追加されない。
- Card 一覧と学習画面で取り込んだ内容を利用でき、解答を表示できる。
- 未処理の browser error が発生しない。

<a id="deck-import-09"></a>

### DECK-IMPORT-09 通常ユーザーの Sample deck を同期できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。

When:

- Sample deck の preview を開き、追加を確定して reload する。

Then:

- 保存できると Deck 一覧へ遷移し、件数が通知される。
- 同期後も、追加したすべての Card をログイン中のアカウントで一つずつ利用できる。
- Sample deck の表裏、タグ、uniqueKey、引用符と改行を維持する。
- 再読み込みや同期によって Deck と Card の複製が増えない。
- 未処理の browser error が発生しない。

<a id="deck-import-10"></a>

### DECK-IMPORT-10 Google 未ログインの Sample deck をこのブラウザーだけに維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 初めて利用するブラウザーで、Google にログインしていない。

When:

- Import 画面を直接開き、Sample deck の追加を確定する。
- Account 画面で匿名状態を確認し、Deck 一覧へ戻って reload する。

Then:

- Google ログイン操作なしで import が成功する。
- 保存先の選択肢は表示されない。
- 保存成功後は reload を待たずに Deck 一覧へ遷移し、対象の Deck と成功通知が表示される。
- Deck とすべての Card はこのブラウザーだけで利用でき、クラウドには追加されない。
- reload 後も対象 Deck を開いてすべての Card を表示できる。
- 未処理の browser error が発生しない。
