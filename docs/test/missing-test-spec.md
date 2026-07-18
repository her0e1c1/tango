# 追加テスト仕様書（漏れケース）

## 目的
既存テストコードと `docs/test-spec.md` を確認し、未実装・スキップ・TODOコメントで明示されているテスト漏れを補完する。

## 対象
- `src/action/deck.spec.ts`
- `src/action/event.spec.ts`
- `src/store/configStore.spec.ts`

---

## 1. Deck Action の不足テスト

### 1-1. `spliteCreate` の「Deck名が未存在」ケース

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---|---|---|---|
| 1 | should create new deck when name does not exist | `deck.byId` に同名 Deck が存在しない。`cards` は新規カードのみ。 | `action.deck.spliteCreate("new-name", cards)` を dispatch | `action.deck.create("new-name")` が1回呼ばれる。`card.bulkUpdate` は0回。`card.bulkCreate` は1回。 |

### 1-2. `parseFile`（現在 skip）の実行可能化

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---|---|---|---|
| 1 | should parse file and call spliteCreate | `FileReader` をモックし、CSV本文 `front,back` を返す。 | `action.deck.parseFile(file)` を dispatch | `spliteCreate("deck-name.csv", parsedCards)` が呼ばれ、dispatch が1回以上実行される。 |
| 2 | should parse file with multiple rows | 複数行CSV（ヘッダなし）を返す。 | `action.deck.parseFile(file)` を dispatch | 各行が `Card` に変換され、件数が一致する。 |
| 3 | should handle empty file | 空ファイルCSVを返す。 | `action.deck.parseFile(file)` を dispatch | `spliteCreate` は空配列または呼び出しなし（実装仕様に合わせて固定）で例外にならない。 |

---

## 2. Config Store の不足テスト

### 3-1. `update` の他フィールド網羅（TODOコメントあり）

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---|---|---|---|
| 1 | should update showBackText | default config | `updateConfig({ showBackText: true })` を呼ぶ | Zustand state が更新される。 |
| 2 | should update defaultAutoPlay | default config | `updateConfig({ defaultAutoPlay: false })` を呼ぶ | Zustand state が更新される。 |

---

## 3. 優先順位
1. `parseFile` の skip 解消（実運用でCSV取込品質に直結）
2. `spliteCreate` の分岐網羅（Deck重複/新規作成の回帰防止）
3. Config update の網羅（軽微だが回帰防止効果あり）
