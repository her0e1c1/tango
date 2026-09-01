# Card Management E2E テスト仕様書

## 目的

Card の作成・編集・削除が保存先の境界を守り、失敗後の再試行でも入力と identity を維持できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-03 | write | [Card 編集内容を保存して reload 後も確認できる](#card-03) |
| CARD-04 | write | [Card を削除できる](#card-04) |
| CARD-08 | read | [Card の削除を取り消せる](#card-08) |
| CARD-09 | write | [Card の編集失敗後に再試行できる](#card-09) |
| CARD-13 | write | [remote Deck に Card を作成できる](#card-13) |
| CARD-14 | write | [local-only Deck に Card を作成できる](#card-14) |
| CARD-15 | write | [remote Card の作成失敗後に重複なく再試行できる](#card-15) |
| CARD-16 | write | [Card の削除失敗後に再試行できる](#card-16) |
| CARD-17 | read | [未保存の Card 編集内容を離脱前に確認できる](#card-17) |

<a id="card-03"></a>

### CARD-03 Card 編集内容を保存して reload 後も確認できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。

When:

- 対象 Card の front text、back text、tags を変更して保存し、画面を reload して編集画面を再度開く。

Then:

- Card の更新成功が共通 toast で表示される。
- 編集画面に変更後の front text、back text、tags が表示される。
- browser error が発生しない。

<a id="card-04"></a>

### CARD-04 Card を削除できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card は削除対象の1件だけである。

When:

- Card 一覧から対象 Card の削除を確定し、画面を reload する。

Then:

- Card の削除成功が共通 toast で表示される。
- Card 一覧に対象 Card が表示されない。
- 対象 Card が active Card として保存先から読み込まれない。
- browser error が発生しない。

<a id="card-08"></a>

### CARD-08 Card の削除を取り消せる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 削除対象 Card の action menu trigger から削除 dialog を開いている。
- dialog に対象 Card と削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除 dialog が閉じる。
- focus が対象 Card の action menu trigger に戻る。
- 対象 Card の永続データが変更されない。
- browser error が発生しない。

<a id="card-09"></a>

### CARD-09 Card の編集失敗後に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。
- 編集要求の失敗が共通 toast で処理され、変更内容が維持されている。
- 次の編集要求は成功できる。

When:

- 同じ変更内容の保存を再試行し、Card 一覧を reload する。

Then:

- Card 一覧へ戻る。
- Card の更新成功が共通 toast で表示される。
- reload 後も対象 Card に変更内容が表示される。
- 最初の編集失敗に伴う未処理の browser error が発生しない。

<a id="card-13"></a>

### CARD-13 remote Deck に Card を作成できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する remote Deck が存在する。

When:

- Card 一覧の Add card から front text と back text を入力して Card を作成し、画面を reload する。

Then:

- Card の作成成功が共通 toast で表示される。
- 作成した Card が reload 後も同じ Deck の Card 一覧に表示される。
- Card は remote 保存先だけに1件存在し、owner は対象 Deck と一致する。
- browser error が発生しない。

<a id="card-14"></a>

### CARD-14 local-only Deck に Card を作成できる

カテゴリ: `write`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- local-only Deck が存在する。

When:

- Card 一覧の Add card から front text と back text を入力して Card を作成し、画面を reload する。

Then:

- Card の作成成功が共通 toast で表示される。
- 作成した Card が reload 後も同じ Deck の Card 一覧に表示される。
- Card は browser 保存先だけに1件存在し、remote 保存先には存在しない。
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

- Card の作成成功が共通 toast で表示され、失敗 toast は残らない。
- 最初の要求と再試行で同じ Card ID が使用される。
- 作成した Card が対象 Deck の remote data に一つだけ存在する。
- Card の front text、back text、deck ID、owner、unique key が最初の作成要求から維持されている。
- browser storage に同じ Card の local-only duplicate が存在しない。
- 最初の作成失敗に伴う未処理の browser error が発生しない。

<a id="card-16"></a>

### CARD-16 Card の削除失敗後に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck と削除対象の Card が存在する。
- 最初の削除要求の失敗が共通 toast で処理され、削除 dialog が閉じている。
- 次の削除要求は成功できる。

When:

- 対象 Card の削除 dialog を開き直して削除を再試行し、Card 一覧を reload する。

Then:

- 削除 dialog が閉じる。
- Card 一覧に対象 Card が表示されない。
- 対象 Card が active Card として保存先から読み込まれない。
- 最初の削除失敗に伴う未処理の browser error が発生しない。

<a id="card-17"></a>

### CARD-17 未保存の Card 編集内容を離脱前に確認できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Card が存在する。
- Card 編集画面で front text を変更し、まだ保存していない。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択した後、再度離脱して Discard changes を選択する。

Then:

- 最初の離脱は取り消され、変更した front text が編集画面に維持される。
- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- 永続化された Card の front text は変更されない。
- browser error が発生しない。
