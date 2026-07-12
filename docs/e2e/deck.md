# Deck E2E テスト仕様書

## 目的

Deck 管理の主要導線が、ブラウザ上で画面遷移・状態更新まで破綻しないことを確認する。

## テストケース

### 1. Deck 一覧から詳細へ遷移できる

| 項目 | 内容 |
|---|---|
| カテゴリ | read |
| 目的 | Deck 一覧に deck が表示され、deck 名クリックで詳細へ遷移できることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck/Card が localStorage に保存されている。 |
| When | `/` を開く。 |
| Then | 一覧に deck 名が表示される。 |
| When | deck 名をクリックする。 |
| Then | deck 詳細画面に遷移する。 |
| Then | card 一覧に card が表示される。 |
| Then | browser error が発生しない。 |

### 2. Deck 編集内容を保存して一覧に戻れる

| 項目 | 内容 |
|---|---|
| カテゴリ | write |
| 目的 | Deck の基本情報を編集し、一覧に反映されることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck が localStorage に保存されている。 |
| When | deck 編集画面を開く。 |
| When | deck name を別の値に変更して submit する。 |
| Then | URL が `/` になる。 |
| Then | 一覧に変更後の deck 名が表示される。 |
| Then | browser error が発生しない。 |

### 3. Deck を削除できる

| 項目 | 内容 |
|---|---|
| カテゴリ | write |
| 目的 | 一覧から Deck を削除でき、削除後に一覧から消えることを確認する。 |
| Given | `docs/e2e/seed.md` の Deck が localStorage に保存されている。 |
| When | `/` を開く。 |
| When | deck の delete icon をクリックする。 |
| When | confirm dialog で OK を選択する。 |
| Then | 一覧に deck が表示されない。 |
| Then | browser error が発生しない。 |
