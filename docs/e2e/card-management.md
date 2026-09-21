# Card Management E2E テスト仕様書

## 目的

Card の作成・編集・削除が保存先の境界を守り、失敗後も入力を維持して再試行できることを確認する。Card 作成の再試行には新しい ID を使用する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-MANAGEMENT-01 | write | [Card 編集内容を保存して reload 後も確認できる](#card-management-01) |
| CARD-MANAGEMENT-02 | write | [Card を削除できる](#card-management-02) |
| CARD-MANAGEMENT-03 | read | [Card の削除を取り消せる](#card-management-03) |
| CARD-MANAGEMENT-04 | write | [Card の編集失敗後に再試行できる](#card-management-04) |
| CARD-MANAGEMENT-05 | write | [remote Deck に Card を作成できる](#card-management-05) |
| CARD-MANAGEMENT-06 | write | [local-only Deck に Card を作成できる](#card-management-06) |
| CARD-MANAGEMENT-07 | write | [remote Card の作成拒否後に新しい ID で重複なく再試行できる](#card-management-07) |
| CARD-MANAGEMENT-08 | write | [Card の削除失敗後に再試行できる](#card-management-08) |
| CARD-MANAGEMENT-09 | read | [未保存の Card 編集内容を離脱前に確認できる](#card-management-09) |
| CARD-MANAGEMENT-10 | read | [Card の未表示の面にある入力エラーを修正できる](#card-management-10) |
| CARD-MANAGEMENT-11 | read | [未保存の Card 作成内容の離脱を確認できる](#card-management-11) |
| CARD-MANAGEMENT-12 | write | [Card 作成成功が未回答の離脱確認より優先される](#card-management-12) |
| CARD-MANAGEMENT-13 | write | [Card 作成中に離脱しても保存成功時に一覧へ移動する](#card-management-13) |
| CARD-MANAGEMENT-14 | write | [Card 作成失敗後も離脱確認と入力を保持して再試行できる](#card-management-14) |

<a id="card-management-01"></a>

### CARD-MANAGEMENT-01 Card 編集内容を保存して reload 後も確認できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。

When:

- 対象 Card の front / back tab を切り替えて本文を編集し、back text を拡大画面でも変更する。
- 拡大画面を閉じ、1行の tags 要約から選択画面を開いて tags を変更して保存し、画面を reload して編集画面を再度開く。

Then:

- Card の更新成功が共通 toast で表示される。保存結果の通知は離脱後の完了でも表示され、共通 toast の寿命に従う。
- 編集画面に変更後の front text、back text、tags が表示される。
- tab と拡大画面を切り替えても両面の入力内容が維持され、拡大画面を閉じると起点へ focus が戻る。
- tags の全候補は選択画面だけに表示され、閉じた状態は最大2個と残りの件数を1行に表示する。
- 選択画面は既存の独自 tag も扱え、閉じて開き直しても選択が維持される。
- 検証中・保存中の連続送信は一度だけ保存し、入力・保存・Cancel・戻るは完了まで無効になる。
- 保存成功時だけ所属 Deck の一覧へ replace 遷移し、離脱後や別 Card への切替後の完了では古い画面から遷移しない。
- 既存 Card の ID・uniqueKey・deckId・学習情報と未変更の独自 tags は保持され、購読更新は編集中の draft を上書きしない。
- browser error が発生しない。

<a id="card-management-02"></a>

### CARD-MANAGEMENT-02 Card を削除できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card は削除対象の1件だけである。

When:

- Card 一覧から対象 Card の削除を確定し、画面を reload する。

Then:

- Card の削除成功が共通 toast で表示される。
- Card 一覧に対象 Card が表示されない。
- 対象 Card が active Card として保存先から読み込まれない。
- browser error が発生しない。

<a id="card-management-03"></a>

### CARD-MANAGEMENT-03 Card の削除を取り消せる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 削除対象 Card の action menu trigger から削除 dialog を開いている。
- dialog に対象 Card と削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除 dialog が閉じる。
- focus が対象 Card の action menu trigger に戻る。
- 対象 Card の永続データが変更されない。
- browser error が発生しない。

<a id="card-management-04"></a>

### CARD-MANAGEMENT-04 Card の編集失敗後に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。
- 編集要求の失敗が共通 toast で処理されている。cache 反映前の失敗では入力を維持し、反映後の remote 拒否では SDK が変更を戻す。
- 次の編集要求は成功できる。

When:

- 必要なら編集画面を開き直して同じ変更内容を入力し、保存を再試行して Card 一覧を reload する。

Then:

- Card 一覧へ戻る。
- Card の更新成功が共通 toast で表示される。
- reload 後も対象 Card に変更内容が表示される。
- 失敗 toast は再試行・Cancel・アンマウントによって個別に消去されず、共通 toast の寿命に従う。
- 最初の編集失敗に伴う未処理の browser error が発生しない。

<a id="card-management-05"></a>

### CARD-MANAGEMENT-05 remote Deck に Card を作成できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する remote Deck が存在する。
- モバイル幅の画面を使用している。

When:

- Card 一覧の Actions の Add card から作成画面を開き、Front / Back の拡大編集で本文を入力する。
- タグ選択画面を開いて閉じ、作成ボタンを続けてクリックして Card を作成し、画面を reload する。

Then:

- Card の作成成功が共通 toast で表示される。
- 両面の拡大編集画面は viewport の上端から下端まで表示され、見出しや完了ボタンが欠けない。
- 拡大編集とタグ選択の背景は viewport 全体を覆い、タグ選択画面は下端に隙間なく接する。
- 作成した Card が reload 後も同じ Deck の Card 一覧に表示される。
- Card は Firestore cache と同期後の remote に同じ ID で1件存在し、owner は対象 Deck と一致する。
- 入力検証中と保存中は作成ボタンが無効になり、作成処理が終わるまで追加の作成を受け付けない。
- browser error が発生しない。

<a id="card-management-06"></a>

### CARD-MANAGEMENT-06 local-only Deck に Card を作成できる

カテゴリ: `write`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- local-only Deck が存在する。
- viewport は 360 x 640 である。

When:

- Card 一覧の Actions の Add card から約1,748文字の通常の段落の front text と有効な back text を入力して Card を作成する。
- 成功通知の Dismiss にポインターで到達できることを確認し、Tab でフォーカスを移して Enter で閉じ、画面を reload する。

Then:

- Card の作成成功が共通 toast で表示され、翻訳された成功メッセージと Card 本文の冒頭を含む最大3行のプレビューが viewport 内に収まる。
- Dismiss の描画範囲とキーボードのフォーカス表示が viewport 内に収まり、操作できる。閉じた後はページにフォーカスが復元される。
- アクセシブルな通知は Card の文脈を維持する。
- 作成した Card が reload 後も同じ Deck の Card 一覧に表示され、front text の全文と back text が切り詰められずに保存される。
- Card は browser 保存先だけに1件存在し、remote 保存先には存在しない。
- browser error が発生しない。

<a id="card-management-07"></a>

### CARD-MANAGEMENT-07 remote Card の作成拒否後に新しい ID で重複なく再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する remote Deck が存在する。
- remote Card の最初の作成要求が拒否され、remote に保存されていないことが確定している。cache 反映後の拒否では SDK が Card を cache から戻す。
- 作成失敗が共通 toast で処理されている。cache 反映前の失敗では作成画面と入力を維持する。
- 次の作成要求は成功できる。

When:

- 必要なら作成画面を開き直して同じ内容を入力し、作成を再試行して Card 一覧を reload する。

Then:

- Card の作成成功が共通 toast で表示され、失敗 toast は残らない。
- 再試行には最初の要求と異なる新しい Card ID と、それと同じ unique key が使用される。
- 作成した Card が対象 Deck の remote data に一つだけ存在する。
- Card の front text、back text、deck ID、owner が最初の作成要求から維持されている。
- Firestore cache と remote は同じ Card ID を保持し、別 ID の複製は存在しない。
- 最初の作成失敗に伴う未処理の browser error が発生しない。

保存結果が不明な通信失敗では、最初の要求が保存済みである可能性がある。再試行は新しい ID を使用するため、この場合の重複防止は保証しない。

<a id="card-management-08"></a>

### CARD-MANAGEMENT-08 Card の削除失敗後に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck と削除対象の Card が存在する。
- 最初の削除要求の失敗が共通 toast で処理され、削除 dialog が閉じている。
- 次の削除要求は成功できる。

When:

- 対象 Card の削除 dialog を開き直して削除を再試行し、Card 一覧を reload する。

Then:

- 削除 dialog が閉じる。
- Card 一覧に対象 Card が表示されない。
- 対象 Card が active Card として保存先から読み込まれない。
- 最初の削除失敗に伴う未処理の browser error が発生しない。

<a id="card-management-09"></a>

### CARD-MANAGEMENT-09 未保存の Card 編集内容を離脱前に確認できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Card が存在する。
- Card 編集画面で front text を変更し、まだ保存していない。
- 永続する共通 toast が表示されている。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択した後、再度離脱して Discard changes を選択する。

Then:

- 最初の離脱は取り消され、変更した front text が編集画面に維持される。
- 離脱確認 dialog 表示中の toast は操作 control と pointer hit target を持たない。
- dialog 表示中に toast が消えるか置き換わっても、focus は Keep editing に維持される。
- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- 永続化された Card の front text は変更されない。
- browser error が発生しない。

<a id="card-management-10"></a>

### CARD-MANAGEMENT-10 Card の未表示の面にある入力エラーを修正できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Card の編集画面を開いている。

When:

- front text と back text を空にし、Back tab を表示した状態で保存を試みる。
- Back tab に切り替えて拡大編集画面を開き、入力エラーを確認して閉じる。

Then:

- 最初の入力エラーがある Front tab が選択され、対象の入力欄へ focus が移る。
- 両面の tab にエラーが示され、Back tab を選ぶと back text の入力エラーも確認できる。
- 拡大編集画面でも入力エラーが表示され、入力欄の accessible description として読み取れる。
- 未入力の値は維持され、Card は保存されず元の永続データが変更されない。
- browser error が発生しない。

<a id="card-management-11"></a>

### CARD-MANAGEMENT-11 未保存の Card 作成内容の離脱を確認できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面を開いている。

When:

- 未変更の状態で Cancel を選択し、再度作成画面を開いて front text を入力する。
- Cancel の離脱確認で Keep editing を選択し、再度 Cancel して Discard changes を選択する。

Then:

- 未変更の場合は確認なしで所属 Deck の Card 一覧へ戻る。
- 未保存の入力がある場合は確認 dialog が表示され、Keep editing では入力を保持する。
- Discard changes では所属 Deck の Card 一覧へ移動し、Card は作成されない。
- browser error が発生しない。

<a id="card-management-12"></a>

### CARD-MANAGEMENT-12 Card 作成成功が未回答の離脱確認より優先される

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、Firestore cache への反映完了を待っている。

When:

- 保存処理中に Header で離脱を試みて Keep editing を選択し、再度 Header で離脱を試みて確認を未回答のまま保存を完了する。

Then:

- 確認には離脱後も作成が続き、成功時に一覧へ移動し、失敗時に通知される説明が表示される。
- Keep editing では入力と保存処理を維持し、作成画面に留まる。
- 保存成功で確認が閉じ、所属 Deck の Card 一覧へ replace 遷移する。古い Header の要求先へ移動しない。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ永続化され、reload 後も表示される。
- browser error が発生しない。

cache 反映が完了すれば remote の応答を待たずに成功して一覧へ移動する。remote 応答を保留した E2E では、この時点で Card が表示されることを確認する。

<a id="card-management-13"></a>

### CARD-MANAGEMENT-13 Card 作成中に離脱しても保存成功時に一覧へ移動する

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、Firestore cache への反映完了を待っている。

When:

- 保存処理中に Header で離脱を試みて Discard changes を選択し、移動先で保存完了を待つ。

Then:

- 確認には離脱後も作成が続くことと完了時の挙動が表示される。
- Discard changes で要求した Deck 一覧へ移動し、保存成功後は所属 Deck の Card 一覧へ replace 遷移する。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ永続化され、reload 後も表示される。
- browser error が発生しない。

cache 反映後に別の画面へ移動した場合、その後の remote 同期成功は再遷移を起こさない。E2E では Deck 一覧に留まり、再度開いた Card 一覧に保存した Card があることを確認する。

<a id="card-management-14"></a>

### CARD-MANAGEMENT-14 Card 作成失敗後も離脱確認と入力を保持して再試行できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、Firestore cache への反映完了を待っている。

When:

- 保存処理中に Header で離脱を試みて確認を未回答のまま書き込みを失敗させ、Keep editing を選択して再試行する。

Then:

- 失敗通知が表示されても離脱確認は残り、成功時の遷移は実行されない。
- Keep editing で前後の入力を保持し、再試行の成功後は所属 Deck の Card 一覧へ移動する。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ永続化され、reload 後も表示される。
- browser error が発生しない。

cache 反映後の remote 拒否は App 共通の同期エラー通知で知らせ、移動先に留まる。SDK が拒否した Card を戻し、古い入力画面や離脱確認を復元しない。この段階を E2E で確認する。

<a id="card-management-15"></a>

### CARD-MANAGEMENT-15 作成中の未保存の解答をプレビューできる

カテゴリ: `read`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- local-only Deck の Card 作成画面を開いており、Front は未入力である。

When:

- Back に未保存の本文を入力し、プレビューをキーボードで開閉する。
- math タグを選択し、強調、表、数式を含む本文をプレビューする。
- 拡大入力でも本文を変更してプレビューを確認し、通常入力へ戻る。

Then:

- 最新の下書きが Deck category と最初の対応タグに従って描画される。
- plain text は改行を保持し、math は Markdown の強調・表と数式を描画する。
- Front の検証や送信が始まらず、本文とタグを維持して入力へ戻れる。
- プレビュー開閉で入力欄が置き換わらず、追加の Undo 履歴喪失がない。
- 狭い画面でもプレビュー操作と入力欄を利用できる。
- Card、Deck、Progress、学習 session の保存値と URL が変更されず、browser error が発生しない。

<a id="card-management-16"></a>

### CARD-MANAGEMENT-16 編集中の未保存の解答と表示形式をプレビューできる

カテゴリ: `read`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- local-only Card の編集画面を開いている。

When:

- 保存済みと異なる Back を入力し、タグを変更してプレビューを開閉する。
- コードの言語を切り替え、拡大入力で下書きを更新して通常入力へ戻る。

Then:

- 最新の下書き、タグの優先順、Deck category、現在のテーマが描画に反映される。
- 対応言語は構文ハイライトを使用し、markdown / md を math として描画しない。
- プレビューだけで既存の検証状態、dirty 状態、本文、タグが変更されない。
- プレビュー開閉で通常・拡大入力の入力欄が置き換わらず、キーボードで入力へ戻れる。
- 未保存変更の離脱確認は維持される。
- Card、Deck、Progress、学習 session の保存値と URL が変更されず、browser error が発生しない。
