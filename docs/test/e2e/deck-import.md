# Import E2E テスト仕様書

## 目的

CSV の内容を確認して取り込み、失敗後も再試行できることを確認する。Sample Deck の明示的な追加と自動初期生成でも、重複や確認前の保存を起こさない。

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
| DECK-IMPORT-11 | read | 異常系 | [同じ CSV を修正して再選択できる](#deck-import-11) |
| DECK-IMPORT-12 | read | 異常系 | [複数行フィールドを含む CSV の論理レコード単位で診断を確認できる](#deck-import-12) |
| DECK-IMPORT-13 | read | 異常系 | [CSV の引用符エラーを論理レコードと元列値で確認できる](#deck-import-13) |
| DECK-IMPORT-14 | read | 異常系 | [空白だけの CSV をファイル全体のエラーとして拒否できる](#deck-import-14) |
| DECK-IMPORT-15 | read | 正常系 | [4種類の例の内容に一致する CSV をダウンロードできる](#deck-import-15) |
| DECK-IMPORT-16 | read | 正常系 | [4種類の例を保存せずに preview できる](#deck-import-16) |
| DECK-IMPORT-17 | batch | 正常系 | [同じ例を再び選んで新しい Deck として追加できる](#deck-import-17) |
| DECK-IMPORT-18 | batch | 異常系 | [例の保存失敗後も同じ内容で重複せず再試行できる](#deck-import-18) |
| DECK-IMPORT-19 | batch | 正常系 | [例の選択後にアカウントを変更すると以前の内容を保存できない](#deck-import-19) |
| DECK-IMPORT-20 | read | 正常系 | [ファイル選択の取消後も現在の確認内容を維持できる](#deck-import-20) |
| DECK-IMPORT-21 | batch | 正常系 | [匿名で追加した例をクラウドに保存しない](#deck-import-21) |

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

<a id="deck-import-02"></a>

### DECK-IMPORT-02 不正な行を含む CSV の import を阻止できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の uniqueKey が空の行を含む CSV と、必須の4列に足りない行を含む CSV を、それぞれ独立した入力例として用意する。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 不正な行と理由が入力エラーとして画面内に表示される。
- 必須列に足りない行を正常な Card へ補完せず、不正な行数に数える。
- Import 操作は無効のままになる。
- Deck と Card は追加されない。

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

- サーバー保存に失敗した場合は失敗の toast を表示し、成功通知や保存後の画面遷移を行わない。準備済みの識別子を保ち、同じ入力で再試行できる。
- クラウドから拒否された Card は Firestore の rollback により利用できる Card として表示されない。保存できた Deck が再読み込みや同期によって重複しない。拒否は呼び出し側が toast で通知する。

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

- 各例について `Try this example` を実行し、preview を確認して追加を確定する。
- Deck 一覧を reload して追加した Deck を開く。

Then:

- 4種類で同じ操作、確認手順を利用できる。
- 処理中は例の選択、ファイル選択、追加確定を重ねて実行できない。再入場後も処理中の表示が維持される。
- 明示的な確定後に選んだ全 Card が追加され、件数が通知されて Deck 一覧へ戻る。
- reload 後も Card を表示できる。

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

- Sample Deck の初期化で全 Card が表示されてから reload とダウンロードを行い、全件が維持される。

- Sample Deck とその Card 群が利用できる。
- Sample Deck とその Card 群は reload 後も重複しない。

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

<a id="deck-import-11"></a>

### DECK-IMPORT-11 同じ CSV を修正して再選択できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 文字コードが不正な CSV を、同じパス・名前のまま修正できる。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- CSV を繰り返し選択して文字コードエラーを確認し、画面を離れずに同じファイルを UTF-8 の有効な内容に修正して再選択する。
- 同じファイルを必須の uniqueKey が空の内容へ変更して選び直した後、再び有効な内容へ修正して選び直す。

Then:

- 同じファイルを選ぶたびに読み取りと検証が行われ、文字コードエラー・行エラーから修正後の内容で preview と追加可否が更新される。
- 表示するファイル名は維持される。ファイル選択欄はキーボードで操作でき、処理中は再選択できない。
- 追加を確定するまで Deck と Card は保存されない。

<a id="deck-import-12"></a>

### DECK-IMPORT-12 [TODO] 複数行フィールドを含む CSV の論理レコード単位で診断を確認できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 論理レコード番号と元列値を確認する入力例として、`"front\ncontinued","back"," foo,foo, bar "," key "\n\n"bad ""front""","back"," key "\n" "," "," foo,foo, bar "," key "` がある。ここで `\n` は実際の改行を表す。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 複数行フィールドを含む入力例では、有効な論理レコード1の本文の改行を保持し、タグは `foo`、`bar`、uniqueKey は `key` に正規化する。空の論理レコード2を読み飛ばし、3列の論理レコード3と表裏が空白かつキーが重複する論理レコード4を不正な2レコードとして数える。レコード4に複数の理由があっても不正件数は増えない。
- 診断番号は1始まりの論理レコード番号とし、引用符内の改行を物理行として加算しない。列contextは引用符の解析後、正規化前の値を保持する。レコード3は `["bad \"front\"","back"," key "]`、レコード4は `[" "," "," foo,foo, bar "," key "]` となる。
- Import 操作は無効のままになる。
- Deck と Card は追加されない。

<a id="deck-import-13"></a>

### DECK-IMPORT-13 [TODO] CSV の引用符エラーを論理レコードと元列値で確認できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 引用符エラーの独立した入力例として、`"front\ncontinued",back,,key\n\n` の後に閉じ引用符のない `"unterminated`、または閉じ引用符の直後に文字が続く `"bad"tail,back,,key` を置いた CSV がある。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 引用符エラーの入力例では、論理レコード3に引用符のエラーを表示し、不正件数は1レコードとなる。閉じ引用符が欠落していることとcontext `["unterminated"]`、閉じ引用符の後に余計な文字があることとcontext `["bad\"tail,back,,key"]` をそれぞれ確認できる。
- Import 操作は無効のままになる。
- Deck と Card は追加されない。

<a id="deck-import-14"></a>

### DECK-IMPORT-14 [TODO] 空白だけの CSV をファイル全体のエラーとして拒否できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 空白3文字だけの CSV がある。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 空白だけの入力では、空のCSVであることをファイル全体のエラーとして報告し、特定のレコード番号や列contextを付けない。
- Import 操作は無効のままになる。
- Deck と Card は追加されない。

<a id="deck-import-15"></a>

### DECK-IMPORT-15 4種類の例の内容に一致する CSV をダウンロードできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 各種類を独立した状態で確認する。

When:

- 各種類の例を切り替え、表裏の表示と CSV の記述を確認し、CSV をダウンロードする。

Then:

- ダウンロードには表示した種類の全 Card が含まれ、数式・Markdown・複数タグ・引用符内の改行は失われない。

<a id="deck-import-16"></a>

### DECK-IMPORT-16 4種類の例を保存せずに preview できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 各種類を独立した状態で確認し、その例に対応する Deck と Card はまだ存在しない。

When:

- 各例を選択して `Try this example` を実行し、追加を確定せずに preview を確認する。

Then:

- 例の選択だけでは保存せず、件数・Deck 名・表裏の内容を preview できる。

<a id="deck-import-17"></a>

### DECK-IMPORT-17 [TODO] 同じ例を再び選んで新しい Deck として追加できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面の例を追加済みで、その Deck と Card を利用できる。

When:

- 新たに同じ例を選び、追加を確定する。

Then:

- 既存の Deck や Card は上書きせず、新しい Deck になる。

<a id="deck-import-18"></a>

### DECK-IMPORT-18 [TODO] 例の保存失敗後も同じ内容で重複せず再試行できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面の例の preview を確認し、追加を確定したが保存に失敗している。

When:

- 同じ preview の内容で追加を再試行する。

Then:

- 同じ取り込みが重複せず、同じ preview の内容を取り込める。

<a id="deck-import-19"></a>

### DECK-IMPORT-19 [TODO] 例の選択後にアカウントを変更すると以前の内容を保存できない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面の例を選択している。

When:

- 選択後、追加を確定する前にアカウントを変更する。

Then:

- 以前の選択内容を別アカウントへ保存できない。

<a id="deck-import-20"></a>

### DECK-IMPORT-20 ファイル選択の取消後も現在の確認内容を維持できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Import 画面に選択済み CSV の preview またはエラーが表示され、追加可否を確認できる。

When:

- ファイル選択を取り消す。

Then:

- 現在の preview・エラー・追加可否は変わらない。

<a id="deck-import-21"></a>

### DECK-IMPORT-21 [TODO] 匿名で追加した例をクラウドに保存しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- Import 画面に基本・数式・マークダウン・サンプルデッキの4種類の例がある。
- 各種類を独立した状態で確認し、その例に対応する Deck と Card はまだ存在しない。

When:

- 各例について preview を確認して追加を確定し、reload して追加した Deck を開く。

Then:

- reload 後も Card を表示できる。
- 匿名で追加した Deck と Card はクラウドに保存されない。
