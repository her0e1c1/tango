# Card Management E2E テスト仕様書

## 目的

Card の作成・編集・削除、未保存入力の扱い、失敗後の再試行を確認する。保存拒否が確定した作成の再試行では重複を防ぐ。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-MANAGEMENT-03 | read | 正常系 | [Card の削除を取り消せる](#card-management-03) |
| CARD-MANAGEMENT-09 | read | 正常系 | [未保存の Card 編集内容を離脱前に確認できる](#card-management-09) |
| CARD-MANAGEMENT-11 | read | 正常系 | [未保存の Card 作成内容の離脱を確認できる](#card-management-11) |
| CARD-MANAGEMENT-15 | read | 正常系 | [作成中の未保存の解答をプレビューできる](#card-management-15) |
| CARD-MANAGEMENT-16 | read | 正常系 | [編集中の未保存の解答と表示形式をプレビューできる](#card-management-16) |
| CARD-MANAGEMENT-17 | read | 正常系 | [Card のタブと拡大画面を切り替えても下書きを維持する](#card-management-17) |
| CARD-MANAGEMENT-21 | read | 正常系 | [別のブラウザーから変更が届いても編集中の Card の入力を維持する](#card-management-21) |
| CARD-MANAGEMENT-23 | read | 正常系 | [通知の表示が変化しても Card の離脱確認を操作できる](#card-management-23) |
| CARD-MANAGEMENT-24 | read | 正常系 | [未変更の Card 作成画面は確認なしで取り消せる](#card-management-24) |
| CARD-MANAGEMENT-05 | write | 正常系 | [ログイン中の Deck に Card を作成できる](#card-management-05) |
| CARD-MANAGEMENT-06 | write | 正常系 | [匿名で利用中の Deck に Card を作成できる](#card-management-06) |
| CARD-MANAGEMENT-12 | write | 正常系 | [Card 作成成功が未回答の離脱確認より優先される](#card-management-12) |
| CARD-MANAGEMENT-13 | write | 正常系 | [Card 作成中に離脱しても保存処理を維持する](#card-management-13) |
| CARD-MANAGEMENT-22 | write | 正常系 | [Card 作成で所属 Deck のタグを選択し新規タグを追加できる](#card-management-22) |
| CARD-MANAGEMENT-01 | write | 正常系 | [Card 編集内容を保存して再読み込み後も確認できる](#card-management-01) |
| CARD-MANAGEMENT-18 | write | 正常系 | [Card のタグ候補を選んで下書きへ反映できる](#card-management-18) |
| CARD-MANAGEMENT-19 | write | 正常系 | [Card の編集保存中は重ねて操作できない](#card-management-19) |
| CARD-MANAGEMENT-20 | write | 正常系 | [Card 編集画面の離脱後に保存が完了しても現在の画面を維持する](#card-management-20) |
| CARD-MANAGEMENT-02 | write | 正常系 | [Card を削除できる](#card-management-02) |
| CARD-MANAGEMENT-10 | read | 異常系 | [Card の未表示の面にある入力エラーを修正できる](#card-management-10) |
| CARD-MANAGEMENT-07 | write | 異常系 | [Card の作成拒否後に重複なく再試行できる](#card-management-07) |
| CARD-MANAGEMENT-14 | write | 異常系 | [Card 作成失敗後も離脱確認と入力を保持して再試行できる](#card-management-14) |
| CARD-MANAGEMENT-25 | write | 異常系 | [Card 作成画面の離脱後に保存を拒否されても戻らない](#card-management-25) |
| CARD-MANAGEMENT-04 | write | 異常系 | [Card の編集失敗後に再試行できる](#card-management-04) |
| CARD-MANAGEMENT-08 | write | 異常系 | [Card の削除失敗後に再試行できる](#card-management-08) |

<a id="card-management-03"></a>

### CARD-MANAGEMENT-03 Card の削除を取り消せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の操作メニューボタンから削除ダイアログを開いている。
- 対象 Card と削除を取り消せない旨が表示されている。

When:

- Cancel を選択する。

Then:

- ダイアログが閉じ、対象 Card の操作メニューボタンにフォーカスが戻る。
- 対象 Card の内容と学習状態を維持する。

<a id="card-management-09"></a>

### CARD-MANAGEMENT-09 未保存の Card 編集内容を離脱前に確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の編集画面で、表面の本文を変更し、未保存である。

When:

- Header から Deck 一覧への離脱を試み、Keep editing で取り消す。再度離脱を試みて Discard changes を選ぶ。
- 確認ダイアログで Tab / Shift+Tab を使い、Escape での取消も確認する。

Then:

- Keep editing と Escape は入力を保って編集を続ける。Escape ではダイアログを閉じ、離脱を試みた操作にフォーカスを戻す。
- Tab / Shift+Tab のフォーカスはダイアログ内を循環する。
- Discard changes では Deck 一覧へ1回だけ移動し、Card を開き直すと変更前の表面の本文を表示する。

<a id="card-management-11"></a>

### CARD-MANAGEMENT-11 未保存の Card 作成内容の離脱を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面で、表面の本文を変更し、未保存である。

When:

- Cancel の確認で Keep editing を選び、再度 Cancel して Discard changes を選ぶ。

Then:

- 未保存変更の確認を表示し、Keep editing では入力を保つ。
- Discard changes では所属 Deck の Card 一覧へ移動し、Card は作成しない。

<a id="card-management-15"></a>

### CARD-MANAGEMENT-15 作成中の未保存の解答をプレビューできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Deck の Card 作成画面を開いている。Front は未入力である。

When:

- Back に未保存の本文を入力し、プレビューをキーボードで開閉する。
- math タグを入力または選択し、強調、表、数式を含む本文をプレビューする。
- 拡大入力でも本文を変更してプレビューを確認し、通常入力へ戻る。

Then:

- 最新の下書きが Deck のカテゴリと最初の対応タグに従って表示される。
- プレーンテキストは改行を保持し、math は Markdown の強調・表と数式を表示する。
- Front の入力エラーや保存処理が始まらず、本文とタグを維持して入力へ戻れる。
- プレビューを開閉した後も、開く前の入力操作を Undo できる。
- 狭い画面でもプレビュー操作と入力欄を利用できる。
- プレビューだけでは Card を作成せず、Deck の内容・学習結果・学習の現在位置・URL は変わらない。

<a id="card-management-16"></a>

### CARD-MANAGEMENT-16 編集中の未保存の解答と表示形式をプレビューできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名で利用中の Card の編集画面を開き、プレビューに使うタグをフォームで入力できる。

When:

- 保存済みと異なる Back を入力し、タグを変更してプレビューを開閉する。
- コードの言語を切り替え、拡大入力で下書きを更新して通常入力へ戻る。

Then:

- 最新の下書き、タグの優先順、Deck のカテゴリ、現在のテーマが表示に反映される。
- 対応言語は構文ハイライトで表示され、markdown / md を math として表示しない。
- プレビューだけで入力エラーや未保存の本文・タグが変わらず、保存済みの扱いにならない。
- 通常・拡大入力のどちらでも、プレビューを閉じてキーボードで編集を続けられ、入力内容や Undo できる履歴を失わない。
- 未保存変更の離脱確認は維持される。
- プレビューだけでは Card や Deck の保存済み内容・学習結果・学習の現在位置・URL は変わらない。

<a id="card-management-17"></a>

### CARD-MANAGEMENT-17 Card のタブと拡大画面を切り替えても下書きを維持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の編集画面を開いている。

When:

- Front / Back タブを切り替えて両面の本文を編集し、裏面の本文を拡大画面でも変更して閉じる。

Then:

- タブと拡大画面を切り替えても両面の入力内容が維持され、拡大画面を閉じると起点へフォーカスが戻る。

<a id="card-management-21"></a>

### CARD-MANAGEMENT-21 [TODO] 別のブラウザーから変更が届いても編集中の Card の入力を維持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の編集画面で、まだ保存していない本文を入力している。

When:

- 別のブラウザーから同じ Card の変更が届く。

Then:

- 編集中の入力を勝手に置き換えない。

<a id="card-management-23"></a>

### CARD-MANAGEMENT-23 [TODO] 通知の表示が変化しても Card の離脱確認を操作できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の表面の本文を編集し、未保存である。通知が表示されている。

When:

- Header から Deck 一覧への離脱を試み、確認ダイアログの表示中に通知が消えるか置き換わる。

Then:

- 通知が重なってもダイアログを操作でき、通知が消えても置き換わっても Keep editing のフォーカスを保つ。

<a id="card-management-24"></a>

### CARD-MANAGEMENT-24 未変更の Card 作成画面は確認なしで取り消せる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面を開き、まだ入力を変更していない。

When:

- Cancel を選択する。

Then:

- 未変更の場合は確認なしで所属 Deck の Card 一覧へ戻る。

<a id="card-management-05"></a>

### CARD-MANAGEMENT-05 ログイン中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントでログインし、所有する Deck に選択用のタグを持つ Card がある。モバイル幅を使用する。

When:

- Card 一覧の Actions → Add card を開き、Front / Back の拡大編集で本文を入力する。
- タグを追加または選択し、作成ボタンを連続クリックして、作成後に再読み込みする。

Then:

- 作成成功を通知する。
- 両面の拡大編集は画面の上端から下端まで表示し、見出し・完了ボタンが欠けない。背景は画面全体を覆い、タグ選択画面も下端に隙間なく接する。
- 再読み込み・同期後も、同じアカウントの同じ Deck に1件だけ表示し、選択タグを保持する。別 Deck への追加や複製は起こらない。
- 入力検証中・保存中は作成ボタンが無効になり、完了まで追加の作成を受け付けない。

<a id="card-management-06"></a>

### CARD-MANAGEMENT-06 匿名で利用中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck が存在する。
- viewport は 360 x 640 である。

When:

- Card 一覧の Actions の Add card から約1,748文字の通常の段落の表面の本文と有効な裏面の本文を入力して Card を作成する。
- 成功通知の Dismiss にポインターで到達できることを確認し、Tab でフォーカスを移して Enter で閉じ、画面を再読み込みする。

Then:

- Card の作成成功が通知され、翻訳された成功メッセージと Card 本文の冒頭を含む最大3行のプレビューが viewport 内に収まる。
- Dismiss の描画範囲とキーボードのフォーカス表示が viewport 内に収まり、操作できる。閉じた後はページにフォーカスが復元される。
- アクセシブルな通知は Card の文脈を維持する。
- 作成した Card が再読み込み後も同じ Deck の Card 一覧に表示され、表面の本文の全文と裏面の本文が切り詰められずに保存される。
- 作成した Card はこのブラウザーだけで一つ利用でき、クラウドには追加されない。

<a id="card-management-12"></a>

### CARD-MANAGEMENT-12 Card 作成成功が未回答の離脱確認より優先される

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面で、両面を入力して保存中である。

When:

- Header の離脱確認で Keep editing を選ぶ。再び離脱を試み、確認を未回答のまま保存完了を待つ。

Then:

- 確認には離脱後も作成が続くことと、画面に留まると成功時に一覧へ移動し、失敗時に通知することを表示する。
- Keep editing では入力と保存を維持して作成画面に留まる。
- サーバー保存成功後に確認を閉じ、所属 Deck の Card 一覧へ移動する。応答待ち中や以前 Header で選んだ画面へは移動しない。
- 成功を通知し、入力した Card を1件だけ表示する。再読み込み後も利用できる。

<a id="card-management-13"></a>

### CARD-MANAGEMENT-13 Card 作成中に離脱しても保存処理を維持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面で、両面を入力して保存中である。

When:

- Header の離脱確認で Discard changes を選び、移動先で保存完了を待つ。

Then:

- 確認には離脱後も作成が続くことと完了時の挙動を表示する。
- 要求した Deck 一覧へ移動し、保存成功後も留まる。離脱した作成画面から成功通知や自動遷移は行わない。
- Deck を開き直すと入力した Card が1件だけあり、再読み込み後も利用できる。
- 保存成功後に別画面へ移動しても、その後の同期完了で再び遷移しない。Deck を開き直すと保存した Card を表示する。

<a id="card-management-22"></a>

### CARD-MANAGEMENT-22 Card 作成で所属 Deck のタグを選択し新規タグを追加できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントでログインし、所有する Deck の Card 作成画面で両面を入力している。
- 所属 Deck の Card にタグがある場合と、どの Card にもタグがない場合を対象とする。

When:

- タグ選択画面で既存候補を選択するか新しいタグを入力し、Card を作成する。タグ候補がない場合はタグなしでも作成する。

Then:

- タグ候補は所属 Deck の Card から集約したタグであり、固定カテゴリや別 Deck のタグは追加されない。Card のタグがなければ候補は空で、タグを新規入力するかタグなしで作成できる。
- 新規入力したタグ名の前後空白を除き、内部の空白は保持する。選択した既存候補の値は保持し、新規タグを末尾へ追加する。

<a id="card-management-01"></a>

### CARD-MANAGEMENT-01 Card 編集内容を保存して再読み込み後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に編集対象の Card があり、同じ Deck の Card が選択用のタグを持つ。

When:

- 両面の本文とタグを変更して保存し、再読み込み後に編集画面を開く。

Then:

- 保存成功時だけ所属 Deck の Card 一覧へ戻り、更新成功を通知する。
- 再表示した編集画面に変更後の本文とタグを表示する。
- 元の Card を更新し、所属 Deck・学習結果・未変更の独自タグは保つ。

<a id="card-management-18"></a>

### CARD-MANAGEMENT-18 Card のタグ候補を選んで下書きへ反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card を編集しており、所属 Deck のタグ候補と編集中の独自タグがある。他の Card にタグがない場合も確認する。

When:

- 1行のタグ要約から選択画面を開き、タグを追加・改名・解除する。
- 選択画面を開き直し、Card 全体を保存する。

Then:

- タグ変更は確認なしで下書きに反映し、Card 全体の保存時に保存する。開き直しても選択を保つ。
- 全候補は選択画面だけに表示し、閉じた状態では最大2個と残り件数を1行で示す。
- 候補は所属 Deck の Card と編集中のタグから集約し、固定カテゴリや別 Deck のタグは含めない。
- 他の Card にタグがなくても、既存の独自タグを保持・解除・再選択できる。

<a id="card-management-19"></a>

### CARD-MANAGEMENT-19 [TODO] Card の編集保存中は重ねて操作できない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の編集画面で本文を変更している。

When:

- 保存を開始し、検証中・保存中に続けて送信や入力・保存・Cancel・戻るを試みる。

Then:

- 検証中・保存中の連続送信で変更が重複せず、入力・保存・Cancel・戻るは完了まで無効になる。

<a id="card-management-20"></a>

### CARD-MANAGEMENT-20 [TODO] Card 編集画面の離脱後に保存が完了しても現在の画面を維持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の変更を保存中で、まだ完了していない。
- 別画面または別 Card へ移動している。

When:

- 以前の Card の保存が成功する。

Then:

- 保存結果は画面を離れた後の完了でも通知され、既定の時間で消える。
- 以前の保存完了によって現在の画面から遷移しない。

<a id="card-management-02"></a>

### CARD-MANAGEMENT-02 Card を削除できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- ログイン中のアカウントが所有する Deck には、削除対象の Card が1件だけある。

When:

- 一覧で削除を確定し、再読み込みする。

Then:

- 削除成功を通知し、一覧の Card 件数は0になる。再読み込み後も削除した Card を閲覧・学習できない。

<a id="card-management-10"></a>

### CARD-MANAGEMENT-10 Card の未表示の面にある入力エラーを修正できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Card の編集画面を開いている。

When:

- 表面の本文と裏面の本文を空にし、Back タブを表示した状態で保存を試みる。
- Back タブに切り替えて拡大編集画面を開き、入力エラーを確認して閉じる。

Then:

- 最初の入力エラーがある Front タブが選択され、対象の入力欄へフォーカスが移る。
- 両面のタブにエラーが示され、Back タブを選ぶと裏面の本文の入力エラーも確認できる。
- 拡大編集画面でも入力エラーが表示され、入力欄の読み上げ説明として確認できる。
- 未入力の値は維持され、Card は保存されず元の内容が変更されない。

<a id="card-management-07"></a>

### CARD-MANAGEMENT-07 Card の作成拒否後に重複なく再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントでログインし、所有する Deck の Card 作成が拒否され、クラウドに未保存と確定している。次の作成は成功する。
- ブラウザー内の保存失敗では入力が残る。ローカル反映後の拒否では、一時表示した Card が一覧から消えている。
- 保存結果が不明な通信失敗は対象外とし、その状態からの再試行の重複防止は保証しない。

When:

- 必要なら作成画面を開き直して同じ内容を入力し、再試行後に Card 一覧を再読み込みする。

Then:

- 作成成功を通知し、失敗通知は残らない。
- 同じアカウントの同じ Deck に、最初に入力した両面の本文を持つ Card が1件だけある。再読み込み・同期後も複製は増えない。

<a id="card-management-14"></a>

### CARD-MANAGEMENT-14 Card 作成失敗後も離脱確認と入力を保持して再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面で、両面を入力して保存中である。今回は失敗し、再試行は成功する。

When:

- Header の離脱確認を未回答のまま保存失敗を待ち、Keep editing を選んで再試行する。

Then:

- ブラウザー内の保存失敗では離脱確認が残り、成功時の遷移は行わない。
- Keep editing で両面の入力を保つ。再試行に成功すると所属 Deck の一覧へ移動し、成功を通知する。
- 入力した Card は1件だけで、再読み込み後も利用できる。
- サーバーに拒否された場合は失敗通知を表示し、成功時の遷移は行わず、拒否された Card は一覧に残らない。

<a id="card-management-25"></a>

### CARD-MANAGEMENT-25 [TODO] Card 作成画面の離脱後に保存を拒否されても戻らない

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck の Card 作成画面で、両面を入力して保存を始めている。
- 保存中の離脱確認で Discard changes を選び、別画面へ移動済みである。

When:

- サーバーが保存を拒否する。

Then:

- 失敗通知を表示し、成功時の遷移は行わない。
- 拒否された Card は一覧に残らず、離脱済みの入力画面や確認へ戻らない。

<a id="card-management-04"></a>

### CARD-MANAGEMENT-04 Card の編集失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に編集対象の Card がある。
- 初回の編集保存に失敗している。ブラウザー内の失敗では入力が残り、ローカル反映後の拒否では保存済みの内容に戻っている。次の編集は成功する。

When:

- 必要なら編集画面を開き直して同じ変更を入力し、再試行後に一覧を再読み込みする。

Then:

- 更新成功を通知して一覧へ戻り、再読み込み後も変更内容を表示する。

<a id="card-management-08"></a>

### CARD-MANAGEMENT-08 Card の削除失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- ログイン中のアカウントが所有する Card の初回削除がクラウドに拒否されている。
- Card は再び利用でき、削除ダイアログは閉じている。次の削除は成功する。

When:

- 削除ダイアログを開き直して再試行し、一覧を再読み込みする。

Then:

- ダイアログが閉じ、一覧から対象 Card が消える。再読み込み後も閲覧・学習できない。
