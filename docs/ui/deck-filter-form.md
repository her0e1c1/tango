# DeckFilterForm

タグによる条件入力をまとめるフォーム。条件入力の表示・通知を対象にし、対象カードの件数は保証しない。

Storybook: `Features/Deck Filter/DeckFilterForm`。

[コンポーネント](../../src/features/deck-filter/ui/DeckFilterForm.tsx) / [Story](../../src/features/deck-filter/ui/DeckFilterForm.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 候補あり、選択なし、Any 条件。 | タグ条件の入力欄を表示する。 |
| `Interaction` | tag 1 を選択した状態で Clear を操作する。 | 空の選択を通知し、選択表示を解除する。 |
| `ManyTagsSelected` | 40候補から2・17・31番目を選択し All 条件を渡す。 | 多数の候補の中でも選択状態と条件を確認できる。 |
| `NoMatchCompatible` | 候補外の advanced・review を選択して All 条件を渡す。 | 受け取った条件を保持して表示する。結果0件をこの部品から推定しない。 |
| `Mobile` | 狭い画面で多数の候補と選択を表示する。 | 条件と選択を画面幅内で確認できる。 |
| `Dark` | 暗いテーマで多数の候補と選択を表示する。 | 条件と選択状態を判別できる。 |
