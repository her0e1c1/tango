# Creation E2E テスト仕様書

## 目的

Deck / Card の作成が保存先の境界を守り、失敗後の再試行でも同じ identity を維持して重複しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-11 | write | [空の local-only Deck を作成して reload 後も確認できる](#deck-11) |
| CARD-15 | write | [remote Card の作成失敗後に重複なく再試行できる](#card-15) |

<a id="deck-11"></a>

### DECK-11 空の local-only Deck を作成して reload 後も確認できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- ユーザーとして認証されている。
- 作成対象の Deck は現在の UID の remote data と local-only data のどちらにも存在しない。

When:

- Deck の作成画面で name と category を入力し、Local only を有効にして保存した後、Deck 一覧を reload する。

Then:

- 作成した空の Deck が reload 後も Deck 一覧に表示される。
- 作成した Deck は browser storage に一つだけ存在する。
- remote data に同じ Deck が存在しない。
- 対象 Deck に Card が存在しない。
- browser error が発生しない。

<a id="card-15"></a>

### CARD-15 remote Card の作成失敗後に重複なく再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する remote Deck が存在する。
- remote Card の最初の作成要求が失敗している。
- 作成失敗が画面内で処理され、入力内容と作成対象の Card ID が維持されている。
- 次の作成要求は成功できる。

When:

- 入力内容を変更せずに同じ Card の作成を再試行し、Card 一覧を reload する。

Then:

- 最初の要求と再試行で同じ Card ID が使用される。
- 作成した Card が対象 Deck の remote data に一つだけ存在する。
- Card の front text、back text、deck ID、owner、unique key が最初の作成要求から維持されている。
- browser storage に同じ Card の local-only duplicate が存在しない。
- 最初の作成失敗に伴う未処理の browser error が発生しない。
