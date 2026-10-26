# Card Filter E2E テスト仕様書

## 目的

Card 一覧と Deck 閲覧で、学習条件から独立したタグの絞り込み、条件の保存、表示順を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-FILTER-01 | read | 正常系 | [学習条件にかかわらず Card を全件表示できる](#card-filter-01) |
| CARD-FILTER-02 | read | 正常系 | [他の Deck のフィルター条件にかかわらず Card を全件表示できる](#card-filter-02) |
| CARD-FILTER-03 | read | 正常系 | [Card が登録されていない Deck は0件表示になる](#card-filter-03) |
| CARD-FILTER-04 | read | 正常系 | [フィルターに一致する Card がない場合は0件表示になる](#card-filter-04) |
| CARD-FILTER-10 | read | 正常系 | [絞り込み結果を追加が新しい順にソートできる](#card-filter-10) |
| CARD-FILTER-11 | read | 正常系 | [絞り込み結果の表示順を標準へ戻せる](#card-filter-11) |
| CARD-FILTER-13 | read | 正常系 | [再読み込みでソートだけを標準へ戻しフィルターを維持する](#card-filter-13) |
| CARD-FILTER-14 | read | 正常系 | [別の Deck から戻ると元のフィルターを復元できる](#card-filter-14) |
| CARD-FILTER-15 | read | 正常系 | [Card 未登録の一覧から Card の追加へ進める](#card-filter-15) |
| CARD-FILTER-16 | read | 正常系 | [Card 未登録の Deck 閲覧から Deck 一覧へ戻れる](#card-filter-16) |
| CARD-FILTER-05 | write | 正常系 | [再読み込み後も同じタグと AND / OR 条件を復元できる](#card-filter-05) |
| CARD-FILTER-06 | write | 正常系 | [フィルターを解除した状態も再読み込み後に維持できる](#card-filter-06) |
| CARD-FILTER-07 | write | 正常系 | [単一タグで Card を絞り込める](#card-filter-07) |
| CARD-FILTER-08 | write | 正常系 | [AND 条件ですべての選択タグを持つ Card に絞り込める](#card-filter-08) |
| CARD-FILTER-09 | write | 正常系 | [OR 条件でいずれかの選択タグを持つ Card に絞り込める](#card-filter-09) |
| CARD-FILTER-12 | write | 正常系 | [タグ未選択なら AND / OR にかかわらず全件表示する](#card-filter-12) |

<a id="card-filter-01"></a>

### CARD-FILTER-01 学習条件にかかわらず Card を全件表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck の Card フィルターは未設定で、学習用タグ・復習期日・枚数上限・shuffle の設定が有効である。
- タグと学習状態が異なる Card があり、Card 数が学習枚数上限を超える場合と、保存済み学習条件では全 Card が対象外になる場合を確認する。

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面で全 Card とその件数を表示する。学習候補が0件でも全件を閲覧できる。
- フィルターは絞り込みなし・OR 条件で、学習条件を初期値にしない。

<a id="card-filter-02"></a>

### CARD-FILTER-02 他の Deck のフィルター条件にかかわらず Card を全件表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 一部の Card に絞り込むタグと AND 条件を保存した Deck の Card 一覧を開いている。
- 移動先の Deck には Card があり、フィルターは未設定である。移動元のタグでは一致しない Card もある。

When:

- 移動先の Card 一覧と Deck 閲覧を開く。

Then:

- 移動元の条件を引き継がず、絞り込みなし・OR 条件で全 Card を表示する。

<a id="card-filter-03"></a>

### CARD-FILTER-03 Card が登録されていない Deck は0件表示になる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck は Card 未登録で、フィルターも未設定である。別の Deck には Card がある。

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面で0件と Card 未登録を示し、Card を表示しない。学習条件による対象外とは案内しない。

<a id="card-filter-04"></a>

### CARD-FILTER-04 フィルターに一致する Card がない場合は0件表示になる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card がある Deck に、両方を持つ Card がない2つのタグを AND 条件で保存している。

When:

- 対象 Deck の Card 一覧と Deck 閲覧を開く。

Then:

- 両画面で0件とフィルター不一致を示す。Card 未登録とは案内せず、全件表示にも切り替えない。
- Card 一覧で選択タグと AND 条件を確認し、変更・解除できる。

<a id="card-filter-10"></a>

### CARD-FILTER-10 絞り込み結果を追加が新しい順にソートできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 追加日時が異なる Card と同じ Card があり、Card 一覧は標準順である。
- 絞り込みなしと、一部の Card に一致するタグを保存した状態をそれぞれ確認する。

When:

- 並び順で「追加が新しい順」を選択する。

Then:

- 追加日時の新しい順に表示する。同じ追加日時では標準の相対順序を保ち、編集日時は順序に影響しない。

<a id="card-filter-11"></a>

### CARD-FILTER-11 絞り込み結果の表示順を標準へ戻せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- Card 一覧は「追加が新しい順」である。
- 絞り込みなしと、一部の Card に一致するタグを保存した状態をそれぞれ確認する。確認中は Card を追加・編集・削除しない。

When:

- 並び順で「標準」を選択する。

Then:

- フィルターに一致する Card が標準の相対順序に戻る。

<a id="card-filter-13"></a>

### CARD-FILTER-13 [TODO] 再読み込みでソートだけを標準へ戻しフィルターを維持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`card-list-sort`](./fixture/card-list-sort.yaml)
- 一部の Card に一致するタグを保存し、Card 一覧を「追加が新しい順」で表示している。
- 標準順とは異なる並びで、確認中は Card を追加・編集・削除しない。

When:

- Card 一覧を再読み込みし、同じ Deck の閲覧画面も開く。

Then:

- 両画面は保存済みフィルターに一致する Card を標準の相対順序で表示する。
- 再読み込み前の選択タグ・AND / OR 条件・表示対象・件数を維持する。

<a id="card-filter-14"></a>

### CARD-FILTER-14 別の Deck から戻ると元のフィルターを復元できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 移動元の Deck には、一部の Card に絞り込むタグと AND 条件を保存している。
- 移動元を離れ、Card があるフィルター未設定の別 Deck の Card 一覧を経て Deck 閲覧を開いている。

When:

- 移動元の Card 一覧へ戻り、フィルター欄を開く。

Then:

- 保存済みの選択タグ・AND 条件・絞り込み結果が復元される。

<a id="card-filter-15"></a>

### CARD-FILTER-15 Card 未登録の一覧から Card の追加へ進める

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card 未登録・フィルター未設定の Deck の Card 一覧を開いている。

When:

- Card の追加操作を選択する。

Then:

- 対象 Deck の Card 作成画面へ移動する。

<a id="card-filter-16"></a>

### CARD-FILTER-16 Card 未登録の Deck 閲覧から Deck 一覧へ戻れる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card 未登録・フィルター未設定の Deck の閲覧画面を開いている。

When:

- Deck 一覧へ戻る操作を選択する。

Then:

- Deck 一覧へ移動する。

<a id="card-filter-05"></a>

### CARD-FILTER-05 再読み込み後も同じタグと AND / OR 条件を復元できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 2つのタグの一方だけ・他方だけ・両方・どちらも持たない Card がある。
- フィルター未設定の Card 一覧を開いている。AND と OR をそれぞれ独立した初期状態で確認する。

When:

- 2つのタグと AND / OR 条件を選択し、自動保存後に Card 一覧を再読み込みする。
- 同じ Deck の閲覧画面を開き、再読み込みする。

Then:

- 選択タグ・AND / OR 条件と、両画面の表示対象・件数が再読み込み前と一致する。初期値や学習条件に戻らない。

<a id="card-filter-06"></a>

### CARD-FILTER-06 フィルターを解除した状態も再読み込み後に維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card 一覧は保存済みのタグと AND 条件で絞り込まれている。学習用タグ条件は別に保存している。

When:

- フィルター欄の「クリア」でタグを解除し、自動保存後に一覧を再読み込みして同じ Deck の閲覧画面を開く。

Then:

- 絞り込みなし・OR 条件を復元し、両画面で全 Card を表示する。解除前の条件は復活しない。
- フィルター欄に重複する「フィルターを解除」ボタンは表示しない。

<a id="card-filter-07"></a>

### CARD-FILTER-07 単一タグで Card を絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象タグを持つ Card と持たない Card があり、対象タグ付きには学習条件では対象外の Card も含む。
- Card 一覧は絞り込みなしである。

When:

- タグを1つ選択し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面は対象タグを持つ Card だけを表示し、件数も一致する。ほかのタグも持つ Card を除外しない。

<a id="card-filter-08"></a>

### CARD-FILTER-08 AND 条件ですべての選択タグを持つ Card に絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 2つのタグの一方だけ・他方だけ・両方・どちらも持たない Card があり、一覧は絞り込みなしである。

When:

- 2つのタグと AND 条件を選択し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面は両方のタグを持つ Card だけを表示し、件数も一致する。

<a id="card-filter-09"></a>

### CARD-FILTER-09 OR 条件でいずれかの選択タグを持つ Card に絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 2つのタグの一方だけ・他方だけ・両方・どちらも持たない Card があり、一覧は絞り込みなしである。

When:

- 2つのタグと OR 条件を選択し、自動保存後に同じ Deck の閲覧画面も開く。

Then:

- 両画面は少なくとも一方のタグを持つ Card だけを表示する。両方を持つ Card も1件とし、件数も一致する。

<a id="card-filter-12"></a>

### CARD-FILTER-12 [TODO] タグ未選択なら AND / OR にかかわらず全件表示する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`browse-filter-empty-tags`](./fixture/browse-filter-empty-tags.yaml)
- タグ付きとタグなしの Card があり、一覧は絞り込みなしである。AND と OR を独立した入力例として確認する。

When:

- タグ未選択のまま AND / OR 条件を指定し、自動保存後に一覧を再読み込みして同じ Deck の閲覧画面も開く。

Then:

- 両画面でタグなしも含む全 Card を一度ずつ表示し、0件にはしない。
