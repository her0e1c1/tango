# Import E2E テスト仕様書

## 目的

CSV の確認・取り込み・再試行と、Sample Deck の追加・自動初期生成を確認する。確認前の保存や再試行による重複を防ぐ。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-IMPORT-01 | read | 正常系 | [有効な CSV を保存せずにプレビューできる](#deck-import-01) |
| DECK-IMPORT-15 | read | 正常系 | [4種類の例を内容どおりに CSV でダウンロードできる](#deck-import-15) |
| DECK-IMPORT-16 | read | 正常系 | [4種類の例を保存せずにプレビューできる](#deck-import-16) |
| DECK-IMPORT-20 | read | 正常系 | [ファイル選択を取り消しても確認内容を保持する](#deck-import-20) |
| DECK-IMPORT-03 | batch | 正常系 | [ログイン中に CSV を取り込んで再読み込み後も利用できる](#deck-import-03) |
| DECK-IMPORT-04 | batch | 正常系 | [匿名で CSV を取り込んで再読み込み後に学習できる](#deck-import-04) |
| DECK-IMPORT-06 | batch | 正常系 | [4種類の例を同じ確認・保存の手順で追加できる](#deck-import-06) |
| DECK-IMPORT-07 | batch | 正常系 | [Sample Deck を一度だけ初期生成できる](#deck-import-07) |
| DECK-IMPORT-08 | batch | 正常系 | [Sample deck の全内容を匿名で取り込んで学習できる](#deck-import-08) |
| DECK-IMPORT-09 | batch | 正常系 | [通常ユーザーの Sample deck を同期できる](#deck-import-09) |
| DECK-IMPORT-10 | batch | 正常系 | [ログインせず Sample deck をブラウザーだけに保存する](#deck-import-10) |
| DECK-IMPORT-17 | batch | 正常系 | [同じ例を再び選んで新しい Deck として追加できる](#deck-import-17) |
| DECK-IMPORT-19 | batch | 正常系 | [例の選択後にアカウントを変更すると以前の内容を保存できない](#deck-import-19) |
| DECK-IMPORT-21 | batch | 正常系 | [匿名で追加した例をクラウドに保存しない](#deck-import-21) |
| DECK-IMPORT-02 | read | 異常系 | [不正な行を含む CSV を取り込めない](#deck-import-02) |
| DECK-IMPORT-11 | read | 異常系 | [同じ CSV を修正して再選択できる](#deck-import-11) |
| DECK-IMPORT-12 | read | 異常系 | [複数行 CSV の診断を論理レコード単位で表示する](#deck-import-12) |
| DECK-IMPORT-13 | read | 異常系 | [CSV の引用符エラーに論理レコード番号と元の列値を表示する](#deck-import-13) |
| DECK-IMPORT-14 | read | 異常系 | [空白だけの CSV をファイル全体のエラーとして拒否できる](#deck-import-14) |
| DECK-IMPORT-05 | batch | 異常系 | [取り込んだ内容の同期拒否を反映できる](#deck-import-05) |
| DECK-IMPORT-18 | batch | 異常系 | [例の保存失敗後も同じ内容で重複せず再試行できる](#deck-import-18) |

<a id="deck-import-01"></a>

### DECK-IMPORT-01 有効な CSV を保存せずにプレビューできる

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

- 通常の Tab／Shift+Tab の順序でファイル選択欄へ移動し、CSV を選べる。
- フォーカス枠はアップロード領域に表示され、他の操作へ移ると消える。広い画面・狭い画面と明暗両テーマで判別できる。
- Deck 名・検証件数・Card の内容をプレビューでき、Import が有効になる。
- Deck と Card はまだ追加されない。

<a id="deck-import-15"></a>

### DECK-IMPORT-15 4種類の例を内容どおりに CSV でダウンロードできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。

When:

- 例ごとに表裏と CSV の記述を確認し、CSV をダウンロードする。

Then:

- ダウンロードには表示した種類の全 Card が含まれ、数式・Markdown・複数タグ・引用符内の改行は失われない。

<a id="deck-import-16"></a>

### DECK-IMPORT-16 4種類の例を保存せずにプレビューできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 選ぶ例に対応する Deck と Card はまだ存在しない。

When:

- 各例を選択して `Try this example` を実行し、追加を確定せずにプレビューを確認する。

Then:

- 例の選択だけでは保存せず、件数・Deck 名・表裏の内容をプレビューできる。

<a id="deck-import-20"></a>

### DECK-IMPORT-20 ファイル選択を取り消しても確認内容を保持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Import 画面に選択済み CSV のプレビューまたはエラーが表示され、追加可否を確認できる。

When:

- ファイル選択を取り消す。

Then:

- 現在のプレビュー・エラー・追加可否は変わらない。

<a id="deck-import-03"></a>

### DECK-IMPORT-03 ログイン中に CSV を取り込んで再読み込み後も利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は、このアカウントにまだ存在しない。

When:

- Import 画面で CSV をプレビューして取り込み、Deck 一覧を再読み込みして対象 Deck を開く。

Then:

- 取り込み件数を含む成功結果が通知される。
- プレビューどおりの Deck と全 Card を、再読み込み後もログイン中のアカウントで利用できる。

<a id="deck-import-04"></a>

### DECK-IMPORT-04 匿名で CSV を取り込んで再読み込み後に学習できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名で利用している。
- 学習可能な Card を含む有効な CSV がある。
- CSV に対応する Deck と Card は、このブラウザーにまだ存在しない。

When:

- Import 画面で CSV をプレビューして取り込み、再読み込みして対象 Deck の学習を開始する。

Then:

- 保存先の選択肢は表示されない。
- 取り込み件数を含む成功結果が通知される。
- 取り込んだ Deck とすべての Card が、同じブラウザーで再読み込みした後も利用できる。
- 取り込んだ Deck と Card はクラウドへ追加されない。
- 学習画面に取り込んだ Card が表示される。

<a id="deck-import-06"></a>

### DECK-IMPORT-06 4種類の例を同じ確認・保存の手順で追加できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 選ぶ例に対応する Deck と Card はまだ存在しない。

When:

- 各例について `Try this example` を実行し、プレビューを確認して追加を確定する。
- Deck 一覧を再読み込みして追加した Deck を開く。

Then:

- 4種類で同じ操作、確認手順を利用できる。
- 明示的な確定後に選んだ全 Card が追加され、件数が通知されて Deck 一覧へ戻る。
- 再読み込み後も Card を表示できる。

<a id="deck-import-07"></a>

### DECK-IMPORT-07 Sample Deck を一度だけ初期生成できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`sample-bootstrap`](./fixture/sample-bootstrap.yaml)
- 認証済みユーザーに Deck がなく、Sample Deck の初期生成が有効である。

When:

- Deck 一覧で全 Card の初期生成を待ち、再読み込みして CSV をダウンロードする。

Then:

- Sample Deck と全 Card を利用でき、再読み込み後も重複しない。
- ダウンロードした CSV に全 Card が含まれる。

<a id="deck-import-08"></a>

### DECK-IMPORT-08 Sample deck の全内容を匿名で取り込んで学習できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名ユーザーで、Import 画面の Sample deck をまだ取り込んでいない。

When:

- Sample deck のプレビューを開き、追加を確定する。
- 再読み込み後に取り込んだ Deck を開き、学習を開始して解答を表示する。

Then:

- プレビューを開くだけでは Deck と Card は追加されない。
- 成功後は再読み込みなしで Deck 一覧に戻り、取り込んだ Deck と件数を含む成功通知が表示される。
- Sample deck の全 Card の表裏、複数タグ、uniqueKey、引用符と改行が再読み込み後も維持される。
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

- Sample deck のプレビューを開き、追加を確定して再読み込みする。

Then:

- 保存できると Deck 一覧へ遷移し、件数が通知される。
- 再読み込み・同期後も全 Card をログイン中のアカウントで利用でき、Deck と Card は重複しない。
- 表裏・タグ・uniqueKey・引用符・改行を維持する。

<a id="deck-import-10"></a>

### DECK-IMPORT-10 ログインせず Sample deck をブラウザーだけに保存する

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 初めて利用するブラウザーで、Google にログインしていない。

When:

- Import 画面を直接開き、Sample deck の追加を確定する。
- Account 画面で匿名状態を確認し、Deck 一覧へ戻って再読み込みする。

Then:

- Google ログイン操作なしで取り込みが成功する。
- 保存先の選択肢は表示されない。
- 保存成功後は再読み込みを待たずに Deck 一覧へ遷移し、対象の Deck と成功通知が表示される。
- Deck とすべての Card はこのブラウザーだけで利用でき、クラウドには追加されない。
- 再読み込み後も対象 Deck を開いてすべての Card を表示できる。

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

<a id="deck-import-21"></a>

### DECK-IMPORT-21 [TODO] 匿名で追加した例をクラウドに保存しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名で利用している。
- 選ぶ例に対応する Deck と Card はまだ存在しない。

When:

- 各例についてプレビューを確認して追加を確定し、再読み込みして追加した Deck を開く。

Then:

- 再読み込み後も Card を表示できる。
- 匿名で追加した Deck と Card はクラウドに保存されない。

<a id="deck-import-02"></a>

### DECK-IMPORT-02 不正な行を含む CSV を取り込めない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- uniqueKey が空の CSV、必須の4列に足りない CSV をそれぞれ確認する。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 不正な行と理由が入力エラーとして画面内に表示される。
- 必須列に足りない行を正常な Card へ補完せず、不正な行数に数える。
- Import は無効で、Deck と Card は追加されない。

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

- 選び直すたびに再検証され、修正内容に応じてエラー・プレビュー・追加可否が更新される。
- 表示するファイル名は維持される。ファイル選択欄はキーボードで操作でき、処理中は再選択できない。
- 追加を確定するまで Deck と Card は保存されない。

<a id="deck-import-12"></a>

### DECK-IMPORT-12 [TODO] 複数行 CSV の診断を論理レコード単位で表示する

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 論理レコード番号と元列値を確認する入力例として、`"front\ncontinued","back"," foo,foo, bar "," key "\n\n"bad ""front""","back"," key "\n" "," "," foo,foo, bar "," key "` がある。ここで `\n` は実際の改行を表す。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- レコード1は有効で、本文の改行を保持し、タグは `foo`、`bar`、uniqueKey は `key` に正規化する。
- 空のレコード2は読み飛ばす。3列のレコード3と、表裏が空白でキーも重複するレコード4は不正とする。不正件数は理由の数にかかわらず2件となる。
- 診断には1始まりの論理レコード番号を使い、引用符内の改行は数えない。元の列値は引用符の解析後・正規化前の値を示す。レコード3は `["bad \"front\"","back"," key "]`、レコード4は `[" "," "," foo,foo, bar "," key "]` となる。
- Import は無効で、Deck と Card は追加されない。

<a id="deck-import-13"></a>

### DECK-IMPORT-13 [TODO] CSV の引用符エラーに論理レコード番号と元の列値を表示する

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 引用符エラーの独立した入力例として、`"front\ncontinued",back,,key\n\n` の後に閉じ引用符のない `"unterminated`、または閉じ引用符の直後に文字が続く `"bad"tail,back,,key` を置いた CSV がある。
- CSV に対応する Deck と Card はまだ存在しない。

When:

- Import 画面で CSV を選択し、検証の完了を待つ。

Then:

- 論理レコード3の引用符エラーを表示し、不正件数は1件となる。閉じ引用符の欠落では元の列値 `["unterminated"]`、閉じ引用符の後に文字が続く場合は元の列値 `["bad\"tail,back,,key"]` をそれぞれ確認できる。
- Import は無効で、Deck と Card は追加されない。

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

- 空の CSV としてファイル全体のエラーを表示し、レコード番号や元の列値は付けない。
- Import は無効で、Deck と Card は追加されない。

<a id="deck-import-05"></a>

### DECK-IMPORT-05 取り込んだ内容の同期拒否を反映できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 有効な CSV に含まれる Card のクラウド保存が拒否される。

When:

- CSV を確認して追加し、同期結果を待って再読み込みする。

Then:

- 失敗が通知され、成功通知や保存後の画面遷移は起きない。同じ入力で再試行できる。
- 拒否された Card は表示されず、保存できた Deck は再読み込み・同期・再試行で重複しない。

<a id="deck-import-18"></a>

### DECK-IMPORT-18 [TODO] 例の保存失敗後も同じ内容で重複せず再試行できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Import 画面の例のプレビューを確認し、追加を確定したが保存に失敗している。

When:

- 同じプレビューの内容で追加を再試行する。

Then:

- 同じ取り込みが重複せず、同じプレビューの内容を取り込める。
