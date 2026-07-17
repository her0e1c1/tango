# Assumptions And Gaps

## Documentation Gaps

- README は最低限の setup/test/deploy token 手順のみで、画面操作、CSV format の詳細、troubleshooting は薄いです。
- 既存 docs は `docs/architecture.md`、`docs/feature-list.md`、`docs/test-spec.md` などがありますが、runtime/deployment、configuration、commands、data model はまとまっていませんでした。この `docs/summary/` で補っています。
- `Docs` という大文字 directory は存在せず、既存 repository は `docs/` を使っています。macOS では case-insensitive filesystem の可能性もあるため、既存構成と skill 指定に合わせて `docs/summary/` に出力しました。

## Product / Behavior Gaps

- Deck を空の状態から新規作成する明確な UI route は見当たりません。deck creation は CSV import、sample load、code 内 action として確認できます。
- `DeckCard` には reimport icon の表示ロジックがありますが、`DeckListPage` では `onClickReimport` がコメントアウトされています。
- `isPublic` は type、form、Firestore rules にありますが、Deck form 上では disabled です。public deck の作成・公開フローは見当たりません。
- `useCardInterval` と `nextSeeingAt` の filter は `filterCardsForDeck` にありますが、学習時の interval 更新ロジックは実装されていません。

## Technical Gaps

- HTTP API routes は見当たらないため、`openapi.yaml` は生成していません。
- Message broker、webhook、明示的な event topic は見当たらないため、`asyncapi.yaml` は生成していません。
- Firestore 以外の persistent database schema や migration は見当たりません。
- Firestore の index 定義 file は見当たりません。現在の realtime read は uid 条件の Query subscription を使います。
- real Firebase project id、API key、deploy token は secrets/env に依存し、repository には含まれていません。

## Testing Gaps

- Playwright の browser E2E tests は `e2e` 配下にあります。
- coverage report 設定は見当たりません。
- 複数の skipped tests が残っています。詳細は `docs/summary/testing.md` と既存 `docs/test/missing-test-spec.md` を参照してください。

## Implementation Notes

- 学習中の `currentIndex` と `cardOrderIds` は Zustand study store、長期設定は Zustand config store が所有します。
- Deck/Card mutation は TanStack Query cache を optimistic に更新し、Firestore 書き込み失敗時に rollback します。
