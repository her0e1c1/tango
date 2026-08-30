# Import E2E テスト仕様書

## 目的

CSV の検証から保存先別の import、失敗後の再試行、Sample Deck の追加までが、重複や意図しない永続化を起こさずに完了することを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| IMPORT-01 | read | [有効な CSV を永続化せずに preview できる](#import-01) |
| IMPORT-02 | read | [不正な行を含む CSV の import を阻止できる](#import-02) |
| IMPORT-03 | batch | [CSV を remote に import して reload 後も利用できる](#import-03) |
| IMPORT-04 | batch | [CSV を local-only に import して reload 後に学習できる](#import-04) |
| IMPORT-05 | batch | [失敗した import を同じ保存先へ重複なく再試行できる](#import-05) |
| IMPORT-06 | batch | [Sample Deck を繰り返し追加しても重複しない](#import-06) |

<a id="import-01"></a>

### IMPORT-01 有効な CSV を永続化せずに preview できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 必須の列と一意な uniqueKey を持つ有効な CSV がある。
- CSV に対応する Deck と Card は選択する保存先に存在しない。

When:

- Import 画面で CSV を選択し、Import を実行せずに検証の完了を待つ。

Then:

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
- import の失敗が画面内で処理され、同じ preview と保存先が維持されている。
- 次の import では Card を保存できる。

When:

- CSV と保存先を変更せずに Import を再度実行する。

Then:

- 再試行は最初の試行で作成された Deck を保存先として完了する。
- 選択した保存先には Deck が一つだけ存在し、preview に含まれていた Card が重複なく保存される。
- 未処理の browser error が発生しない。

<a id="import-06"></a>

### IMPORT-06 Sample Deck を繰り返し追加しても重複しない

カテゴリ: `batch`

Given:

- Fixture: [`sample-deck-present`](./fixture/sample-deck-present.yaml)
- Sample Deck が明示的な追加操作によって local storage に保存されている。
- Sample Deck とその Card の識別子および件数が記録されている。
- Deck 一覧から Import 画面を開いている。

When:

- Import 画面から Sample Deck を再度追加し、`Back to decks` で Deck 一覧へ戻った後、画面を reload して Sample Deck を開く。

Then:

- local storage に存在する Sample Deck は一つだけである。
- Sample Deck の Card の識別子と件数は追加前から変わらず、重複していない。
- 未処理の browser error が発生しない。
