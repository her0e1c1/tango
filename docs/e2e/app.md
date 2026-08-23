# App E2E テスト仕様書

## 目的

アプリケーションの初期化と route recovery が、複数の永続資源や認証失敗を含む状況でも破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| APP-01 | batch | [Sample Deck を一度だけ初期生成できる](#app-01) |
| APP-02 | read | [存在しない route から Deck 一覧へ復帰できる](#app-02) |
| APP-03 | read | [認証初期化失敗から Reload で復帰できる](#app-03) |

<a id="app-01"></a>

### APP-01 Sample Deck を一度だけ初期生成できる

カテゴリ: `batch`

Given:

- 認証済みユーザーに Deck がなく、Sample Deck の初期生成が有効である。

When:

- Deck 一覧を開いて初期生成の完了を待ち、ページを reload する。

Then:

- Sample Deck とその Card 群が利用できる。
- Sample Deck とその Card 群は reload 後も重複しない。
- browser error が発生しない。

<a id="app-02"></a>

### APP-02 存在しない route から Deck 一覧へ復帰できる

カテゴリ: `read`

Given:

- 認証済みユーザーがアプリケーションにアクセスできる。
- Sample Deck の自動生成が無効である。

When:

- 存在しない route を直接開き、`Go home` を選択する。

Then:

- Deck 一覧へ遷移する。
- not-found 表示が残らない。
- browser error が発生しない。

<a id="app-03"></a>

### APP-03 認証初期化失敗から Reload で復帰できる

カテゴリ: `read`

Given:

- 認証初期化失敗が画面内で処理され、認証初期化失敗画面に `Reload` が表示されている。
- 次の認証初期化は成功でき、Sample Deck の自動生成は無効である。

When:

- 認証初期化失敗画面に表示された `Reload` を選択する。

Then:

- 再初期化が完了し、Deck 一覧を利用できる。
- 未処理の browser error が発生しない。
