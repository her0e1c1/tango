# Import E2E テスト仕様書

## 目的

CSV の検証から保存先別の import、失敗後の再試行、Sample Deck の明示的な追加と自動初期生成までが、重複や意図しない永続化を起こさずに完了することを確認する。

## 共通の操作・結果契約（IMPORT-01〜IMPORT-06）

- CSV の検証、import、例の選択は同時に一つだけ実行でき、処理中は保存先変更や競合する操作を受け付けない。
- 処理中に画面を離れて再入場しても処理中の表示と排他は維持され、完了後に操作可能になる。
- 保存の成功・失敗は一回の処理につき一つの App 所有の共通 toast で通知する。画面離脱を理由に結果を抑止・消去しない。
- 完了時に開始元の画面が離脱済みなら、自動的に Deck 一覧へ移動しない。
- CSV の読み取り失敗は画面内に表示され、ファイルを再選択して回復できる。空の CSV は保存しない。
- 保存先を変更すると preview を破棄する。同じ保存先の選択では preview を維持する。
- 認証ユーザーが読み取り中に変わった場合は選択を破棄し、preview の準備後に変わった場合は別ユーザーの import を実行しない。
- 同名の Deck が存在しても新しい CSV の import は既存の Deck・Card を上書きしない。
- import 成功後は preview を破棄し、失敗後は同じ Deck・Card の識別子で再試行できる。
- 基本・数式・マークダウン・サンプルデッキは同じ preview と保存先のフローを利用し、選択だけでは保存しない。
- 確認画面から保存先を維持したままファイル・例の選択へ戻れる。処理中は選び直せない。
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
| IMPORT-05 | batch | [失敗した import を同じ保存先へ重複なく再試行できる](#import-05) |
| IMPORT-06 | batch | [4種類の例を同じ確認・保存フローで追加できる](#import-06) |
| IMPORT-07 | batch | [Sample Deck を一度だけ初期生成できる](#import-07) |

<a id="import-01"></a>

### IMPORT-01 有効な CSV を永続化せずに preview できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の列と一意な uniqueKey を持つ有効な CSV がある。
- CSV に対応する Deck と Card は選択する保存先に存在しない。

When:

- Import 画面で `Change` から保存先を開き、保存先から Tab でファイル選択欄、次の操作へ進み、Shift+Tab でファイル選択欄、保存先へ戻る。
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
- ユーザーとして認証されている。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する remote の Deck と Card は現在の UID に存在しない。

When:

- Import 画面で remote の保存先を選択し、CSV の preview を確認して import した後、Deck 一覧を reload して import した Deck を開く。

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
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は local storage に存在しない。

When:

- Import 画面で local-only の保存先を選択し、CSV の preview を確認して import した後、reload して import した Deck の学習を開始する。

Then:

- import 件数を含む成功結果が共通 toast で表示される。
- import した Deck とすべての Card が local storage に維持される。
- 対応する Deck と Card は remote data に作成されない。
- 学習画面に import した Card が表示される。
- 未処理の browser error が発生しない。

<a id="import-05"></a>

### IMPORT-05 失敗した import を同じ保存先へ重複なく再試行できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 有効な CSV の最初の import で、保存先の Deck を作成した後に Card の保存が失敗している。
- import の失敗と詳細が共通 toast で処理され、同じ preview と保存先が維持されている。
- 次の import では Card を保存できる。

When:

- CSV と保存先を変更せずに Import を再度実行する。

Then:

- 再試行は最初の試行で作成された Deck を保存先として完了する。
- import 件数を含む成功結果が共通 toast で表示される。過去の失敗 toast の寿命は App の共通 toast に従う。
- 選択した保存先には Deck が一つだけ存在し、preview に含まれていた Card が重複なく保存される。
- 未処理の browser error が発生しない。

<a id="import-06"></a>

### IMPORT-06 4種類の例を同じ確認・保存フローで追加できる

カテゴリ: `batch`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 例に対応する Deck と Card は選択した保存先に存在しない。

When:

- 各種類の例を切り替え、表裏の表示と CSV の記述を確認し、CSV をダウンロードする。
- 各例について local-only または remote を選択して `Try this example` を実行し、preview を確認して追加を確定する。
- Deck 一覧を reload して追加した Deck を開く。

Then:

- 4種類で同じ操作、確認手順、保存先選択を利用できる。
- ダウンロードには表示した種類の全カードが含まれ、数式・Markdown・複数タグ・引用符内の改行は失われない。
- 例の選択だけでは保存せず、件数・Deck 名・表裏の内容を preview できる。
- 処理中は例の選択、ファイル選択、保存先変更、追加確定が排他になる。再入場後も処理状態を維持する。
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
