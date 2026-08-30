# Card E2E テスト仕様書

## 目的

Card 管理の主要導線が、ブラウザ上で表示・編集・削除・filter・学習状態更新まで破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧に学習情報を表示できる](#card-01) |
| CARD-02 | read | [Card の裏面 overlay を開ける](#card-02) |
| CARD-03 | write | [Card 編集内容を保存して reload 後も確認できる](#card-03) |
| CARD-04 | write | [Card を削除できる](#card-04) |
| CARD-05 | write | [Card の右 swipe で score を増やせる](#card-05) |
| CARD-06 | write | [Card の左 swipe で score を減らせる](#card-06) |
| CARD-07 | read | [開いている Card の裏面 overlay を閉じられる](#card-07) |
| CARD-08 | read | [Card の削除を取り消せる](#card-08) |
| CARD-09 | write | [Card の編集失敗後に再試行できる](#card-09) |
| CARD-10 | write | [score と tag の filter を保存して Card 一覧へ反映できる](#card-10) |
| CARD-11 | read | [Card view を直接開ける](#card-11) |
| CARD-12 | read | [存在しない Card から復帰できる](#card-12) |
| CARD-13 | write | [remote Deck に Card を作成できる](#card-13) |
| CARD-14 | write | [local-only Deck に Card を作成できる](#card-14) |

<a id="card-01"></a>

### CARD-01 Card 一覧に学習情報を表示できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score、学習回数、tags を持つ Card が存在する。

When:

- 対象 Deck の Card 一覧を開く。

Then:

- 対象 Card の front text、score、学習回数、tags が表示される。
- browser error が発生しない。

<a id="card-02"></a>

### CARD-02 Card の裏面 overlay を開ける

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text と back text を持つ Card が存在する。

When:

- Card 一覧で対象 Card を選択する。

Then:

- 対象 Card の back text が overlay に表示される。
- browser error が発生しない。

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

- Card 一覧に対象 Card が表示されない。
- 対象 Card が active Card として保存先から読み込まれない。
- browser error が発生しない。

<a id="card-05"></a>

### CARD-05 Card の右 swipe で score を増やせる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score を持つ Card が存在する。

When:

- Card 一覧で対象 Card を右方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の score が swipe 前より 1 増えて表示される。
- browser error が発生しない。

<a id="card-06"></a>

### CARD-06 Card の左 swipe で score を減らせる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score を持つ Card が存在する。

When:

- Card 一覧で対象 Card を左方向に swipe し、保存完了後に画面を reload する。

Then:

- 対象 Card の score が swipe 前より 1 減って表示される。
- browser error が発生しない。

<a id="card-07"></a>

### CARD-07 開いている Card の裏面 overlay を閉じられる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card 一覧で、対象 Card の back text overlay が開いている。

When:

- overlay の close action を実行する。

Then:

- back text overlay が閉じる。
- Card 一覧に対象 Card の front text が表示される。
- Card の永続データが変更されない。
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
- 編集要求の失敗が編集画面内で処理され、変更内容が維持されている。
- 次の編集要求は成功できる。

When:

- 同じ変更内容の保存を再試行し、Card 一覧を reload する。

Then:

- Card 一覧へ戻る。
- reload 後も対象 Card に変更内容が表示される。
- 最初の編集失敗に伴う未処理の browser error が発生しない。

<a id="card-10"></a>

### CARD-10 score と tag の filter を保存して Card 一覧へ反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score と tags の組み合わせが異なる複数の Card が存在する。

When:

- Card 一覧で score 範囲と tag filter を設定し、保存完了後に画面を reload する。

Then:

- reload 前に設定した score 範囲と tag filter が表示される。
- 両方の filter 条件に一致する Card だけが一覧に表示される。
- browser error が発生しない。

<a id="card-11"></a>

### CARD-11 Card view を直接開ける

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に back text を持つ Card が存在する。

When:

- 対象 Card の view route を直接開く。

Then:

- 対象 Card の back text が Card answer として表示される。
- application shell が表示される。
- browser error が発生しない。

<a id="card-12"></a>

### CARD-12 存在しない Card から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーの保存先に、route が参照する Card が存在しない。

When:

- 存在しない Card の view route を直接開き、Card が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。

<a id="card-13"></a>

### CARD-13 remote Deck に Card を作成できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する remote Deck が存在する。

When:

- Card 一覧の Add card から front text と back text を入力して Card を作成し、画面を reload する。

Then:

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

- 作成した Card が reload 後も同じ Deck の Card 一覧に表示される。
- Card は browser 保存先だけに1件存在し、remote 保存先には存在しない。
- browser error が発生しない。
