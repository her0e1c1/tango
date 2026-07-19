# テスト仕様書

## 概要

本ドキュメントは、Tango アプリケーションのテスト仕様をまとめたものです。  
テストフレームワークとして [Vitest](https://vitest.dev/) および [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) を使用しています。

---

## テスト分類

| 分類 | ファイル | 種別 |
|------|---------|------|
| Action / Deck | `src/action/deck.spec.ts` | ユニットテスト |
| Action / Card | `src/action/card.spec.ts` | ユニットテスト |
| Action / Event | `src/action/event.spec.ts` | ユニットテスト |
| Settings / Config Store | `src/store/configStore.spec.ts` | ユニットテスト |
| Firestore / Deck | `src/adapters/firestore/deck.spec.ts` | 統合テスト |
| Firestore / Card | `src/adapters/firestore/card.spec.ts` | 統合テスト |
| Firestore / Event | `src/adapters/firestore/event.spec.ts` | Query購読統合テスト |
| Firestore / Rule | `src/adapters/firestore/rule/rule.spec.ts` | セキュリティルールテスト |
| Container / CardForm | `src/features/card/containers/CardFormContainer.spec.tsx` | container テスト |
| Container / CardList | `src/features/card/containers/CardListContainer.spec.tsx` | container/template 統合テスト |
| Container / DeckForm | `src/features/deck/containers/DeckFormContainer.spec.tsx` | container テスト |
| Hook / DeckFilter | `src/features/deck/hooks/useDeckFilterState.spec.tsx` | hook/component 統合テスト |
| Hook / ConfigForm | `src/features/settings/hooks/useConfigFormState.spec.tsx` | hook/component 統合テスト |
| Component / FrontText | `src/features/card/components/FrontText.spec.tsx` | component テスト |
| Hook / StudyController | `src/features/study/hooks/useStudyControllerState.spec.tsx` | hook/component 統合テスト |
| Container / DeckSwiper | `src/features/study/containers/DeckSwiperContainer.spec.tsx` | container/template 統合テスト |
| Container / DeckImport | `src/features/import/containers/DeckImportContainer.spec.tsx` | container/template 統合テスト |
| Architecture | `src/lib/componentArchitecture.spec.ts` | UI 依存境界テスト |

---

## 1. Action テスト（ユニットテスト）

### 1-1. Deck Action (`src/action/deck.spec.ts`)

> `firestore` および `file-saver` はモック化して実行。タイマーは `vi.useFakeTimers()` で固定。

#### prepareDeck

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should prepare deck | `name: "name"`, `uid: "uid"` | `action.deck.prepare()` を呼ぶ | 返り値が `{ name, uid }` を含む |

#### generateName

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should generate name | State に `name: "name"` の Deck が存在 | `generateName("deckName", state)` | `"deckName"` を返す（衝突なし） |
| 2 | should generate name with _1 | State に `name: "name"` の Deck が存在 | `generateName("name", state)` | `"name_1"` を返す |
| 3 | should generate name with _2 | State に `"name"` と `"name_1"` が存在 | `generateName("name", state)` | `"name_2"` を返す |

#### create

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should create | `uid: "uid"`, Deck Query 空 | deck mutation で作成 | `firestore.deck.create` が正しい Deck オブジェクトで呼ばれる |

#### update

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should update | `uid: "uid"` | `action.deck.update(deck)` を dispatch | `firestore.deck.update` が該当 Deck で呼ばれる |

#### remove

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should remove | State に `deckId: { uid: "uid" }` が存在 | `action.deck.remove("deckId")` を dispatch | `firestore.deck.remove("deckId", "uid")` が呼ばれる |

#### start

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should start | `defaultAutoPlay: true`, `cardIds: []` | `useStudyActions.start()` を呼ぶ | study store に `currentIndex: 0`, `cardOrderIds: []`, `autoPlay: true` が保存される |

#### swipe

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should swip | `currentIndex: 0`, `cardOrderIds: ["a","b","c"]`, card `a` の `interval: 60*24` | `action.deck.swipe("cardSwipeRight", "deckId")` を dispatch | dispatch が3回呼ばれ、`lastSwipe`・`currentIndex: 1`・card の `numberOfSeen: 1` / `lastSeenAt` が更新される |

#### spliteCreate

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should splite & create | `uniqueKey: "a"` のカードが既存 | `action.deck.spliteCreate("name", cards)` を dispatch | 既存カードは `bulkUpdate`、新規カードは `bulkCreate`、新規 Deck の `create` は呼ばれない |

#### parseUrl

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should parse url | URL から CSV `"front,back"` をフェッチ | `action.deck.parseUrl("http://example.com/deck-name.csv")` を dispatch | `spliteCreate("deck-name.csv", [{ frontText: "front", backText: "back", ... }])` が呼ばれる |

#### parseFile

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should parse file *(スキップ)* | CSV ファイルオブジェクト | `action.deck.parseFile(file)` を dispatch | `spliteCreate` が正しいカードで呼ばれる |

#### download

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should download | `name: "name"`, `cardIds: []` | `action.deck.download("id")` を dispatch | `Blob` が `""` で生成され、`fileSaver.saveAs` が `"name.csv"` で呼ばれる |

#### downloadCsvSampleText

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should download | なし | `action.deck.downloadCsvSampleText()` を dispatch | `Blob` が `CSV_SAMPLE_TEXT` で生成され、`fileSaver.saveAs` が `"sample.csv"` で呼ばれる |

---

### 1-2. Card Action (`src/action/card.spec.ts`)

> `firestore` はモック化して実行。

#### fromRow

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should be fromRow | 行データ `["front","back","a,b,c","123"]` | `card.fromRow(row)` | `{ frontText:"front", backText:"back", tags:["a","b","c"], uniqueKey:"123" }` |
| 2 | should be empty | 空配列 | `card.fromRow([])` | `{ frontText:"", backText:"", tags:[], uniqueKey:"" }` |

#### toRow

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should be toRow | Card オブジェクト | `card.toRow(c)` | `["front","back","a,b,c","123"]` |
| 2 | should be empty | 全フィールド空の Card | `card.toRow(c)` | `["","","",""]` |

#### goTo

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should goTo index | `cardOrderIds: ["a", id, "b"]` | `card.goTo(id)` を dispatch | `deck.update({ id, currentIndex: 1 })` が呼ばれる |

#### update

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should update | `deckId: "deckId"` の Deck が存在 | `card.update(c)` を dispatch | `firestore.card.update(c)` が呼ばれる |

#### remove

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should remove | `id: "id"`, `deckId: "deckId"` の Card と Deck が存在 | `card.remove("id")` を dispatch | `firestore.card.logicalRemove("id")` が呼ばれる |

#### filterCardsForUpdate

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should filter an old card with invalid key | State に `uniqueKey:"a"` が存在 | `uniqueKey:"z"` のカードでフィルタ | 空配列（マッチなし） |
| 2 | should filter an old card with the same text | State に同一テキストのカードが存在 | 同テキストのカードでフィルタ | 空配列（変更なし） |
| 3 | should not filter an old card | State に `uniqueKey:"a"` が存在 | `uniqueKey:"a"` のカード（テキスト未指定）でフィルタ | State の値を上書きしたカードを返す |
| 4 | should not filter an old card and overwrite | State に `uniqueKey:"a"` が存在 | `uniqueKey:"a"`, `frontText:"f"` のカードでフィルタ | `frontText:"f"`, `backText:"b"` に上書きしたカードを返す |

---

### 1-3. Event Action (`src/action/event.spec.ts`)

> Firebase Auth と Query cleanup をモック化して実行。旧 realtime action lifecycle と cursor は存在しない。

#### logout

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should logout | confirmed UID | `action.event.logout(uid)` を呼ぶ | sign-out後に UID Query cache と study state が除去される |

#### loginGoogle

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should login | `linkWithPopup` が Firebase User を返す | `action.event.loginGoogle()` を呼ぶ | User が Auth Context へ publish される |

---

### 1-4. Config Store (`src/store/configStore.spec.ts`)

#### update

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | updates and toggles long-lived settings | default config | `updateConfig` と `toggleConfig` を呼ぶ | Zustand state が更新される |
| 2 | persists only config state | memory storage | config を更新して rehydrate | `tango-config` に config だけが保存・復元される |

---

## 2. Firestore テスト（統合テスト）

> Firestore エミュレータを使用して実行。並列実行 (`describe.concurrent`) および `retry: 3` を設定。

### 2-1. Firestore / Deck (`src/adapters/firestore/deck.spec.ts`)

#### CRUD

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should create a deck and check if exists | `firestore.deck.create(d)` | Firestore に同一データが保存され、`exists()` が `true` |
| 2 | should update a deck | `create` 後に `update({ name: "updated" })` | Firestore のデータが更新される |
| 3 | should delete a deck | `create` 後に `remove(id, uid)` | `exists()` が `false` になる |

#### splitCards

| # | テスト名 | 入力 | 期待結果 |
|---|---------|------|---------|
| 1 | should split cards (max=5) | 5枚, max=5 | `[[card0..4]]` (1グループ) |
| 2 | should split cards (max=3) | 5枚, max=3 | `[[card0..2], [card3..4]]` (2グループ) |
| 3 | should split cards (max=2) | 5枚, max=2 | `[[card0..1], [card2..3], [card4]]` (3グループ) |
| 4 | should be empty cards | max=0 または cards=[] | `[]` |

---

### 2-2. Firestore / Card (`src/adapters/firestore/card.spec.ts`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should create a card | `firestore.card.create(c)` | Firestore に同一データが保存される |
| 2 | should update a card | `create` 後に `update({ frontText: "updated" })` | Firestore のデータが更新される |
| 3 | should bulk-update a card | `create` 後に `bulkUpdate([updated])` | Firestore のデータが更新される |
| 4 | should logical-remove a card | `create` 後に `logicalRemove(id)` | `deletedAt` が設定されたデータが保存される |
| 5 | should exists a card | `create` 後に `exists(id)` | `true` を返す |

---

### 2-3. Firestore / Event (`src/adapters/firestore/event.spec.ts`)

| # | テスト名 | 期待結果 |
|---|---------|---------|
| 1 | Query realtime subscriptions | cursorなしのUID購読がDeck/Cardの初期replace、更新delta、削除deltaを順に通知する |

---

### 2-4. Firestore / Security Rule (`src/adapters/firestore/rule/rule.spec.ts`)

> Firestore セキュリティルール (`firestore.rules`) を対象としたテスト。

#### 認証済みユーザー（正規UID）

| # | リソース | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | deck | 読み取り (getDoc) | 成功 |
| 2 | deck | 作成 (setDoc) | 成功 |
| 3 | deck | 更新 (updateDoc) | 成功 |
| 4 | deck | 削除 (deleteDoc) | 成功 |
| 5 | card | 読み取り (getDoc) | 成功 |
| 6 | card | 作成 (setDoc, 対応 Deck あり) | 成功 |
| 7 | card | 更新 (updateDoc) | 成功 |
| 8 | card | 削除 (deleteDoc) | 成功 |

#### 認証済みユーザー（異なるUID）

| # | リソース | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | deck (非公開) | 読み取り | 失敗 |
| 2 | deck (公開) | 読み取り | 成功 |
| 3 | deck | 作成 | 失敗 |
| 4 | deck | 更新 | 失敗 |
| 5 | deck | 削除 | 失敗 |
| 6 | card (非公開 Deck) | 読み取り | 失敗 |
| 7 | card (公開 Deck) | 読み取り | 成功 |
| 8 | card | 作成 | 失敗 |
| 9 | card | 更新 | 失敗 |
| 10 | card | 削除 | 失敗 |

#### 未認証ユーザー

| # | リソース | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | deck (非公開) | 読み取り | 失敗 |
| 2 | deck (公開) | 読み取り | 成功 |
| 3 | deck | 作成 | 失敗 |
| 4 | deck | 更新 | 失敗 |
| 5 | deck | 削除 | 失敗 |
| 6 | card (非公開 Deck) | 読み取り | 失敗 |
| 7 | card (公開 Deck) | 読み取り | 成功 |
| 8 | card | 作成 | 失敗 |
| 9 | card | 更新 | 失敗 |
| 10 | card | 削除 | 失敗 |

---

## 3. Feature UI テスト

### 3-1. CardFormContainer (`src/features/card/containers/CardFormContainer.spec.tsx`)

> 初期カード: `frontText: "FRONT TEXT"`, `backText: "BACK TEXT"`, `tags: []`, `lastSeenAt: 1`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | submits current card | Save ボタンをクリック | `cardUpdateAndBack(card)` が呼ばれる |
| 2 | submits edited text | front/back text を編集後 Save | 編集済み card で `cardUpdateAndBack` が呼ばれる |
| 3 | submits edited tags | language tag を選択後 Save | 編集済み tags で `cardUpdateAndBack` が呼ばれる |
| 4 | preserves invalid route error | route id なしで container を評価 | `invalid card id` error |

---

### 3-2. DeckFormContainer (`src/features/deck/containers/DeckFormContainer.spec.tsx`)

> 初期 Deck: `name: "NAME"`, `isPublic: false`, `convertToBr: false`, `url: ""`, `category: ""`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | submits current deck | Save ボタンをクリック | `updateAndBack(deck)` が呼ばれる |
| 2 | submits edited name | `name` を編集後 Save | 編集済み name で `updateAndBack` が呼ばれる |
| 3 | submits edited URL | `url` を編集後 Save | 編集済み url で `updateAndBack` が呼ばれる |
| 4 | submits convert setting | `convertToBr` を変更後 Save | `convertToBr: true` で `updateAndBack` が呼ばれる |
| 5 | submits edited category | category を変更後 Save | 編集済み category で `updateAndBack` が呼ばれる |
| 6 | preserves invalid route error | route id なしで container を評価 | `invalid deck id` error |

---

### 3-3. ConfigForm (`src/features/settings/hooks/useConfigFormState.spec.tsx`)

> 初期 Config: 全フラグ `false`、数値フィールド `0`、文字列フィールド `""`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | auto-submits field changes | boolean/numeric field を変更 | 変更ごとに `onSubmit` が最新 config で呼ばれる |
| 2 | synchronizes dark mode | `config.darkMode` prop を変更 | form 表示と auto-submit の値が同期する |

---

### 3-4. FrontText (`src/features/card/components/FrontText.spec.tsx`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should swipe | `text="text"` でレンダリング | `#frontText` 要素が表示されている |

---

### 3-5. Deck filter (`src/features/deck/hooks/useDeckFilterState.spec.tsx`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | auto-submits score/filter | score と AND/OR と全タグを変更 | 最新 deck filter で `onSubmit` が呼ばれる |
| 2 | auto-submits score controls | score switch と slider を変更 | ON は `0`、OFF は `null`、slider 値が反映される |
| 3 | auto-submits tag controls | 個別 tag、all、clear を操作 | selectedTags が各操作に合わせて送信される |

---

### 3-6. Study controller (`src/features/study/hooks/useStudyControllerState.spec.tsx`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | toggles play/pause | controller icon をクリック | container hook の autoPlay が切り替わる |
| 2 | advances after interval | Play 後、設定時間まで timer を進める | interval 到達時だけ `onChange(index + 1)` が呼ばれる |
| 3 | keeps initial autoPlay semantics | mount 後に prop を変更 | hook 内 state は prop 変更で再初期化されない |
| 4 | updates index manually | slider を変更 | `onChange` が選択 index で呼ばれる |
| 5 | stops at terminal index | terminal index で timer を進める | `onChange` は呼ばれない |

---

## テスト実行方法

```bash
# Docker コンテナ内でテスト実行（推奨）
docker compose -f .devcontainer/compose.yaml run --rm --entrypoint npm dev run test:firestore

# 特定ファイルのみ実行
docker compose -f .devcontainer/compose.yaml run --rm --entrypoint npm dev run test -- ./src/action/deck.spec.ts

# ローカルで実行（Firestore エミュレータ起動が必要）
npm run test

# Make 経由で Docker 実行
make test
```
