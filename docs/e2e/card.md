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

**カテゴリ:** `read`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

**When**

- 対象 deck の詳細画面を開く。

**Then**

- card の front text が表示される。
- score と学習回数が表示される。
- browser error が発生しない。

<a id="card-02"></a>
### CARD-02 Card の裏面を overlay で確認できる

**カテゴリ:** `read`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

**When**

- 対象 deck の詳細画面を開く。
- card の front text をクリックする。

**Then**

- overlay に card の back text が表示される。

**When**

- overlay をクリックする。

**Then**

- overlay が閉じる。
- browser error が発生しない。

<a id="card-03"></a>
### CARD-03 Card 編集内容を保存して前画面に戻れる

**カテゴリ:** `write`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

**When**

- 対象 deck の詳細画面を開く。
- card の edit icon をクリックする。

**Then**

- card 編集画面に遷移する。

**When**

- front text、back text、tags を別の値に変更して submit する。

**Then**

- Deck 詳細画面に戻る。
- card 一覧に変更後の front text が表示される。

**When**

- 変更後の front text をクリックする。

**Then**

- overlay に変更後の back text が表示される。
- browser error が発生しない。

<a id="card-04"></a>
### CARD-04 Card を削除できる

**カテゴリ:** `write`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

**When**

- 対象 deck の詳細画面を開く。
- card の delete icon をクリックする。
- confirm dialog で OK を選択する。

**Then**

- card 一覧に削除した card が表示されない。
- browser error が発生しない。

<a id="card-05"></a>
### CARD-05 Card の swipe 操作で score を更新できる

**カテゴリ:** `write`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。

**When**

- 対象 deck の詳細画面を開く。
- card を右方向に swipe する。

**Then**

- card の score が増える。

**When**

- card を左方向に swipe する。

**Then**

- card の score が減る。
- browser error が発生しない。
