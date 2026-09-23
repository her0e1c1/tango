# Card Filter E2E テスト仕様書

## 目的

Card 一覧（card-list）と Deck 閲覧（deck-view）で、学習条件とは独立した Card フィルターを使って表示対象を選べることを確認する。
同じ Deck の両画面は同じフィルターを使用し、選択タグと AND / OR 条件を Deck ごとに自動保存する。
未設定の Deck は絞り込みなし・OR 条件で表示し、学習条件や他の Deck のフィルターを初期値としてコピーしない。

学習用のタグ、復習期日、枚数上限、shuffle などの学習条件は、閲覧対象を制限しない。
これは学習条件全体からの独立性であり、FSRS だけを特別扱いする仕様ではない。
フィルターの変更・解除は学習条件や学習履歴を変更しない。

ソートは Card 一覧の表示順の操作として扱い、絞り込み結果や学習順を変更しない。
既存の「標準」「追加が新しい順」を対象とし、ソート順は永続化せず、Deck 閲覧は標準順を維持する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-FILTER-01 | read | 正常系 | [学習条件にかかわらず Card を全件表示できる](#card-filter-01) |
| CARD-FILTER-02 | read | 正常系 | [他の Deck のフィルター条件にかかわらず Card を全件表示できる](#card-filter-02) |
| CARD-FILTER-03 | read | 正常系 | [Card が登録されていない Deck は0件表示になる](#card-filter-03) |
| CARD-FILTER-04 | read | 正常系 | [フィルターに一致する Card がない場合は0件表示になる](#card-filter-04) |
| CARD-FILTER-05 | write | 正常系 | [リロード後も同じタグと AND / OR 条件を復元できる](#card-filter-05) |
| CARD-FILTER-06 | write | 正常系 | [フィルターを解除した状態もリロード後に維持できる](#card-filter-06) |
| CARD-FILTER-07 | write | 正常系 | [単一タグで Card を絞り込める](#card-filter-07) |
| CARD-FILTER-08 | write | 正常系 | [AND 条件ですべての選択タグを持つ Card に絞り込める](#card-filter-08) |
| CARD-FILTER-09 | write | 正常系 | [OR 条件でいずれかの選択タグを持つ Card に絞り込める](#card-filter-09) |
| CARD-FILTER-10 | read | 正常系 | [絞り込み結果を追加が新しい順にソートできる](#card-filter-10) |
| CARD-FILTER-11 | read | 正常系 | [絞り込み結果の表示順を標準へ戻せる](#card-filter-11) |

<a id="card-filter-01"></a>

### CARD-FILTER-01 学習条件にかかわらず Card を全件表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck の Card フィルターは未設定である。
- 学習用のタグ条件、復習期日を尊重する設定、枚数上限、shuffle が有効である。
- 次の各状態の Deck を、それぞれ対象とする。

| 対象 Deck の状態 | 前提 |
| --- | --- |
| 学習候補が一部ある | タグと学習状態が異なる Card があり、Card 数は学習枚数上限より多い |
| 学習候補が0件 | Card は登録されているが、保存済み学習条件ではすべて対象外になる |

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面とも対象 Deck の全 Card を表示し、表示対象の件数はその Deck の Card 数と一致する。
- Card フィルターは絞り込みなし・OR 条件であり、学習条件を初期値にしない。
- 学習対象外の Card も表示し、学習の枚数上限や shuffle を適用しない。
- 学習候補が0件でも、Card が存在する Deck を0件表示にしない。
- 別の Deck の Card を混在させず、フィルター、学習条件、Card、学習履歴、学習 session を変更しない。
- browser error が発生しない。

<a id="card-filter-02"></a>

### CARD-FILTER-02 他の Deck のフィルター条件にかかわらず Card を全件表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card を持つ複数の Deck がある。
- 一方の Deck には一部の Card に絞り込むタグと AND 条件を保存済みで、その Card 一覧を表示している。
- 移動先の Deck の Card フィルターは未設定であり、移動元のタグ条件では表示されない Card がある。

When:

- 移動先の Deck の Card 一覧と Deck 閲覧を開き、その後、移動元の Card 一覧へ戻る。

Then:

- 移動先は絞り込みなし・OR 条件で全 Card を表示する。
- 移動元の選択タグと AND 条件を移動先へ適用しない。
- 移動元へ戻ると保存済みのタグと AND 条件、および絞り込み結果が復元される。
- 各画面には選択した Deck の Card だけを表示し、両 Deck の保存済み条件を変更しない。
- browser error が発生しない。

<a id="card-filter-03"></a>

### CARD-FILTER-03 Card が登録されていない Deck は0件表示になる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck は存在するが、Card が1枚も登録されていない。
- 対象 Deck の Card フィルターは未設定である。
- 別の Deck には Card が登録されている。

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面で表示対象が0件であることが分かり、Card を表示しない。
- Card 未登録の状態を示し、学習条件で対象外になっているとは案内しない。
- 別の Deck の Card を代わりに表示しない。
- 一覧では Card の追加、Deck 閲覧では Deck 一覧へ戻る操作を利用できる。
- browser error が発生しない。

<a id="card-filter-04"></a>

### CARD-FILTER-04 フィルターに一致する Card がない場合は0件表示になる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck には Card が登録されている。
- 同じ Card が両方を持つことのないタグを AND 条件として保存済みで、一致する Card がない。

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面とも表示対象は0件で、フィルターに一致する Card がないことを示す。
- Card が未登録であるとは案内せず、条件を勝手に解除して全件表示に切り替えない。
- Card 一覧では選択タグと AND 条件を確認でき、条件の変更・解除を利用できる。
- 保存済みフィルターと学習条件は変わらず、Card の内容と学習履歴も変更されない。
- browser error が発生しない。

<a id="card-filter-05"></a>

### CARD-FILTER-05 リロード後も同じタグと AND / OR 条件を復元できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 一方だけ、他方だけ、両方、どちらも持たない Card を区別できる2つのタグがある。
- 対象 Deck の Card 一覧を開いており、Card フィルターは未設定である。
- AND と OR はそれぞれ独立した初期状態から確認する。

When:

- 2つのタグと対象の AND / OR 条件を選択し、自動保存後に Card 一覧をリロードする。
- 同じ Deck の閲覧画面を開き、その画面もリロードする。

Then:

- 選択タグと AND / OR 条件はリロード前と一致する。
- Card 一覧と Deck 閲覧の表示対象・件数は、保存した条件でのリロード前の結果と一致する。
- 条件が初期値や学習条件に置き換わらない。
- 対象 Deck の Card フィルターだけが保存され、他の Deck のフィルター、学習条件、Card、学習履歴、学習 session は変わらない。
- browser error が発生しない。

<a id="card-filter-06"></a>

### CARD-FILTER-06 フィルターを解除した状態もリロード後に維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card を持つ Deck の一覧でタグと AND 条件を保存済みで、表示対象が絞り込まれている。
- 学習用のタグ条件は Card フィルターとは別に保存されている。

When:

- Card フィルターを解除し、自動保存後に一覧をリロードして同じ Deck の閲覧画面を開く。

Then:

- 絞り込みなし・OR 条件が復元され、両画面でその Deck の全 Card を表示する。
- 解除前の条件が復活せず、学習条件を代わりに適用しない。
- 学習条件、他の Deck のフィルター、Card、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="card-filter-07"></a>

### CARD-FILTER-07 単一タグで Card を絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck に、選択するタグを持つ Card と持たない Card がある。
- 選択するタグを持つ Card には、学習条件では対象外になる Card も含まれる。
- Card 一覧は絞り込みなしで表示されている。

When:

- タグを1つ選択し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面とも選択タグを持つ Card だけを表示し、件数は一致する Card 数となる。
- ほかのタグも持つ Card を除外せず、学習条件による追加の絞り込みを行わない。
- 対象 Deck のフィルターだけが保存され、学習条件は変わらない。
- browser error が発生しない。

<a id="card-filter-08"></a>

### CARD-FILTER-08 AND 条件ですべての選択タグを持つ Card に絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck に、2つのタグの一方だけ、他方だけ、両方、どちらも持たない Card がある。
- Card 一覧は絞り込みなしで表示されている。

When:

- 2つのタグを選択して AND 条件を指定し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面とも選択したすべてのタグを持つ Card だけを表示する。
- 一方のタグだけを持つ Card と、どちらも持たない Card は表示しない。
- 件数は条件に一致する Card 数であり、対象 Deck のフィルターだけが保存される。
- 学習条件は変更されず、学習候補による追加の絞り込みも行わない。
- browser error が発生しない。

<a id="card-filter-09"></a>

### CARD-FILTER-09 OR 条件でいずれかの選択タグを持つ Card に絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck に、2つのタグの一方だけ、他方だけ、両方、どちらも持たない Card がある。
- Card 一覧は絞り込みなしで表示されている。

When:

- 2つのタグを選択して OR 条件を指定し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面とも選択タグのいずれかを持つ Card を表示し、どちらも持たない Card は表示しない。
- 両方のタグを持つ Card も1件として表示し、重複させない。
- 件数は条件に一致する Card 数であり、対象 Deck のフィルターだけが保存される。
- 学習条件は変更されず、学習候補による追加の絞り込みも行わない。
- browser error が発生しない。

<a id="card-filter-10"></a>

### CARD-FILTER-10 絞り込み結果を追加が新しい順にソートできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 対象 Deck に追加日時が異なる Card と、追加日時が同じ Card がある。
- Card 一覧は標準順で表示されている。
- 絞り込みなしの場合と、一部の Card に一致するタグを保存済みの場合をそれぞれ確認する。

When:

- Card 一覧の並び順で「追加が新しい順」を選択する。

Then:

- 表示対象の Card を追加日時の新しい順で表示する。同じ追加日時なら標準の相対順序を維持し、編集日時では順序を変えない。
- ソート前後で表示対象と件数、選択タグ、AND / OR 条件は変わらない。
- フィルターに一致しない Card をソートによって追加しない。
- ソート順は永続化せず、Card、学習条件、学習 session の順序・位置を変更しない。
- browser error が発生しない。

<a id="card-filter-11"></a>

### CARD-FILTER-11 絞り込み結果の表示順を標準へ戻せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 対象 Deck の Card 一覧は「追加が新しい順」で表示されている。
- 絞り込みなしの場合と、一部の Card に一致するタグを保存済みの場合をそれぞれ確認する。
- 確認中に Card の追加・編集・削除は行わない。

When:

- Card 一覧の並び順で「標準」を選択する。

Then:

- 現在のフィルターに一致する Card が標準の相対順序へ戻る。
- 表示対象と件数、選択タグ、AND / OR 条件は変わらない。
- Card、保存済みフィルター、学習条件、学習 session は変更されない。
- browser error が発生しない。
