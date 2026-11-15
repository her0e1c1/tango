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
| STORYBOOK-CARD-LIST-23 | interaction | 正常系 | [開いた時点の解答を開き直すまで保持する](#storybook-card-list-23) |
| STORYBOOK-CARD-LIST-24 | interaction | 正常系 | [起点の Card が消えた後は並び順へ戻る](#storybook-card-list-24) |
| STORYBOOK-CARD-LIST-25 | interaction | 正常系 | [解答プレビュー中も通知を確認できる](#storybook-card-list-25) |
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
| STORYBOOK-CARD-LIST-26 | interaction | 正常系 | [Card を追加が新しい順に表示できる](#storybook-card-list-26) |
| STORYBOOK-CARD-LIST-27 | interaction | 正常系 | [Card の表示順を標準へ戻せる](#storybook-card-list-27) |
| STORYBOOK-CARD-LIST-28 | interaction | 正常系 | [並び替え後も選択した Card のプレビューと行操作を利用できる](#storybook-card-list-28) |
| STORYBOOK-CARD-LIST-29 | interaction | 正常系 | [別 Card の変更後も行のフォーカスとメニューを維持できる](#storybook-card-list-29) |
| STORYBOOK-CARD-LIST-30 | interaction | 正常系 | [フィルター保存中も並び替えでき、禁止中の操作は実行できない](#storybook-card-list-30) |
| STORYBOOK-CARD-LIST-31 | interaction | 正常系 | [画面を離れるか Deck を変更すると並び順が標準に戻る](#storybook-card-list-31) |
| STORYBOOK-CARD-LIST-32 | interaction | 正常系 | [フィルター保存中に変更しても最後の選択を維持できる](#storybook-card-list-32) |
| STORYBOOK-CARD-LIST-33 | interaction | 正常系 | [言語やフィルターを変更しても並び順を保持できる](#storybook-card-list-33) |
| STORYBOOK-CARD-LIST-34 | interaction | 異常系 | [フィルター保存失敗後も選択を維持して次の変更を保存できる](#storybook-card-list-34) |
| STORYBOOK-CARD-LIST-35 | interaction | 正常系 | [Card の解答プレビューを開ける](#storybook-card-list-35) |
| STORYBOOK-CARD-LIST-36 | interaction | 正常系 | [Card の解答プレビューを閉じて一覧へ戻れる](#storybook-card-list-36) |
| STORYBOOK-CARD-LIST-37 | interaction | 正常系 | [解答の文章を選択できる](#storybook-card-list-37) |
| STORYBOOK-CARD-LIST-38 | interaction | 正常系 | [解答のリンクと脚注をたどれる](#storybook-card-list-38) |
| STORYBOOK-CARD-LIST-39 | interaction | 正常系 | [解答の本文をキーボードで縦にスクロールできる](#storybook-card-list-39) |
| STORYBOOK-CARD-LIST-40 | interaction | 正常系 | [解答のコードをキーボードで横にスクロールできる](#storybook-card-list-40) |
| STORYBOOK-CARD-LIST-41 | interaction | 正常系 | [解答の数式をキーボードで横にスクロールできる](#storybook-card-list-41) |
| STORYBOOK-CARD-LIST-42 | render | 正常系 | [Card 一覧に学習情報を表示できる](#storybook-card-list-42) |
| STORYBOOK-CARD-LIST-43 | interaction | 異常系 | [存在しない Deck から復帰できる](#storybook-card-list-43) |
| STORYBOOK-CARD-LIST-44 | interaction | 正常系 | [Card の削除を取り消せる](#storybook-card-list-44) |
| STORYBOOK-CARD-LIST-45 | interaction | 正常系 | [削除成功の応答後に一覧を更新する](#storybook-card-list-45) |
| STORYBOOK-CARD-LIST-46 | interaction | 異常系 | [削除失敗の応答後に同じ Card を再試行する](#storybook-card-list-46) |
| STORYBOOK-CARD-LIST-47 | interaction | 異常系 | [読めない Card の件数と結果の回復を表示する](#storybook-card-list-47) |
| STORYBOOK-CARD-LIST-48 | interaction | 正常系 | [Card 一覧からキーボードで画面を移る](#storybook-card-list-48) |
| STORYBOOK-CARD-LIST-49 | interaction | 正常系 | [フィルター不一致の0件から条件を確認して変更する](#storybook-card-list-49) |
| STORYBOOK-CARD-LIST-50 | render | 正常系 | [同じ Deck のタグだけを重複なく候補にする](#storybook-card-list-50) |

<a id="storybook-card-list-01"></a>

### STORYBOOK-CARD-LIST-01 Card 作成画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面に対象 Deck を表示している。

When:

- Card の追加を選ぶ。

Then:

- 同じ Deck の Card 作成画面が表示される。

<a id="storybook-card-list-02"></a>

### STORYBOOK-CARD-LIST-02 Card 未作成の空状態を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card が一つもない。

When:

- Card 一覧画面を開く。

Then:

- Card がまだないことと、追加する操作が表示される。

<a id="storybook-card-list-03"></a>

### STORYBOOK-CARD-LIST-03 フィルターによる0件状態を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card があるが、閲覧フィルターに一致するものはない。

When:

- Card 一覧画面を開く。

Then:

- 絞り込み結果が0件であることが表示され、Card 未作成の案内とは区別される。

<a id="storybook-card-list-04"></a>

### STORYBOOK-CARD-LIST-04 学習の復習期限で閲覧を0件にしない

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に復習期限が未来の Card だけがあり、閲覧フィルターは未指定である。

When:

- Card 一覧画面を開く。

Then:

- 対象 Deck の Card を全件表示でき、復習対象0件を理由に非表示にしない。

<a id="storybook-card-list-05"></a>

### STORYBOOK-CARD-LIST-05 選んだ Card を閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 内容の異なる二つの Card が一覧にある。

When:

- Enter・Space・ポインターで対象 Card の閲覧を選ぶ。

Then:

- 選んだ Card の名前付きプレビューに表面と解答を表示し、もう片方の内容と取り違えない。
- プレビュー内へフォーカスが移り、背景操作と画面移動のショートカットは利用できない。

<a id="storybook-card-list-06"></a>

### STORYBOOK-CARD-LIST-06 選択タグを解除して一覧を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 二つのタグで絞り込んだ一覧を表示している。

When:

- 片方の選択タグを解除する。

Then:

- 解除したタグが選択表示から消え、残った条件に一致する Card が表示される。

<a id="storybook-card-list-07"></a>

### STORYBOOK-CARD-LIST-07 Card の拡大表示を閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面から Card の拡大表示を開いている。

When:

- 閉じる操作を選ぶ。

Then:

- 拡大表示が閉じ、接続済みで操作可能な元の表示ボタンへフォーカスが戻る。
- 一覧を再び操作できる。

<a id="storybook-card-list-08"></a>

### STORYBOOK-CARD-LIST-08 標準順に戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で標準とは異なる順序を選んでいる。

When:

- 標準順を選ぶ。

Then:

- 標準順の選択が表示され、同じ Card 群が標準順に並ぶ。

<a id="storybook-card-list-09"></a>

### STORYBOOK-CARD-LIST-09 メニューから Card を編集する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Card の操作メニューを開いている。

When:

- 編集を選ぶ。

Then:

- メニューが閉じ、同じ Card の編集画面が表示される。

<a id="storybook-card-list-10"></a>

### STORYBOOK-CARD-LIST-10 空の理由を断定できない間は誤案内しない

カテゴリ: `render`

区分: 正常系

Given:

- Card の表示準備中で、空である理由をまだ確定できない。

When:

- Card 一覧画面を確認する。

Then:

- Card 未作成やフィルター不一致と断定した案内は表示されない。

<a id="storybook-card-list-11"></a>

### STORYBOOK-CARD-LIST-11 長い選択タグの名前を確認できる

カテゴリ: `render`

区分: 正常系

Given:

- 長い名前のタグを閲覧フィルターで選択している。

When:

- Card 一覧画面の選択タグを確認する。

Then:

- タグ名が失われず、表示または読み上げ名から名前を確認できる。

<a id="storybook-card-list-12"></a>

### STORYBOOK-CARD-LIST-12 タグ解除後に残るタグへフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の選択タグが表示され、一つの解除操作にフォーカスしている。

When:

- そのタグをキーボードで解除する。

Then:

- 残ったタグの解除操作へフォーカスが移り、続けて操作できる。

<a id="storybook-card-list-13"></a>

### STORYBOOK-CARD-LIST-13 最後のタグ解除後はフィルターへ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択タグが一つだけあり、その解除操作にフォーカスしている。

When:

- タグを解除する。

Then:

- 選択タグが消え、フィルター操作へフォーカスが戻る。

<a id="storybook-card-list-14"></a>

### STORYBOOK-CARD-LIST-14 Tab 移動だけでは選択を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で閲覧タグを選択している。

When:

- Tab でフィルター内を移動する。

Then:

- フォーカスだけが移り、選択タグと絞り込み結果は変わらない。

<a id="storybook-card-list-15"></a>

### STORYBOOK-CARD-LIST-15 メニューを一つに保ち対象の削除で閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card があり、一つのメニューを開いている。

When:

- 別の Card のメニューを開き、その Card が外部更新で一覧から消える。

Then:

- 二つのメニューは同時に表示されず、消えた Card のメニューも残らない。

<a id="storybook-card-list-16"></a>

### STORYBOOK-CARD-LIST-16 並べ替え後も選んだ Card を操作する

カテゴリ: `interaction`

区分: 正常系

Given:

- 一つの Card の操作メニューを開いている。

When:

- Card の表示順が変わった後、編集を選ぶ。

Then:

- 行の位置ではなく、メニューを開いた Card の編集画面が表示される。

<a id="storybook-card-list-17"></a>

### STORYBOOK-CARD-LIST-17 空状態から Card 作成を始める

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に Card がなく、空状態の案内が表示されている。

When:

- 案内から追加を選ぶ。

Then:

- 同じ Deck の Card 作成画面が表示される。

<a id="storybook-card-list-18"></a>

### STORYBOOK-CARD-LIST-18 0件状態からフィルターを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card は存在するが、閲覧フィルターで0件になっている。

When:

- 0件の案内からフィルターを解除する。

Then:

- 選択条件が解除され、対象 Deck の Card が表示される。

<a id="storybook-card-list-19"></a>

### STORYBOOK-CARD-LIST-19 行の編集操作で対象を取り違えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 内容の異なる複数の Card が一覧にある。

When:

- 一つの行の編集操作を選ぶ。

Then:

- その Card の表面・裏面を持つ編集画面が表示される。

<a id="storybook-card-list-20"></a>

### STORYBOOK-CARD-LIST-20 処理中の Card を操作させない

カテゴリ: `render`

区分: 正常系

Given:

- 一覧の一つの Card の削除を確定し、確認モーダルで処理結果を待っている。

When:

- Card 一覧画面を確認する。

Then:

- 削除処理中は対象の再操作と背景の Card 操作を受け付けない。
- 処理が完了するとモーダルが閉じ、残った Card を操作できる。

<a id="storybook-card-list-21"></a>

### STORYBOOK-CARD-LIST-21 選んだ Card の削除を開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card が一覧にある。

When:

- 一つの Card の削除操作を選ぶ。

Then:

- その Card が削除対象として扱われ、別の Card が対象にならない。確認が必要な場合は確定前に一覧から消えない。

<a id="storybook-card-list-22"></a>

### STORYBOOK-CARD-LIST-22 操作不可の Card にメニューを開かない

カテゴリ: `render`

区分: 正常系

Given:

- Card のメニュー操作が無効な状態である。

When:

- メニューを開く操作を試みる。

Then:

- 操作メニューが表示されず、Card の内容も変わらない。

<a id="storybook-card-list-23"></a>

### STORYBOOK-CARD-LIST-23 開いた時点の解答を開き直すまで保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧から長い解答を開き、本文を途中までスクロールしている。対象 Deck には学習中のセッションがある。

When:

- 同じ Card の本文とタグの更新を受け取り、プレビューを閉じて同じ Card を開き直す。

Then:

- 閲覧中は開いた時点の本文とタグによる表示、読み取り位置とフォーカスを維持する。
- 一覧の更新後も同じ起点へ戻り、開き直すと新しい本文とタグによる表示になる。
- プレビューの開閉は Card・Deck・セッション・設定を変更しない。

<a id="storybook-card-list-24"></a>

### STORYBOOK-CARD-LIST-24 起点の Card が消えた後は並び順へ戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧から解答プレビューを開いている。

When:

- 更新により起点の Card を含む一覧の全 Card がなくなり、残っている解答プレビューを閉じる。

Then:

- プレビューが閉じ、別の Card や画面外へ移らず、並び順操作へフォーカスが移る。
- 一覧は Card 未作成の案内を表示する。

<a id="storybook-card-list-25"></a>

### STORYBOOK-CARD-LIST-25 解答プレビュー中も通知を確認できる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧から解答プレビューを開いている。

When:

- 自動では消えない警告通知を受け取り、通知を消さずに解答プレビューを閉じる。

Then:

- 表示中のプレビュー内で同じ通知の表示と読み上げ領域を一つだけ利用できる。通知はフォーカスを奪わず、背景の通知を消す操作は利用できない。
- プレビューを閉じても通知を失わず、通常の通知表示と通知を消す操作へ戻る。フォーカスは元の Card の表示操作へ戻る。

<a id="storybook-deck-filter-01"></a>

### STORYBOOK-DECK-FILTER-01 閲覧タグをまとめて解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で複数の閲覧タグを選択している。

When:

- Clear を選ぶ。

Then:

- 選択タグがなくなり、タグで除外されていた Card も表示される。

<a id="storybook-deck-filter-02"></a>

### STORYBOOK-DECK-FILTER-02 折りたたまれたタグを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面のタグ候補が折りたたまれている。

When:

- 追加のタグを表示する操作を選ぶ。

Then:

- 隠れていたタグが表示され、選択できる。

<a id="storybook-deck-filter-03"></a>

### STORYBOOK-DECK-FILTER-03 タグ選択を一覧へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面にタグ A を持つ Card と持たない Card がある。

When:

- タグ A を選ぶ。

Then:

- タグ A が選択済みになり、A を持つ Card だけが表示される。

<a id="storybook-deck-filter-04"></a>

### STORYBOOK-DECK-FILTER-04 同じタグを重複して表示しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Card が同じタグを持つ Deck の一覧を開いている。

When:

- そのタグを選ぶ。

Then:

- 候補と選択表示に同名のタグが重複せず、タグによる絞り込みが適用される。

<a id="storybook-deck-filter-05"></a>

### STORYBOOK-DECK-FILTER-05 Any と All で絞り込み結果を変える

カテゴリ: `interaction`

区分: 正常系

Given:

- タグ A のみ、B のみ、A と B の両方を持つ3枚の Card がある。

When:

- A と B を選び、Any から All へ切り替える。

Then:

- Any では3枚、All では両方のタグを持つ1枚が表示される。

<a id="storybook-deck-filter-06"></a>

### STORYBOOK-DECK-FILTER-06 候補から消えた選択タグも解除できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧フィルターには選択タグがあるが、その一部を持つ Card がなくなっている。

When:

- タグ候補を開く。

Then:

- 選択済みのタグが見つけやすい位置に残り、候補外になったタグも解除できる。

<a id="storybook-deck-filter-07"></a>

### STORYBOOK-DECK-FILTER-07 追加表示したタグをキーボードで選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- タグ候補が折りたたまれている。

When:

- 候補を展開し、キーボードで追加表示されたタグへ移動して選ぶ。

Then:

- 対象タグが選択済みになり、その条件で一覧が更新される。

<a id="storybook-deck-filter-08"></a>

### STORYBOOK-DECK-FILTER-08 解除で隠れるタグからフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択中であることによって表示されているタグにフォーカスしている。

When:

- そのタグを解除する。

Then:

- タグが隠れても、表示中の操作へフォーカスが移り、操作を続けられる。

<a id="storybook-deck-filter-09"></a>

### STORYBOOK-DECK-FILTER-09 最後の候補外タグを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card が持たなくなったタグだけを選択している。

When:

- そのタグを解除する。

Then:

- 候補外タグが選択表示から消え、存在しないタグにフォーカスが残らない。

<a id="storybook-deck-filter-10"></a>

### STORYBOOK-DECK-FILTER-10 Clear が無効になる前にフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択タグがあり、Clear にフォーカスしている。

When:

- すべてのタグを解除する。

Then:

- Clear が無効になってもフォーカスを失わず、利用可能なフィルター操作へ移る。

<a id="storybook-deck-filter-11"></a>

### STORYBOOK-DECK-FILTER-11 8件以下では追加表示操作を出さない

カテゴリ: `render`

区分: 正常系

Given:

- タグ候補が8件以下である。

When:

- Card 一覧画面のフィルターを開く。

Then:

- すべての候補を表示し、追加表示のためのボタンは表示しない。

<a id="storybook-deck-filter-12"></a>

### STORYBOOK-DECK-FILTER-12 タグ候補がなくても一致条件を保持する

カテゴリ: `render`

区分: 正常系

Given:

- タグ候補がなく、閲覧フィルターの一致条件は All である。

When:

- Card 一覧画面のフィルターを開く。

Then:

- 候補がないことだけでは Any に変更されず、All の選択が保たれる。

<a id="storybook-deck-filter-13"></a>

### STORYBOOK-DECK-FILTER-13 大量の選択タグをスクロールして確認する

カテゴリ: `render`

区分: 正常系

Given:

- 一画面に収まらない数の閲覧タグを選択している。

When:

- 選択タグの領域をスクロールする。

Then:

- すべての選択タグを確認・解除でき、一覧の操作が画面外へ押し出され続けない。

<a id="storybook-deck-filter-14"></a>

### STORYBOOK-DECK-FILTER-14 長い候補タグ名を確認できる

カテゴリ: `render`

区分: 正常系

Given:

- 長い名前のタグ候補がある。

When:

- Card 一覧画面のフィルターを開く。

Then:

- 候補の名前を表示または読み上げ名で確認でき、選択後も同じ名前を確認できる。

<a id="storybook-deck-filter-15"></a>

### STORYBOOK-DECK-FILTER-15 言語が変わってもタグの展開を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面で追加のタグ候補を展開している。

When:

- 表示言語を日本語へ変更する。

Then:

- 操作名が日本語へ変わり、展開状態とタグ名と選択内容は保たれる。

<a id="storybook-card-list-26"></a>

### STORYBOOK-CARD-LIST-26 [TODO] Card を追加が新しい順に表示できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck に追加日時が異なる Card と、追加日時が同じ Card が存在する。絞り込みなしと、一部の Card に一致する閲覧タグを選択した状態を独立した入力例とする。
- Card 一覧は標準の順序で表示され、既存の学習セッションがある。

When:

- キーボードで並び順の「追加が新しい順」を選択する。

Then:

- 追加日時が新しい Card から表示され、同じ追加日時では標準の相対順序を維持する。編集日時は順序に影響しない。
- 件数とタグ候補、フィルターに一致する Card は変わらない。
- Card・Deck の内容や既存の学習の出題順・現在位置は変わらない。
- 新しく始める学習の対象や出題順にも影響しない。

<a id="storybook-card-list-27"></a>

### STORYBOOK-CARD-LIST-27 [TODO] Card の表示順を標準へ戻せる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。絞り込みなしと、一部の Card に一致する閲覧タグを選択した状態を独立した入力例とし、確認中は Card を追加・更新・削除しない。
- 対象 Deck に既存の学習セッションがある。

When:

- キーボードで並び順の「標準」を選択する。

Then:

- その時点の標準の順序へ戻り、件数・Card と Deck の内容・学習の出題順と現在位置は変わらない。

<a id="storybook-card-list-28"></a>

### STORYBOOK-CARD-LIST-28 [TODO] 並び替え後も選択した Card のプレビューと行操作を利用できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧を「追加が新しい順」で表示している。

When:

- 対象 Card の解答プレビューを開閉するか、行操作を選択する。

Then:

- プレビューと行操作は選択した Card を対象とし、プレビュー開閉後も並び順を保つ。

<a id="storybook-card-list-29"></a>

### STORYBOOK-CARD-LIST-29 [TODO] 別 Card の変更後も行のフォーカスとメニューを維持できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧を「追加が新しい順」で表示している。
- 操作可能な行にフォーカスがあるか、対象 Card のメニューを開いている。

When:

- 別 Card が追加・更新・削除されるか、メニュー対象の Card が削除される。

Then:

- 別 Card の変更では、残る行のフォーカスとメニューを保つ。対象 Card が削除された場合はメニューを閉じる。

<a id="storybook-card-list-30"></a>

### STORYBOOK-CARD-LIST-30 [TODO] フィルター保存中も並び替えでき、禁止中の操作は実行できない

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧を開いている。
- フィルター自動保存中、Card の変更中、またはダイアログ表示中である。

When:

- 並び順や、その状態で禁止されている行の操作を選択しようとする。

Then:

- フィルター自動保存中も並び順を選択できる。
- Card の変更中やダイアログ表示中に禁止されている操作は引き続き実行できない。

<a id="storybook-card-list-31"></a>

### STORYBOOK-CARD-LIST-31 [TODO] 画面を離れるか Deck を変更すると並び順が標準に戻る

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 一覧画面から離れて戻るか、表示する Deck を変更する。

Then:

- 並び順は標準に戻る。

<a id="storybook-card-list-32"></a>

### STORYBOOK-CARD-LIST-32 [TODO] フィルター保存中に変更しても最後の選択を維持できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck の Card 一覧でタグフィルターの保存応答を保留している。

When:

- 保存中に条件を続けて変更し、別画面へ移動して戻る。

Then:

- 保存中も変更でき、最後の選択が以前の条件に戻らない。

<a id="storybook-card-list-33"></a>

### STORYBOOK-CARD-LIST-33 [TODO] 言語やフィルターを変更しても並び順を保持できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧で「追加が新しい順」を選択している。

When:

- 言語またはフィルターを変更し、フィルターでは結果0件となる条件も選択する。

Then:

- 言語・フィルター変更後や結果0件でも、選択した並び順を保持する。

<a id="storybook-card-list-34"></a>

### STORYBOOK-CARD-LIST-34 [TODO] フィルター保存失敗後も選択を維持して次の変更を保存できる

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck の Card 一覧を開いており、タグフィルター保存先は失敗、成功の順に応答する。

When:

- 条件を変更し、保存失敗後に再度変更して、保存後に再表示する。

Then:

- 保存失敗を通知し、選択を維持する。次の保存に成功すると選択中の全条件を再表示できる。

<a id="storybook-card-list-35"></a>

### STORYBOOK-CARD-LIST-35 [TODO] Card の解答プレビューを開ける

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck に、両面の本文を持つ Card がある。

When:

- Card 一覧の対象 Card へキーボードで移動し、表示を選ぶ。

Then:

- 対象 Card の名前付き解答プレビューを表示し、フォーカスがプレビュー内へ移る。
- タイトル・閉じる操作・本文へキーボードで移動でき、Tab と Shift+Tab はプレビュー内を循環する。長いタイトルもキーボードでスクロールできる。
- 本文を読む間は背景の一覧・フィルター・並び順・画面移動の操作へ移らない。

<a id="storybook-card-list-36"></a>

### STORYBOOK-CARD-LIST-36 [TODO] Card の解答プレビューを閉じて一覧へ戻れる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck の Card 一覧で、解答プレビューを開いている。

When:

- 本文とは独立した「カードを閉じる」操作、または Escape でプレビューを閉じる。

Then:

- プレビューが閉じ、接続済みで操作可能な起点へフォーカスが戻る。起点がなくなっている場合は、別の Card へ移さず一覧の並び順操作へ戻る。
- 一覧の絞り込みと並び順、Card の内容と学習結果は変わらず、一覧を再び操作できる。

<a id="storybook-card-list-37"></a>

### STORYBOOK-CARD-LIST-37 [TODO] 解答の文章を選択できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の解答プレビューに、選択できる文章を表示している。

When:

- ポインターをドラッグして解答の文章を選択する。

Then:

- 文章が選択され、プレビューは開いたままである。

<a id="storybook-card-list-38"></a>

### STORYBOOK-CARD-LIST-38 [TODO] 解答のリンクと脚注をたどれる

カテゴリ: `interaction`

区分: 正常系

Given:

- 解答プレビューに脚注へのリンクと注番号、脚注から本文へ戻るリンクがある。

When:

- 解答のリンクと注番号から脚注へ移動し、それぞれ本文へ戻る。

Then:

- 脚注と元の注番号が表示範囲へ移り、プレビューは開いたままである。

<a id="storybook-card-list-39"></a>

### STORYBOOK-CARD-LIST-39 [TODO] 解答の本文をキーボードで縦にスクロールできる

カテゴリ: `interaction`

区分: 正常系

Given:

- 解答プレビューに縦に長い本文を表示している。

When:

- 解答の本文へフォーカスし、PageDown を押す。

Then:

- 本文の下方へ読み取り位置が移り、プレビューは開いたままである。

<a id="storybook-card-list-40"></a>

### STORYBOOK-CARD-LIST-40 [TODO] 解答のコードをキーボードで横にスクロールできる

カテゴリ: `interaction`

区分: 正常系

Given:

- 解答プレビューに横に長いコードを表示している。

When:

- コードへフォーカスし、右矢印キーを押す。

Then:

- コードの右方へ読み取り位置が移り、プレビューは開いたままである。

<a id="storybook-card-list-41"></a>

### STORYBOOK-CARD-LIST-41 [TODO] 解答の数式をキーボードで横にスクロールできる

カテゴリ: `interaction`

区分: 正常系

Given:

- 解答プレビューに横に長い数式を表示している。

When:

- 数式へフォーカスし、右矢印キーを押す。

Then:

- 数式の右方へ読み取り位置が移り、プレビューは開いたままである。

<a id="storybook-card-list-42"></a>

### STORYBOOK-CARD-LIST-42 [TODO] Card 一覧に学習情報を表示できる

カテゴリ: `render`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Deck に、タグ付きの Card がある。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の表面の本文とタグを表示する。

<a id="storybook-card-list-43"></a>

### STORYBOOK-CARD-LIST-43 [TODO] 存在しない Deck から復帰できる

カテゴリ: `interaction`

区分: 異常系

Given:

- 開こうとしている URL の Deck は存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。

<a id="storybook-card-list-44"></a>

### STORYBOOK-CARD-LIST-44 [TODO] Card の削除を取り消せる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の操作メニューボタンから削除ダイアログを開いている。
- 対象 Card と削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- ダイアログが閉じ、対象 Card の操作メニューボタンにフォーカスが戻る。
- 対象 Card の内容と学習状態を維持する。

<a id="storybook-card-list-45"></a>

### STORYBOOK-CARD-LIST-45 [TODO] 削除成功の応答後に一覧を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に Card が1件あり、削除先は成功応答と対象 Card がなくなった結果を返す。

When:

- 一覧で対象 Card の削除を確定する。

Then:

- 削除成功を通知し、ダイアログを閉じ、Card 件数0の案内を表示する。
- 削除した Card を代わりの Card と取り違えず、他の Deck の内容と学習状態は変わらない。

<a id="storybook-card-list-46"></a>

### STORYBOOK-CARD-LIST-46 [TODO] 削除失敗の応答後に同じ Card を再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Card の削除先は拒否、成功の順に応答する。拒否時には対象 Card が利用できる結果を返す。

When:

- 削除し、失敗後にダイアログを開き直して再試行する。

Then:

- 失敗を通知して対象 Card を操作可能に戻し、再試行成功後にダイアログを閉じて一覧から対象 Card を除く。

<a id="storybook-card-list-47"></a>

### STORYBOOK-CARD-LIST-47 [TODO] 読めない Card の件数と結果の回復を表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 同じ Deck の2枚のうち1枚、または2枚とも読み込めない結果を受け取っている。正常な Card と Deck は利用できる。

When:

- Card 一覧を開き、読めなかった Card が有効になった結果を順に受け取る。

Then:

- 正常な Card だけを表示し、全件が読めない場合も Deck と一覧の操作を利用できる。
- 読めない件数と保存データを変更していない警告を表示する。結果の回復で同じ本文の Card を再表示して件数を減らし、全件が正常になると警告を消す。
- 未評価として補完した Card を表示せず、画面の復旧操作だけで保存値を変更しない。

<a id="storybook-card-list-48"></a>

### STORYBOOK-CARD-LIST-48 [TODO] Card 一覧からキーボードで画面を移る

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 一覧画面を開いており、入力欄やダイアログを操作していない。

When:

- t を押して Deck 一覧へ移り、Card 一覧へ戻って s を押す。

Then:

- t は Deck 一覧、s は Settings へそれぞれ一度だけ遷移し、Deck・Card の内容と学習状態は変わらない。

<a id="storybook-card-list-49"></a>

### STORYBOOK-CARD-LIST-49 [TODO] フィルター不一致の0件から条件を確認して変更する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck には Card があり、両方を持つ Card がない二つのタグを AND 条件で選択している。保存先は変更に成功する。

When:

- Card 一覧のフィルターを開いて条件を確認し、一つのタグを解除する。

Then:

- 変更前は0件とフィルター不一致を表示し、Card 未登録や全件表示へ切り替えない。
- 選択タグと AND 条件を確認でき、解除後は残る条件に一致する Card を表示する。

<a id="storybook-card-list-50"></a>

### STORYBOOK-CARD-LIST-50 [TODO] 同じ Deck のタグだけを重複なく候補にする

カテゴリ: `render`

区分: 正常系

Given:

- 同じ Deck の複数 Card がタグを共有し、別 Deck の Card は固有のタグを持つ。

When:

- 対象 Deck の Card 一覧のタグ候補を開く。

Then:

- 同じ Deck のタグは一度ずつ表示し、別 Deck のタグと固定カテゴリを候補へ追加しない。
