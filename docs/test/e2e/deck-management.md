# Deck Management E2E テスト仕様書

## 目的

Deck の作成・編集・削除と、重複しない再試行を確認する。操作は対象 Deck の Card と学習に反映し、他の Deck は変更しない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-MANAGEMENT-03 | read | 正常系 | [Deck の削除を取り消せる](#deck-management-03) |
| DECK-MANAGEMENT-08 | read | 正常系 | [未保存の Deck 編集内容を維持して編集を続けられる](#deck-management-08) |
| DECK-MANAGEMENT-10 | read | 正常系 | [未保存の Deck 編集内容を破棄して一覧へ戻れる](#deck-management-10) |
| DECK-MANAGEMENT-05 | write | 正常系 | [ログイン中に空の Deck を作成して再読み込み後も確認できる](#deck-management-05) |
| DECK-MANAGEMENT-07 | write | 正常系 | [匿名で空の Deck を作成して再読み込み後も確認できる](#deck-management-07) |
| DECK-MANAGEMENT-01 | write | 正常系 | [Deck 編集内容を保存して再読み込み後も確認できる](#deck-management-01) |
| DECK-MANAGEMENT-02 | batch | 正常系 | [Deck と関連データをまとめて削除できる](#deck-management-02) |
| DECK-MANAGEMENT-06 | write | 異常系 | [ログイン中の Deck 作成拒否を反映できる](#deck-management-06) |
| DECK-MANAGEMENT-04 | batch | 異常系 | [Deck の削除失敗後に再試行できる](#deck-management-04) |
| DECK-MANAGEMENT-09 | batch | 異常系 | [学習 session の終了失敗後も Deck の削除成功を維持する](#deck-management-09) |

<a id="deck-management-03"></a>

### DECK-MANAGEMENT-03 Deck の削除を取り消せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 所有する Deck の操作メニューから削除ダイアログを開いている。
- ダイアログに対象 Deck、関連 Card と学習 session への影響、削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除ダイアログが閉じる。
- フォーカスが対象 Deck の操作メニューボタンに戻る。
- 対象 Deck と Card を引き続き利用でき、学習 session も同じ位置から再開できる。

<a id="deck-management-08"></a>

### DECK-MANAGEMENT-08 未保存の Deck 編集内容を維持して編集を続けられる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-unsaved-navigation`](./fixture/deck-unsaved-navigation.yaml)
- 所有する Deck の編集画面で name を変更し、まだ保存していない。
- 通知が表示されている。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択する。

Then:

- 離脱は取り消され、変更した name が編集画面に維持される。
- 通知が重なってもダイアログを操作でき、通知の消去・置き換えでも Keep editing のフォーカスを維持する。

<a id="deck-management-10"></a>

### DECK-MANAGEMENT-10 未保存の Deck 編集内容を破棄して一覧へ戻れる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-unsaved-navigation`](./fixture/deck-unsaved-navigation.yaml)
- 認証済みユーザーが所有する Deck の編集画面で name を変更し、まだ保存していない。
- Header から Deck 一覧への離脱を一度試み、Keep editing を選択して編集を続けている。

When:

- Header から再度 Deck 一覧への離脱を試み、Discard changes を選択する。

Then:

- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- Deck 一覧には変更前の name が表示される。

<a id="deck-management-05"></a>

### DECK-MANAGEMENT-05 ログイン中に空の Deck を作成して再読み込み後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 作成対象の Deck はまだ存在しない。

When:

- Deck の作成画面で name、category を入力し、保存した後、Deck 一覧を再読み込みする。

Then:

- 作成成功が通知され、再読み込み後も空の Deck が一覧に一つだけ表示される。
- 編集画面でも入力した name、category を確認できる。作成・編集画面に改行変換の操作・説明は表示されず、新規 Deck の旧改行変換値は既定の `false` になる。
- 同期後も同じアカウントの Deck として利用でき、再読み込みや同期によって複製が増えない。

<a id="deck-management-07"></a>

### DECK-MANAGEMENT-07 匿名で空の Deck を作成して再読み込み後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 匿名で利用している。
- 作成対象の Deck はまだ存在しない。

When:

- Deck の作成画面で name と category を入力し、保存した後、Deck 一覧を再読み込みする。

Then:

- 作成画面に保存先の選択肢はない。
- サーバー応答を待たずに作成を完了できる。
- Deck の作成成功が通知される。
- 同じブラウザーで再読み込みしても、空の Deck が一覧に一つだけ表示される。
- 作成した Deck はこのブラウザーだけで利用でき、クラウドには追加されない。

<a id="deck-management-01"></a>

### DECK-MANAGEMENT-01 Deck 編集内容を保存して再読み込み後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Deck が存在する。旧改行変換値が保存されている。

When:

- 対象 Deck の name、category を変更して保存し、画面を再読み込みして編集画面を再度開く。

Then:

- Deck の更新成功が通知される。
- 編集画面に変更後の name、category が表示される。改行変換の操作・説明と空の詳細設定欄は表示されない。
- 保存済みの旧改行変換値と Card 本文は変更されない。

<a id="deck-management-02"></a>

### DECK-MANAGEMENT-02 Deck と関連データをまとめて削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 所有する Deck に複数の Card と再開可能な学習 session がある。
- 同じユーザーが別の Deck、Card、学習 session も所有している。
- Deck の削除と学習 session 終了の後処理が成功できる。

When:

- Deck 一覧から対象 Deck の削除を確定し、画面を再読み込みする。

Then:

- Deck の保存成功で削除成功が通知され、操作待ちが解除される。
- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck のすべての Card を表示・操作できなくなる。削除前にこのブラウザーで開いたことがない Card も対象となる。
- 対象 Deck の学習 session を再開できない。
- 別の Deck と Card は変わらず、学習 session も再開できる。

<a id="deck-management-06"></a>

### DECK-MANAGEMENT-06 ログイン中の Deck 作成拒否を反映できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Deck の作成がローカル反映後にクラウドへの同期で拒否される。

When:

- Deck の作成画面で name、category を入力し、保存する。

Then:

- サーバーの保存結果を待ち、拒否されると入力を保持して失敗を通知する。
- 拒否された Deck は利用可能な Deck として一覧に残らない。
- 操作していないのに新しい Deck が繰り返し作成されない。

<a id="deck-management-04"></a>

### DECK-MANAGEMENT-04 Deck の削除失敗後に再試行できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 所有する Deck に Card と再開可能な学習 session がある。
- 最初の削除がクラウドから拒否され、Firestore の rollback 後に対象 Deck、Card、学習 session を再び利用でき、削除ダイアログは閉じている。
- 次の削除は成功できる。

When:

- 対象 Deck の削除ダイアログを開き直して再試行する。

Then:

- 削除ダイアログが閉じる。
- Deck の削除成功が通知される。
- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck の Card を利用できず、学習 session も再開できない。

<a id="deck-management-09"></a>

### DECK-MANAGEMENT-09 学習 session の終了失敗後も Deck の削除成功を維持する

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する削除対象の Deck に、複数の Card と再開可能な学習 session が存在する。
- 同じユーザーが別の Deck、Card、学習 session も所有している。
- Deck の保存は成功するが、対象 Deck の学習 session を終了する後処理は保留された後に拒否される。

When:

- Deck 一覧から対象 Deck の削除を確定し、学習 session 終了の後処理が拒否された後に画面を再読み込みする。

Then:

- Deck の保存成功で削除成功が通知され、学習 session の終了を待たずに操作待ちが解除される。
- 学習 session の終了が保留・失敗しても削除は取り消されず、後処理の失敗は別途通知される。
- 再読み込み後も Deck 一覧に対象 Deck が表示されず、その学習 session を再開できない。
- 対象 Deck のすべての Card を表示・操作できない。削除前にこのブラウザーで開いたことがない Card も対象となる。
- 別の Deck と Card は変わらず、学習 session も再開できる。
