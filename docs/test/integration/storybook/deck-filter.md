# Deck Filter Storybook 結合テスト仕様書

## 目的

タグ選択、一致条件、段階的な開示とフォーカスの維持を確認する。

## 検証境界

DeckFilterForm / TagFilter と実際の子 UI、Story 側の選択状態。Card の絞り込み計算と永続化は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [card-list-actions](../../e2e/card-list-actions.md) を参照する。

03〜15 は Vitest から追加した契約で、対応 Story は追加先である。記載した各条件の準備とアサーションは未実装であり、既存の展開操作だけで検証済みとはしない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FILTER-01 | interaction | 正常系 | [選択タグをクリアする](#storybook-deck-filter-01) |
| STORYBOOK-DECK-FILTER-02 | interaction | 正常系 | [折りたたまれたタグを表示する](#storybook-deck-filter-02) |
| STORYBOOK-DECK-FILTER-03 | interaction | 正常系 | [タグ選択を通知する](#storybook-deck-filter-03) |
| STORYBOOK-DECK-FILTER-04 | interaction | 正常系 | [重複を除いて選択を扱う](#storybook-deck-filter-04) |
| STORYBOOK-DECK-FILTER-05 | interaction | 正常系 | [Any と All を切り替える](#storybook-deck-filter-05) |
| STORYBOOK-DECK-FILTER-06 | interaction | 正常系 | [選択済みと候補外のタグを先頭に保つ](#storybook-deck-filter-06) |
| STORYBOOK-DECK-FILTER-07 | interaction | 正常系 | [追加表示したタグへキーボードで移動する](#storybook-deck-filter-07) |
| STORYBOOK-DECK-FILTER-08 | interaction | 正常系 | [解除で隠れるタグからフォーカスを移す](#storybook-deck-filter-08) |
| STORYBOOK-DECK-FILTER-09 | interaction | 正常系 | [最後の候補外タグを解除する](#storybook-deck-filter-09) |
| STORYBOOK-DECK-FILTER-10 | interaction | 正常系 | [Clear の無効化前にフォーカスを移す](#storybook-deck-filter-10) |
| STORYBOOK-DECK-FILTER-11 | render | 正常系 | [8件以下では開示ボタンを表示しない](#storybook-deck-filter-11) |
| STORYBOOK-DECK-FILTER-12 | render | 正常系 | [空状態でも一致条件を保つ](#storybook-deck-filter-12) |
| STORYBOOK-DECK-FILTER-13 | render | 正常系 | [大量の選択タグをスクロール領域にする](#storybook-deck-filter-13) |
| STORYBOOK-DECK-FILTER-14 | render | 正常系 | [長いタグ名を保持する](#storybook-deck-filter-14) |
| STORYBOOK-DECK-FILTER-15 | interaction | 正常系 | [言語変更後も展開状態を保つ](#storybook-deck-filter-15) |

<a id="storybook-deck-filter-01"></a>

### STORYBOOK-DECK-FILTER-01 選択タグをクリアする

カテゴリ: `interaction`

区分: 正常系

Given:

- tag 1 が選択済みで、変更を Story 側の状態へ反映する。

When:

- Clear を押す。

Then:

- 空配列を変更 callback に渡し、tag 1 のチェックが外れる。

<a id="storybook-deck-filter-02"></a>

### STORYBOOK-DECK-FILTER-02 折りたたまれたタグを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 12件中8件を表示し、残り4件を折りたたんでいる。

When:

- Show 4 more tags を押す。

Then:

- 12件の checkbox を表示する。開示ボタンは Show fewer tags になり、aria-expanded は true になる。

<a id="storybook-deck-filter-03"></a>

### STORYBOOK-DECK-FILTER-03 [TODO] タグ選択を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- one / two が未選択で、Any 条件である。

When:

- one を選択する。

Then:

- `["one"]` を変更 callback に渡し、手動難易度の combobox は表示しない。

<a id="storybook-deck-filter-04"></a>

### STORYBOOK-DECK-FILTER-04 [TODO] 重複を除いて選択を扱う

カテゴリ: `interaction`

区分: 正常系

Given:

- 候補は one / two、選択値は one / one とする。

When:

- two を追加する場合と、初期状態から one を解除する場合を個別に操作する。

Then:

- 初期表示は 1 selected で Clear は有効である。追加要求は `["one", "two"]`、解除要求は空配列になる。

<a id="storybook-deck-filter-05"></a>

### STORYBOOK-DECK-FILTER-05 [TODO] Any と All を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Match の radio group で Any を選択し、変更を Story 側に反映する。

When:

- All、その後 Any を選ぶ。

Then:

- All は true、Any は false を callback に通知し、選択中の条件を checked 状態で示す。

<a id="storybook-deck-filter-06"></a>

### STORYBOOK-DECK-FILTER-06 [TODO] 選択済みと候補外のタグを先頭に保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- one〜twelve の候補に two の重複があり、候補外 stale と four を選択している。stale の選択値にも重複がある。

When:

- 展開して twelve を選択し、再び折りたたむ。

Then:

- 初期表示は重複のない stale / four と未選択8件で、残りは3件である。
- 選択後は stale / four / twelve が先頭に残り、折りたたんでも twelve を保持する。隠れた未選択候補は2件になる。

<a id="storybook-deck-filter-07"></a>

### STORYBOOK-DECK-FILTER-07 [TODO] 追加表示したタグへキーボードで移動する

カテゴリ: `interaction`

区分: 正常系

Given:

- tag-1〜tag-12 が未選択で、開示ボタンにフォーカスしている。

When:

- Enter で展開し、Tab で追加タグから Show fewer tags まで移動し、Space で折りたたむ。

Then:

- 展開直後は tag-9 に移り、追加タグへ順に移動できる。折りたたむと追加タグが隠れ、開示ボタンにフォーカスを保つ。

<a id="storybook-deck-filter-08"></a>

### STORYBOOK-DECK-FILTER-08 [TODO] 解除で隠れるタグからフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- 12候補中 tag-12 を選択し、折りたたみ状態でその checkbox にフォーカスしている。

When:

- Space で解除する。

Then:

- tag-12 は隠れ、表示中の tag-1 にフォーカスが移る。

<a id="storybook-deck-filter-09"></a>

### STORYBOOK-DECK-FILTER-09 [TODO] 最後の候補外タグを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- 候補は空で、候補外 stale だけを選択している。

When:

- stale にフォーカスし、Space で解除する。

Then:

- stale が消え、Any の radio にフォーカスが移る。

<a id="storybook-deck-filter-10"></a>

### STORYBOOK-DECK-FILTER-10 [TODO] Clear の無効化前にフォーカスを移す

カテゴリ: `interaction`

区分: 正常系

Given:

- one を選択している。

When:

- Clear を押す。

Then:

- Clear は無効になり、Any の radio にフォーカスが移る。

<a id="storybook-deck-filter-11"></a>

### STORYBOOK-DECK-FILTER-11 [TODO] 8件以下では開示ボタンを表示しない

カテゴリ: `render`

区分: 正常系

Given:

- 未選択候補が8件ある。

When:

- フィルターを描画する。

Then:

- 全8件と No filter を表示し、Clear は無効で、開示ボタンは表示しない。

<a id="storybook-deck-filter-12"></a>

### STORYBOOK-DECK-FILTER-12 [TODO] 空状態でも一致条件を保つ

カテゴリ: `render`

区分: 正常系

Given:

- 候補・選択タグとも空で、All を選択している。

When:

- フィルターを描画する。

Then:

- No tags available. と選択中の All を表示し、checkbox と開示ボタンは表示しない。

<a id="storybook-deck-filter-13"></a>

### STORYBOOK-DECK-FILTER-13 [TODO] 大量の選択タグをスクロール領域にする

カテゴリ: `render`

区分: 正常系

Given:

- 120候補すべてを選択している。

When:

- フィルターを描画する。

Then:

- Tag choices は高さ制限のある縦スクロール領域になり、全120件の操作と 120 selected を保持する。未選択タグの開示ボタンは出さず、特定の CSS クラス名を契約にしない。

<a id="storybook-deck-filter-14"></a>

### STORYBOOK-DECK-FILTER-14 [TODO] 長いタグ名を保持する

カテゴリ: `render`

区分: 正常系

Given:

- 空白のない長いタグ名を渡す。

When:

- フィルターを描画する。

Then:

- 元の名前全体で特定できる checkbox を表示する。

<a id="storybook-deck-filter-15"></a>

### STORYBOOK-DECK-FILTER-15 [TODO] 言語変更後も展開状態を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- 10候補を英語で全件展開している。

When:

- 日本語へ変更する。

Then:

- 開示ボタンの文言は日本語へ変わり、展開状態と追加表示された tag-9 を保持する。
