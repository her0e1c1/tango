# Use Cases

## 1. アプリ起動と同期初期化

Actor: 利用者

1. 利用者が SPA を開きます。
2. `App` が `action.event.init()` を dispatch します。
3. config が anonymous の場合、Firebase anonymous sign-in を実行します。
4. auth state change で uid/displayName を config に保存します。
5. Firestore deck/card snapshot を購読し、差分を Redux state に反映します。

```mermaid
sequenceDiagram
    actor User as 利用者
    participant App as App
    participant Event as action.event
    participant Auth as Firebase Auth
    participant FS as Firestore
    participant Store as Redux

    User->>App: open SPA
    App->>Event: init()
    Event->>Auth: signInAnonymously()
    Auth-->>Event: onAuthStateChanged(user)
    Event->>Store: configUpdate(uid, displayName)
    Event->>FS: subscribeDeck/subscribeCard(uid, lastUpdatedAt)
    FS-->>Event: snapshot event
    Event->>Store: deck/card bulk update
```

## 2. CSV を import して deck/card を作る

Actor: 利用者

1. 利用者が `/import` で CSV file を選択します。
2. `deck.parseFile()` が `Papa.parse` で rows を読みます。
3. row は `card.fromRow()` で `frontText/backText/tags/uniqueKey` に変換されます。
4. `spliteCreate()` が `uniqueKey` で新規 card と更新対象 card を分けます。
5. 同名 deck がない場合は `deck.create()` で deck を作ります。
6. 新規 card を bulk create、既存 card を bulk update します。

```mermaid
sequenceDiagram
    actor User as 利用者
    participant Page as DeckImportPage
    participant Deck as action.deck
    participant Card as action.card
    participant Store as Redux
    participant FS as Firestore

    User->>Page: upload CSV
    Page->>Deck: parseFile(file)
    Deck->>Deck: parseCsv(file)
    Deck->>Card: fromRow(row)
    Deck->>Store: splitByUniqueKey(cards)
    Deck->>Deck: create(deckName) if missing
    Deck->>Card: bulkUpdate(oldCards)
    Deck->>Card: bulkCreate(newCards, deckId)
    Card-->>FS: create/update when localMode=false
    Card-->>Store: card insert/update
```

## 3. 学習を開始して swipe する

Actor: 利用者

1. 利用者が deck の Study を押して `/deck/:id/start` に移動します。
2. tag/score filter を調整します。
3. Start を押すと `deck.start()` が filter 後の cards を取得します。
4. shuffle と max number を適用して `cardOrderIds` と `currentIndex` を保存します。
5. `/deck/:id/study` で front text を表示します。
6. swipe または arrow key で `deck.swipe()` を呼び、score と current index を更新します。

```mermaid
sequenceDiagram
    actor User as 利用者
    participant Start as DeckStartPage
    participant Selector as selector.card
    participant Deck as action.deck
    participant Card as action.card
    participant Study as DeckSwiperPage
    participant Store as Redux

    User->>Start: choose filters
    User->>Start: click Start
    Start->>Deck: start(deckId)
    Deck->>Selector: getFilteredByDeckId(deckId)
    Deck->>Store: deck.update(currentIndex, cardOrderIds)
    Start->>Study: navigate /study
    User->>Study: swipe
    Study->>Deck: swipe(direction, deckId)
    Deck->>Card: update(score, numberOfSeen, lastSeenAt)
    Deck->>Store: deck.update(currentIndex)
```

## 4. Google login して Firestore 同期する

Actor: 利用者

1. 利用者が Settings で Login を押します。
2. 現在の anonymous user に Google provider を link します。
3. user 情報を config に保存し、`lastUpdatedAt` を reset します。
4. uid を使って deck/card snapshot を購読します。

```mermaid
sequenceDiagram
    actor User as 利用者
    participant Settings as ConfigPage
    participant Event as action.event
    participant Auth as Firebase Auth
    participant FS as Firestore
    participant Store as Redux

    User->>Settings: click Login
    Settings->>Event: loginGoogle()
    Event->>Auth: linkWithPopup(currentUser, GoogleAuthProvider)
    Auth-->>Event: UserCredential
    Event->>Store: configUpdate(uid, displayName, lastUpdatedAt=0)
    Event->>FS: subscribeDeck/subscribeCard(uid, 0)
```

## 5. Deck を CSV として download する

Actor: 利用者

1. 利用者が deck card の download icon を押します。
2. `deck.download()` が deck 内 card を取得します。
3. `card.toRow()` で rows に変換します。
4. `Papa.unparse` で CSV 文字列にし、`file-saver` で保存します。
