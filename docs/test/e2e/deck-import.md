# Import E2E テスト仕様書

## 目的

CSV とサンプルから追加した Deck と Card の保存・再表示・学習、匿名での保持、連携後の同期、保存拒否からの復旧を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-IMPORT-03 | batch | 正常系 | [ログイン中に CSV を取り込んで再読み込み後も利用できる](#deck-import-03) |
| DECK-IMPORT-04 | batch | 正常系 | [匿名で CSV を取り込んで再読み込み後に学習できる](#deck-import-04) |
| DECK-IMPORT-07 | batch | 正常系 | [Sample Deck を一度だけ初期生成できる](#deck-import-07) |
| DECK-IMPORT-08 | batch | 正常系 | [Sample deck の全内容を匿名で取り込んで学習できる](#deck-import-08) |
| DECK-IMPORT-09 | batch | 正常系 | [通常ユーザーの Sample deck を同期できる](#deck-import-09) |
| DECK-IMPORT-10 | batch | 正常系 | [ログインせず Sample deck をブラウザーだけに保存する](#deck-import-10) |
| DECK-IMPORT-21 | batch | 正常系 | [匿名で追加した例をクラウドに保存しない](#deck-import-21) |
| DECK-IMPORT-05 | batch | 異常系 | [取り込んだ内容の同期拒否を反映できる](#deck-import-05) |

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
