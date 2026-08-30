# Deck E2E テスト仕様書

## 目的

Deck 管理の主要導線が、ブラウザ上で表示・作成・編集・削除・保存先の移行・export まで破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して reload 後も確認できる](#deck-02) |
| DECK-03 | batch | [Deck と関連データをまとめて削除できる](#deck-03) |
| DECK-04 | read | [Deck の削除を取り消せる](#deck-04) |
| DECK-05 | batch | [Deck の削除失敗後に再試行できる](#deck-05) |
| DECK-06 | read | [存在しない Deck から復帰できる](#deck-06) |
| DECK-07 | batch | [local-only Deck と Card を remote へ移行できる](#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](#deck-08) |
| DECK-09 | write | [空の remote Deck を作成して reload 後も確認できる](#deck-09) |
| DECK-10 | write | [remote Deck の作成失敗後に重複なく再試行できる](#deck-10) |
| DECK-12 | read | [未保存の Deck 編集内容を離脱前に確認できる](#deck-12) |

<a id="deck-01"></a>

### DECK-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に Card が存在する。

When:

- Deck 一覧を開き、対象 Deck を選択する。

Then:

- 対象 Deck の Card 一覧へ遷移する。
- 対象 Card の front text が表示される。
- browser error が発生しない。

<a id="deck-02"></a>

### DECK-02 Deck 編集内容を保存して reload 後も確認できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Deck が存在する。

When:

- 対象 Deck の name と category を変更して保存し、画面を reload して編集画面を再度開く。

Then:

- 編集画面に変更後の name と category が表示される。
- browser error が発生しない。

<a id="deck-03"></a>

### DECK-03 Deck と関連データをまとめて削除できる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck に複数の Card と再開可能な学習 session が存在する。

When:

- Deck 一覧から対象 Deck の削除を確定し、画面を reload する。

Then:

- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck と関連するすべての Card が保存先から削除されている。
- 対象 Deck の学習 session を再開できない。
- browser error が発生しない。

<a id="deck-04"></a>

### DECK-04 Deck の削除を取り消せる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck の action menu trigger から削除 dialog を開いている。
- dialog に対象 Deck、関連 Card と学習 session への影響、削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除 dialog が閉じる。
- focus が対象 Deck の action menu trigger に戻る。
- 対象 Deck と関連する Card および学習 session が変更されない。
- browser error が発生しない。

<a id="deck-05"></a>

### DECK-05 Deck の削除失敗後に再試行できる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck に Card と再開可能な学習 session が存在する。
- 削除要求の失敗が dialog 内で処理され、同じ削除対象が維持されている。
- 次の削除要求は成功できる。

When:

- dialog から同じ Deck の削除を再試行する。

Then:

- 削除 dialog が閉じる。
- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck と関連する Card および学習 session が削除される。
- 最初の削除失敗に伴う未処理の browser error が発生しない。

<a id="deck-06"></a>

### DECK-06 存在しない Deck から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーの保存先に、route が参照する Deck が存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。

<a id="deck-07"></a>

### DECK-07 local-only Deck と Card を remote へ移行できる

カテゴリ: `batch`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 認証済みユーザーの browser storage に local-only Deck が存在する。
- 対象 Deck に複数の local-only Card が存在する。

When:

- 対象 Deck の Local only を無効にして保存し、画面を reload する。

Then:

- 対象 Deck とすべての Card が remote から読み込まれて表示される。
- browser storage に移行前の Deck と Card の duplicate が残らない。
- browser error が発生しない。

<a id="deck-08"></a>

### DECK-08 Deck の Card を CSV で export できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text、back text、tags、unique key を持つ Card が複数存在する。

When:

- Deck 一覧から対象 Deck の CSV download を実行する。

Then:

- 対象 Deck の name に対応する CSV file が download される。
- CSV に各 Card の front text、back text、tags、unique key が Card ごとの row として含まれる。
- browser error が発生しない。

<a id="deck-09"></a>

### DECK-09 空の remote Deck を作成して reload 後も確認できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- ユーザーとして認証されている。
- 作成対象の Deck は現在の UID の remote data と local-only data のどちらにも存在しない。

When:

- Deck の作成画面で name と category を入力し、local-only を無効にして保存した後、Deck 一覧を reload する。

Then:

- 作成した空の Deck が reload 後も Deck 一覧に表示される。
- 作成した Deck は現在の UID の remote data に一つだけ存在する。
- browser storage に同じ Deck の local-only duplicate が存在しない。
- browser error が発生しない。

<a id="deck-10"></a>

### DECK-10 remote Deck の作成失敗後に重複なく再試行できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- ユーザーとして認証されている。
- remote Deck の最初の作成要求が失敗している。
- 作成失敗が画面内で処理され、入力した name と category、remote の保存先、作成対象の Deck ID が維持されている。
- 次の作成要求は成功できる。

When:

- 入力と保存先を変更せずに同じ Deck の作成を再試行し、Deck 一覧を reload する。

Then:

- 維持されていた Deck ID の Deck が現在の UID の remote data に一つだけ存在する。
- 作成した Deck の name、category、remote の保存先が最初の作成要求から維持されている。
- browser storage に同じ Deck の local-only duplicate が存在しない。
- 最初の作成失敗に伴う未処理の browser error が発生しない。

<a id="deck-12"></a>

### DECK-12 未保存の Deck 編集内容を離脱前に確認できる

カテゴリ: `read`

Given:

- Fixture: [`deck-unsaved-navigation`](./fixture/deck-unsaved-navigation.yaml)
- 認証済みユーザーが所有する編集対象の Deck が存在する。
- Deck 編集画面で name を変更し、まだ保存していない。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択した後、再度離脱して Discard changes を選択する。

Then:

- 最初の離脱は取り消され、変更した name が編集画面に維持される。
- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- 永続化された Deck の name は変更されない。
- browser error が発生しない。
