# Persistence E2E テスト仕様書

## 目的

アカウント間のデータ分離、再読み込み・通信断後の復元、再接続後のブラウザー間同期を確認する。

非公開の学習データは [StudySession](../integration/firestore/rules-study-session.md#firestore-rules-study-session-02)、削除済み公開データの読取拒否は [Deck](../integration/firestore/rules-deck.md#firestore-rules-deck-01)・[Card](../integration/firestore/rules-card.md#firestore-rules-card-01) の認可仕様を参照する。匿名の学習結果・記録の復元は [STUDY-SESSION-07](./study-session.md#study-session-07)・[STUDY-SESSION-12](./study-session.md#study-session-12)、保存先は [共通前提](./AGENTS.md#保存先の用語) を参照する。
旧アプリで保存したデータの自動引き継ぎは対象外とする。
サーバー上の論理削除済み document の保持は [Firestore の論理削除反映](../integration/firestore/incremental-sync.md#firestore-incremental-sync-02)、保存操作時の本文・子 Card の保持は [Card 削除](../integration/firestore/card.md#firestore-card-07)・[Deck 削除](../integration/firestore/deck.md#firestore-deck-04) の契約とする。本書では画面を開き直した利用者が変更後の内容だけを利用できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PERSISTENCE-01 | read | 正常系 | [アカウントごとのデータを再読み込み後も分離して表示できる](#persistence-01) |
| PERSISTENCE-08 | read | 正常系 | [オフラインの再読み込みで保存済みの学習位置を復元できる](#persistence-08) |
| PERSISTENCE-05 | batch | 正常系 | [匿名でオフライン作成した Card を再読み込み後も保持する](#persistence-05) |
| PERSISTENCE-13 | batch | 正常系 | [匿名でオフラインインポートした Card を再読み込み後も保持する](#persistence-13) |
| PERSISTENCE-02 | batch | 正常系 | [オフラインの変更を再接続後に同期できる](#persistence-02) |
| PERSISTENCE-03 | write | 正常系 | [別のブラウザーに Card の変更を再読み込みなしで反映できる](#persistence-03) |
| PERSISTENCE-04 | batch | 正常系 | [匿名の Deck と Card の編集内容を再読み込み後も利用できる](#persistence-04) |
| PERSISTENCE-06 | batch | 正常系 | [オフラインで進めた学習を同期後に別ブラウザーで再開できる](#persistence-06) |
| PERSISTENCE-09 | batch | 正常系 | [画面を閉じた間の編集と削除を再開後に反映できる](#persistence-09) |
| PERSISTENCE-12 | batch | 正常系 | [匿名でオフライン削除した Card は再読み込み後も表示しない](#persistence-12) |
| PERSISTENCE-07 | batch | 異常系 | [端末内のデータが失われてもサーバーから再取得できる](#persistence-07) |
| PERSISTENCE-10 | batch | 異常系 | [一部の Card を読めなくても起動して修復後に再表示できる](#persistence-10) |
| PERSISTENCE-17 | batch | 異常系 | [すべての Card を読めない状態から修復した1枚を再表示できる](#persistence-17) |

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

- 再読み込みの前後とも、ログイン中のアカウントが所有する Deck と Card だけを表示する。

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

<a id="persistence-05"></a>

### PERSISTENCE-05 [TODO] 匿名でオフライン作成した Card を再読み込み後も保持する

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 初回認証済みの匿名ユーザーであり、Deck と複数 Card の画面をこのブラウザーで一度開いている。

When:

- 通信を切断して Card を作成し、オフラインのまま同じブラウザーを再読み込みする。

Then:

- 操作直後・再読み込み後とも、入力どおりの Card が1件だけ増え、既存 Card は変わらない。

<a id="persistence-13"></a>

### PERSISTENCE-13 [TODO] 匿名でオフラインインポートした Card を再読み込み後も保持する

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 初回認証済みの匿名ユーザーであり、Deck と複数 Card の画面をこのブラウザーで一度開いている。
- 既存 Card と本文・識別キーが異なる有効な CSV ファイルを用意する。

When:

- 通信を切断して対象 Deck に CSV をインポートし、オフラインのまま同じブラウザーを再読み込みする。

Then:

- 操作直後・再読み込み後とも、CSV の新しい Card が内容どおり重複なく追加され、既存 Card は変わらない。

<a id="persistence-02"></a>

### PERSISTENCE-02 オフラインの変更を再接続後に同期できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントにログインしたユーザーが Deck と Card を所有している。
- 編集用ブラウザーで対象 Deck と Card を取得済みで、オフラインの再読み込み後も表示できる。
- 同じアカウントのオンラインの確認用ブラウザーに、変更前の Card が表示されている。

When:

- オフラインのブラウザーで対象 Card を編集して保存する。
- 保存待ちを確認して再接続し、保存完了後に確認用ブラウザーで対象 Card を再読み込みする。

Then:

- 端末内には変更が反映されるが、再接続後の保存成功までは保存中とし、成功通知や画面遷移を行わない。
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

- 確認用ブラウザーの front text が新しい内容に置き換わる。Card は追加されず、件数も変わらない。

<a id="persistence-04"></a>

### PERSISTENCE-04 匿名の Deck と Card の編集内容を再読み込み後も利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と複数の Card を利用できる。

When:

- Deck の名前と Card の本文を編集して保存し、同じ匿名アカウントのまま画面を再読み込みする。

Then:

- 再読み込み後も変更後の名前と本文を表示する。
- このブラウザーだけに保持され、クラウドには保存されない。

<a id="persistence-06"></a>

### PERSISTENCE-06 [TODO] オフラインで進めた学習を同期後に別ブラウザーで再開できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`google-study-session-middle`](./fixture/google-study-session-middle.yaml)
- Google アカウントの途中の学習を開き、現在位置と出題順を利用できる。後続に未回答の Card がある。
- 同じアカウントでログインした確認用の別ブラウザーがあるが、まだ学習を再開していない。

When:

- 通信を切断して現在の Card を Good と評価し、保存待ち中に画面を離れて再接続する。
- 同期後に最初のブラウザーを閉じ、確認用ブラウザーから同じ Deck の Continue を実行する。

Then:

- オフライン中は保存待ちとし、追加評価を受け付けない。端末内への反映だけで完了とせず、再接続後の保存完了から操作を再開する。
- 確認用ブラウザーで次の Card から元の順序で再開し、評価済み Card への逆戻りや未回答 Card の飛ばしは起きない。
- Good の学習結果が維持され、再接続や再開によって同じ回答を重複して記録しない。
- 再接続だけで学習が完了・中止扱いになったり、別の新しい学習に置き換わったりしない。

<a id="persistence-09"></a>

### PERSISTENCE-09 画面を閉じた間の編集と削除を再開後に反映できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 画面を閉じた間に別クライアントで1枚を編集し、別の Card を削除してから Deck を開き直す。
- 再び画面を閉じ、別クライアントでその Deck を削除してから一覧を開き直し、再読み込みする。

Then:

- 最初の再開では編集後の本文と未変更の Card を表示し、削除した Card を表示しない。
- Deck の削除後はその Deck の一覧の項目を表示せず、再読み込み後も復活しない。
- 変更していない Card は欠落したり重複したりしない。

<a id="persistence-12"></a>

### PERSISTENCE-12 [TODO] 匿名でオフライン削除した Card は再読み込み後も表示しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 初回認証済みの匿名ユーザーであり、Deck と複数 Card の画面をこのブラウザーで一度開いている。

When:

- 通信を切断して Card を1件削除し、オフラインのまま同じブラウザーを再読み込みする。

Then:

- 操作直後・再読み込み後とも、削除した Card だけを非表示にし、他の Card は変わらない。

<a id="persistence-07"></a>

### PERSISTENCE-07 端末内のデータが失われてもサーバーから再取得できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 端末内の取得済みデータをすべて失った後、オンラインで一覧を開き直す。

Then:

- 全 Card をサーバーの内容で表示し、欠落・重複しない。

<a id="persistence-10"></a>

### PERSISTENCE-10 一部の Card を読めなくても起動して修復後に再表示できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで作成した2枚の Card を、再読み込み後も利用できる。
- 画面を閉じた後に1枚の保存情報を読み込めなくなっている。Deck・認証・設定は利用できる。

When:

- アプリと Card 一覧を開き直して再読み込みする。
- 読めなかった Card の保存情報が修復された後、一覧を開き直す。

Then:

- 最初の再起動では全データの削除や再認証を求めずに起動し、元の Deck と正常な1枚を表示する。
- 読み込めない1枚と保存データが変更されていない旨を警告し、再読み込み後も同じ表示を維持する。
- 修復後は元の2枚を同じ本文で表示し、警告を表示しない。

<a id="persistence-17"></a>

### PERSISTENCE-17 すべての Card を読めない状態から修復した1枚を再表示できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで作成した2枚の Card を、再読み込み後も利用できる。
- 画面を閉じた後に2枚とも保存情報を読み込めなくなっている。Deck・認証・設定は利用できる。

When:

- アプリと Card 一覧を開き直して再読み込みする。
- そのうち1枚の保存情報が修復された後、一覧を開き直す。

Then:

- 最初の再起動では全データの削除や再認証を求めずに起動し、元の Deck を利用できる。Card は0枚で、読み込めない2枚と保存データ不変更の警告を表示する。
- 修復した Card は元の本文で表示し、残る1枚を読めない旨へ警告を更新する。
- 保存情報が修復されていない Card を別の内容で表示しない。
