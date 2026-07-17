# E2E Seed データ

## Config

`tango-config` の Zustand persistence envelope に E2E 用 config を seed する。

Firebase UID / displayName はpersistせず、remote-mode testではAuth route mockから供給する。

## Deck

| 項目 | 値 |
|---|---|
| `id` | `e2e-deck-1` |
| `name` | `E2E Deck` |
| `category` | `English` |
| `uid` | `e2e-user` |

Deck/Card は Firestore emulator に seed し、browser storage には entity data を保存しない。

## Card

詳細画面の表示確認用に、対象 deck に紐づく card を1枚だけ seed する。

| id | deckId | frontText | backText |
|---|---|---|---|
| `e2e-card-1` | `e2e-deck-1` | `apple` | `りんご` |
