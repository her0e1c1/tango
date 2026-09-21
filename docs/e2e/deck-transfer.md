# Deck Transfer E2E テスト仕様書

## 目的

旧形式の Deck と Card を Firestore cache へ移行し、Deck の Card を外部で利用できる形式へ export できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-07 | batch | [旧形式の Deck と Card を一度だけ cache へ移行できる](#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](#deck-08) |

<a id="deck-07"></a>

### DECK-07 旧形式の Deck と Card を一度だけ cache へ移行できる

カテゴリ: `batch`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 旧アプリの browser storage に Deck と複数の Card が存在する。
- 現在の匿名 UID の Firestore cache にはまだ移行されていない。

When:

- アプリを起動して対象 Deck を開き、reload する。

Then:

- 現在の UID の Firestore cache に一度だけ移行し、全 Card を表示できる。
- 移行完了前は編集を開始できない。失敗時は起動エラーを表示する。
- 元の browser storage はバックアップとして変更せずに残る。
- 再起動や別 UID への切り替えで重複移行しない。移行中に中断・認証切替が起きても、元の UID だけが移行を再開できる。
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
