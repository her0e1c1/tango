# Persistence E2E テスト仕様書

## 目的

remote data が認証 UID ごとに分離され、永続 cache と queued write が network 状態の変化を越えて正しく機能することを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSIST-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](#persist-01) |
| PERSIST-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](#persist-02) |

<a id="persist-01"></a>

### PERSIST-01 UID ごとに remote data を分離して reload 後も表示できる

カテゴリ: `read`

Given:

- Fixture: [`two-users`](./fixture/read/two-users.yaml)
- 異なる UID の認証済みユーザーが、それぞれ固有の remote Deck と Card を所有している。
- 各ユーザーで認証した独立した browser context がある。
- 各 browser context で Sample Deck の自動生成が無効であり、local-only Deck と Card は存在しない。

When:

- 各 browser context で Deck 一覧を開いて reload し、そのユーザーが所有する Deck を開く。

Then:

- 各 browser context には現在の UID が所有する remote Deck と Card だけが表示される。
- 別の UID が所有する remote Deck と Card は reload の前後で表示されない。
- 未処理の browser error が発生しない。

<a id="persist-02"></a>

### PERSIST-02 offline cache の変更を再接続後に remote へ同期できる

カテゴリ: `batch`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/batch/remote-deck-with-card.yaml)
- 認証済みユーザーが remote の Deck と Card を所有している。
- primary browser は対象の Deck と Card を永続 cache に読み込み、offline で reload した後も対象 Card を表示している。
- 同じ UID で認証した online の verification browser context がある。

When:

- primary browser で対象 Card を編集して保存し、network を再接続して同期の完了を待った後、verification browser context で対象 Card を reload する。

Then:

- 編集内容が primary browser の画面に維持される。
- verification browser context に編集内容が remote data として表示される。
- queued write による重複した Deck や Card は作成されない。
- 未処理の browser error が発生しない。
