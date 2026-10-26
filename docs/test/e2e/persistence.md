# Persistence E2E テスト仕様書

## 目的

アカウント間のデータ分離、再読み込み・通信断後の復元、再接続後のブラウザー間同期を確認する。

非公開の学習データは [StudySession](../integration/firestore/rules-study-session.md#firestore-rules-study-session-02)、削除済み公開データの読取拒否は [Deck](../integration/firestore/rules-deck.md#firestore-rules-deck-01)・[Card](../integration/firestore/rules-card.md#firestore-rules-card-01) の認可仕様を参照する。匿名の学習結果・記録の復元は [STUDY-SESSION-07](./study-session.md#study-session-07)・[STUDY-SESSION-12](./study-session.md#study-session-12)、保存先は [共通前提](./AGENTS.md#保存先の用語) を参照する。
旧アプリで保存したデータの自動引き継ぎは対象外とする。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PERSISTENCE-01 | read | 正常系 | [アカウントごとのデータを再読み込み後も分離して表示できる](#persistence-01) |
| PERSISTENCE-08 | read | 正常系 | [オフラインの再読み込みで保存済みの学習位置を復元できる](#persistence-08) |
| PERSISTENCE-14 | read | 正常系 | [変更なしで画面を開き直しても全 Card を重複なく表示できる](#persistence-14) |
| PERSISTENCE-05 | batch | 正常系 | [匿名でオフライン作成した Card を再読み込み後も保持する](#persistence-05) |
| PERSISTENCE-13 | batch | 正常系 | [匿名でオフラインインポートした Card を再読み込み後も保持する](#persistence-13) |
| PERSISTENCE-02 | batch | 正常系 | [オフラインの変更を再接続後に同期できる](#persistence-02) |
| PERSISTENCE-03 | write | 正常系 | [別のブラウザーに Card の変更を再読み込みなしで反映できる](#persistence-03) |
| PERSISTENCE-04 | batch | 正常系 | [未ログインの Deck の変更をこのブラウザーだけに維持できる](#persistence-04) |
| PERSISTENCE-06 | batch | 正常系 | [オフラインで進めた学習を同期後に別ブラウザーで再開できる](#persistence-06) |
| PERSISTENCE-09 | batch | 正常系 | [画面を閉じている間の Card の編集を再開後に反映できる](#persistence-09) |
| PERSISTENCE-11 | batch | 正常系 | [未ログインの Card の変更をこのブラウザーだけに維持できる](#persistence-11) |
| PERSISTENCE-12 | batch | 正常系 | [匿名でオフライン削除した Card は再読み込み後も表示しない](#persistence-12) |
| PERSISTENCE-15 | batch | 正常系 | [画面を閉じた間に論理削除された Card は再開後も表示しない](#persistence-15) |
| PERSISTENCE-16 | batch | 正常系 | [画面を閉じた間に論理削除された Deck は再開後も表示しない](#persistence-16) |
| PERSISTENCE-19 | read | 異常系 | [不正な匿名 Card の表示・編集リンクで復旧警告を維持できる](#persistence-19) |
| PERSISTENCE-20 | read | 異常系 | [全 Card が不正な匿名 Deck の表示リンクで復旧警告を維持できる](#persistence-20) |
| PERSISTENCE-07 | batch | 異常系 | [端末内のデータが失われてもサーバーから再取得できる](#persistence-07) |
| PERSISTENCE-10 | batch | 異常系 | [匿名 Card の保存値が不正でも正常なデータを再起動後に利用できる](#persistence-10) |
| PERSISTENCE-17 | batch | 異常系 | [不正な匿名 Card の保存値を修復すると再び表示できる](#persistence-17) |
| PERSISTENCE-18 | batch | 異常系 | [不正な匿名 Card があっても狭い画面で学習を完了できる](#persistence-18) |

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

<a id="persistence-14"></a>

### PERSISTENCE-14 変更なしで画面を開き直しても全 Card を重複なく表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 保存内容を変更せずに一覧を再読み込みし、画面を閉じてから再び開く。

Then:

- 全 Card を重複なく表示する。

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

### PERSISTENCE-04 未ログインの Deck の変更をこのブラウザーだけに維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と複数の Card を利用できる。

When:

- Deck を編集して保存し、同じ匿名アカウントのまま画面を再読み込みする。

Then:

- 再読み込み後も編集内容を表示し、このブラウザーだけに保持する。クラウドには保存しない。

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

### PERSISTENCE-09 画面を閉じている間の Card の編集を再開後に反映できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 画面を閉じている間に別クライアントで1枚の Card を編集して開き直す。

Then:

- 編集した Card は新しい本文で表示し、変更しなかった Card は残る。

<a id="persistence-11"></a>

### PERSISTENCE-11 未ログインの Card の変更をこのブラウザーだけに維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と複数の Card を利用できる。

When:

- Card を編集して保存し、同じ匿名アカウントのまま画面を再読み込みする。

Then:

- 再読み込み後も編集内容を表示し、このブラウザーだけに保持する。クラウドには保存しない。

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

<a id="persistence-15"></a>

### PERSISTENCE-15 画面を閉じた間に論理削除された Card は再開後も表示しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。

When:

- 画面を閉じている間に別クライアントで1枚の Card を論理削除して開き直す。

Then:

- 削除した Card は表示せず、変更しなかった Card は残る。
- サーバーには削除済みの Card が残る。

<a id="persistence-16"></a>

### PERSISTENCE-16 画面を閉じた間に論理削除された Deck は再開後も表示しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントの Deck と複数 Card を一度取得している。
- 対象 Deck には論理削除済みの Card がある。

When:

- 画面を閉じている間に別クライアントで親 Deck を論理削除し、Deck 一覧を開き直して再読み込みする。

Then:

- 親 Deck は一覧から消え、再読み込みでも復活しない。
- サーバーには削除済みの Deck と Card が残る。

<a id="persistence-19"></a>

### PERSISTENCE-19 不正な匿名 Card の表示・編集リンクで復旧警告を維持できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と2枚の未評価 Card を作成している。
- 1枚の FSRS が欠落し、もう1枚は正常なままである。Deck、認証状態、設定は正常なままである。
- 不正な Card の保存済み表示リンクと編集リンクがある。表示・編集を独立した画面例とする。

When:

- 不正な Card の保存済み表示リンクまたは編集リンクを開いて再読み込みし、復旧操作で一覧へ戻る。

Then:

- 対象 Card が利用できない旨、読み込めない件数、保存データを変更していない警告を表示する。
- 再読み込み後と元の Deck の一覧へ戻った後も、警告を維持する。

<a id="persistence-20"></a>

### PERSISTENCE-20 全 Card が不正な匿名 Deck の表示リンクで復旧警告を維持できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と2枚の未評価 Card を作成している。
- 両方の Card の FSRS が欠落している。Deck、認証状態、設定は正常なままである。
- 対象 Deck の保存済み表示リンクがある。

When:

- 全 Card が不正な Deck の保存済み表示リンクを開いて再読み込みし、一覧へ戻る。

Then:

- Card がない旨、読み込めない件数、保存データを変更していない警告を表示する。
- 再読み込み後も同じ状態を保ち、元の Deck の一覧へ戻っても警告を維持する。

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

### PERSISTENCE-10 匿名 Card の保存値が不正でも正常なデータを再起動後に利用できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と2枚の未評価 Card を作成している。正常な保存値では再読み込み後も両方を表示できる。
- 画面を閉じた後に、次の各行の保存値が不正になっている。Deck、認証状態、設定は正常なままである。

| 不正な保存値 | 最初の再起動で利用できる Card |
| --- | --- |
| 2枚のうち1枚の FSRS が欠落 | 正常な1枚 |
| 2枚とも FSRS が欠落 | 0枚。ただし Deck とアプリは利用できる |

When:

- 同じブラウザーでアプリを開き直し、Deck の Card 一覧を開いて再読み込みする。

Then:

- 全ローカルデータの削除や再認証を必要とせずに起動し、元の Deck と表の Card を表示できる。
- FSRS 欠落 Card を未評価として補完せず除外し、正常な Card は表示する。再読み込み後も同じ結果を保つ。
- 読み込めない Card の件数と、保存データを変更していないことを警告する。
- アプリは不正な保存値を自動修復・削除しない。

<a id="persistence-17"></a>

### PERSISTENCE-17 不正な匿名 Card の保存値を修復すると再び表示できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と2枚の未評価 Card を作成している。正常な保存値では再読み込み後も両方を表示できる。
- 画面を閉じた後に、次の各行の保存値が不正になっている。Deck、認証状態、設定は正常なままである。

| 不正な保存値 | 最初の再起動で利用できる Card |
| --- | --- |
| 2枚のうち1枚の FSRS が欠落 | 正常な1枚 |
| 2枚とも FSRS が欠落 | 0枚。ただし Deck とアプリは利用できる |

- 再起動後の一覧には正常な Card だけが表示され、読み込めない件数と保存データ不変更の警告が表示されている。

When:

- 不正な1枚の保存値を有効な未評価状態へ修復し、一覧を開き直す。

Then:

- 保存値が修復された Card は同じ本文で再表示し、警告件数が減る。
- 他の Card の表示は変わらず、全 Card が正常になったら警告は消える。

<a id="persistence-18"></a>

### PERSISTENCE-18 不正な匿名 Card があっても狭い画面で学習を完了できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで Deck と2枚の未評価 Card を作成している。
- 1枚の FSRS が欠落し、もう1枚の正常な Card を学習できる。Deck、認証状態、設定は正常なままである。
- 画面は390×844であり、評価ボタンと再生操作を表示する既定の設定を使う。

When:

- 正常な1枚の学習画面を開き、スクロールせず再生・停止してから Card に回答する。

Then:

- 警告・正常 Card の本文・評価／再生操作が初期表示内に収まり、スクロールせず再生・停止と回答から学習を完了できる。
- 完了画面に対象数1枚（英語では「Session: 1 card」）を表示する。戻る操作の表示だけでは完了と判定しない。
