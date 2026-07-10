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
| Action / Config | `src/action/config.spec.ts` | ユニットテスト |
| Firestore / Deck | `src/action/firestore/deck.spec.ts` | 統合テスト |
| Firestore / Card | `src/action/firestore/card.spec.ts` | 統合テスト |
| Firestore / Event | `src/action/firestore/event.spec.ts` | 統合テスト（スキップ） |
| Firestore / Rule | `src/action/firestore/rule/rule.spec.ts` | セキュリティルールテスト |
| Selector / Deck | `src/selector/deck.spec.ts` | ユニットテスト |
| Selector / Card | `src/selector/card.spec.ts` | ユニットテスト |
| Component / CardForm | `src/component/Organism/CardForm.spec.tsx` | コンポーネントテスト |
| Component / DeckForm | `src/component/Organism/DeckForm.spec.tsx` | コンポーネントテスト |
| Component / ConfigForm | `src/component/Organism/ConfigForm.spec.tsx` | コンポーネントテスト |
| Component / FrontText | `src/component/Organism/FrontText.spec.tsx` | コンポーネントテスト |
| Component / DeckStartForm | `src/component/Organism/DeckStartForm.spec.tsx` | コンポーネントテスト（スキップ） |
| Component / Controller | `src/component/Organism/Controller.spec.tsx` | コンポーネントテスト（スキップ） |

---

## 1. Action テスト（ユニットテスト）

### 1-1. Deck Action (`src/action/deck.spec.ts`)

> `firestore` および `file-saver` はモック化して実行。タイマーは `vi.useFakeTimers()` で固定。

#### prepareDeck

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should prepare deck | `name: "name"`, `uid: "uid"`, `localMode: true` | `action.deck.prepare()` を呼ぶ | 返り値が `{ name, uid, localMode }` を含む |

#### generateName

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should generate name | State に `name: "name"` の Deck が存在 | `generateName("deckName", state)` | `"deckName"` を返す（衝突なし） |
| 2 | should generate name with _1 | State に `name: "name"` の Deck が存在 | `generateName("name", state)` | `"name_1"` を返す |
| 3 | should generate name with _2 | State に `"name"` と `"name_1"` が存在 | `generateName("name", state)` | `"name_2"` を返す |

#### create

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should create | `uid: "uid"`, `localMode: false`, Deck State 空 | `action.deck.create("name")` を dispatch | `firestore.deck.create` が正しい Deck オブジェクトで呼ばれる |

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
| 1 | should start | `defaultAutoPlay: true`, `cardIds: []` | `action.deck.start("deckId")` を dispatch | `deck.update` が `{ currentIndex: 0, cardOrderIds: [] }` で呼ばれ、`configUpdate({ showBackText: false, autoPlay: true })` が dispatch される |

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

> `firebase/auth`, `firestore` はモック化して実行。タイマーは `vi.useFakeTimers()` で固定。

#### deckOnChange

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should subscribe deck | `added: [deck]`, `lastUpdatedAt` | `action.event.deckOnChange(e)` を dispatch | `deckBulkInsert([deck])` と `configUpdate({ lastUpdatedAt })` が dispatch される |

#### cardOnChange

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should subscribe card | `added: [card]`, `lastUpdatedAt` | `action.event.cardOnChange(e)` を dispatch | `cardBulkInsert([card])` と `configUpdate({ lastUpdatedAt })` が dispatch される |

#### removeFromLocal

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | delete deck | `firestore.deck.exists` が `false` を返す | `action.event.removeFromLocal()` を dispatch | `deckDelete("deckId")` が dispatch される |
| 2 | delete card | `firestore.deck.exists` が `false` を返す | `action.event.removeFromLocal()` を dispatch | `cardDelete("cardId")` が dispatch される |

#### logout

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should logout | なし | `action.event.logout()` を dispatch | `getAuth` 1回、`signOut` 1回呼ばれ、`clearAll()` が dispatch される |

#### loginGoogle

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should login | `linkWithPopup` が `{ user: { uid, isAnonymous, providerData } }` を返す | `action.event.loginGoogle()` を dispatch | `linkWithPopup` 1回呼ばれ、`configUpdate({ uid, displayName, isAnonymous, lastUpdatedAt: 0 })` が dispatch される |

---

