# E2E Seed データ

## Config

既存 smoke test の `persistedConfig` を基本にする。

| 項目 | 値 |
|---|---|
| `localMode` | `true` |
| `loadSample` | `false` |

Firebase UID / displayName はpersistせず、remote-mode testではAuth route mockから供給する。

## Deck

| 項目 | 値 |
|---|---|
| `id` | `e2e-deck-1` |
| `name` | `E2E Deck` |
| `category` | `English` |
| `uid` | `e2e-user` |
| `localMode` | `true` |
| `currentIndex` | `null` |
| `cardOrderIds` | `[]` |

## Card

詳細画面の表示確認用に、対象 deck に紐づく card を1枚だけ seed する。

| id | deckId | frontText | backText |
|---|---|---|---|
| `e2e-card-1` | `e2e-deck-1` | `apple` | `りんご` |
