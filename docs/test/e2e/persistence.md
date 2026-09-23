# Persistence E2E テスト仕様書

## 目的

アカウントごとにデータが分離され、再読み込みや通信断の後も保存した内容を利用でき、再接続後に同じアカウントの別ブラウザーへ変更が反映されることを確認する。

旧アプリで保存したデータの自動引き継ぎは対象外とする。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSISTENCE-01 | read | [アカウントごとのデータを再読み込み後も分離して表示できる](#persistence-01) |
| PERSISTENCE-02 | batch | [オフラインの変更を再接続後に同期できる](#persistence-02) |
| PERSISTENCE-03 | write | [別のブラウザーに Card の変更を再読み込みなしで反映できる](#persistence-03) |
| PERSISTENCE-04 | batch | [未ログインの変更をこのブラウザーだけに維持できる](#persistence-04) |

<a id="persistence-01"></a>

### PERSISTENCE-01 アカウントごとのデータを再読み込み後も分離して表示できる

カテゴリ: `read`

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
- 別アカウントの学習 session を自分の学習として再開できない。Deck が公開されていても、個人の学習 session は公開されない。
- 削除済みの Deck や Card は、以前公開されていた場合も他の利用者から閲覧できない。
- 未処理の browser error が発生しない。

<a id="persistence-02"></a>

### PERSISTENCE-02 オフラインの変更を再接続後に同期できる

カテゴリ: `batch`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントにログインしたユーザーが Deck と Card を所有している。
- 編集用のブラウザーで対象の Deck と Card を一度開いている。オフラインで再読み込みした後も対象 Card を表示できる。
- 同じアカウントでログインした、オンラインの確認用ブラウザーがある。

When:

- オフラインのブラウザーで対象 Card を編集して保存する。
- 通信を再接続して同期の完了を待ち、確認用ブラウザーで対象 Card を再読み込みする。

Then:

- オフラインでも編集操作が完了し、編集したブラウザーに変更内容が表示される。
- 再接続後も変更内容が失われず、確認用ブラウザーにも同じ内容が表示される。
- 再接続や再読み込みによって Deck や Card が重複しない。
- オフラインで保存した学習がある場合も、出題順・現在位置・完了または中止の状態が同期後に変わらない。
- 未処理の browser error が発生しない。

<a id="persistence-03"></a>

### PERSISTENCE-03 別のブラウザーに Card の変更を再読み込みなしで反映できる

カテゴリ: `write`

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
- 未処理の browser error が発生しない。

<a id="persistence-04"></a>

### PERSISTENCE-04 未ログインの変更をこのブラウザーだけに維持できる

カテゴリ: `batch`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- このブラウザーで利用できる Deck と複数の Card が存在する。

When:

- Deck と Card を編集して保存し、画面を再読み込みする。
- 未ログインのまま Card の作成・削除・インポートと学習を実行する。

Then:

- Deck と Card の編集内容は、同じブラウザーで再読み込みした後も表示される。
- Deck の作成・編集・インポート画面に保存先の選択肢はない。
- 匿名利用中の作成・編集・削除・回答・学習の進行は、このブラウザーだけに保持され、クラウドへ送信されない。
- 初回の匿名認証が完了していれば、通信がなくてもこれらの操作が完了する。
- 同じ匿名アカウントのまま再読み込みすると、学習結果と現在位置が復元される。回答だけ、または学習位置だけが進んだ状態にならない。
- browser error が発生しない。
