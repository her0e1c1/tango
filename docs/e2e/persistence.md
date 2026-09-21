# Persistence E2E テスト仕様書

## 目的

remote data が認証 UID ごとに分離され、永続 cache、queued write、realtime subscription が 単一タブで network 状態を越えて正しく機能することを確認する。

旧アプリの browser storage からの自動移行は行わない。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSISTENCE-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](#persistence-01) |
| PERSISTENCE-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](#persistence-02) |
| PERSISTENCE-03 | write | [別の open client に remote Card の変更を即時反映できる](#persistence-03) |
| PERSISTENCE-04 | batch | [未ログインの変更を local-only に維持できる](#persistence-04) |

<a id="persistence-01"></a>

### PERSISTENCE-01 UID ごとに remote data を分離して reload 後も表示できる

カテゴリ: `read`

Given:

- Fixture: [`two-users`](./fixture/two-users.yaml)
- 異なる UID の認証済みユーザーが、それぞれ固有の remote Deck と Card を所有している。
- 各ユーザーで認証した独立した browser context がある。
- 各 browser context で Sample Deck の自動生成が無効であり、local-only Deck と Card は存在しない。

When:

- 各 browser context で Deck 一覧を開いて reload し、そのユーザーが所有する Deck を開く。

Then:

- 各 browser context には現在の UID が所有する remote Deck と Card だけが表示される。
- 別の UID が所有する remote Deck と Card は reload の前後で表示されない。
- remote StudySession も本人だけが読み書きでき、所有者の変更は拒否される。対象 Deck が公開されていても session は公開されない。
- 公開 Deck と Card も、削除済みの親または Card 自体の tombstone があれば他ユーザー・匿名・未認証から読み取れない。
- 未処理の browser error が発生しない。

<a id="persistence-02"></a>

### PERSISTENCE-02 offline cache の変更を再接続後に remote へ同期できる

カテゴリ: `batch`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが remote の Deck と Card を所有している。
- primary browser は対象の Deck と Card を永続 cache に読み込み、offline で reload した後も対象 Card を表示している。
- 同じ UID で認証した online の verification browser context がある。

When:

- primary browser で対象 Card を編集して保存し、network を再接続して同期の完了を待った後、verification browser context で対象 Card を reload する。

Then:

- 編集内容が primary browser の画面に維持される。
- verification browser context に編集内容が remote data として表示される。
- queued write による重複した Deck や Card は作成されない。
- 学習 session の保留保存も Firestore SDK の永続 offline queue に維持され、再接続時に同じ ID を使う。出題順、現在位置、明示的な終了状態が再接続後に同期される。
- 未処理の browser error が発生しない。

<a id="persistence-03"></a>

### PERSISTENCE-03 別の open client に remote Card の変更を即時反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 同じ UID で認証した独立した2つの browser context が、同じ remote Card の一覧を開いている。
- secondary browser context は対象 Card の変更前の front text を表示している。

When:

- primary browser context で対象 Card の front text を変更して保存する。
- secondary browser context は reload せずに開いたままにする。

Then:

- secondary browser context に変更後の front text が表示される。
- secondary browser context に変更前の front text が残らない。
- 対象 Card の ID と unique key は維持され、remote data に重複が作成されない。
- 未処理の browser error が発生しない。

<a id="persistence-04"></a>

### PERSISTENCE-04 未ログインの変更を local-only に維持できる

カテゴリ: `batch`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- browser storage に local-only Deck と複数の Card が存在する。

When:

- Deck と Card を編集して保存し、画面を reload する。
- 未ログインのまま Card の作成・削除・インポートと学習を実行する。

Then:

- Deck と Card の編集内容は browser storage に維持され、reload 後も表示される。
- Deck 作成・編集・インポート画面に保存先の選択肢はない。匿名 UID の Firestore cache を利用し、匿名の間は同期が停止する。
- クラウドへの Deck と Card の追加・更新・削除は拒否される。匿名認証の UID と所有者が一致する場合も拒否される。
- 起動・reload の最初の Firestore 利用から同期を停止するため、匿名の Deck、Card、回答、学習 session はクラウドへ転送されない。
- 通信を有効にしなくても操作が完了する。回答 ID と回答時刻は受付時に固定され、回答・進捗・session の前進を一つの batch で保存する。
- 同じ UID の reload 後も進捗と現在位置が復元される。
- browser error が発生しない。
