# Persistence E2E テスト仕様書

## 目的

アカウントごとにデータが分離され、再読み込みや通信断の後も保存した内容を利用でき、再接続後に同じアカウントの別ブラウザーへ変更が反映されることを確認する。

学習データの非公開性は [StudySession の認可](../integration/firestore/rules-study-session.md#firestore-rules-study-session-02)、削除済み公開データの読取拒否は [Deck](../integration/firestore/rules-deck.md#firestore-rules-deck-01) と [Card](../integration/firestore/rules-card.md#firestore-rules-card-01) の認可仕様で扱う。匿名の学習結果と記録の復元は [STUDY-SESSION-07](./study-session.md#study-session-07) と [STUDY-SESSION-12](./study-session.md#study-session-12)、保存先を選ばない利用形態は [共通前提](./AGENTS.md#保存先の用語) を参照する。
旧アプリで保存したデータの自動引き継ぎは対象外とする。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PERSISTENCE-01 | read | 正常系 | [アカウントごとのデータを再読み込み後も分離して表示できる](#persistence-01) |
| PERSISTENCE-02 | batch | 正常系 | [オフラインの変更を再接続後に同期できる](#persistence-02) |
| PERSISTENCE-03 | write | 正常系 | [別のブラウザーに Card の変更を再読み込みなしで反映できる](#persistence-03) |
| PERSISTENCE-04 | batch | 正常系 | [未ログインの変更をこのブラウザーだけに維持できる](#persistence-04) |
| PERSISTENCE-05 | batch | 正常系 | [未ログインでもオフラインの Card 操作を再読み込み後まで維持できる](#persistence-05) |
| PERSISTENCE-06 | batch | 正常系 | [オフラインで進めた学習を同期後に別ブラウザーで再開できる](#persistence-06) |
| PERSISTENCE-07 | batch | 異常系 | [端末内の取得済みデータが欠損・破損しても再取得できる](#persistence-07) |
| PERSISTENCE-08 | batch | 異常系 | [端末内の保存に失敗しても再読み込み後に内容を復元できる](#persistence-08) |

<a id="persistence-01"></a>

### PERSISTENCE-01 アカウントごとのデータを再読み込み後も分離して表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`two-users`](./fixture/two-users.yaml)
- 異なる Google アカウントが、それぞれ固有の Deck と Card を所有している。
- 各アカウントでログインした独立したブラウザーがある。
- 各ブラウザーで Sample Deck の自動生成は無効であり、匿名利用時の Deck と Card は存在しない。

When:

- 各ブラウザーで Deck 一覧を開いて再読み込みし、そのアカウントが所有する Deck を開く。

Then:

- 各ブラウザーには、ログイン中のアカウントが所有する Deck と Card だけが表示される。
- 別アカウントが所有する Deck と Card は、再読み込みの前後で自分のデータとして表示されない。

<a id="persistence-02"></a>

### PERSISTENCE-02 オフラインの変更を再接続後に同期できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントにログインしたユーザーが Deck と Card を所有している。
- 編集用のブラウザーで対象の Deck と Card を一度開いている。オフラインで再読み込みした後も対象 Card を表示できる。
- 同じアカウントでログインした、オンラインの確認用ブラウザーが変更前の対象 Card を表示している。

When:

- オフラインのブラウザーで対象 Card を編集して保存する。
- オフラインのまま保存操作の完了と表示を確認した後、通信を再接続し、確認用ブラウザーで対象 Card を再読み込みする。

Then:

- 再接続より前に編集操作が完了し、編集したブラウザーに変更内容が表示される。通信の回復まで保存中のままにならない。
- オフラインの間、確認用ブラウザーでは変更前の内容が維持される。
- 再接続後も変更内容が失われず、同期した確認用ブラウザーにも同じ内容が表示される。
- 再接続や再読み込みによって Deck や Card が重複しない。

<a id="persistence-03"></a>

### PERSISTENCE-03 別のブラウザーに Card の変更を再読み込みなしで反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 同じ Google アカウントでログインした独立した2つのブラウザーが、同じ Deck の Card 一覧を開いている。
- 確認用ブラウザーは対象 Card の変更前の front text を表示している。

When:

- 一方のブラウザーで対象 Card の front text を変更して保存する。
- 確認用ブラウザーは再読み込みせずに開いたままにする。

Then:

- 確認用ブラウザーに変更後の front text が表示される。
- 確認用ブラウザーに変更前の front text が残らない。
- 元の Card が更新され、同じ内容の Card が追加されたり、Card の件数が増えたりしない。

<a id="persistence-04"></a>

### PERSISTENCE-04 未ログインの変更をこのブラウザーだけに維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- このブラウザーで利用できる Deck と複数の Card が存在する。

When:

- Deck と Card を編集して保存し、同じ匿名アカウントのまま画面を再読み込みする。

Then:

- Deck と Card の編集内容は、同じブラウザーで再読み込みした後も表示される。
- 編集した Deck と Card はこのブラウザーだけに保持され、クラウドには保存されない。

<a id="persistence-05"></a>

### PERSISTENCE-05 [TODO] 未ログインでもオフラインの Card 操作を再読み込み後まで維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 初回の匿名認証が完了しており、Google アカウントにはログインしていない。
- このブラウザーで利用できる Deck と複数の Card があり、対象画面を一度開いている。
- 次の各行を独立した入力例とする。インポートでは、既存 Card と本文・識別キーが異なる有効な CSV ファイルを用意する。

| 操作 | 期待する Card 一覧 |
| --- | --- |
| 新しい Card を作成する | 入力した内容の Card が1件増える |
| 既存の Card を1件削除する | 削除した Card だけが表示されなくなる |
| 対象 Deck に CSV ファイルをインポートする | ファイルに含まれる新しい Card が入力どおり追加される |

When:

- 通信を切断して表の操作を実行し、オフラインのまま同じブラウザーを再読み込みする。

Then:

- 通信の回復を待たずに操作が完了し、操作直後と再読み込み後の Card 一覧が表の結果に一致する。
- 対象外の既存 Card の内容は変わらず、追加した Card は再読み込みで重複しない。
- 操作結果は同じ匿名アカウントのこのブラウザーで利用でき、クラウドには保存されない。

<a id="persistence-06"></a>

### PERSISTENCE-06 [TODO] オフラインで進めた学習を同期後に別ブラウザーで再開できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントの途中の学習を開いており、現在の Card の後にも未回答の Card がある。
- 学習中のブラウザーで、現在位置と出題順を利用できる状態になっている。
- 同じアカウントでログインした確認用の別ブラウザーがあるが、まだ学習を再開していない。

When:

- 学習中のブラウザーの通信を切断し、現在の Card を Good と評価する。
- オフラインのまま次の Card へ進んだ後、学習画面を離れて通信を再接続する。
- 同期後に最初のブラウザーを閉じ、確認用ブラウザーから同じ Deck の Continue を実行する。

Then:

- オフライン中に評価操作が完了して次の Card が表示され、通信の回復まで待たされない。
- 確認用ブラウザーでもその次の Card から再開し、元の出題順を維持する。評価済みの Card に戻ったり、未回答の Card を飛ばしたりしない。
- Good の学習結果が維持され、再接続や再開によって同じ回答を重複して記録しない。
- 再接続だけで学習が完了・中止扱いになったり、別の新しい学習に置き換わったりしない。

<a id="persistence-07"></a>

### PERSISTENCE-07 端末内の取得済みデータが欠損・破損しても再取得できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 取得済みの Deck と複数 Card があり、端末内の取得済みデータが一部欠損している、解析不能になっている、または本文の形式が壊れている。

When:

- オンラインで画面を再読み込みして Deck を開く。

Then:

- 保存済みの全 Card をサーバーから取得し直して表示する。欠損した Card を飛ばさず、重複もしない。

<a id="persistence-08"></a>

### PERSISTENCE-08 端末内の保存に失敗しても再読み込み後に内容を復元できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 取得済みの Deck と複数 Card がある。端末内の保存が一時的に失敗する状態になっている。

When:

- Card を編集して保存する。保存エラーを確認し、端末内の保存が利用可能になってから画面を再読み込みする。

Then:

- 保存失敗を画面で通知する。再読み込み後はサーバーに保存された変更を表示し、変更しなかった Card も欠落しない。
