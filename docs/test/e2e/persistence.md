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
| PERSISTENCE-07 | batch | 異常系 | [端末内のデータが失われてもサーバーから再取得できる](#persistence-07) |
| PERSISTENCE-08 | read | 正常系 | [オフラインの再読み込みで保存済みの学習位置を復元できる](#persistence-08) |
| PERSISTENCE-09 | batch | 正常系 | [画面を閉じている間の変更と論理削除を再開後に反映できる](#persistence-09) |

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
- オフライン中は保存操作が保留されることを確認した後、通信を再接続して保存完了を待ち、確認用ブラウザーで対象 Card を再読み込みする。

Then:

- ローカル snapshot には変更内容が反映されるが、編集操作は再接続後の保存成功まで保存中のままとし、成功通知や保存後の遷移を行わない。
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
- 操作結果は同じ匿名アカウントのこのブラウザーで利用でき、クラウドには保存されない。サーバーへの同期は開始しない。
- 匿名時に後から検出されたローカル保存エラーは `reportError` による診断として報告し、操作単位の toast は表示しない。

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
- オフラインで評価を要求し、保存待ち中に学習画面を離れて通信を再接続する。
- 同期後に最初のブラウザーを閉じ、確認用ブラウザーから同じ Deck の Continue を実行する。

Then:

- オフライン中は評価の保存が保留され、追加の評価操作を受け付けない。ローカル反映と保存完了は区別し、通信回復後に保存完了と後続操作を確認する。
- 確認用ブラウザーでもその次の Card から再開し、元の出題順を維持する。評価済みの Card に戻ったり、未回答の Card を飛ばしたりしない。
- Good の学習結果が維持され、再接続や再開によって同じ回答を重複して記録しない。
- 再接続だけで学習が完了・中止扱いになったり、別の新しい学習に置き換わったりしない。

<a id="persistence-07"></a>

### PERSISTENCE-07 端末内のデータが失われてもサーバーから再取得できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 端末内の取得済みデータが失われた後、オンラインで一覧を開き直す。

Then:

- 全 Card をサーバーの内容で表示し、欠落・重複しない。

<a id="persistence-08"></a>

### PERSISTENCE-08 オフラインの再読み込みで保存済みの学習位置を復元できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントの途中の学習を一度開き、端末内のデータを利用できる。

When:

- データの通信を切断し、学習画面を再読み込みする。

Then:

- 同じ Card と学習位置を表示する。最初からやり直したり、Deck や Card が消えたりしない。

<a id="persistence-09"></a>

### PERSISTENCE-09 画面を閉じている間の変更と論理削除を再開後に反映できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 変更なしで一覧を再読み込みする。次に画面を閉じている間に別クライアントで1枚を編集し、別の1枚を論理削除して開き直す。再び画面を閉じ、親 Deck を論理削除して Deck 一覧を開き直す。

Then:

- 変更なしの再読み込みでは全 Card を重複なく表示する。編集した Card は新しい本文で表示し、削除した Card は表示しない。変更しなかった Card は残る。親 Deck の削除後は一覧から消え、再読み込みでも復活しない。サーバーには削除済みの Deck と Card が残る。
