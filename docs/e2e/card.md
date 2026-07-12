# Card E2E テスト仕様書

## 目的

Card 管理の主要導線が、ブラウザ上で表示・編集・削除・状態更新まで破綻しないことを確認する。

## テストケース

### 1. Card 一覧を表示できる

| 項目 | 内容 |
|---|---|
| カテゴリ | read |
| 目的 | Deck 詳細画面で、対象 deck に紐づく card が一覧表示されることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | 対象 deck の詳細画面を開く。 |
| Then | card の front text が表示される。 |
| Then | score と学習回数が表示される。 |
| Then | browser error が発生しない。 |

### 2. Card の裏面を overlay で確認できる

| 項目 | 内容 |
|---|---|
| カテゴリ | read |
| 目的 | Card 一覧から card の裏面を確認でき、overlay を閉じられることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | 対象 deck の詳細画面を開く。 |
| When | card の front text をクリックする。 |
| Then | overlay に card の back text が表示される。 |
| When | overlay をクリックする。 |
| Then | overlay が閉じる。 |
| Then | browser error が発生しない。 |

### 3. Card 編集内容を保存して前画面に戻れる

| 項目 | 内容 |
|---|---|
| カテゴリ | write |
| 目的 | Card の front text、back text、tags を編集し、Deck 詳細画面に反映されることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | 対象 deck の詳細画面を開く。 |
| When | card の edit icon をクリックする。 |
| Then | card 編集画面に遷移する。 |
| When | front text、back text、tags を別の値に変更して submit する。 |
| Then | Deck 詳細画面に戻る。 |
| Then | card 一覧に変更後の front text が表示される。 |
| When | 変更後の front text をクリックする。 |
| Then | overlay に変更後の back text が表示される。 |
| Then | browser error が発生しない。 |

### 4. Card を削除できる

| 項目 | 内容 |
|---|---|
| カテゴリ | write |
| 目的 | Deck 詳細画面から Card を削除でき、削除後に一覧から消えることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | 対象 deck の詳細画面を開く。 |
| When | card の delete icon をクリックする。 |
| When | confirm dialog で OK を選択する。 |
| Then | card 一覧に削除した card が表示されない。 |
| Then | browser error が発生しない。 |

### 5. Card の swipe 操作で score を更新できる

| 項目 | 内容 |
|---|---|
| カテゴリ | write |
| 目的 | Card 一覧で swipe 操作を行うと、card の score が更新されることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | 対象 deck の詳細画面を開く。 |
| When | card を右方向に swipe する。 |
| Then | card の score が増える。 |
| When | card を左方向に swipe する。 |
| Then | card の score が減る。 |
| Then | browser error が発生しない。 |