### 1-4. Config Action (`src/action/config.spec.ts`)

#### update

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should update | なし | `update("autoPlay", true)` を dispatch | `configUpdate({ autoPlay: true })` が dispatch される |

---

## 2. Firestore テスト（統合テスト）

> Firestore エミュレータを使用して実行。並列実行 (`describe.concurrent`) および `retry: 3` を設定。

### 2-1. Firestore / Deck (`src/action/firestore/deck.spec.ts`)

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

### 2-2. Firestore / Card (`src/action/firestore/card.spec.ts`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should create a card | `firestore.card.create(c)` | Firestore に同一データが保存される |
| 2 | should update a card | `create` 後に `update({ frontText: "updated" })` | Firestore のデータが更新される |
| 3 | should bulk-update a card | `create` 後に `bulkUpdate([updated])` | Firestore のデータが更新される |
| 4 | should logical-remove a card | `create` 後に `logicalRemove(id)` | `deletedAt` が設定されたデータが保存される |
| 5 | should exists a card | `create` 後に `exists(id)` | `true` を返す |

---

### 2-3. Firestore / Event (`src/action/firestore/event.spec.ts`) ※スキップ

> 現在 `describe.skip` によりスキップ中。

#### deck イベント

| # | テスト名 | 期待結果 |
|---|---------|---------|
| 1 | should create a insert event | `updatedAt` 以降の作成で `added` イベントが発火する |
| 2 | should not create a insert event | `updatedAt` 以前の作成では発火しない |
| 3 | should create a update event | 更新操作で `modified` イベントが発火する |
| 4 | should not create a update event | `updatedAt` 以前の更新では発火しない |
| 5 | should create a delete event | 削除操作で `removed` イベントが発火する |
| 6 | should not create a delete event | `updatedAt` 以前の削除では発火しない |

#### card イベント

| # | テスト名 | 期待結果 |
|---|---------|---------|
| 1 | should create a insert event | カード追加で `added` イベントが発火する |
| 2 | should not create a insert event | `updatedAt` 以前の追加では発火しない |
| 3 | should create a update event | 更新で `modified` イベントが発火する |
| 4 | should create a update event for logical remove | 論理削除で `removed` イベントが発火する |
| 5 | should not create a update event | `updatedAt` 以前の更新では発火しない |
| 6 | should create a delete event | 物理削除で `removed` イベントが発火する |
| 7 | should not create a delete event | `updatedAt` 以前の削除では発火しない |

---

### 2-4. Firestore / Security Rule (`src/action/firestore/rule/rule.spec.ts`)

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

## 3. Selector テスト（ユニットテスト）

### 3-1. Deck Selector (`src/selector/deck.spec.ts`)

#### findByName

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should find by name | State に `name: "deckName"` の Deck が存在 | `findByName("deckName")(state)` | `"id"` を返す |
| 2 | should not find by name | State に `name: "deckName"` の Deck が存在 | `findByName("invalid")(state)` | `null` を返す |

---

### 3-2. Card Selector (`src/selector/card.spec.ts`)

#### splitByUniqueKey

| # | テスト名 | 前提条件 | 操作 | 期待結果 |
|---|---------|---------|------|---------|
| 1 | should split into new cards | State に `uniqueKey: "a","b","c"` が存在 | `uniqueKey: "A","B","C"` のカードで分割 | 全カードが `newCards` に分類、`oldCards` は空 |
| 2 | should split into old cards | State に `uniqueKey: "a","b","c"` が存在 | `uniqueKey: "a","b","c"` のカードで分割 | 全カードが `oldCards` に分類、`newCards` は空 |
| 3 | should split into new and old cards | State に `uniqueKey: "a","b","c"` が存在 | `uniqueKey: "A","b","c"` のカードで分割 | `newCards: ["A"]`、`oldCards: ["b","c"]` |

---

## 4. コンポーネントテスト

### 4-1. CardForm (`src/component/Organism/CardForm.spec.tsx`)

