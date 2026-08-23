# Card E2E テスト仕様書

## 目的

Card 管理の主要導線が、ブラウザ上で表示・編集・削除・状態更新まで破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧を表示できる](#card-01) |
| CARD-02 | read | [Card の裏面を overlay で確認できる](#card-02) |
| CARD-03 | write | [Card 編集内容を保存して前画面に戻れる](#card-03) |
| CARD-04 | write | [Card を削除できる](#card-04) |
| CARD-05 | write | [Card の swipe 操作で score を更新できる](#card-05) |

<a id="card-01"></a>

### CARD-01 Card 一覧を表示できる

カテゴリ: `read`

Given:

- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に未学習の Card が存在する。

When:

- 対象 deck の詳細画面を開く。

Then:

- card の front text が表示される。
- score と学習回数が表示される。
- browser error が発生しない。

<a id="card-02"></a>

### CARD-02 Card の裏面を overlay で確認できる

カテゴリ: `read`

Given:

- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に front text と back text を持つ Card が存在する。

When:

- 対象 deck の詳細画面を開き、card の裏面を表示して閉じる。

Then:

- overlay で card の back text を確認できる。
- overlay を閉じられる。
- browser error が発生しない。

<a id="card-03"></a>

### CARD-03 Card 編集内容を保存して前画面に戻れる

カテゴリ: `write`

Given:

- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。

When:

- Card の front text、back text、tags を編集して保存し、変更後の裏面を確認する。

Then:

- Deck 詳細画面に戻る。
- card 一覧に変更後の front text が表示される。
- overlay に変更後の back text が表示される。
- browser error が発生しない。

<a id="card-04"></a>

### CARD-04 Card を削除できる

カテゴリ: `write`

Given:

- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に削除対象の Card が存在する。

When:

- 対象 deck の詳細画面から card を削除する。

Then:

- card 一覧に削除した card が表示されない。
- browser error が発生しない。

<a id="card-05"></a>

### CARD-05 Card の swipe 操作で score を更新できる

カテゴリ: `write`

Given:

- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に score を持つ Card が存在する。

When:

- 対象 deck の詳細画面で card を右方向に swipe した後、左方向に swipe する。

Then:

- 右方向の swipe で card の score が増える。
- 左方向の swipe で card の score が減る。
- browser error が発生しない。
