# Card 編集画面 Storybook 結合テスト仕様書

## 目的

Card 編集画面を入口とした `play` で、既存 Card の両面・タグ・プレビューの編集と、保存中・失敗後の操作を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-01 | interaction | 正常系 | [タブを切り替えても表面の入力を保持する](#storybook-card-form-01) |
| STORYBOOK-CARD-FORM-02 | interaction | 正常系 | [編集する Card のタグを選ぶ](#storybook-card-form-02) |
| STORYBOOK-CARD-FORM-03 | interaction | 異常系 | [日本語の入力エラーを関連付ける](#storybook-card-form-03) |
| STORYBOOK-CARD-FORM-04 | interaction | 正常系 | [解答プレビューを開く](#storybook-card-form-04) |
| STORYBOOK-CARD-FORM-06 | interaction | 正常系 | [拡大編集後も両面の下書きを保つ](#storybook-card-form-06) |
| STORYBOOK-CARD-FORM-07 | interaction | 正常系 | [独自タグの選択と要約を保って保存する](#storybook-card-form-07) |
| STORYBOOK-CARD-FORM-08 | interaction | 正常系 | [キーボードで編集面を切り替える](#storybook-card-form-08) |
| STORYBOOK-CARD-FORM-09 | interaction | 異常系 | [裏面エラーのある入力欄を開く](#storybook-card-form-09) |
| STORYBOOK-CARD-FORM-10 | interaction | 異常系 | [未知のエラーを安全な翻訳文で表示する](#storybook-card-form-10) |
| STORYBOOK-CARD-FORM-11 | interaction | 異常系 | [言語変更後も下書きとタグを保つ](#storybook-card-form-11) |
| STORYBOOK-CARD-FORM-12 | interaction | 正常系 | [不完全な下書きを保存せずプレビューする](#storybook-card-form-12) |
| STORYBOOK-CARD-FORM-13 | interaction | 異常系 | [拡大編集の変更を数式プレビューへ反映する](#storybook-card-form-13) |
| STORYBOOK-CARD-FORM-14 | interaction | 正常系 | [表示条件に応じてコードを表示する](#storybook-card-form-14) |
| STORYBOOK-CARD-FORM-15 | interaction | 正常系 | [タグ変更をプレビューへ反映する](#storybook-card-form-15) |
| STORYBOOK-CARD-FORM-16 | interaction | 正常系 | [言語が変わってもプレビューを開いておく](#storybook-card-form-16) |
| STORYBOOK-CARD-FORM-20 | interaction | 正常系 | [保存中は編集と離脱を無効にする](#storybook-card-form-20) |
| STORYBOOK-CARD-FORM-21 | interaction | 正常系 | [外部更新で編集中の下書きを上書きしない](#storybook-card-form-21) |
| STORYBOOK-CARD-FORM-22 | interaction | 異常系 | [両面が不正なら表面から修正する](#storybook-card-form-22) |
| STORYBOOK-CARD-FORM-23 | interaction | 異常系 | [保存失敗後に同じ下書きを再送信する](#storybook-card-form-23) |
| STORYBOOK-CARD-FORM-24 | interaction | 正常系 | [確認なしのタグ編集を下書きへ即時反映する](#storybook-card-form-24) |
| STORYBOOK-CARD-FORM-25 | interaction | 異常系 | [空白や重複したタグ名で保存しない](#storybook-card-form-25) |

<a id="storybook-card-form-01"></a>

### STORYBOOK-CARD-FORM-01 [TODO] タブを切り替えても表面の入力を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で既存の両面を表示している。

When:

- 表面を Updated prompt に変え、Back、Front の順にタブを切り替える。

Then:

- 表面の値は Updated prompt のままである。

<a id="storybook-card-form-02"></a>

### STORYBOOK-CARD-FORM-02 [TODO] 編集する Card のタグを選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で raw タグを選択していない。

When:

- タグ編集を開き raw を選ぶ。

Then:

- raw が選択済みになり、Card のタグの要約へ反映される。

<a id="storybook-card-form-03"></a>

### STORYBOOK-CARD-FORM-03 [TODO] 日本語の入力エラーを関連付ける

カテゴリ: `interaction`

区分: 異常系

Given:

- 日本語の Card 編集画面で表面を空にしている。

When:

- 保存する。

Then:

- 表面の必須エラーが表示され、入力の説明に「表面のテキストは必須です。」が関連付けられる。

<a id="storybook-card-form-04"></a>

### STORYBOOK-CARD-FORM-04 [TODO] 解答プレビューを開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で裏面に太字と数式を入力している。通常幅とモバイル幅を独立した表示例とする。

When:

- Back タブの解答プレビューを開く。

Then:

- 解答プレビュー領域が表示され、入力した太字と数式を確認できる。

<a id="storybook-card-form-06"></a>

### STORYBOOK-CARD-FORM-06 [TODO] 拡大編集後も両面の下書きを保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で表面 Front と裏面 Back を表示している。

When:

- 表面を Updated front にし、裏面を拡大して Updated back に変更し、Escape で閉じる。

Then:

- 裏面の拡大ボタンにフォーカスが戻り、通常入力に Updated back、表面に Updated front が残る。

<a id="storybook-card-form-07"></a>

### STORYBOOK-CARD-FORM-07 [TODO] 独自タグの選択と要約を保って保存する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で両面を入力し、language と custom を選択している。保存先は成功を返す。

When:

- custom を解除・再選択し、math を追加してタグ編集を開き直し、その後保存する。

Then:

- 開き直しても選択が残り、要約で language、custom、math を確認できる。保存後も対象 Card に3タグが表示される。

<a id="storybook-card-form-08"></a>

### STORYBOOK-CARD-FORM-08 [TODO] キーボードで編集面を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の Front タブにフォーカスしている。

When:

- ArrowRight、Home、End、ArrowLeft を順に押す。

Then:

- Back、Front、Back、Front の順に選択とフォーカスが移り、対応する入力欄が表示される。

<a id="storybook-card-form-09"></a>

### STORYBOOK-CARD-FORM-09 [TODO] 裏面エラーのある入力欄を開く

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面は有効、裏面は空で、Front タブを表示している。

When:

- 保存し、エラーのある裏面を拡大する。

Then:

- Back タブが開いて裏面へフォーカスが移り、通常・拡大入力に必須エラーが関連付けられる。表面は失われない。

<a id="storybook-card-form-10"></a>

### STORYBOOK-CARD-FORM-10 [TODO] 未知のエラーを安全な翻訳文で表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面の入力に未知のエラーがあり、英語で拡大編集を開いている。

When:

- 表示言語を日本語へ変更する。

Then:

- 一般的な日本語のエラーが通常・拡大入力に表示され、内部エラー文は露出せず、値と拡大編集は保持される。

<a id="storybook-card-form-11"></a>

### STORYBOOK-CARD-FORM-11 [TODO] 言語変更後も下書きとタグを保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面は必須エラー、裏面は未保存の回答、タグは language と custom である。

When:

- 日本語へ変更し、表面に「修正した問題」を入力して保存する。

Then:

- 言語変更だけでは保存されず、修正時も裏面とタグが残る。保存に成功すると修正した内容を閲覧できる。

<a id="storybook-card-form-12"></a>

### STORYBOOK-CARD-FORM-12 [TODO] 不完全な下書きを保存せずプレビューする

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の表面は空、裏面は改行を含む First と Second で、raw 表示を使っている。

When:

- 裏面のプレビューを開き、Enter で閉じる。

Then:

- 改行を含む下書きが表示され、閉じるとプレビューボタンにフォーカスが戻る。入力や既存のエラーは変わらない。

<a id="storybook-card-form-13"></a>

### STORYBOOK-CARD-FORM-13 [TODO] 拡大編集の変更を数式プレビューへ反映する

カテゴリ: `interaction`

区分: 異常系

Given:

- math の Deck の Card 編集画面で表面にエラーがあり、裏面の拡大編集を開いている。

When:

- 太字・数式・表を入力してプレビューし、太字を Changed に変えて拡大編集を閉じる。

Then:

- 太字・数式・表と Changed がプレビューへ反映され、変更後の裏面と表面のエラーが残る。

<a id="storybook-card-form-14"></a>

### STORYBOOK-CARD-FORM-14 [TODO] 表示条件に応じてコードを表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面の裏面は const answer = 42; である。Deck python・タグなし、Deck math・タグ custom/typescript/python、Deck math・タグ md を独立した入力例とする。

When:

- 解答プレビューを開き、light と dark を切り替える。

Then:

- それぞれ python、typescript、md の表示が選ばれ、コードを数式にせず、開いたプレビューのテーマが切り替わる。

<a id="storybook-card-form-15"></a>

### STORYBOOK-CARD-FORM-15 [TODO] タグ変更をプレビューへ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で裏面のプレビューを開いている。

When:

- 表示形式を指定するタグを変更する。

Then:

- プレビューを開いたまま変更後の表示形式になり、裏面の入力文字列は保持される。

<a id="storybook-card-form-16"></a>

### STORYBOOK-CARD-FORM-16 [TODO] 言語が変わってもプレビューを開いておく

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で英語の解答プレビューを開いている。

When:

- 表示言語を日本語へ変更する。

Then:

- 領域名は「解答プレビュー」、操作名は「プレビューを閉じる」になり、プレビューは開いたままである。

<a id="storybook-card-form-20"></a>

### STORYBOOK-CARD-FORM-20 [TODO] 保存中は編集と離脱を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で変更を入力し、保存先の応答を保留している。

When:

- 保存してから、保存先の応答を完了させる。

Then:

- 待機中は Saving…、表面入力、Cancel、Back to cards が無効になり、応答後は処理中の状態が解除される。

<a id="storybook-card-form-21"></a>

### STORYBOOK-CARD-FORM-21 [TODO] 外部更新で編集中の下書きを上書きしない

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で Front text と Back text から編集を始め、表面を Unsaved front に変更している。

When:

- 対象 Card に別の表面・裏面の更新が届く。

Then:

- 編集中の Unsaved front と、編集開始時の Back text が保持される。

<a id="storybook-card-form-22"></a>

### STORYBOOK-CARD-FORM-22 [TODO] 両面が不正なら表面から修正する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で両面を空にしている。

When:

- 保存を選び、その後 Back タブを開く。

Then:

- 最初は表面の必須エラーとフォーカスが表示され、Back タブでも裏面の必須エラーを確認できる。

<a id="storybook-card-form-23"></a>

### STORYBOOK-CARD-FORM-23 [TODO] 保存失敗後に同じ下書きを再送信する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で表面を Retry front に変更し、保存先は失敗、成功の順に返す。

When:

- 保存し、失敗後にもう一度保存する。

Then:

- 失敗時は Unable to save changes. Try again. と下書きが残る。再試行の成功後は変更した Card を確認できる。

<a id="storybook-card-form-24"></a>

### STORYBOOK-CARD-FORM-24 [TODO] 確認なしのタグ編集を下書きへ即時反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 編集画面で本文と二つのタグを表示している。

When:

- タグ名の変更、別タグの解除、新しいタグの追加を行い、タグ編集を開き直す。

Then:

- 入力中にフォーカスを失わず、確認・OK 操作なしでタグと要約が更新され、開き直しても保持される。Card の保存前に成功通知は出ない。

<a id="storybook-card-form-25"></a>

### STORYBOOK-CARD-FORM-25 [TODO] 空白や重複したタグ名で保存しない

カテゴリ: `interaction`

区分: 異常系

Given:

- Card 編集画面で本文と二つのタグを表示し、新しいタグ行を追加している。

When:

- 空白、既存と同名、有効な名前の順に入力し、各状態で保存を試みる。

Then:

- 空白と重複には該当入力のエラーが表示され、有効な名前に直すと確認画面なしに保存できる。