> 初期カード: `frontText: "FRONT TEXT"`, `backText: "BACK TEXT"`, `tags: []`, `lastSeenAt: 1`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should submit | Save ボタンをクリック | `onSubmit` が初期カードで呼ばれる |
| 2 | should update frontText | `frontText` テキストエリアをクリアして "UPDATED" を入力後 Save | `onSubmit({ ...card, frontText: "UPDATED" })` が呼ばれる |
| 3 | should update backText | `backText` テキストエリアをクリアして "UPDATED" を入力後 Save | `onSubmit({ ...card, backText: "UPDATED" })` が呼ばれる |
| 4 | should update tags | タグオプション "tag 1" をクリック後 Save | `onSubmit({ ...card, tags: ["tag 1"] })` が呼ばれる |

---

### 4-2. DeckForm (`src/component/Organism/DeckForm.spec.tsx`)

> 初期 Deck: `name: "NAME"`, `isPublic: false`, `convertToBr: false`, `url: ""`, `category: ""`, `localMode: true`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should submit | Save ボタンをクリック | `onSubmit` が初期 Deck で呼ばれる |
| 2 | should update name | `name` 入力をクリアして "UPDATED" と入力後 Save | `onSubmit({ ...deck, name: "UPDATED" })` が呼ばれる |
| 3 | should update url | `url` 入力をクリアして "UPDATED" と入力後 Save | `onSubmit({ ...deck, url: "UPDATED" })` が呼ばれる |
| 4 | should update isPublic *(スキップ)* | `isPublic` チェックボックスをクリック後 Save | `onSubmit({ ...deck, isPublic: true })` が呼ばれる |
| 5 | should update convertToBr | `convertToBr` チェックボックスをクリック後 Save | `onSubmit({ ...deck, convertToBr: true })` が呼ばれる |
| 6 | should update category | セレクトで "LABEL" を選択後 Save | `onSubmit({ ...deck, category: "VALUE" })` が呼ばれる |

---

### 4-3. ConfigForm (`src/component/Organism/ConfigForm.spec.tsx`)

> 初期 Config: 全フラグ `false`、数値フィールド `0`、文字列フィールド `""`

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should update showHeader | `showHeader` チェックボックスをクリック | `onSubmit({ ...config, showHeader: true })` が呼ばれる |
| 2 | should update showSwipeButtonList | `showSwipeButtonList` チェックボックスをクリック | `onSubmit({ ...config, showSwipeButtonList: true })` が呼ばれる |
| 3 | should update showSwipeFeedback | `showSwipeFeedback` チェックボックスをクリック | `onSubmit({ ...config, showSwipeFeedback: true })` が呼ばれる |
| 4 | should update maxNumberOfCardsToLearn | `maxNumberOfCardsToLearn` 入力を `10` に変更 | `onSubmit({ ...config, maxNumberOfCardsToLearn: 10 })` が呼ばれる |
| 5 | should update cardInterval *(スキップ)* | `cardInterval` 入力を `10` に変更 | `onSubmit({ ...config, cardInterval: 10 })` が呼ばれる |

---

### 4-4. FrontText (`src/component/Organism/FrontText.spec.tsx`)

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should swipe | `text="text"` でレンダリング | `#frontText` 要素が表示されている |

---

### 4-5. DeckStartForm (`src/component/Organism/DeckStartForm.spec.tsx`) ※スキップ

> 現在 `describe.skip` によりスキップ中。

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should submit | `scoreMax:2`, `scoreMin:-2`, タグフィルタ ON、全タグ選択後 Submit | `onSubmit({ scoreMax:2, scoreMin:-2, tagAndFilter:true, selectedTags: tags })` が呼ばれる |
| 2 | should update score | scoreMax/scoreMin スイッチの ON/OFF とスライダー操作 | スイッチ ON で `0`、OFF で `null`、スライダーの値が反映される |

---

### 4-6. Controller (`src/component/Organism/Controller.spec.tsx`) ※スキップ

> 現在 `describe.skip` によりスキップ中。

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| 1 | should update index once a second | Play ボタンをクリック後、1秒進める | `onChange(1)` が呼ばれる |
| 2 | should update index manually | スライダーを `3` に変更 | `onChange(3)` が呼ばれる |

---

## テスト実行方法

```bash
# Docker コンテナ内でテスト実行（推奨）
docker compose run --rm --entrypoint npm dev run test:firestore

# 特定ファイルのみ実行
docker compose run --rm --entrypoint npm dev run test -- ./src/action/deck.spec.ts

# ローカルで実行（Firestore エミュレータ起動が必要）
npm run test

# Make 経由で Docker 実行
make test
```
