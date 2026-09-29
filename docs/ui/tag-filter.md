# TagFilter

タグ候補、選択状態、AND／OR条件、候補の展開とフォーカス。絞り込み結果や永続化は扱わない。

Storybook: `Features/Deck Filter/TagFilter`。

[コンポーネント](../../src/features/deck-filter/ui/TagFilter.tsx) / [Story](../../src/features/deck-filter/ui/TagFilter.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Collapsed` | 12候補、選択なし、Any 条件。 | 最初の8候補と残り4件の展開操作を表示する。 |
| `Expanded` | 12候補から追加候補を展開する。 | 全12候補と折り畳み操作を表示する。 |
| `Selected` | tag-12 と tag-3 を選択し All 条件を渡す。 | 選択した候補を確認でき、All が選択される。 |
| `AllSelectedManyTags` | 120候補をすべて選択する。 | 選択数120と選択済み候補を高さに上限のあるスクロール領域に表示する。 |
| `Empty` | 候補も選択も空。 | 候補なしを案内し、存在しない候補を表示しない。 |
| `LongTag` | 区切りのない長いタグを渡す。 | 候補の読み上げ名にタグ全文を保持する。 |
| `Mobile320` | 狭い画面で2件選択する。 | 条件と選択候補を幅内で確認できる。 |
| `Dark` | 暗いテーマで2件選択する。 | 選択・未選択を判別できる。 |
| `Japanese` | 日本語の候補と2件の選択を渡す。 | 日本語の説明、条件、選択数を表示する。 |
| `NarrowContainer` | 日本語表示を狭い親領域に置く。 | 候補と操作が親領域に収まる。 |
| `Selection` | 2候補から選択し、All／Any の切替後に Clear を操作する。 | 選択・条件を通知し、解除後は Clear が無効になって Any にフォーカスが移る。 |
| `DuplicateSelectionAdded` | one が重複して選択された状態から two を追加する。 | 初期選択数は1となり、重複のない one・two を通知する。 |
| `DuplicateSelectionRemoved` | one が重複して選択された状態で one を解除する。 | 空の選択を通知する。 |
| `KeyboardDisclosure` | キーボードで候補を展開し、追加候補を巡って折り畳む。 | 追加候補へ移動でき、折り畳み後は展開ボタンにフォーカスを戻す。 |
| `RemoveHiddenSelection` | 折り畳み範囲外の tag-12 を選択し、解除する。 | 消えた候補にフォーカスを残さず、最初の候補に移す。 |
| `RemoveStaleSelection` | 候補にはない最後の選択タグを解除する。 | タグを消し、Any にフォーカスを移す。 |
| `EightChoices` | 選択なしで8候補を渡す。 | 全候補を表示し、展開操作はなく、Clear は無効になる。 |
| `EmptyAll` | 候補なしで All 条件を渡す。 | 候補なしを案内し、All の選択を維持する。 |
| `UnavailableAndDuplicateChoices` | 候補の重複と候補外の選択を渡し、追加候補を選択して折り畳む。 | 重複を除き、候補外を含む選択済みタグを先に表示して選択を隠さない。 |
| `LanguageChange` | 10候補を展開してから日本語に切り替える。 | 案内を翻訳し、展開状態と10候補を保持する。 |
