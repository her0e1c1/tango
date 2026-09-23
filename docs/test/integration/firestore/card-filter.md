# Card Filter Firestore 結合テスト仕様書

## 目的

[Card Filter E2E](../../e2e/card-filter.md) に必要な、Deck ごとの閲覧用フィルターの保存・復元・購読を確認する。
Card 一覧と Deck 閲覧で共有する選択タグと AND / OR 条件を対象とし、学習条件とは独立して扱う。
復習期日や FSRS に限らず、学習用のタグ、枚数上限、shuffle などの学習条件をフィルターの初期値や保存値に流用しない。

画面遷移、リロード、表示件数、タグの AND / OR による絞り込み結果は E2E 側で確認する。
ソート順は永続化対象に含めず、Card 一覧のソート操作と Deck 閲覧の標準順も E2E 側で扱う。
保存先のコレクション名やフィールド名、内部関数の呼出順は本書では規定しない。

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-FILTER-01 | read | 正常系 | [未設定の Deck は学習条件や他 Deck に依存せず既定値で取得できる](#firestore-card-filter-01) |
| FIRESTORE-CARD-FILTER-02 | write | 正常系 | [選択タグと AND / OR 条件を保存して復元できる](#firestore-card-filter-02) |
| FIRESTORE-CARD-FILTER-03 | write | 正常系 | [保存済みフィルターを新しい条件に置き換えられる](#firestore-card-filter-03) |
| FIRESTORE-CARD-FILTER-04 | write | 正常系 | [解除した状態を保存して復元できる](#firestore-card-filter-04) |
| FIRESTORE-CARD-FILTER-05 | write | 正常系 | [Deck ごとのフィルターを独立して保存できる](#firestore-card-filter-05) |
| FIRESTORE-CARD-FILTER-06 | write | 正常系 | [学習用タグ条件の変更で Card フィルターを上書きしない](#firestore-card-filter-06) |
| FIRESTORE-CARD-FILTER-07 | read | 正常系 | [購読中の変更・解除を対象 Deck に反映できる](#firestore-card-filter-07) |

<a id="firestore-card-filter-01"></a>

### FIRESTORE-CARD-FILTER-01 未設定の Deck は学習条件や他 Deck に依存せず既定値で取得できる

カテゴリ: `read`

区分: 正常系

Given:

- 対象 Deck には学習用のタグと AND 条件が保存されているが、Card フィルターは一度も保存されていない。
- 別の Deck には Card フィルターとして `tag-other` と AND 条件を保存済みである。
- 対象 Deck に Card がある場合と、Card が0枚の場合をそれぞれ確認する。

When:

- 本人の Deck の購読を開始し、対象 Deck の Card フィルターを取得する。

Then:

- 対象 Deck のフィルターは選択タグなし・OR 条件となり、既存 Deck でも取得に失敗しない。
- 学習用のタグ条件や別の Deck のフィルターをコピーしない。
- 別の Deck は保存済みの `tag-other`・AND 条件のままである。
- 読取だけでフィルターの既定値を書き込まず、保存済みデータを変更しない。

<a id="firestore-card-filter-02"></a>

### FIRESTORE-CARD-FILTER-02 選択タグと AND / OR 条件を保存して復元できる

カテゴリ: `write`

区分: 正常系

Given:

- 対象 Deck の Card フィルターは未設定で、学習用のタグ条件は保存されている。
- 次の入力を、それぞれ独立した初期状態から確認する。

| 選択タグ | 条件 |
| --- | --- |
| `tag-a` | OR |
| `tag-a`, `tag-b` | AND |
| `tag-a`, `tag-b` | OR |

When:

- 対象 Deck の Card フィルターを指定した入力で保存し、保存値の確認後に購読し直す。

Then:

- 選択タグと AND / OR 条件が対象 Deck のフィルターとして保存され、同じ条件を復元できる。
- 初期値や学習用のタグ条件に置き換わらない。
- 学習条件と、対象 Deck の名前・URL・公開設定・作成日時は変わらない。保存に伴う更新日時の変更は許容する。

<a id="firestore-card-filter-03"></a>

### FIRESTORE-CARD-FILTER-03 保存済みフィルターを新しい条件に置き換えられる

カテゴリ: `write`

区分: 正常系

Given:

- 対象 Deck の Card フィルターに `tag-a`, `tag-b` と AND 条件を保存済みである。
- 学習用のタグ条件と、Card・学習履歴・学習 session が存在し、変更前の保存値を取得している。

When:

- Card フィルターを `tag-b`, `tag-c` と OR 条件に変更して保存し、購読し直す。

Then:

- 保存値と復元値は `tag-b`, `tag-c`・OR 条件となり、以前の `tag-a` や AND 条件は残らない。
- タグを追記するのではなく、新しい選択内容に置き換える。
- 学習条件、Card の本文・タグ・学習状態、学習履歴、学習 session の保存値は変更されず、新しい履歴や session も作成されない。

<a id="firestore-card-filter-04"></a>

### FIRESTORE-CARD-FILTER-04 解除した状態を保存して復元できる

カテゴリ: `write`

区分: 正常系

Given:

- 対象 Deck の Card フィルターに `tag-a`, `tag-b` と AND 条件を保存済みである。
- 学習用のタグ条件は Card フィルターとは別に保存されている。
- Card・学習履歴・学習 session が存在し、解除前の保存値を取得している。

When:

- 対象 Deck の Card フィルターを解除して保存し、購読し直す。

Then:

- 選択タグなし・OR 条件を復元でき、解除前の条件は復活しない。
- 学習用のタグ条件を代わりに適用しない。
- 学習条件、Card の本文・タグ・学習状態、学習履歴、学習 session の保存値は変更されず、新しい履歴や session も作成されない。

<a id="firestore-card-filter-05"></a>

### FIRESTORE-CARD-FILTER-05 Deck ごとのフィルターを独立して保存できる

カテゴリ: `write`

区分: 正常系

Given:

- Deck A のフィルターは `tag-a`・AND 条件、Deck B は `tag-b`・OR 条件で保存されている。
- Deck C のフィルターは未設定である。
- 次の操作はそれぞれ独立した初期状態から確認する。

| Deck A への操作 | Deck A の期待条件 |
| --- | --- |
| `tag-c`・OR 条件へ変更して保存する | `tag-c`・OR 条件 |
| フィルターを解除して保存する | 選択タグなし・OR 条件 |

When:

- Deck A に対象の操作を行い、A・B・C を購読し直す。

Then:

- Deck A には操作後の条件が保存され、その条件を復元できる。
- Deck B は `tag-b`・OR 条件のままであり、保存値も変わらない。
- Deck C は選択タグなし・OR 条件として取得でき、フィルターは未保存のままである。
- Deck A の条件を他の Deck に保存・適用しない。

<a id="firestore-card-filter-06"></a>

### FIRESTORE-CARD-FILTER-06 学習用タグ条件の変更で Card フィルターを上書きしない

カテゴリ: `write`

区分: 正常系

Given:

- 対象 Deck の Card フィルターに `browse-a`, `browse-b` と AND 条件を保存済みである。
- 同じ Deck の学習用タグ条件は `study-a`・AND 条件で保存されている。

When:

- 学習用タグ条件だけを `study-b`・OR 条件に変更して保存し、購読し直す。

Then:

- 学習用タグ条件は `study-b`・OR 条件として保存される。
- Card フィルターの保存値と復元値は `browse-a`, `browse-b`・AND 条件のままである。
- 閲覧用と学習用の条件が互いの値を上書きしない。

<a id="firestore-card-filter-07"></a>

### FIRESTORE-CARD-FILTER-07 購読中の変更・解除を対象 Deck に反映できる

カテゴリ: `read`

区分: 正常系

Given:

- Deck A と Deck B のフィルターを購読中で、それぞれの保存済み条件を取得している。
- Deck A は `tag-a`・OR 条件、Deck B は `tag-b`・AND 条件である。
- 各操作は独立した初期状態から確認し、書込側と購読側でアプリケーションの状態を共有しない。

| Deck A に保存する内容 | 購読側の期待条件 |
| --- | --- |
| `tag-c`, `tag-d`・AND 条件。一致する Card は0枚である | `tag-c`, `tag-d`・AND 条件 |
| フィルターの解除 | 選択タグなし・OR 条件 |

When:

- 別の接続から Deck A に対象の内容を保存し、購読側でサーバーと同期した変更を待つ。

Then:

- 購読を開始し直さなくても Deck A の条件が期待値になる。
- 一致する Card がなくても、保存した条件を勝手に解除・変更しない。
- Deck B の取得値と保存値は `tag-b`・AND 条件のままである。
- 購読エラーは通知されない。
