# Card 一覧画面 Storybook 結合テスト仕様書

## 目的

Card 一覧画面を入口とした `play` で、対象 Deck の一覧、閲覧フィルター、タグ、一行ごとの操作と空状態を確認する。学習条件とは別の閲覧条件を扱う。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-LIST-01 | interaction | 正常系 | [Card 作成画面を開く](#storybook-card-list-01) |
| STORYBOOK-CARD-LIST-02 | render | 正常系 | [Card 未作成の空状態を表示する](#storybook-card-list-02) |
| STORYBOOK-CARD-LIST-03 | render | 正常系 | [フィルターによる0件状態を表示する](#storybook-card-list-03) |
| STORYBOOK-CARD-LIST-04 | render | 正常系 | [学習の復習期限で閲覧を0件にしない](#storybook-card-list-04) |
| STORYBOOK-CARD-LIST-05 | interaction | 正常系 | [選んだ Card を閲覧する](#storybook-card-list-05) |
| STORYBOOK-CARD-LIST-06 | interaction | 正常系 | [選択タグを解除して一覧を更新する](#storybook-card-list-06) |
| STORYBOOK-CARD-LIST-07 | interaction | 正常系 | [Card の拡大表示を閉じる](#storybook-card-list-07) |
| STORYBOOK-CARD-LIST-08 | interaction | 正常系 | [標準順に戻す](#storybook-card-list-08) |
| STORYBOOK-CARD-LIST-09 | interaction | 正常系 | [メニューから Card を編集する](#storybook-card-list-09) |
| STORYBOOK-CARD-LIST-10 | render | 正常系 | [空の理由を断定できない間は誤案内しない](#storybook-card-list-10) |
| STORYBOOK-CARD-LIST-11 | render | 正常系 | [長い選択タグの名前を確認できる](#storybook-card-list-11) |
| STORYBOOK-CARD-LIST-12 | interaction | 正常系 | [タグ解除後に残るタグへフォーカスを移す](#storybook-card-list-12) |
| STORYBOOK-CARD-LIST-13 | interaction | 正常系 | [最後のタグ解除後はフィルターへ戻る](#storybook-card-list-13) |
| STORYBOOK-CARD-LIST-14 | interaction | 正常系 | [Tab 移動だけでは選択を変えない](#storybook-card-list-14) |
| STORYBOOK-CARD-LIST-15 | interaction | 正常系 | [メニューを一つに保ち対象の削除で閉じる](#storybook-card-list-15) |
| STORYBOOK-CARD-LIST-16 | interaction | 正常系 | [並べ替え後も選んだ Card を操作する](#storybook-card-list-16) |
| STORYBOOK-CARD-LIST-17 | interaction | 正常系 | [空状態から Card 作成を始める](#storybook-card-list-17) |
| STORYBOOK-CARD-LIST-18 | interaction | 正常系 | [0件状態からフィルターを解除する](#storybook-card-list-18) |
| STORYBOOK-CARD-LIST-19 | interaction | 正常系 | [行の編集操作で対象を取り違えない](#storybook-card-list-19) |
| STORYBOOK-CARD-LIST-20 | render | 正常系 | [処理中の Card を操作させない](#storybook-card-list-20) |
| STORYBOOK-CARD-LIST-21 | interaction | 正常系 | [選んだ Card の削除を開始する](#storybook-card-list-21) |
| STORYBOOK-CARD-LIST-22 | render | 正常系 | [操作不可の Card にメニューを開かない](#storybook-card-list-22) |
| STORYBOOK-DECK-FILTER-01 | interaction | 正常系 | [閲覧タグをまとめて解除する](#storybook-deck-filter-01) |
| STORYBOOK-DECK-FILTER-02 | interaction | 正常系 | [折りたたまれたタグを表示する](#storybook-deck-filter-02) |
| STORYBOOK-DECK-FILTER-03 | interaction | 正常系 | [タグ選択を一覧へ反映する](#storybook-deck-filter-03) |
| STORYBOOK-DECK-FILTER-04 | interaction | 正常系 | [同じタグを重複して表示しない](#storybook-deck-filter-04) |
| STORYBOOK-DECK-FILTER-05 | interaction | 正常系 | [Any と All で絞り込み結果を変える](#storybook-deck-filter-05) |
| STORYBOOK-DECK-FILTER-06 | interaction | 正常系 | [候補から消えた選択タグも解除できる](#storybook-deck-filter-06) |
| STORYBOOK-DECK-FILTER-07 | interaction | 正常系 | [追加表示したタグをキーボードで選ぶ](#storybook-deck-filter-07) |
| STORYBOOK-DECK-FILTER-08 | interaction | 正常系 | [解除で隠れるタグからフォーカスを移す](#storybook-deck-filter-08) |
| STORYBOOK-DECK-FILTER-09 | interaction | 正常系 | [最後の候補外タグを解除する](#storybook-deck-filter-09) |
| STORYBOOK-DECK-FILTER-10 | interaction | 正常系 | [Clear が無効になる前にフォーカスを移す](#storybook-deck-filter-10) |
| STORYBOOK-DECK-FILTER-11 | render | 正常系 | [8件以下では追加表示操作を出さない](#storybook-deck-filter-11) |
| STORYBOOK-DECK-FILTER-12 | render | 正常系 | [タグ候補がなくても一致条件を保持する](#storybook-deck-filter-12) |
| STORYBOOK-DECK-FILTER-13 | render | 正常系 | [大量の選択タグをスクロールして確認する](#storybook-deck-filter-13) |
| STORYBOOK-DECK-FILTER-14 | render | 正常系 | [長い候補タグ名を確認できる](#storybook-deck-filter-14) |
| STORYBOOK-DECK-FILTER-15 | interaction | 正常系 | [言語が変わってもタグの展開を保つ](#storybook-deck-filter-15) |

<a id="storybook-card-list-01"></a>

### STORYBOOK-CARD-LIST-01 [TODO] Card 作成画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面に対象 Deck を表示している。

When:

- Card の追加を選ぶ。

Then:

- 同じ Deck の Card 作成画面が表示される。

<a id="storybook-card-list-02"></a>

### STORYBOOK-CARD-LIST-02 [TODO] Card 未作成の空状態を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card が一つもない。

When:

- Card 一覧画面を開く。

Then:

- Card がまだないことと、追加する操作が表示される。

<a id="storybook-card-list-03"></a>

### STORYBOOK-CARD-LIST-03 [TODO] フィルターによる0件状態を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card があるが、閲覧フィルターに一致するものはない。

When:

- Card 一覧画面を開く。

Then:

- 絞り込み結果が0件であることが表示され、Card 未作成の案内とは区別される。

<a id="storybook-card-list-04"></a>

### STORYBOOK-CARD-LIST-04 [TODO] 学習の復習期限で閲覧を0件にしない

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に復習期限が未来の Card だけがあり、閲覧フィルターは未指定である。

When:

- Card 一覧画面を開く。

Then:

- 対象 Deck の Card を全件表示でき、復習対象0件を理由に非表示にしない。

<a id="storybook-card-list-05"></a>

### STORYBOOK-CARD-LIST-05 [TODO] 選んだ Card を閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 内容の異なる二つの Card が一覧にある。

When:

- 片方の Card の閲覧を選ぶ。

Then:

- 選んだ Card の表面が表示され、もう片方の内容と取り違えない。

<a id="storybook-card-list-06"></a>

### STORYBOOK-CARD-LIST-06 [TODO] 選択タグを解除して一覧を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 二つのタグで絞り込んだ一覧を表示している。

When:

- 片方の選択タグを解除する。

Then:

- 解除したタグが選択表示から消え、残った条件に一致する Card が表示される。

<a id="storybook-card-list-07"></a>

### STORYBOOK-CARD-LIST-07 [TODO] Card の拡大表示を閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面から Card の拡大表示を開いている。

When:

- 閉じる操作を選ぶ。

Then:

- 拡大表示が閉じ、一覧を再び操作できる。

<a id="storybook-card-list-08"></a>

### STORYBOOK-CARD-LIST-08 [TODO] 標準順に戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で標準とは異なる順序を選んでいる。

When:

- 標準順を選ぶ。

Then:

- 標準順の選択が表示され、同じ Card 群が標準順に並ぶ。

<a id="storybook-card-list-09"></a>

### STORYBOOK-CARD-LIST-09 [TODO] メニューから Card を編集する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Card の操作メニューを開いている。

When:

- 編集を選ぶ。

Then:

- メニューが閉じ、同じ Card の編集画面が表示される。

<a id="storybook-card-list-10"></a>

### STORYBOOK-CARD-LIST-10 [TODO] 空の理由を断定できない間は誤案内しない

カテゴリ: `render`

区分: 正常系

Given:

- Card の表示準備中で、空である理由をまだ確定できない。

When:

- Card 一覧画面を確認する。

Then:

- Card 未作成やフィルター不一致と断定した案内は表示されない。

<a id="storybook-card-list-11"></a>

### STORYBOOK-CARD-LIST-11 [TODO] 長い選択タグの名前を確認できる

カテゴリ: `render`

区分: 正常系

Given:

- 長い名前のタグを閲覧フィルターで選択している。

When:

- Card 一覧画面の選択タグを確認する。

Then:

- タグ名が失われず、表示または読み上げ名から名前を確認できる。

<a id="storybook-card-list-12"></a>

### STORYBOOK-CARD-LIST-12 [TODO] タグ解除後に残るタグへフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の選択タグが表示され、一つの解除操作にフォーカスしている。

When:

- そのタグをキーボードで解除する。

Then:

- 残ったタグの解除操作へフォーカスが移り、続けて操作できる。

<a id="storybook-card-list-13"></a>

### STORYBOOK-CARD-LIST-13 [TODO] 最後のタグ解除後はフィルターへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択タグが一つだけあり、その解除操作にフォーカスしている。

When:

- タグを解除する。

Then:

- 選択タグが消え、フィルター操作へフォーカスが戻る。

<a id="storybook-card-list-14"></a>

### STORYBOOK-CARD-LIST-14 [TODO] Tab 移動だけでは選択を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で閲覧タグを選択している。

When:

- Tab でフィルター内を移動する。

Then:

- フォーカスだけが移り、選択タグと絞り込み結果は変わらない。

<a id="storybook-card-list-15"></a>

### STORYBOOK-CARD-LIST-15 [TODO] メニューを一つに保ち対象の削除で閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card があり、一つのメニューを開いている。

When:

- 別の Card のメニューを開き、その Card が外部更新で一覧から消える。

Then:

- 二つのメニューは同時に表示されず、消えた Card のメニューも残らない。

<a id="storybook-card-list-16"></a>

### STORYBOOK-CARD-LIST-16 [TODO] 並べ替え後も選んだ Card を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- 一つの Card の操作メニューを開いている。

When:

- Card の表示順が変わった後、編集を選ぶ。

Then:

- 行の位置ではなく、メニューを開いた Card の編集画面が表示される。

<a id="storybook-card-list-17"></a>

### STORYBOOK-CARD-LIST-17 [TODO] 空状態から Card 作成を始める

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に Card がなく、空状態の案内が表示されている。

When:

- 案内から追加を選ぶ。

Then:

- 同じ Deck の Card 作成画面が表示される。

<a id="storybook-card-list-18"></a>

### STORYBOOK-CARD-LIST-18 [TODO] 0件状態からフィルターを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card は存在するが、閲覧フィルターで0件になっている。

When:

- 0件の案内からフィルターを解除する。

Then:

- 選択条件が解除され、対象 Deck の Card が表示される。

<a id="storybook-card-list-19"></a>

### STORYBOOK-CARD-LIST-19 [TODO] 行の編集操作で対象を取り違えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 内容の異なる複数の Card が一覧にある。

When:

- 一つの行の編集操作を選ぶ。

Then:

- その Card の表面・裏面を持つ編集画面が表示される。

<a id="storybook-card-list-20"></a>

### STORYBOOK-CARD-LIST-20 [TODO] 処理中の Card を操作させない

カテゴリ: `render`

区分: 正常系

Given:

- 一覧の一つの Card が処理中で、他の Card は処理中ではない。

When:

- Card 一覧画面を確認する。

Then:

- 処理中の行の操作は無効になり、他の Card は操作できる。

<a id="storybook-card-list-21"></a>

### STORYBOOK-CARD-LIST-21 [TODO] 選んだ Card の削除を開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card が一覧にある。

When:

- 一つの Card の削除操作を選ぶ。

Then:

- その Card が削除対象として扱われ、別の Card が対象にならない。確認が必要な場合は確定前に一覧から消えない。

<a id="storybook-card-list-22"></a>

### STORYBOOK-CARD-LIST-22 [TODO] 操作不可の Card にメニューを開かない

カテゴリ: `render`

区分: 正常系

Given:

- Card のメニュー操作が無効な状態である。

When:

- メニューを開く操作を試みる。

Then:

- 操作メニューが表示されず、Card の内容も変わらない。

<a id="storybook-deck-filter-01"></a>

### STORYBOOK-DECK-FILTER-01 [TODO] 閲覧タグをまとめて解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で複数の閲覧タグを選択している。

When:

- Clear を選ぶ。

Then:

- 選択タグがなくなり、タグで除外されていた Card も表示される。

<a id="storybook-deck-filter-02"></a>

### STORYBOOK-DECK-FILTER-02 [TODO] 折りたたまれたタグを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面のタグ候補が折りたたまれている。

When:

- 追加のタグを表示する操作を選ぶ。

Then:

- 隠れていたタグが表示され、選択できる。

<a id="storybook-deck-filter-03"></a>

### STORYBOOK-DECK-FILTER-03 [TODO] タグ選択を一覧へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面にタグ A を持つ Card と持たない Card がある。

When:

- タグ A を選ぶ。

Then:

- タグ A が選択済みになり、A を持つ Card だけが表示される。

<a id="storybook-deck-filter-04"></a>

### STORYBOOK-DECK-FILTER-04 [TODO] 同じタグを重複して表示しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card が同じタグを持つ Deck の一覧を開いている。

When:

- そのタグを選ぶ。

Then:

- 候補と選択表示に同名のタグが重複せず、タグによる絞り込みが適用される。

<a id="storybook-deck-filter-05"></a>

### STORYBOOK-DECK-FILTER-05 [TODO] Any と All で絞り込み結果を変える

カテゴリ: `interaction`

区分: 正常系

Given:

- タグ A のみ、B のみ、A と B の両方を持つ3枚の Card がある。

When:

- A と B を選び、Any から All へ切り替える。

Then:

- Any では3枚、All では両方のタグを持つ1枚が表示される。

<a id="storybook-deck-filter-06"></a>

### STORYBOOK-DECK-FILTER-06 [TODO] 候補から消えた選択タグも解除できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧フィルターには選択タグがあるが、その一部を持つ Card がなくなっている。

When:

- タグ候補を開く。

Then:

- 選択済みのタグが見つけやすい位置に残り、候補外になったタグも解除できる。

<a id="storybook-deck-filter-07"></a>

### STORYBOOK-DECK-FILTER-07 [TODO] 追加表示したタグをキーボードで選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- タグ候補が折りたたまれている。

When:

- 候補を展開し、キーボードで追加表示されたタグへ移動して選ぶ。

Then:

- 対象タグが選択済みになり、その条件で一覧が更新される。

<a id="storybook-deck-filter-08"></a>

### STORYBOOK-DECK-FILTER-08 [TODO] 解除で隠れるタグからフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択中であることによって表示されているタグにフォーカスしている。

When:

- そのタグを解除する。

Then:

- タグが隠れても、表示中の操作へフォーカスが移り、操作を続けられる。

<a id="storybook-deck-filter-09"></a>

### STORYBOOK-DECK-FILTER-09 [TODO] 最後の候補外タグを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card が持たなくなったタグだけを選択している。

When:

- そのタグを解除する。

Then:

- 候補外タグが選択表示から消え、存在しないタグにフォーカスが残らない。

<a id="storybook-deck-filter-10"></a>

### STORYBOOK-DECK-FILTER-10 [TODO] Clear が無効になる前にフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択タグがあり、Clear にフォーカスしている。

When:

- すべてのタグを解除する。

Then:

- Clear が無効になってもフォーカスを失わず、利用可能なフィルター操作へ移る。

<a id="storybook-deck-filter-11"></a>

### STORYBOOK-DECK-FILTER-11 [TODO] 8件以下では追加表示操作を出さない

カテゴリ: `render`

区分: 正常系

Given:

- タグ候補が8件以下である。

When:

- Card 一覧画面のフィルターを開く。

Then:

- すべての候補を表示し、追加表示のためのボタンは表示しない。

<a id="storybook-deck-filter-12"></a>

### STORYBOOK-DECK-FILTER-12 [TODO] タグ候補がなくても一致条件を保持する

カテゴリ: `render`

区分: 正常系

Given:

- タグ候補がなく、閲覧フィルターの一致条件は All である。

When:

- Card 一覧画面のフィルターを開く。

Then:

- 候補がないことだけでは Any に変更されず、All の選択が保たれる。

<a id="storybook-deck-filter-13"></a>

### STORYBOOK-DECK-FILTER-13 [TODO] 大量の選択タグをスクロールして確認する

カテゴリ: `render`

区分: 正常系

Given:

- 一画面に収まらない数の閲覧タグを選択している。

When:

- 選択タグの領域をスクロールする。

Then:

- すべての選択タグを確認・解除でき、一覧の操作が画面外へ押し出され続けない。

<a id="storybook-deck-filter-14"></a>

### STORYBOOK-DECK-FILTER-14 [TODO] 長い候補タグ名を確認できる

カテゴリ: `render`

区分: 正常系

Given:

- 長い名前のタグ候補がある。

When:

- Card 一覧画面のフィルターを開く。

Then:

- 候補の名前を表示または読み上げ名で確認でき、選択後も同じ名前を確認できる。

<a id="storybook-deck-filter-15"></a>

### STORYBOOK-DECK-FILTER-15 [TODO] 言語が変わってもタグの展開を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で追加のタグ候補を展開している。

When:

- 表示言語を日本語へ変更する。

Then:

- 操作名が日本語へ変わり、展開状態とタグ名と選択内容は保たれる。
