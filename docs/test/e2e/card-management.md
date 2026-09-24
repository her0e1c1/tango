# Card Management E2E テスト仕様書

## 目的

Card を作成・編集・削除でき、失敗後も入力を維持して再試行できることを確認する。保存拒否が確定した作成の再試行では、Card が重複しない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-MANAGEMENT-01 | write | 正常系 | [Card 編集内容を保存して reload 後も確認できる](#card-management-01) |
| CARD-MANAGEMENT-02 | write | 正常系 | [Card を削除できる](#card-management-02) |
| CARD-MANAGEMENT-03 | read | 正常系 | [Card の削除を取り消せる](#card-management-03) |
| CARD-MANAGEMENT-04 | write | 異常系 | [Card の編集失敗後に再試行できる](#card-management-04) |
| CARD-MANAGEMENT-05 | write | 正常系 | [ログイン中の Deck に Card を作成できる](#card-management-05) |
| CARD-MANAGEMENT-06 | write | 正常系 | [匿名で利用中の Deck に Card を作成できる](#card-management-06) |
| CARD-MANAGEMENT-07 | write | 異常系 | [Card の作成拒否後に重複なく再試行できる](#card-management-07) |
| CARD-MANAGEMENT-08 | write | 異常系 | [Card の削除失敗後に再試行できる](#card-management-08) |
| CARD-MANAGEMENT-09 | read | 正常系 | [未保存の Card 編集内容を離脱前に確認できる](#card-management-09) |
| CARD-MANAGEMENT-10 | read | 異常系 | [Card の未表示の面にある入力エラーを修正できる](#card-management-10) |
| CARD-MANAGEMENT-11 | read | 正常系 | [未保存の Card 作成内容の離脱を確認できる](#card-management-11) |
| CARD-MANAGEMENT-12 | write | 正常系 | [Card 作成成功が未回答の離脱確認より優先される](#card-management-12) |
| CARD-MANAGEMENT-13 | write | 正常系 | [Card 作成中に離脱しても保存成功時に一覧へ移動する](#card-management-13) |
| CARD-MANAGEMENT-14 | write | 異常系 | [Card 作成失敗後も離脱確認と入力を保持して再試行できる](#card-management-14) |
| CARD-MANAGEMENT-15 | read | 正常系 | [作成中の未保存の解答をプレビューできる](#card-management-15) |
| CARD-MANAGEMENT-16 | read | 正常系 | [編集中の未保存の解答と表示形式をプレビューできる](#card-management-16) |

<a id="card-management-01"></a>

### CARD-MANAGEMENT-01 Card 編集内容を保存して reload 後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在し、選択に使うタグを Deck に登録している。

When:

- 対象 Card の front / back tab を切り替えて本文を編集し、back text を拡大画面でも変更する。
- 拡大画面を閉じ、1行の tags 要約から選択画面を開いて tags を変更して保存し、画面を reload して編集画面を再度開く。

Then:

- Card の更新成功が通知される。保存結果は画面を離れた後の完了でも通知され、既定の時間で消える。
- 編集画面に変更後の front text、back text、tags が表示される。
- tab と拡大画面を切り替えても両面の入力内容が維持され、拡大画面を閉じると起点へ focus が戻る。
- tags の全候補は選択画面だけに表示され、閉じた状態は最大2個と残りの件数を1行に表示する。
- 選択候補は所属 Deck に登録したタグと Card の既存タグであり、固定カテゴリや別 Deck のタグは追加されない。Deck のタグが未登録でも、Card の既存タグは保持・解除・再選択できる。
- 選択画面は既存の独自 tag も扱え、閉じて開き直しても選択が維持される。
- 検証中・保存中の連続送信で変更が重複せず、入力・保存・Cancel・戻るは完了まで無効になる。
- 保存成功時だけ所属 Deck の Card 一覧へ戻る。すでに別画面や別 Card へ移った場合は、以前の保存完了によって遷移しない。
- 元の Card が更新され、所属 Deck、学習結果、未変更の独自 tags は維持される。別のブラウザーから変更が届いても、編集中の入力を勝手に置き換えない。
- browser error が発生しない。

<a id="card-management-02"></a>

### CARD-MANAGEMENT-02 Card を削除できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck の Card は削除対象の1件だけである。

When:

- Card 一覧から対象 Card の削除を確定し、画面を reload する。

Then:

- Card の削除成功が通知される。
- Card 一覧に対象 Card が表示されず、対象 Deck の Card 件数は0になる。
- 再読み込みしても削除した Card を閲覧・学習できない。
- browser error が発生しない。

<a id="card-management-03"></a>

### CARD-MANAGEMENT-03 Card の削除を取り消せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 削除対象 Card の操作メニューボタンから削除 dialog を開いている。
- dialog に対象 Card と削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- 削除 dialog が閉じる。
- focus が対象 Card の操作メニューボタンに戻る。
- 対象 Card を同じ内容・学習状態で引き続き利用できる。
- browser error が発生しない。

<a id="card-management-04"></a>

### CARD-MANAGEMENT-04 Card の編集失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に編集対象の Card が存在する。
- 編集の失敗が通知されている。ブラウザー内で保存できなかった場合は入力が残り、保存後にクラウドから拒否された場合は元の Card の内容に戻っている。
- 次の編集は成功できる。

When:

- 必要なら編集画面を開き直して同じ変更内容を入力し、保存を再試行して Card 一覧を reload する。

Then:

- Card 一覧へ戻る。
- Card の更新成功が通知される。
- reload 後も対象 Card に変更内容が表示される。
- 再試行・Cancel・画面移動だけで失敗通知の表示時間を変更しない。
- 最初の編集失敗に伴う未処理の browser error が発生しない。

<a id="card-management-05"></a>

### CARD-MANAGEMENT-05 ログイン中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントにログインしたユーザーが所有する Deck が存在する。
- モバイル幅の画面を使用し、選択に使うタグを Deck に登録している。

When:

- Card 一覧の Actions の Add card から作成画面を開き、Front / Back の拡大編集で本文を入力する。
- 所属 Deck に登録したタグをタグ選択画面で選び、作成ボタンを続けてクリックして Card を作成し、画面を reload する。

Then:

- Card の作成成功が通知される。
- 両面の拡大編集画面は viewport の上端から下端まで表示され、見出しや完了ボタンが欠けない。
- 拡大編集とタグ選択の背景は viewport 全体を覆い、タグ選択画面は下端に隙間なく接する。
- 作成した Card が reload 後も同じ Deck の Card 一覧に一つだけ表示され、選択したタグを保持する。
- タグ候補は所属 Deck に登録したタグであり、固定カテゴリや別 Deck のタグは追加されない。Deck のタグが空または未登録なら候補は空で、タグなしで作成できる。
- 同期後も同じアカウントの対象 Deck で利用でき、別の Deck へ追加されたり複製が増えたりしない。
- 入力検証中と保存中は作成ボタンが無効になり、作成処理が終わるまで追加の作成を受け付けない。
- browser error が発生しない。

<a id="card-management-06"></a>

### CARD-MANAGEMENT-06 匿名で利用中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck が存在する。
- viewport は 360 x 640 である。

When:

- Card 一覧の Actions の Add card から約1,748文字の通常の段落の front text と有効な back text を入力して Card を作成する。
- 成功通知の Dismiss にポインターで到達できることを確認し、Tab でフォーカスを移して Enter で閉じ、画面を reload する。

Then:

- Card の作成成功が通知され、翻訳された成功メッセージと Card 本文の冒頭を含む最大3行のプレビューが viewport 内に収まる。
- Dismiss の描画範囲とキーボードのフォーカス表示が viewport 内に収まり、操作できる。閉じた後はページにフォーカスが復元される。
- アクセシブルな通知は Card の文脈を維持する。
- 作成した Card が reload 後も同じ Deck の Card 一覧に表示され、front text の全文と back text が切り詰められずに保存される。
- 作成した Card はこのブラウザーだけで一つ利用でき、クラウドには追加されない。
- browser error が発生しない。

<a id="card-management-07"></a>

### CARD-MANAGEMENT-07 Card の作成拒否後に重複なく再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントにログインしたユーザーが所有する Deck が存在する。
- 最初の Card 作成が拒否され、クラウドには保存されていないことが確定している。一時的に表示された Card も一覧から消えている。
- 作成失敗が通知されている。ブラウザー内で保存できなかった場合は、作成画面に入力が残っている。
- 次の作成は成功できる。

When:

- 必要なら作成画面を開き直して同じ内容を入力し、作成を再試行して Card 一覧を reload する。

Then:

- Card の作成成功が通知され、失敗通知は残らない。
- 対象 Deck の Card 一覧に、作成した Card が一つだけ表示される。
- 最初に入力した front text と back text が維持され、同じアカウントの同じ Deck で利用できる。
- 再読み込みや同期によって Card の複製が増えない。
- 最初の作成失敗に伴う未処理の browser error が発生しない。

保存できたか不明な通信失敗は、このケースの前提に含めない。その状態からの再試行については重複防止を保証しない。

<a id="card-management-08"></a>

### CARD-MANAGEMENT-08 Card の削除失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- 認証済みユーザーが所有する Deck と削除対象の Card が存在する。
- 最初の削除の失敗が通知され、削除 dialog が閉じている。
- 次の削除は成功できる。

When:

- 対象 Card の削除 dialog を開き直して削除を再試行し、Card 一覧を reload する。

Then:

- 削除 dialog が閉じる。
- Card 一覧に対象 Card が表示されない。
- 再読み込みしても削除した Card を閲覧・学習できない。
- 最初の削除失敗に伴う未処理の browser error が発生しない。

<a id="card-management-09"></a>

### CARD-MANAGEMENT-09 未保存の Card 編集内容を離脱前に確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する編集対象の Card が存在する。
- Card 編集画面で front text を変更し、まだ保存していない。
- 通知が表示されている。

When:

- Header から Deck 一覧への離脱を試み、Keep editing を選択した後、再度離脱して Discard changes を選択する。

Then:

- 最初の離脱は取り消され、変更した front text が編集画面に維持される。
- 離脱確認 dialog 表示中は、通知が重なっていても dialog の操作を妨げない。
- dialog 表示中に通知が消えるか置き換わっても、focus は Keep editing に維持される。
- 2回目の離脱では Deck 一覧へ1回だけ遷移する。
- 対象 Card を開き直すと、変更前の front text が表示される。
- browser error が発生しない。

<a id="card-management-10"></a>

### CARD-MANAGEMENT-10 Card の未表示の面にある入力エラーを修正できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Card の編集画面を開いている。

When:

- front text と back text を空にし、Back tab を表示した状態で保存を試みる。
- Back tab に切り替えて拡大編集画面を開き、入力エラーを確認して閉じる。

Then:

- 最初の入力エラーがある Front tab が選択され、対象の入力欄へ focus が移る。
- 両面の tab にエラーが示され、Back tab を選ぶと back text の入力エラーも確認できる。
- 拡大編集画面でも入力エラーが表示され、入力欄の読み上げ説明として確認できる。
- 未入力の値は維持され、Card は保存されず元の内容が変更されない。
- browser error が発生しない。

<a id="card-management-11"></a>

### CARD-MANAGEMENT-11 未保存の Card 作成内容の離脱を確認できる

カテゴリ: `read`

区分: 正常系

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

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、保存を開始している。まだ保存は完了していない。

When:

- 保存処理中に Header で離脱を試みて Keep editing を選択し、再度 Header で離脱を試みて確認を未回答のまま保存完了を待つ。

Then:

- 確認には離脱後も作成が続き、成功時に一覧へ移動し、失敗時に通知される説明が表示される。
- Keep editing では入力と保存処理を維持し、作成画面に留まる。
- 保存成功で確認が閉じ、所属 Deck の Card 一覧へ移動する。以前に Header で選んだ画面へは移動しない。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ表示され、reload 後も利用できる。
- ブラウザー内で保存できればクラウドの応答を待たずに一覧へ移動し、Card を表示する。
- browser error が発生しない。

<a id="card-management-13"></a>

### CARD-MANAGEMENT-13 Card 作成中に離脱しても保存成功時に一覧へ移動する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、保存を開始している。まだ保存は完了していない。

When:

- 保存処理中に Header で離脱を試みて Discard changes を選択し、移動先で保存完了を待つ。

Then:

- 確認には離脱後も作成が続くことと完了時の挙動が表示される。
- Discard changes で要求した Deck 一覧へ移動し、保存成功後は所属 Deck の Card 一覧へ移動する。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ表示され、reload 後も利用できる。
- 保存成功後に別画面へ移動した場合は、その後のクラウド同期完了によって再び遷移しない。対象 Deck を開き直すと保存した Card が表示される。
- browser error が発生しない。

<a id="card-management-14"></a>

### CARD-MANAGEMENT-14 Card 作成失敗後も離脱確認と入力を保持して再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck の Card 作成画面で両面を入力し、保存を開始している。まだ保存は完了していない。
- 今回の保存は失敗し、その後の再試行は成功できる。

When:

- 保存処理中に Header で離脱を試み、確認を未回答のまま保存失敗を待つ。Keep editing を選択して再試行する。

Then:

- 失敗通知が表示されても離脱確認は残り、成功時の画面遷移は行われない。
- Keep editing で両面の入力を保持し、再試行の成功後は所属 Deck の Card 一覧へ移動する。
- 成功通知が表示され、対象 Deck に入力した Card が1件だけ表示され、reload 後も利用できる。
- すでに保存成功として移動した後にクラウドから拒否された場合は、移動先で同期エラーが通知される。拒否された Card は一覧に残らず、以前の入力画面や離脱確認へ勝手に戻らない。
- browser error が発生しない。

<a id="card-management-15"></a>

### CARD-MANAGEMENT-15 作成中の未保存の解答をプレビューできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Deck にプレビューに使うタグを登録し、Card 作成画面を開いている。Front は未入力である。

When:

- Back に未保存の本文を入力し、プレビューをキーボードで開閉する。
- math タグを選択し、強調、表、数式を含む本文をプレビューする。
- 拡大入力でも本文を変更してプレビューを確認し、通常入力へ戻る。

Then:

- 最新の下書きが Deck category と最初の対応タグに従って表示される。
- plain text は改行を保持し、math は Markdown の強調・表と数式を表示する。
- Front の入力エラーや保存処理が始まらず、本文とタグを維持して入力へ戻れる。
- プレビューを開閉した後も、開く前の入力操作を Undo できる。
- 狭い画面でもプレビュー操作と入力欄を利用できる。
- プレビューだけでは Card を作成せず、Deck の内容・学習結果・学習の現在位置・URL は変わらない。
- browser error が発生しない。

<a id="card-management-16"></a>

### CARD-MANAGEMENT-16 編集中の未保存の解答と表示形式をプレビューできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Card の編集画面を開き、プレビューに使うタグを Deck に登録している。

When:

- 保存済みと異なる Back を入力し、タグを変更してプレビューを開閉する。
- コードの言語を切り替え、拡大入力で下書きを更新して通常入力へ戻る。

Then:

- 最新の下書き、タグの優先順、Deck category、現在のテーマが表示に反映される。
- 対応言語は構文ハイライトで表示され、markdown / md を math として表示しない。
- プレビューだけで入力エラーや未保存の本文・タグが変わらず、保存済みの扱いにならない。
- 通常・拡大入力のどちらでも、プレビューを閉じてキーボードで編集を続けられ、入力内容や Undo できる履歴を失わない。
- 未保存変更の離脱確認は維持される。
- プレビューだけでは Card や Deck の保存済み内容・学習結果・学習の現在位置・URL は変わらない。
- browser error が発生しない。
