# Navigation E2E テスト仕様書

## 目的

存在しない route から復帰でき、画面ごとの keyboard shortcut で主要 route へ遷移できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |
| NAVIGATION-03 | write | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |

<a id="navigation-01"></a>

### NAVIGATION-01 存在しない route から Deck 一覧へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーがアプリケーションにアクセスできる。
- Sample Deck の自動生成が無効である。

When:

- 存在しない route を直接開き、`Go home` を選択する。

Then:

- Deck 一覧へ遷移する。
- not-found 表示が残らない。
- browser error が発生しない。

<a id="navigation-02"></a>

### NAVIGATION-02 画面の keyboard shortcut で主要 route へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧と Card 一覧を利用できる。

When:

- Deck 一覧で `s` を入力して Settings を開き、Deck 一覧へ戻って `i` を入力して Import を開く。
- Card 一覧で `t` を入力して Deck 一覧を開き、Card 一覧へ戻って `s` を入力して Settings を開く。

Then:

- 各 shortcut に設定された route へ1回だけ遷移する。
- Deck と Card の永続データは変更されない。
- browser error が発生しない。

<a id="navigation-03"></a>

### NAVIGATION-03 共通エラー画面が現在の言語で表示され Reload で復旧する

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが日本語の Settings 画面を開いている。
- 次の配色反映で一度だけ例外が発生する。

When:

- Dark mode を変更して共通エラー画面を表示し、再読み込みを選択する。

Then:

- Provider 外側のエラー境界が障害を捕捉し、日本語の見出し・説明・再読み込みボタンと html[lang] を表示する。
- 初期 locale 同期前は安全な英語の既定値を使用する。
- 再読み込み後は障害が再発せず、日本語の Settings へ復旧する。
