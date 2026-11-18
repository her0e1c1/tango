# Card 編集画面 Playwright 結合テスト仕様書

## 目的

Card 編集画面を入口とした Playwright テストで、既存 Card の両面・タグ・プレビューの編集と、保存中・失敗後の操作を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-CARD-FORM-01 | interaction | 正常系 | [タブを切り替えても表面の入力を保持する](#playwright-card-form-01) |
| PLAYWRIGHT-CARD-FORM-02 | interaction | 正常系 | [編集する Card のタグを選ぶ](#playwright-card-form-02) |
| PLAYWRIGHT-CARD-FORM-03 | interaction | 異常系 | [日本語の入力エラーを関連付ける](#playwright-card-form-03) |
| PLAYWRIGHT-CARD-FORM-04 | interaction | 正常系 | [解答プレビューを開く](#playwright-card-form-04) |
| PLAYWRIGHT-CARD-FORM-06 | interaction | 正常系 | [拡大編集後も両面の下書きを保つ](#playwright-card-form-06) |
| PLAYWRIGHT-CARD-FORM-07 | interaction | 正常系 | [独自タグの選択と要約を保って保存する](#playwright-card-form-07) |
| PLAYWRIGHT-CARD-FORM-08 | interaction | 正常系 | [キーボードで編集面を切り替える](#playwright-card-form-08) |
| PLAYWRIGHT-CARD-FORM-09 | interaction | 異常系 | [裏面エラーのある入力欄を開く](#playwright-card-form-09) |
| PLAYWRIGHT-CARD-FORM-10 | interaction | 異常系 | [未知のエラーを安全な翻訳文で表示する](#playwright-card-form-10) |
| PLAYWRIGHT-CARD-FORM-11 | interaction | 異常系 | [言語変更後も下書きとタグを保つ](#playwright-card-form-11) |
| PLAYWRIGHT-CARD-FORM-12 | interaction | 正常系 | [不完全な下書きを保存せずプレビューする](#playwright-card-form-12) |
| PLAYWRIGHT-CARD-FORM-13 | interaction | 異常系 | [拡大編集の変更を数式プレビューへ反映する](#playwright-card-form-13) |
| PLAYWRIGHT-CARD-FORM-14 | interaction | 正常系 | [表示条件に応じてコードを表示する](#playwright-card-form-14) |
| PLAYWRIGHT-CARD-FORM-15 | interaction | 正常系 | [タグ変更をプレビューへ反映する](#playwright-card-form-15) |
| PLAYWRIGHT-CARD-FORM-16 | interaction | 正常系 | [言語が変わってもプレビューを開いておく](#playwright-card-form-16) |
| PLAYWRIGHT-CARD-FORM-20 | interaction | 正常系 | [保存中は編集と離脱を無効にする](#playwright-card-form-20) |
| PLAYWRIGHT-CARD-FORM-21 | interaction | 正常系 | [外部更新で編集中の下書きを上書きしない](#playwright-card-form-21) |
| PLAYWRIGHT-CARD-FORM-22 | interaction | 異常系 | [両面が不正なら表面から修正する](#playwright-card-form-22) |
| PLAYWRIGHT-CARD-FORM-23 | interaction | 異常系 | [保存失敗後に同じ下書きを再送信する](#playwright-card-form-23) |
| PLAYWRIGHT-CARD-FORM-24 | interaction | 正常系 | [確認なしのタグ編集を下書きへ即時反映する](#playwright-card-form-24) |
| PLAYWRIGHT-CARD-FORM-25 | interaction | 異常系 | [空白や重複したタグ名で保存しない](#playwright-card-form-25) |
| PLAYWRIGHT-CARD-EDIT-01 | interaction | 正常系 | [長い解答プレビューへキーボードで移動する](#playwright-card-edit-01) |
| PLAYWRIGHT-CARD-EDIT-02 | interaction | 正常系 | [プレビューを閉じた拡大編集内でフォーカスを循環させる](#playwright-card-edit-02) |
| PLAYWRIGHT-CARD-EDIT-03 | interaction | 正常系 | [未保存の Card 編集内容を離脱前に確認できる](#playwright-card-edit-03) |
| PLAYWRIGHT-CARD-EDIT-04 | interaction | 正常系 | [編集中の未保存の解答と表示形式をプレビューできる](#playwright-card-edit-04) |
| PLAYWRIGHT-CARD-EDIT-05 | interaction | 正常系 | [Card のタグ候補を選んで下書きへ反映できる](#playwright-card-edit-05) |
| PLAYWRIGHT-CARD-EDIT-06 | interaction | 正常系 | [タグ入力中の Enter は Card を送信せず下書きを保つ](#playwright-card-edit-06) |
| PLAYWRIGHT-CARD-EDIT-07 | interaction | 正常系 | [入力直後の候補クリックで対象タグだけを解除する](#playwright-card-edit-07) |
| PLAYWRIGHT-CARD-EDIT-08 | interaction | 正常系 | [タグ名の前後空白だけを除いて選択順に保存する](#playwright-card-edit-08) |
| PLAYWRIGHT-CARD-EDIT-09 | interaction | 正常系 | [編集成功の応答後に対象 Card の内容を確認する](#playwright-card-edit-09) |
| PLAYWRIGHT-CARD-EDIT-10 | interaction | 正常系 | [Card 編集画面の離脱後に保存が完了しても現在の画面を維持する](#playwright-card-edit-10) |
| PLAYWRIGHT-CARD-EDIT-11 | interaction | 正常系 | [ログアウトを中止して元のアカウントへ戻っても Card の保存成功を通知する](#playwright-card-edit-11) |
| PLAYWRIGHT-CARD-EDIT-12 | interaction | 正常系 | [保存待ち中に所属 Deck を削除した Card の古い成功を通知しない](#playwright-card-edit-12) |
| PLAYWRIGHT-CARD-EDIT-13 | interaction | 異常系 | [認証確認中の Card 保存失敗を元のアカウントへの復帰後に通知する](#playwright-card-edit-13) |
| PLAYWRIGHT-CARD-EDIT-14 | interaction | 正常系 | [通知の表示が変化しても Card の離脱確認を操作できる](#playwright-card-edit-14) |
| PLAYWRIGHT-CARD-EDIT-15 | interaction | 正常系 | [Card の編集保存中は重ねて操作できない](#playwright-card-edit-15) |
| PLAYWRIGHT-CARD-EDIT-16 | interaction | 異常系 | [Card の未表示の面にある入力エラーを修正できる](#playwright-card-edit-16) |
| PLAYWRIGHT-CARD-EDIT-17 | interaction | 正常系 | [未保存のタグ変更を破棄する](#playwright-card-edit-17) |
| PLAYWRIGHT-CARD-EDIT-18 | interaction | 異常系 | [System の言語変更後も検証エラーと未保存の入力を保つ](#playwright-card-edit-18) |
| PLAYWRIGHT-CARD-EDIT-19 | interaction | 異常系 | [読めない Card の編集リンクから警告を維持して戻る](#playwright-card-edit-19) |

<a id="playwright-card-form-01"></a>

### PLAYWRIGHT-CARD-FORM-01 タブを切り替えても表面の入力を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で既存の両面を表示している。

When:

- 表面を Updated prompt に変え、Back、Front の順にタブを切り替える。

Then:

- 表面の値は Updated prompt のままである。

<a id="playwright-card-form-02"></a>

### PLAYWRIGHT-CARD-FORM-02 編集する Card のタグを選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で raw タグを選択していない。

When:

- タグ編集を開き raw を選ぶ。

Then:

- raw が選択済みになり、Card のタグの要約へ反映される。

<a id="playwright-card-form-03"></a>

### PLAYWRIGHT-CARD-FORM-03 日本語の入力エラーを関連付ける

カテゴリ: `interaction`

区分: 異常系

Given:

- 日本語の Card 編集画面で表面を空にしている。

When:

- 保存する。

Then:

- 表面の必須エラーが表示され、入力の説明に「表面のテキストは必須です。」が関連付けられる。文書の言語も ja になる。

<a id="playwright-card-form-04"></a>

### PLAYWRIGHT-CARD-FORM-04 解答プレビューを開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で裏面に太字と数式を入力している。通常幅とモバイル幅を独立した表示例とする。

When:

- Back タブの解答プレビューを開く。

Then:

- 解答プレビュー領域が表示され、入力した太字と数式を確認できる。

<a id="playwright-card-form-06"></a>

### PLAYWRIGHT-CARD-FORM-06 拡大編集後も両面の下書きを保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で表面 Front と裏面 Back を表示している。

When:

- 表面を Updated front にし、裏面を拡大して Updated back に変更し、Escape で閉じる。

Then:

- 裏面の拡大ボタンにフォーカスが戻り、通常入力に Updated back、表面に Updated front が残る。

<a id="playwright-card-form-07"></a>

### PLAYWRIGHT-CARD-FORM-07 独自タグの選択と要約を保って保存する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で両面を入力し、language と custom を選択している。保存先は成功を返す。

When:

- custom を解除・再選択し、math を追加してタグ編集を開き直し、その後保存する。

Then:

- 開き直しても選択が残り、Escape で閉じるとタグ編集の操作にフォーカスを戻す。要約では language、custom と残り1件を表示し、読み上げ説明で3タグを確認できる。
- 保存境界には両面と選択順のタグが渡り、保存後も対象 Card に3タグが表示される。

<a id="playwright-card-form-08"></a>

### PLAYWRIGHT-CARD-FORM-08 キーボードで編集面を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の Front タブにフォーカスしている。

When:

- ArrowRight、Home、End、ArrowLeft を順に押す。

Then:

- Back、Front、Back、Front の順に選択とフォーカスが移り、対応する入力欄が表示される。

<a id="playwright-card-form-09"></a>

### PLAYWRIGHT-CARD-FORM-09 裏面エラーのある入力欄を開く

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面は有効、裏面は空で、Front タブを表示している。

When:

- 保存し、エラーのある裏面を拡大する。

Then:

- Back タブが開いて裏面へフォーカスが移り、通常・拡大入力に必須エラーが関連付けられる。表面は失われない。

<a id="playwright-card-form-10"></a>

### PLAYWRIGHT-CARD-FORM-10 未知のエラーを安全な翻訳文で表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 実際の Card 編集 model・action・編集部品を結合し、React Hook Form の公開 API で未知の入力エラーを準備する。英語で拡大編集を開いている。

When:

- 表示言語を日本語へ変更する。

Then:

- 一般的な日本語のエラーが通常・拡大入力に表示され、内部エラー文は露出せず、値と拡大編集は保持される。

<a id="playwright-card-form-11"></a>

### PLAYWRIGHT-CARD-FORM-11 言語変更後も下書きとタグを保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面は必須エラー、裏面は未保存の回答、タグは language と custom である。

When:

- 日本語へ変更し、表面に「修正した問題」を入力して保存する。

Then:

- 言語変更だけでは保存されず、修正時も裏面とタグが残る。保存に成功すると修正した内容を閲覧できる。

<a id="playwright-card-form-12"></a>

### PLAYWRIGHT-CARD-FORM-12 不完全な下書きを保存せずプレビューする

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の表面は空、裏面は改行を含む First と Second で、raw 表示を使っている。

When:

- 裏面のプレビューを開き、Enter で閉じる。

Then:

- 改行を含む下書きが表示され、閉じるとプレビューボタンにフォーカスが戻る。入力や既存のエラーは変わらない。

<a id="playwright-card-form-13"></a>

### PLAYWRIGHT-CARD-FORM-13 拡大編集の変更を数式プレビューへ反映する

カテゴリ: `interaction`

区分: 異常系

Given:

- math の Deck の Card 編集画面で表面にエラーがあり、裏面の拡大編集を開いている。

When:

- 太字・数式・表を入力してプレビューし、太字を Changed に変えて拡大編集を閉じる。

Then:

- 太字・数式・表と Changed がプレビューへ反映され、変更後の裏面と表面のエラーが残る。

<a id="playwright-card-form-14"></a>

### PLAYWRIGHT-CARD-FORM-14 表示条件に応じてコードを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の裏面は const answer = 42; である。Deck python・タグなし、Deck math・タグ custom/typescript/python、Deck math・タグ md を独立した入力例とする。typescript は初期テーマが light の場合と dark の場合を確認する。

When:

- 解答プレビューを開き、light と dark を切り替える。

Then:

- それぞれ python、typescript、md の表示が選ばれ、コードを数式にせず、開いたプレビューのテーマが切り替わる。

<a id="playwright-card-form-15"></a>

### PLAYWRIGHT-CARD-FORM-15 タグ変更をプレビューへ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で裏面のプレビューを開いている。

When:

- 表示形式を指定するタグを変更する。

Then:

- プレビューを開いたまま変更後の表示形式になり、裏面の入力文字列は保持される。

<a id="playwright-card-form-16"></a>

### PLAYWRIGHT-CARD-FORM-16 言語が変わってもプレビューを開いておく

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で英語の解答プレビューを開いている。通常幅とモバイル幅を独立した表示例とする。

When:

- 表示言語を日本語へ変更する。

Then:

- 領域名は「解答プレビュー」、操作名は「プレビューを閉じる」になり、プレビューは開いたままである。

<a id="playwright-card-form-20"></a>

### PLAYWRIGHT-CARD-FORM-20 保存中は編集と離脱を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で変更を入力し、保存先の応答を保留している。

When:

- 保存してから、保存先の応答を完了させる。

Then:

- 待機中は Saving…、表面入力、Cancel、Back to cards が無効になり、応答後は処理中の状態が解除される。

<a id="playwright-card-form-21"></a>

### PLAYWRIGHT-CARD-FORM-21 外部更新で編集中の下書きを上書きしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で Front text と Back text から編集を始め、表面を Unsaved front に変更している。

When:

- 対象 Card に別の表面・裏面の更新が届く。

Then:

- 編集中の Unsaved front と、編集開始時の Back text が保持される。

<a id="playwright-card-form-22"></a>

### PLAYWRIGHT-CARD-FORM-22 両面が不正なら表面から修正する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で両面を空にしている。

When:

- 保存を選び、その後 Back タブを開く。

Then:

- 最初は表面の必須エラーとフォーカスが表示され、Back タブでも裏面の必須エラーを確認できる。

<a id="playwright-card-form-23"></a>

### PLAYWRIGHT-CARD-FORM-23 保存失敗後に同じ下書きを再送信する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面を Retry front に変更し、保存先は失敗、成功の順に返す。

When:

- 保存し、失敗後にもう一度保存する。

Then:

- 失敗時は Unable to save changes. Try again. と下書きが残る。再試行の成功後は変更した Card を確認できる。

<a id="playwright-card-form-24"></a>

### PLAYWRIGHT-CARD-FORM-24 確認なしのタグ編集を下書きへ即時反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で本文と二つのタグを表示している。

When:

- タグ名の変更、別タグの解除、新しいタグの追加を行い、タグ編集を開き直す。

Then:

- 入力中にフォーカスを失わず、確認・OK 操作なしでタグと要約が更新され、開き直しても保持される。Card の保存前に成功通知は出ない。

<a id="playwright-card-form-25"></a>

### PLAYWRIGHT-CARD-FORM-25 空白や重複したタグ名で保存しない

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で本文と二つのタグを表示し、新しいタグ行を追加する場合と、最初の既存タグを変更する場合を独立した入力例とする。

When:

- 新規タグには空白だけの名前、custom、前後空白付きの custom を順に入力し、各状態でタグ編集を閉じて保存を試みる。修正後の有効な値は new と前後空白付きの new tag を独立した入力例とする。
- 既存の shared と kept の最初のタグを、空白だけ、kept、前後空白付きの kept に変更する。各例で拒否を確認した後に corrected へ修正して保存する。

Then:

- 空白とtrim後の重複には該当入力のエラーが表示され、有効な名前に直すと前後空白を除いて確認画面なしに保存できる。

<a id="playwright-card-edit-01"></a>

### PLAYWRIGHT-CARD-EDIT-01 長い解答プレビューへキーボードで移動する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で、プレビュー領域の高さを超える長い裏面の下書きを表示している。

When:

- 裏面の解答プレビューを開き、Tab を押す。

Then:

- 入力や保存操作へ飛ばされず、長文のプレビュー領域にフォーカスが移る。

<a id="playwright-card-edit-02"></a>

### PLAYWRIGHT-CARD-EDIT-02 プレビューを閉じた拡大編集内でフォーカスを循環させる

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面を幅1,280または横向きの幅812で表示し、裏面の拡大入力を開いている。解答プレビューは閉じている。

When:

- 解答プレビューの表示ボタンから Tab を押し、続けて Shift+Tab を押す。その後 Done で拡大編集を閉じる。

Then:

- Tab で拡大入力の完了ボタンへ移り、Shift+Tab でプレビューの表示ボタンへ戻る。非表示の領域やダイアログの外へフォーカスが移らない。
- Done で閉じると通常入力に戻り、Expand Back へフォーカスを戻す。

<a id="playwright-card-edit-03"></a>

### PLAYWRIGHT-CARD-EDIT-03 未保存の Card 編集内容を離脱前に確認できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の編集画面で、表面の本文を変更し、未保存である。

When:

- Header から Deck 一覧への離脱を試み、Keep editing で取り消す。再度離脱を試みて Discard changes を選ぶ。
- 確認ダイアログで Tab / Shift+Tab を使い、Escape での取消も確認する。

Then:

- Keep editing と Escape は入力を保って編集を続ける。Escape ではダイアログを閉じ、離脱を試みた操作にフォーカスを戻す。
- Tab / Shift+Tab のフォーカスはダイアログ内を循環する。
- Discard changes では Deck 一覧へ1回だけ移動し、Card を開き直すと変更前の表面の本文を表示する。

<a id="playwright-card-edit-04"></a>

### PLAYWRIGHT-CARD-EDIT-04 編集中の未保存の解答と表示形式をプレビューできる

カテゴリ: `interaction`

区分: 正常系

Given:

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

<a id="playwright-card-edit-05"></a>

### PLAYWRIGHT-CARD-EDIT-05 [TODO] Card のタグ候補を選んで下書きへ反映できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card を編集しており、所属 Deck のタグ候補と編集中の独自タグがある。他の Card にタグがない場合も確認する。
- 候補の所属を確認する例では、現在の Deck に chapter-1 があり、別 Deck にだけ python がある。作成した Card を実際の一覧から編集し直す場合も確認する。

When:

- 1行のタグ要約から選択画面を開き、タグを追加・改名・解除する。
- 選択画面を開き直し、Card 全体を保存する。

Then:

- タグ変更は確認なしで下書きに反映し、Card 全体の保存時に保存する。開き直しても選択を保つ。
- 全候補は選択画面だけに表示し、閉じた状態では最大2個と残り件数を1行で示す。
- 候補は所属 Deck の Card と編集中のタグから集約し、固定カテゴリや別 Deck のタグは含めない。
- 他の Card にタグがなくても、既存の独自タグを保持・解除・再選択できる。

<a id="playwright-card-edit-06"></a>

### PLAYWRIGHT-CARD-EDIT-06 タグ入力中の Enter は Card を送信せず下書きを保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card の両面の本文を編集し、タグ編集を開いている。

When:

- タグ名を入力中に Enter を押し、タグ編集を閉じて両面の本文を確認する。

Then:

- 入力中も Enter 後もタグ名のフォーカスと入力値を保つ。
- Card を送信せず、タグと両面の下書き・保存済み内容を維持する。

<a id="playwright-card-edit-07"></a>

### PLAYWRIGHT-CARD-EDIT-07 入力直後の候補クリックで対象タグだけを解除する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card のタグ編集を開き、既存名の重複行や新しいタグを追加できる。

When:

- 前後空白付きの既存名の重複行と新しいタグ名をそれぞれ入力し、入力欄を離れずに候補をクリックして解除する。

Then:

- 確認・OK 操作なしで入力を即時反映し、クリック1回で対象を解除する。前後空白の除去でクリックを失わない。
- 重複行の解除ではその行だけが消え、元のタグは残る。

<a id="playwright-card-edit-08"></a>

### PLAYWRIGHT-CARD-EDIT-08 タグ名の前後空白だけを除いて選択順に保存する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面のタグ編集を開き、既存名の変更と新規追加ができる。保存先は成功応答と変更結果を返す。

When:

- 前後空白付きのタグ名と、内部空白を含む新しいタグ名を入力する。入力欄を離れるかタグ編集を閉じて保存する。

Then:

- 入力欄を離れるかタグ編集を閉じると前後空白だけを除き、内部空白は保つ。
- 選択順を保ち、新しいタグを末尾に追加して保存する。

<a id="playwright-card-edit-09"></a>

### PLAYWRIGHT-CARD-EDIT-09 [TODO] 編集成功の応答後に対象 Card の内容を確認する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Card と同じ Deck の別 Card に本文・タグ・学習状態があり、編集対象には独自タグがある。
- 保存先は成功応答と対象 Card の変更結果を返す。

When:

- 対象 Card の両面と選択タグを変更して保存し、対象 Card を再び編集する。

Then:

- 成功応答時だけ所属 Deck の一覧へ戻り、更新成功を通知する。開き直すと変更後の本文とタグを確認できる。
- 対象の Card を更新し、所属 Deck、学習状態、未変更の独自タグと他の Card は維持する。

<a id="playwright-card-edit-10"></a>

### PLAYWRIGHT-CARD-EDIT-10 [TODO] Card 編集画面の離脱後に保存が完了しても現在の画面を維持する

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の変更を保存中で、まだ完了していない。
- 別画面または別 Card へ移動している。

When:

- 以前の Card の保存先が成功応答と変更結果を返す。

Then:

- 保存結果は画面を離れた後の完了でも通知され、既定の時間で消える。
- 以前の保存完了によって現在の画面から遷移しない。

<a id="playwright-card-edit-11"></a>

### PLAYWRIGHT-CARD-EDIT-11 [TODO] ログアウトを中止して元のアカウントへ戻っても Card の保存成功を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Card の編集保存の応答を保留し、Account 画面へ移動している。
- 認証処理は確認中から元のアカウントへの復帰を返し、ログアウト中止を通知する。保存成功は認証確認中または復帰後に届く。

When:

- ログアウトを試み、元のアカウントへ復帰し、保存成功の応答と変更結果を受け取る。

Then:

- 認証を確認している間は Card の保存成功を通知せず、元のアカウントでの利用に戻って保存成功を確認できたら一度だけ通知する。
- 保存完了とログアウト中止の順序が入れ替わっても、成功通知を失わず重複させない。ログアウト失敗は Account 内で表示し、ホームへ離脱後に届く場合は別の通知として、保存結果と両方確認できる。
- 以前の編集画面へ戻らず、現在の画面を維持する。

<a id="playwright-card-edit-12"></a>

### PLAYWRIGHT-CARD-EDIT-12 [TODO] 保存待ち中に所属 Deck を削除した Card の古い成功を通知しない

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card を編集して保存を始め、別画面へ移動している。
- Card の保存成功はまだ通知されていない。

When:

- 保存待ち中に所属 Deck が削除された結果を受け取る。その後、以前の保存先が成功を返す。

Then:

- 削除した Deck の Card については、古い編集保存の成功を後から通知せず、現在の画面から移動しない。
- 以前の保存結果を待ち続けず、別の Deck や Card の操作を妨げない。保存そのものを取り消したとは扱わない。
- 単に画面を移動した場合や一覧のフィルターで Card が見えなくなった場合はこの終了条件に含めず、保存成功を通知する。

<a id="playwright-card-edit-13"></a>

### PLAYWRIGHT-CARD-EDIT-13 [TODO] 認証確認中の Card 保存失敗を元のアカウントへの復帰後に通知する

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Card の編集保存の応答を保留している。
- 認証処理は確認中から元のアカウントへの復帰を返し、ログアウトを中止する。

When:

- 認証確認中に保存先が失敗を返し、元のアカウントへ復帰する。復帰前にもう一度認証確認が始まる場合も独立して確認する。

Then:

- 認証確認中は保存失敗を通知せず、元のアカウントへ復帰したら一度だけ通知する。保存成功として扱わず、現在の画面を維持する。
- ログアウト失敗と保存失敗の順序が入れ替わっても両方確認できる。Account に留まる場合はログアウト失敗を画面内に表示し、ホームへ離れた場合は通知する。
- 復帰前に所属 Deck が削除された場合、別アカウントへ切り替わった場合、同じ Card を新しく保存し直した場合は、古い保存失敗を通知しない。
- その後に元のアカウントや Deck へ戻っても、破棄した結果を再通知しない。

<a id="playwright-card-edit-14"></a>

### PLAYWRIGHT-CARD-EDIT-14 [TODO] 通知の表示が変化しても Card の離脱確認を操作できる

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の表面の本文を編集し、未保存である。通知が表示されている。

When:

- Header から Deck 一覧への離脱を試み、確認ダイアログの表示中に通知が消えるか置き換わる。

Then:

- 通知が重なってもダイアログを操作でき、通知が消えても置き換わっても Keep editing のフォーカスを保つ。

<a id="playwright-card-edit-15"></a>

### PLAYWRIGHT-CARD-EDIT-15 [TODO] Card の編集保存中は重ねて操作できない

カテゴリ: `interaction`

区分: 正常系

Given:

- ログイン中のアカウントが所有する Card の編集画面で本文を変更している。

When:

- 保存を開始し、検証中・保存中に続けて送信や入力・保存・Cancel・戻るを試みる。

Then:

- 検証中・保存中の連続送信で変更が重複せず、入力・保存・Cancel・戻るは完了まで無効になる。

<a id="playwright-card-edit-16"></a>

### PLAYWRIGHT-CARD-EDIT-16 Card の未表示の面にある入力エラーを修正できる

カテゴリ: `interaction`

区分: 異常系

Given:

- ログイン中のアカウントが所有する Card の編集画面を開いている。

When:

- 表面の本文と裏面の本文を空にし、Back タブを表示した状態で保存を試みる。
- Back タブに切り替えて拡大編集画面を開き、入力エラーを確認して閉じる。

Then:

- 最初の入力エラーがある Front タブが選択され、対象の入力欄へフォーカスが移る。
- 両面のタブにエラーが示され、Back タブを選ぶと裏面の本文の入力エラーも確認できる。
- 拡大編集画面でも入力エラーが表示され、入力欄の読み上げ説明として確認できる。
- 未入力の値は維持され、Card は保存されず元の内容が変更されない。

<a id="playwright-card-edit-17"></a>

### PLAYWRIGHT-CARD-EDIT-17 未保存のタグ変更を破棄する

カテゴリ: `interaction`

区分: 正常系

Given:

- 編集対象の Card にタグがある。

When:

- タグを追加・改名・解除した後、Card の未保存変更を破棄して再度編集画面を開く。

Then:

- 保存済みタグは操作前のままであり、下書きの変更は残らない。

<a id="playwright-card-edit-18"></a>

### PLAYWRIGHT-CARD-EDIT-18 System の言語変更後も検証エラーと未保存の入力を保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- Language は System、ブラウザーの言語は英語である。Card 編集画面に未保存の裏面とタグがあり、表面を空で送信した必須エラーが表示されている。詳細を説明できない検証エラーも独立した入力例とする。

When:

- 画面を開いたままブラウザーの言語変更イベントで日本語へ切り替える。

Then:

- 表示中のエラー、入力欄の読み上げ名、ページの言語が日本語へ更新される。詳細を説明できないエラーは現在の言語の汎用メッセージになる。
- 現在の画面・空の表面・裏面の入力・タグ・未保存の状態を保持する。言語変更だけでは保存を実行せず、学習の再開位置を変えない。

<a id="playwright-card-edit-19"></a>

### PLAYWRIGHT-CARD-EDIT-19 読めない Card の編集リンクから警告を維持して戻る

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck に正常な Card が1枚と読み込めない Card が1枚あり、認証と設定は利用できる。

When:

- 読み込めない Card の編集リンクを開き、復旧操作で Deck 一覧へ戻る。

Then:

- 対象 Card が利用できない旨、読み込めない件数、保存データを変更していない警告を表示する。
- 編集フォームを代わりの Card で表示せず、Deck 一覧へ戻っても警告を維持する。
