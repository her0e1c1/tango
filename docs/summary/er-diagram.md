# ER Diagram

Firestore collection と TypeScript 型から確認できるデータ構造です。RDBMS の migration は見当たらないため、Firestore document model として整理しています。

```mermaid
erDiagram
    DECK ||--o{ CARD : contains

    DECK {
        string id
        string uid
        string name
        string url
        boolean isPublic
        number createdAt
        number updatedAt
        number deletedAt
        boolean localMode
        number currentIndex
        number scoreMax
        number scoreMin
        string_array cardOrderIds
        string_array selectedTags
        boolean tagAndFilter
        string category
        boolean convertToBr
    }

    CARD {
        string id
        string deckId
        string uid
        string frontText
        string backText
        string_array tags
        string uniqueKey
        number createdAt
        number updatedAt
        number deletedAt
        number score
        number numberOfSeen
        number lastSeenAt
        date nextSeeingAt
        number interval
        string url
        number startLine
        number endLine
    }
```

## Collections

| Collection | Source | Notes |
| --- | --- | --- |
| `deck` | `src/action/firestore/deck.ts`, `src/vite-env.d.ts` | deck document を `deck.id` で保存します。`create()` は `createdAt` と `updatedAt` を現在時刻に更新します。 |
| `card` | `src/action/firestore/card.ts`, `src/vite-env.d.ts` | card document を `card.id` で保存します。`deckId` が deck への参照です。 |

## Relationship

- `Card.deckId` が `Deck.id` を参照します。
- `Deck.cardOrderIds` は学習順を保持する card id 配列です。
- Firestore rule では card create/update 時に `request.resource.data.deckId` の deck 所有者が `request.auth.uid` と一致することを確認します。

## Deletion Semantics

- `card.logicalRemove()` は `deletedAt` と `updatedAt` を設定する soft delete です。
- `deck.remove()` は該当 deck の card を query して削除し、deck document も `deleteDoc` します。
- snapshot 購読では `deletedAt != null` の document を removed event として扱います。

## Local State Only

`ConfigState` は Firestore collection ではなく Redux state と LocalStorage に保存されます。`Deck.currentIndex` は型コメントで Firestore に保存しない意図が書かれていますが、`deck.update()` は渡された field を Firestore に送るため、実際の保存範囲は呼び出し側の payload に依存します。
