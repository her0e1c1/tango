# Deck Management E2E テスト仕様書

## 目的

Deck を作成・編集・削除でき、失敗後も再試行できることを確認する。再試行で重複を作らず、対象 Deck の Card と学習に操作が反映され、他の Deck は変更されない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-MANAGEMENT-01 | write | 正常系 | [Deck 編集内容を保存して reload 後も確認できる](#deck-management-01) |
| DECK-MANAGEMENT-02 | batch | 正常系 | [Deck と関連データをまとめて削除できる](#deck-management-02) |
| DECK-MANAGEMENT-03 | read | 正常系 | [Deck の削除を取り消せる](#deck-management-03) |
| DECK-MANAGEMENT-04 | batch | 異常系 | [Deck の削除失敗後に再試行できる](#deck-management-04) |
| DECK-MANAGEMENT-05 | write | 正常系 | [ログイン中に空の Deck を作成して reload 後も確認できる](#deck-management-05) |
| DECK-MANAGEMENT-06 | write | 異常系 | [ログイン中の Deck 作成拒否を反映できる](#deck-management-06) |
| DECK-MANAGEMENT-07 | write | 正常系 | [匿名で空の Deck を作成して reload 後も確認できる](#deck-management-07) |
| DECK-MANAGEMENT-08 | read | 正常系 | [未保存の Deck 編集内容を離脱前に確認できる](#deck-management-08) |

<a id="deck-management-01"></a>

### DECK-MANAGEMENT-01 Deck 編集内容を保存して reload 後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Deck が存在する。

When:

- 対象 Deck の name、category、source URL を変更して保存し、画面を reload して編集画面を再度開く。

Then:

- Deck の更新成功が通知される。
- 編集画面に変更後の name、category、source URL が表示される。
- browser error が発生しない。

<a id="deck-management-02"></a>

### DECK-MANAGEMENT-02 Deck と関連データをまとめて削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck に複数の Card と再開可能な学習 session が存在する。
- 同じユーザーが、操作対象ではない別の Deck、Card、学習 session を所有している。

When:

- Deck 一覧から対象 Deck の削除を確定し、画面を reload する。

Then:

- Deck の削除成功が通知される。
- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck のすべての Card を表示・操作できなくなる。削除前にこのブラウザーで開いたことがない Card も対象となる。
- 対象 Deck の学習 session を再開できない。
- 操作対象ではない Deck、Card、学習 session は維持され、引き続き再開できる。
- browser error が発生しない。

<a id="deck-management-03"></a>

### DECK-MANAGEMENT-03 Deck の削除を取り消せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck の操作メニューボタンから削除 dialog を開いている。
- dialog に対象 Deck、関連 Card と学習 session への影響、削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除 dialog が閉じる。
- focus が対象 Deck の操作メニューボタンに戻る。
- 対象 Deck と Card を引き続き利用でき、学習 session も同じ位置から再開できる。
- browser error が発生しない。

<a id="deck-management-04"></a>

### DECK-MANAGEMENT-04 Deck の削除失敗後に再試行できる

カテゴリ: `batch`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する削除対象の Deck が存在する。
- 対象 Deck に Card と再開可能な学習 session が存在する。
- 最初の削除がクラウドから拒否され、Firestore の rollback 後に対象 Deck、Card、学習 session を再び利用でき、削除 dialog は閉じている。
- 次の削除は成功できる。

When:

- 対象 Deck の削除 dialog を開き直して再試行する。

Then:

- 削除 dialog が閉じる。
- Deck の削除成功が通知される。
- Deck 一覧に対象 Deck が表示されない。
- 対象 Deck の Card を利用できず、学習 session も再開できない。
- 最初の削除失敗に伴う未処理の browser error が発生しない。

<a id="deck-management-05"></a>

### DECK-MANAGEMENT-05 ログイン中に空の Deck を作成して reload 後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- 作成対象の Deck はまだ存在しない。

When:

- Deck の作成画面で name、category、source URL、改行変換を入力し、保存した後、Deck 一覧を reload する。

Then:

- Deck の作成成功が通知される。
- 作成した空の Deck が reload 後も Deck 一覧に一つだけ表示される。
- 編集画面でも入力した name、category、source URL、改行変換を確認できる。
- 同期後も同じアカウントの Deck として利用でき、再読み込みや同期によって複製が増えない。
- browser error が発生しない。

<a id="deck-management-06"></a>

### DECK-MANAGEMENT-06 ログイン中の Deck 作成拒否を反映できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしている。
- Deck の作成がローカル反映後にクラウドへの同期で拒否される。

When:

- Deck の作成画面で name、category、source URL、改行変換を入力し、保存する。

Then:

- ブラウザー内でローカル反映が完了すれば、クラウドの応答待ちで操作が止まらない。
- クラウドから拒否された Deck は Firestore の rollback により利用できる Deck として一覧に残らない。遅延した同期拒否のための独自通知は行わない。
- 操作していないのに新しい Deck が繰り返し作成されたり、失敗が未処理の browser error になったりしない。

<a id="deck-management-07"></a>

### DECK-MANAGEMENT-07 匿名で空の Deck を作成して reload 後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Google アカウントにログインしていない匿名ユーザーである。
- 作成対象の Deck はまだ存在しない。

When:

- Deck の作成画面で name と category を入力し、保存した後、Deck 一覧を reload する。

Then:

- 作成画面に保存先の選択肢はない。
- Deck の作成成功が通知される。
- 作成した空の Deck が同じブラウザーで reload した後も、一つだけ Deck 一覧に表示される。
- 作成した Deck はこのブラウザーだけで利用でき、クラウドには追加されない。
- 対象 Deck に Card が存在しない。
- browser error が発生しない。

<a id="deck-management-08"></a>

### DECK-MANAGEMENT-08 未保存の Deck 編集内容を離脱前に確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-unsaved-navigation`](./fixture/deck-unsaved-navigation.yaml)
- 認証済みユーザーが所有する編集対象の Deck が存在する。
- Deck 編集画面で name を変更し、まだ保存していない。
- 通知が表示されている。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択した後、再度離脱して Discard changes を選択する。

Then:

- 最初の離脱は取り消され、変更した name が編集画面に維持される。
- 離脱確認 dialog 表示中は、通知が重なっていても dialog の操作を妨げない。
- dialog 表示中に通知が消えるか置き換わっても、focus は Keep editing に維持される。
- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- Deck 一覧には変更前の name が表示される。
- browser error が発生しない。
