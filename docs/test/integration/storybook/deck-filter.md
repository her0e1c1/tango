# Deck Filter Storybook 結合テスト仕様書

## 目的

タグ選択、一致条件、段階的な開示とキーボード操作時のフォーカスを確認する。

## 検証境界

DeckFilterForm / TagFilter、実際の子 UI と Story 側の選択状態。Card の絞り込み結果や永続化は対象外。

関連 E2E: [card-list-actions](../../e2e/card-list-actions.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FILTER-01 | interaction | [選択済みタグをクリアする](#storybook-deck-filter-01) | DeckFilterForm :: `Interaction` |
| STORYBOOK-DECK-FILTER-02 | interaction | [折りたたまれたタグをすべて表示する](#storybook-deck-filter-02) | TagFilter :: `Expanded` |
| STORYBOOK-DECK-FILTER-03 | interaction | [タグ選択を通知し手動難易度の入力を表示しない](#storybook-deck-filter-03) | DeckFilterForm :: `TagSelection`（未実装） |
| STORYBOOK-DECK-FILTER-04 | interaction | [重複を除いた選択件数と選択変更を扱う](#storybook-deck-filter-04) | TagFilter :: `DeduplicatedSelection`（未実装） |
| STORYBOOK-DECK-FILTER-05 | interaction | [Any と All の変更を通知する](#storybook-deck-filter-05) | TagFilter :: `MatchMode`（未実装） |
| STORYBOOK-DECK-FILTER-06 | interaction | [選択済みと候補外のタグを先頭に保つ](#storybook-deck-filter-06) | TagFilter :: `SelectedAndStaleTags`（未実装） |
| STORYBOOK-DECK-FILTER-07 | interaction | [展開したタグへキーボードで移動する](#storybook-deck-filter-07) | TagFilter :: `KeyboardDisclosure`（未実装） |
| STORYBOOK-DECK-FILTER-08 | interaction | [解除で隠れるタグから残るタグへフォーカスを移す](#storybook-deck-filter-08) | TagFilter :: `DeselectionFocus`（未実装） |
| STORYBOOK-DECK-FILTER-09 | interaction | [最後の候補外タグを解除すると一致条件へ戻る](#storybook-deck-filter-09) | TagFilter :: `LastStaleTagFocus`（未実装） |
| STORYBOOK-DECK-FILTER-10 | interaction | [Clear が無効になる前にフォーカスを移す](#storybook-deck-filter-10) | TagFilter :: `ClearFocus`（未実装） |
| STORYBOOK-DECK-FILTER-11 | render | [未選択タグが8件以下なら開示ボタンを表示しない](#storybook-deck-filter-11) | TagFilter :: `EightTags`（未実装） |
| STORYBOOK-DECK-FILTER-12 | render | [タグがなくても一致条件を保持して空状態を表示する](#storybook-deck-filter-12) | TagFilter :: `EmptyContract`（未実装） |
| STORYBOOK-DECK-FILTER-13 | render | [大量の選択タグをスクロール領域で扱う](#storybook-deck-filter-13) | TagFilter :: `AllSelectedContract`（未実装） |
| STORYBOOK-DECK-FILTER-14 | render | [長いタグを選択可能な名前として保持する](#storybook-deck-filter-14) | TagFilter :: `LongTagContract`（未実装） |
| STORYBOOK-DECK-FILTER-15 | interaction | [言語変更後もタグの展開状態を保持する](#storybook-deck-filter-15) | TagFilter :: `LocaleWhileExpanded`（未実装） |

対応ファイルは [DeckFilterForm.stories.tsx](../../../../src/features/deck-filter/ui/DeckFilterForm.stories.tsx) と [TagFilter.stories.tsx](../../../../src/features/deck-filter/ui/TagFilter.stories.tsx)。03 以降は追加予定の named export であり、既存 `play` の検証済み項目には数えない。

<a id="storybook-deck-filter-01"></a>

### STORYBOOK-DECK-FILTER-01 選択済みタグをクリアする

カテゴリ: `interaction`

対応 Story: DeckFilterForm :: `Interaction`

Given:

- tag 1 が選択済みのフィルターフォームを用意し、変更を Story 側の状態に反映する。

When:

- タグ選択の Clear を押す。

Then:

- 選択タグの変更 callback に空配列が渡され、tag 1 のチェックが外れる。

<a id="storybook-deck-filter-02"></a>

### STORYBOOK-DECK-FILTER-02 折りたたまれたタグをすべて表示する

カテゴリ: `interaction`

対応 Story: TagFilter :: `Expanded`

Given:

- タグ12件があり、8件を表示して残り4件を折りたたんでいる。

When:

- Show 4 more tags を押す。

Then:

- 12件のタグのチェックボックスが表示される。
- 開示ボタンが Show fewer tags になり、aria-expanded が true になる。

<a id="storybook-deck-filter-03"></a>

### STORYBOOK-DECK-FILTER-03 タグ選択を通知し手動難易度の入力を表示しない

カテゴリ: `interaction`

対応予定 Story: DeckFilterForm :: `TagSelection`（未実装）。元テスト: [DeckFilterForm.spec.tsx](../../../../src/features/deck-filter/ui/DeckFilterForm.spec.tsx) :: `filters by tags without manual difficulty controls`。

Given:

- one / two が候補にあり、未選択、Any 条件である。

When:

- one を選択する。

Then:

- 選択変更 callback に `["one"]` を通知する。
- 手動難易度の combobox は表示しない。

<a id="storybook-deck-filter-04"></a>

### STORYBOOK-DECK-FILTER-04 重複を除いた選択件数と選択変更を扱う

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `DeduplicatedSelection`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `reports tag, clear, and explicit match-mode changes with a deduplicated selection count`。

Given:

- 候補は one / two、選択値は one / one とする。

When:

- two を選択する場合と、初期状態から one を解除する場合をそれぞれ操作する。

Then:

- 初期表示は 1 selected で、Clear が有効である。
- two の追加要求は `["one", "two"]`、one の解除要求は空配列となる。

<a id="storybook-deck-filter-05"></a>

### STORYBOOK-DECK-FILTER-05 Any と All の変更を通知する

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `MatchMode`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `reports tag, clear, and explicit match-mode changes with a deduplicated selection count`。

Given:

- Match の radio group で Any が選択されている。選択通知を Story 側の値に反映する。

When:

- All を選び、その後 Any を選ぶ。

Then:

- All の変更は true、Any の変更は false を通知する。
- 選択された一致条件を radio の checked 状態で確認できる。

<a id="storybook-deck-filter-06"></a>

### STORYBOOK-DECK-FILTER-06 選択済みと候補外のタグを先頭に保つ

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `SelectedAndStaleTags`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `keeps selected and stale tags first while progressively disclosing unselected tags`。

Given:

- one から twelve の12候補に two の重複があり、候補外の stale と four が選択済みである。stale の選択値にも重複がある。

When:

- 隠れたタグを展開して twelve を選択し、再び折りたたむ。

Then:

- 重複を表示せず、初期状態は stale / four と未選択8件を表示し、残りは3件である。
- 選択後は stale / four / twelve が先頭に残り、折りたたんでも twelve を選択済みとして表示する。未表示の候補は2件になる。

<a id="storybook-deck-filter-07"></a>

### STORYBOOK-DECK-FILTER-07 展開したタグへキーボードで移動する

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `KeyboardDisclosure`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `moves keyboard focus through newly revealed tags and keeps it on the disclosure when collapsing`。

Given:

- tag-1 から tag-12 が未選択で、Show 4 more tags にフォーカスしている。

When:

- Enter で展開し、Tab で追加タグから Show fewer tags まで移動し、Space で折りたたむ。

Then:

- 展開直後は tag-9 にフォーカスし、tag-10 以降へ順に移動できる。
- 折りたたむと tag-9 以降が隠れ、開示ボタンにフォーカスが残る。

<a id="storybook-deck-filter-08"></a>

### STORYBOOK-DECK-FILTER-08 解除で隠れるタグから残るタグへフォーカスを移す

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `DeselectionFocus`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `moves focus to a remaining tag when deselection removes a collapsed chip`。

Given:

- 12候補のうち tag-12 が選択され、折りたたみ状態で tag-12 にフォーカスしている。

When:

- Space で選択を解除する。

Then:

- tag-12 は折りたたまれ、表示中の tag-1 にフォーカスが移る。

<a id="storybook-deck-filter-09"></a>

### STORYBOOK-DECK-FILTER-09 最後の候補外タグを解除すると一致条件へ戻る

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `LastStaleTagFocus`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `moves focus to the match controls when the last stale selected tag disappears`。

Given:

- 候補は空で、候補外の stale だけが選択されている。

When:

- stale にフォーカスし、Space で解除する。

Then:

- stale が消え、Any の radio にフォーカスが移る。

<a id="storybook-deck-filter-10"></a>

### STORYBOOK-DECK-FILTER-10 Clear が無効になる前にフォーカスを移す

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `ClearFocus`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `moves focus before Clear disables itself`。

Given:

- one を選択している。

When:

- Clear を押す。

Then:

- Clear が無効になり、Any の radio にフォーカスが移る。

<a id="storybook-deck-filter-11"></a>

### STORYBOOK-DECK-FILTER-11 未選択タグが8件以下なら開示ボタンを表示しない

カテゴリ: `render`

対応予定 Story: TagFilter :: `EightTags`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `omits disclosure when there are no more than eight unselected tags`。

Given:

- 未選択の候補が8件ある。

When:

- フィルターを描画する。

Then:

- 8件すべてと No filter を表示し、Clear は無効、開示ボタンは表示しない。

<a id="storybook-deck-filter-12"></a>

### STORYBOOK-DECK-FILTER-12 タグがなくても一致条件を保持して空状態を表示する

カテゴリ: `render`

対応予定 Story: TagFilter :: `EmptyContract`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `shows a simple empty state when no tags are available`。

Given:

- 候補と選択タグは空で、All 条件が選択されている。

When:

- フィルターを描画する。

Then:

- No tags available. を表示し、checkbox と開示ボタンは表示しない。
- All の選択は維持される。

<a id="storybook-deck-filter-13"></a>

### STORYBOOK-DECK-FILTER-13 大量の選択タグをスクロール領域で扱う

カテゴリ: `render`

対応予定 Story: TagFilter :: `AllSelectedContract`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `bounds a large all-selected tag list while keeping every selection available`。

Given:

- 120件すべての候補が選択済みである。

When:

- フィルターを描画する。

Then:

- Tag choices を高さ制限のある縦スクロール領域にし、120件の選択操作と 120 selected を保持する。
- 未選択タグ用の開示ボタンは表示しない。特定の CSS クラス名の一致を契約にしない。

<a id="storybook-deck-filter-14"></a>

### STORYBOOK-DECK-FILTER-14 長いタグを選択可能な名前として保持する

カテゴリ: `render`

対応予定 Story: TagFilter :: `LongTagContract`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `keeps a long tag available through its native checkbox`。

Given:

- 改行や空白のない長いタグ名を候補に渡す。

When:

- フィルターを描画する。

Then:

- 元のタグ名全体で特定できる checkbox が表示される。

<a id="storybook-deck-filter-15"></a>

### STORYBOOK-DECK-FILTER-15 言語変更後もタグの展開状態を保持する

カテゴリ: `interaction`

対応予定 Story: TagFilter :: `LocaleWhileExpanded`（未実装）。元テスト: [TagFilter.spec.tsx](../../../../src/features/deck-filter/ui/TagFilter.spec.tsx) :: `keeps the expanded filter and tag controls mounted when the locale changes`。

Given:

- 10候補を英語で全件展開している。

When:

- 日本語へ変更する。

Then:

- 開示ボタンは「表示するタグを減らす」に変わり、展開状態と追加表示された tag-9 を保持する。
