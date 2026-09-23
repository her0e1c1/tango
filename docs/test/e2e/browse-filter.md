# Browse Filter E2E テスト仕様書

## 目的

Card 一覧（card-list）と Deck 閲覧（deck-view）を、学習用の tag filter と FSRS の復習期日による選別から分離する。
復習期日前の Card も閲覧・管理でき、一覧での絞り込みが学習条件を変更しないことを確認する。

Card 一覧の tag filter はその画面内の一時的な条件とし、初期状態は絞り込みなしとする。
Deck 閲覧は対象 Deck の全 Card を表示し、学習条件と Card 一覧の tag filter を引き継がない。
本書は変更後の期待仕様であり、各ケースの検証は未実装である。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| BROWSE-FILTER-01 | read | [学習条件にかかわらず Card 一覧を全件表示できる](#browse-filter-01) |
| BROWSE-FILTER-02 | read | [学習と一覧の条件を引き継がず Deck の全 Card を閲覧できる](#browse-filter-02) |
| BROWSE-FILTER-03 | read | [一覧専用の tag filter を AND / OR で適用できる](#browse-filter-03) |
| BROWSE-FILTER-04 | read | [一覧の絞り込み解除で学習条件を変えずに全件へ戻れる](#browse-filter-04) |
| BROWSE-FILTER-05 | write | [学習用の tag filter を変更しても閲覧対象は変わらない](#browse-filter-05) |
| BROWSE-FILTER-06 | write | [復習期日の設定を変更しても閲覧対象は変わらない](#browse-filter-06) |
| BROWSE-FILTER-07 | read | [全 Card が復習期日前でも一覧と Deck 閲覧を開ける](#browse-filter-07) |
| BROWSE-FILTER-08 | read | [一覧の再入場・再読込・Deck 変更で絞り込みを持ち越さない](#browse-filter-08) |

<a id="browse-filter-01"></a>

### BROWSE-FILTER-01 学習条件にかかわらず Card 一覧を全件表示できる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 認証済みユーザーが所有する Deck に、復習期日を過ぎた Card、復習期日前の Card、FSRS 未開始の Card が存在する。
- 学習用の tag filter が保存され、その条件に一致しない Card も同じ Deck に存在する。
- Respect review schedule が有効で、基準時刻は期限到来済み Card の期日より後、期限前 Card の期日より前である。
- Card 一覧ではまだ絞り込みを行っていない。

When:

- 対象 Deck の Card 一覧を開き、復習期日前の Card の裏面を表示してから、編集画面を開く。編集内容は保存しない。

Then:

- 一覧の tag filter は絞り込みなしで始まり、対象 Deck の全 Card とその件数を表示する。
- 復習期日前の Card と学習用の tag filter に一致しない Card も一覧に含まれる。
- 復習期日前の Card の裏面と編集画面を開ける。閲覧・編集画面を開くために復習期日の設定を変更する必要はない。
- 別の Deck の Card は表示しない。
- 保存済みの学習条件、Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-02"></a>

### BROWSE-FILTER-02 学習と一覧の条件を引き継がず Deck の全 Card を閲覧できる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 復習期日と tags が異なる Card がある Deck に、学習用の tag filter が保存されている。
- Respect review schedule が有効である。
- Card 一覧では、学習用とは異なるタグを選んで一部の Card だけを表示している。

When:

- Deck 一覧を経由して対象 Deck の View を開き、全 Card の表裏を順に閲覧する。

Then:

- 対象 Deck の全 Card を標準順で閲覧でき、総数は Deck 内の全 Card 数と一致する。
- 復習期日前、学習用の tag filter に不一致、Card 一覧の tag filter に不一致の Card も閲覧できる。
- 別の Deck の Card は表示しない。
- 学習条件、Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-03"></a>

### BROWSE-FILTER-03 一覧専用の tag filter を AND / OR で適用できる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 学習用のタグとは別に、期限到来済み Card と未評価 Card のみに共通するタグ、および期限前 Card と未評価 Card のみに共通するタグが存在する。
- Respect review schedule が有効である。
- 対象 Deck の Card 一覧を開いている。

When:

- その2つのタグを一覧で選択し、OR 条件と AND 条件でそれぞれ絞り込む。
- 学習開始画面へ移動する。学習は開始しない。

Then:

| 一覧の条件 | 一覧に表示する Card |
| --- | --- |
| OR | どちらかのタグを持つ、期限到来済み・期限前・未評価の Card |
| AND | 両方のタグを持つ未評価の Card のみ |

- 一覧の表示件数は、それぞれの条件に一致する Card 数と一致する。
- タグに一致する Card は復習期日前でも表示する。
- 学習開始画面のタグ選択と AND / OR 条件は保存済みの学習条件を維持し、一覧で選んだ条件に置き換わらない。
- 保存済みの学習条件、Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-04"></a>

### BROWSE-FILTER-04 一覧の絞り込み解除で学習条件を変えずに全件へ戻れる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 学習用の tag filter が保存され、Respect review schedule が有効である。
- 対象 Deck の一覧で、学習用のタグと、そのタグを持たない Card のタグを AND 条件で選択し、一致する Card がない状態である。

When:

- Card 一覧の絞り込み解除を実行し、その後、学習開始画面を開く。学習は開始しない。

Then:

- 一覧のタグ選択が解除され、復習期日前の Card を含む対象 Deck の全 Card とその件数が再表示される。
- 学習開始画面には保存済みの学習用 tag filter が残る。
- Respect review schedule は有効なままであり、学習条件に一致しても復習期日前の Card は学習候補に含まれない。
- Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-05"></a>

### BROWSE-FILTER-05 学習用の tag filter を変更しても閲覧対象は変わらない

カテゴリ: `write`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 対象 Deck に学習用の tag filter が保存され、その条件に一致しない Card も存在する。
- Card 一覧ではまだ絞り込みを行っていない。

When:

- 学習開始画面で、これまで学習条件から外れていた Card のタグだけを選択する。
- 保存後に Card 一覧と Deck 閲覧を開き、最後に学習開始画面を再読込する。学習は開始しない。

Then:

- Card 一覧は絞り込みなしで全件を表示し、Deck 閲覧でも同じ Deck の全 Card を閲覧できる。
- 学習開始画面には変更したタグ選択が保存されており、新しいタグ条件に一致する Card だけが学習候補となる。
- 明示的に変更した学習用の tag filter だけが保存される。
- Card の内容と FSRS、学習履歴、学習 session、復習期日の設定は変更されない。
- browser error が発生しない。

<a id="browse-filter-06"></a>

### BROWSE-FILTER-06 復習期日の設定を変更しても閲覧対象は変わらない

カテゴリ: `write`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Respect review schedule が有効であり、学習用のタグに一致する復習期日前の Card が存在する。
- Card 一覧では絞り込みを行っていない。

When:

- 設定画面で Respect review schedule を無効にし、Card 一覧、Deck 閲覧、学習開始画面を開く。学習は開始しない。

Then:

- Card 一覧と Deck 閲覧は、設定変更前と同じ全 Card を表示する。対象の Card と件数は変わらない。
- 学習開始画面では、学習用のタグに一致する復習期日前の Card も候補に含まれる。タグに一致しない Card は候補に含まれない。
- 復習期日の設定だけが保存され、学習用の tag filter は変更されない。
- Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-07"></a>

### BROWSE-FILTER-07 全 Card が復習期日前でも一覧と Deck 閲覧を開ける

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- 学習用のタグには一致するが、全 Card の復習期日が未来である Deck が存在する。
- Respect review schedule が有効で、未評価の Card と進行中の学習 session は存在しない。

When:

- その Deck の学習開始画面を開いた後、Card 一覧と Deck 閲覧を開く。

Then:

- 学習開始画面では今回学習できる Card がない旨を表示し、学習を開始できない。
- Card 一覧と Deck 閲覧では、その Deck の全 Card の表裏を確認できる。
- 閲覧画面で「Card が存在しない」または「復習期日まで閲覧できない」という空状態にはならない。
- 復習期日の設定を無効にせず閲覧でき、Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。

<a id="browse-filter-08"></a>

### BROWSE-FILTER-08 一覧の再入場・再読込・Deck 変更で絞り込みを持ち越さない

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card を持つ複数の Deck が存在し、それぞれ学習用の tag filter が保存されている。
- 一方の Deck の Card 一覧でタグを選択し、一部の Card に絞り込んでいる。

When:

- 次の操作を、それぞれ上記の状態から行う。

| 操作 | 操作後に確認する一覧 |
| --- | --- |
| Deck 一覧に戻り、同じ Deck の Card 一覧を再度開く | 元の Deck |
| 表示中の Card 一覧を再読込する | 元の Deck |
| 別の Deck の Card 一覧へ移動する | 移動先の Deck |

Then:

- 操作後の一覧はタグ選択なしで始まり、対象 Deck の全 Card を表示する。
- 以前の一覧条件や保存済みの学習条件を、一覧の初期値として引き継がない。
- 元の Deck と移動先の Deck の Card を混在させない。
- 各 Deck の保存済み学習条件、Card の内容と FSRS、学習履歴、学習 session は変更されない。
- browser error が発生しない。
