# Deck インポート画面 Playwright 結合テスト仕様書

## 目的

Deck インポート画面を入口とした Playwright テストで、CSV とサンプルの選択から解析・プレビュー・確定までの画面内の振る舞いを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-IMPORT-01 | render | 正常系 | [初期画面に保存先選択を表示しない](#playwright-import-01) |
| PLAYWRIGHT-IMPORT-02 | interaction | 正常系 | [CSV を読み込んでプレビューする](#playwright-import-02) |
| PLAYWRIGHT-IMPORT-03 | interaction | 異常系 | [日本語の診断と無効な確定操作を表示する](#playwright-import-03) |
| PLAYWRIGHT-IMPORT-04 | interaction | 異常系 | [プレビュー失敗を安全な日本語にする](#playwright-import-04) |
| PLAYWRIGHT-IMPORT-05 | interaction | 異常系 | [診断を翻訳してユーザー入力を保持する](#playwright-import-05) |
| PLAYWRIGHT-IMPORT-06 | interaction | 正常系 | [CSV 形式の説明を開く](#playwright-import-06) |
| PLAYWRIGHT-IMPORT-07 | render | 正常系 | [インポート処理中の選択を無効にする](#playwright-import-07) |
| PLAYWRIGHT-IMPORT-08 | interaction | 正常系 | [選んだサンプルを試す](#playwright-import-08) |
| PLAYWRIGHT-IMPORT-09 | interaction | 正常系 | [プレビュー後もファイルを選び直す](#playwright-import-09) |
| PLAYWRIGHT-IMPORT-10 | interaction | 正常系 | [内容確認とインポート確定を区別する](#playwright-import-10) |
| PLAYWRIGHT-IMPORT-11 | interaction | 異常系 | [不正な行があれば確定を止める](#playwright-import-11) |
| PLAYWRIGHT-IMPORT-12 | interaction | 異常系 | [準備失敗後もファイルを選び直す](#playwright-import-12) |
| PLAYWRIGHT-DECK-IMPORT-01 | interaction | 正常系 | [ファイル選択へキーボードで移動し保存前にプレビューする](#playwright-deck-import-01) |
| PLAYWRIGHT-DECK-IMPORT-02 | interaction | 正常系 | [選択を取り消してもプレビューと診断を保持する](#playwright-deck-import-02) |
| PLAYWRIGHT-DECK-IMPORT-03 | interaction | 正常系 | [4種類の例の全内容を CSV で出力する](#playwright-deck-import-03) |
| PLAYWRIGHT-DECK-IMPORT-04 | interaction | 正常系 | [4種類の例を追加確定前に保存しない](#playwright-deck-import-04) |
| PLAYWRIGHT-DECK-IMPORT-05 | interaction | 正常系 | [CSV と各例の追加成功を件数と一覧へ反映する](#playwright-deck-import-05) |
| PLAYWRIGHT-DECK-IMPORT-06 | interaction | 正常系 | [新たに選んだ同名の CSV や例を別の Deck として追加する](#playwright-deck-import-06) |
| PLAYWRIGHT-DECK-IMPORT-07 | interaction | 正常系 | [アカウント変更後に以前の選択を追加できない](#playwright-deck-import-07) |
| PLAYWRIGHT-DECK-IMPORT-08 | interaction | 異常系 | [不正な UTF-8 を拒否し同名の修正ファイルを再検証する](#playwright-deck-import-08) |
| PLAYWRIGHT-DECK-IMPORT-09 | interaction | 異常系 | [複数行 CSV の診断を論理レコードと元列値で示す](#playwright-deck-import-09) |
| PLAYWRIGHT-DECK-IMPORT-10 | interaction | 異常系 | [引用符エラーに論理レコード番号と元列値を示す](#playwright-deck-import-10) |
| PLAYWRIGHT-DECK-IMPORT-11 | interaction | 異常系 | [空白だけの CSV をファイル全体のエラーにする](#playwright-deck-import-11) |
| PLAYWRIGHT-DECK-IMPORT-12 | interaction | 異常系 | [保存失敗後に同じプレビューで再試行する](#playwright-deck-import-12) |
| PLAYWRIGHT-DECK-IMPORT-13 | interaction | 異常系 | [不正な必須列の CSV 全体を追加不可にする](#playwright-deck-import-13) |
| PLAYWRIGHT-DECK-IMPORT-14 | interaction | 異常系 | [System 言語変更でも CSV の診断と入力を保持する](#playwright-deck-import-14) |
| PLAYWRIGHT-DECK-IMPORT-15 | interaction | 正常系 | [System 言語変更でも有効な CSV の選択を保つ](#playwright-deck-import-15) |
| PLAYWRIGHT-DECK-IMPORT-16 | interaction | 異常系 | [System 言語変更でも再試行内容と通知期限を保つ](#playwright-deck-import-16) |
| PLAYWRIGHT-DECK-IMPORT-17 | interaction | 正常系 | [取り込み中の離脱と再入場でも競合操作と古い遷移を防ぐ](#playwright-deck-import-17) |

<a id="playwright-import-01"></a>

### PLAYWRIGHT-IMPORT-01 [TODO] 初期画面に保存先選択を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- Deck インポート画面でファイルをまだ選択していない。

When:

- 初期表示を確認する。

Then:

- Add a deck とファイル選択が表示され、保存先を選ぶ radio は表示されない。

<a id="playwright-import-02"></a>

### PLAYWRIGHT-IMPORT-02 [TODO] CSV を読み込んでプレビューする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面でファイルが未選択で、有効な4列1行の CSV ファイルがある。

When:

- ファイル入力で CSV を選択する。

Then:

- 選択前には Review import と保存先の radio がなく、選択後は Review import、有効1件、CSV の解答が表示される。

<a id="playwright-import-03"></a>

### PLAYWRIGHT-IMPORT-03 [TODO] 日本語の診断と無効な確定操作を表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 日本語の Deck インポート画面で、有効0件・無効1件となる3列の行を含む CSV がある。

When:

- CSV を選択する。

Then:

- 日本語の診断と有効0件が表示され、追加操作は無効になる。

<a id="playwright-import-04"></a>

### PLAYWRIGHT-IMPORT-04 [TODO] プレビュー失敗を安全な日本語にする

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面で認証失敗、アカウント変更、権限不足、接続不可、容量不足、未知の失敗を独立した入力例として表示する。

When:

- 表示言語を日本語へ変更する。

Then:

- 各原因に応じた日本語の案内へ変わり、未知の例外の内部情報は表示されない。

<a id="playwright-import-05"></a>

### PLAYWRIGHT-IMPORT-05 [TODO] 診断を翻訳してユーザー入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面でキー重複、列数不足、空 CSV、不正な引用符、未知の解析エラーを独立した入力例として表示する。

When:

- 英語から日本語へ変更する。

Then:

- 診断は日本語へ変わり、診断に含まれる「自作キー」「ユーザー入力」などの入力文字列は変更されない。

<a id="playwright-import-06"></a>

### PLAYWRIGHT-IMPORT-06 [TODO] CSV 形式の説明を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面でファイルをまだ選択していない。

When:

- CSV format を開く。

Then:

- 隠れていたヘッダーなし4列の説明が表示される。ファイル選択は有効なままで、プレビューはまだ表示されない。

<a id="playwright-import-07"></a>

### PLAYWRIGHT-IMPORT-07 [TODO] インポート処理中の選択を無効にする

カテゴリ: `render`

区分: 正常系

Given:

- Deck インポート画面で確定した処理がまだ完了していない。

When:

- 選択操作を確認する。

Then:

- ファイル選択と Try this example は無効になり、保存先の選択領域は表示されない。

<a id="playwright-import-08"></a>

### PLAYWRIGHT-IMPORT-08 [TODO] 選んだサンプルを試す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面に Basic、Math、Markdown、Sample deck がある。各サンプルを独立した入力例とする。

When:

- サンプルを選び、Try this example を選ぶ。

Then:

- 選んだサンプルが押下状態になり、そのサンプルの内容がプレビューに表示される。Download CSV はキーボードで選べる。

<a id="playwright-import-09"></a>

### PLAYWRIGHT-IMPORT-09 [TODO] プレビュー後もファイルを選び直す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面で deck.csv のプレビューを表示している。

When:

- 異なる内容の CSV を選び直す。

Then:

- 新しいファイルの内容がプレビューへ反映され、以前の内容と混ざらない。

<a id="playwright-import-10"></a>

### PLAYWRIGHT-IMPORT-10 [TODO] 内容確認とインポート確定を区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck インポート画面に表面 front、裏面 back、キー key-1 の有効1件と空行1件のスキップが表示されている。

When:

- 内容を確認し、選び直しと Add 1 card を独立した操作例として選ぶ。

Then:

- プレビューには両面・キー・スキップ件数が表示される。確認や選び直しだけでは完了表示にならず、確定操作からインポートが始まる。

<a id="playwright-import-11"></a>

### PLAYWRIGHT-IMPORT-11 [TODO] 不正な行があれば確定を止める

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面で有効1件と、3行目のキーが空の無効1件を含む CSV がある。

When:

- CSV を選択する。

Then:

- Row 3: Unique key is required. と修正した CSV を選ぶ案内が表示され、有効な行があっても追加操作は無効になる。

<a id="playwright-import-12"></a>

### PLAYWRIGHT-IMPORT-12 [TODO] 準備失敗後もファイルを選び直す

カテゴリ: `interaction`

区分: 異常系

Given:

- Deck インポート画面でファイルの読み取りに失敗する。内部エラーには file read failed が含まれる。

When:

- 失敗表示後に別のファイルを選ぶ。

Then:

- 安全な準備失敗の案内が表示され、内部エラー文は露出しない。ファイル選択とサンプルの試用が利用でき、新しい内容をプレビューできる。

<a id="playwright-deck-import-01"></a>

### PLAYWRIGHT-DECK-IMPORT-01 [TODO] ファイル選択へキーボードで移動し保存前にプレビューする

カテゴリ: `interaction`

区分: 正常系

Given:

- 有効な必須4列と一意な uniqueKey を持つ CSV があり、対応する Deck・Card はまだない。広い画面・狭い画面、明暗テーマを独立した表示条件とする。

When:

- ファイル選択欄へ Tab／Shift+Tab で移動し、CSV を選んで検証結果を待つ。

Then:

- 通常のフォーカス順で移動でき、アップロード領域のフォーカス枠を識別できる。他の操作へ移ると枠が消える。
- Deck 名・検証件数・Card の内容を表示し、追加が可能になる。確定前は Deck・Card を追加しない。

<a id="playwright-deck-import-02"></a>

### PLAYWRIGHT-DECK-IMPORT-02 [TODO] 選択を取り消してもプレビューと診断を保持する

カテゴリ: `interaction`

区分: 正常系

Given:

- CSV のプレビューまたはエラーが表示され、追加可否を確認できる。各表示を独立した条件とする。

When:

- ファイル選択を取り消す。

Then:

- プレビュー・エラー・追加可否を変更しない。

<a id="playwright-deck-import-03"></a>

### PLAYWRIGHT-DECK-IMPORT-03 [TODO] 4種類の例の全内容を CSV で出力する

カテゴリ: `interaction`

区分: 正常系

Given:

- インポート画面で Basic・Math・Markdown・Sample deck を選べる。種類ごとに独立した状態とする。

When:

- 選んだ例の表裏と CSV の記述を確認し、CSV ダウンロードを選ぶ。

Then:

- 表示した種類の全 Card を含む CSV を出力し、表裏・タグ・uniqueKey・数式・Markdown・引用符内の改行を保持する。
- 選択と出力だけで Deck・Card を追加しない。

<a id="playwright-deck-import-04"></a>

### PLAYWRIGHT-DECK-IMPORT-04 [TODO] 4種類の例を追加確定前に保存しない

カテゴリ: `interaction`

区分: 正常系

Given:

- Basic・Math・Markdown・Sample deck の対応 Deck・Card はまだない。種類ごとに独立した状態とする。

When:

- 各例を選んで Try this example を実行し、確定せずプレビューを確認する。

Then:

- Deck 名・件数・全 Card の表裏をプレビューでき、追加確定前は Deck・Card を追加しない。

<a id="playwright-deck-import-05"></a>

### PLAYWRIGHT-DECK-IMPORT-05 [TODO] CSV と各例の追加成功を件数と一覧へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 通常アカウントと匿名利用、CSV と Basic・Math・Markdown・Sample deck を独立した条件とし、有効な内容をプレビューしている。保存先は成功を返し、取り込んだ Deck と全 Card が利用可能な状態になる。

When:

- 追加を確定して処理結果を待つ。

Then:

- 確定後にだけ追加し、保存先の選択肢を表示しない。選んだ Deck と全 Card を一覧から開け、取り込み件数を含む成功通知が表示される。
- CSV とすべての例で同じ確認・確定手順を利用でき、成功後は Deck 一覧へ戻り、プレビューが残らない。
- 表裏・複数タグ・uniqueKey・引用符・改行と日本語、文字として含まれる U+FFFD を保持する。例の追加で自動初期生成設定を変更しない。

<a id="playwright-deck-import-06"></a>

### PLAYWRIGHT-DECK-IMPORT-06 [TODO] 新たに選んだ同名の CSV や例を別の Deck として追加する

カテゴリ: `interaction`

区分: 正常系

Given:

- 同じ名前の CSV または同じ例を追加済みで、その Deck と Card を利用できる。保存先は新しい追加にも成功を返す。

When:

- CSV または例を新たに選び直して追加を確定する。

Then:

- 既存の Deck・Card を上書きせず新しい Deck として表示し、両方の内容を利用できる。保存失敗後の同じプレビューによる再試行とは区別する。

<a id="playwright-deck-import-07"></a>

### PLAYWRIGHT-DECK-IMPORT-07 [TODO] アカウント変更後に以前の選択を追加できない

カテゴリ: `interaction`

区分: 正常系

Given:

- 通常アカウントで例を選択している。読み取り中とプレビュー表示後を独立した条件とする。

When:

- 追加確定前にアカウントを変更する。

Then:

- 以前の選択を解除し、古い選択内容を別のアカウントへ追加できない。新しくファイル・例を選び直せる。

<a id="playwright-deck-import-08"></a>

### PLAYWRIGHT-DECK-IMPORT-08 [TODO] 不正な UTF-8 を拒否し同名の修正ファイルを再検証する

カテゴリ: `interaction`

区分: 異常系

Given:

- 不正な UTF-8 の CSV を、同じ名前・パスのまま修正できる。

When:

- 同じファイルを繰り返し選んで文字コードエラーを確認し、有効な UTF-8、uniqueKey が空の内容、有効な内容の順に修正して選び直す。

Then:

- 選び直すたびにエラー・プレビュー・追加可否を更新し、ファイル名を維持する。読み取り中は再選択できず、終わるとキーボードで再選択できる。
- 不正な UTF-8 では英語・日本語で UTF-8 での再保存と再選択を案内し、プレビューや以前の選択へ戻らない。確定前に Deck・Card を追加しない。

<a id="playwright-deck-import-09"></a>

### PLAYWRIGHT-DECK-IMPORT-09 [TODO] 複数行 CSV の診断を論理レコードと元列値で示す

カテゴリ: `interaction`

区分: 異常系

Given:

- 入力は `"front\ncontinued","back"," foo,foo, bar "," key "\n\n"bad ""front""","back"," key "\n" "," "," foo,foo, bar "," key "` とし、`\n` は実際の改行である。

When:

- CSV を選んで検証結果を待つ。

Then:

- レコード1は有効で本文改行を保持し、タグは foo・bar、uniqueKey は key とする。空のレコード2は読み飛ばす。3列のレコード3と、表裏が空白でキーが重複するレコード4は不正2件とする。
- 診断は引用符内改行を数えない1始まりの論理レコード番号と正規化前の元列値を示す。レコード3は `["bad \"front\"","back"," key "]`、レコード4は `[" "," "," foo,foo, bar "," key "]` である。
- 追加は無効になり、Deck・Card を追加しない。

<a id="playwright-deck-import-10"></a>

### PLAYWRIGHT-DECK-IMPORT-10 [TODO] 引用符エラーに論理レコード番号と元列値を示す

カテゴリ: `interaction`

区分: 異常系

Given:

- `"front\ncontinued",back,,key\n\n` の後に、閉じ引用符のない `"unterminated`、または `"bad"tail,back,,key` を置いた CSV がある。各エラーを独立した入力例とし、`\n` は実際の改行である。

When:

- CSV を選んで検証結果を待つ。

Then:

- 論理レコード3の引用符エラーを不正1件として示す。元列値はそれぞれ `["unterminated"]` と `["bad\"tail,back,,key"]` である。
- 追加は無効になり、Deck・Card を追加しない。

<a id="playwright-deck-import-11"></a>

### PLAYWRIGHT-DECK-IMPORT-11 [TODO] 空白だけの CSV をファイル全体のエラーにする

カテゴリ: `interaction`

区分: 異常系

Given:

- 空白3文字だけの CSV があり、対応する Deck・Card はまだない。

When:

- CSV を選んで検証結果を待つ。

Then:

- 空の CSV として、レコード番号と元列値を付けずファイル全体のエラーを表示する。追加は無効になり、Deck・Card を追加しない。

<a id="playwright-deck-import-12"></a>

### PLAYWRIGHT-DECK-IMPORT-12 [TODO] 保存失敗後に同じプレビューで再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- 通常アカウントで CSV または例の有効な内容を確認している。最初の保存先は一部の追加後に失敗を返し、再試行では成功を返す。

When:

- 追加を確定し、失敗の案内後に同じプレビューのまま再試行する。

Then:

- 失敗を通知し、失敗時は成功通知や保存後の遷移をせず同じ入力で再試行できる。
- 再試行成功後は一度の取り込みの内容を利用でき、保存先へ渡す取り込みの対象が変わって Deck・Card が増えることはない。

<a id="playwright-deck-import-13"></a>

### PLAYWRIGHT-DECK-IMPORT-13 [TODO] 不正な必須列の CSV 全体を追加不可にする

カテゴリ: `interaction`

区分: 異常系

Given:

- uniqueKey が空の CSV と、必須4列に足りない CSV があり、入力例ごとに独立した状態で確認する。

When:

- CSV を選んで検証結果を待つ。

Then:

- 不正な行と理由を画面内に表示し、列不足を正常な Card に補完しない。
- 不正な行を含む場合は全体の追加が無効になり、Deck・Card を追加しない。

<a id="playwright-deck-import-14"></a>

### PLAYWRIGHT-DECK-IMPORT-14 [TODO] System 言語変更でも CSV の診断と入力を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- System 設定でブラウザー言語が英語のインポート画面に、日本語の有効行・必須項目が空の行・閉じ引用符がない行を含む CSV の検証結果がある。重複キー・列数・空ファイル・既知／未知の解析エラーも独立した入力例とする。

When:

- ブラウザー言語を日本語へ変更する。

Then:

- 診断を現在の言語へ更新し、説明できない解析エラーは汎用メッセージとする。
- 複合入力では有効1件・無効2件・診断3件、元の行の文脈、日本語入力、診断の順序と対象を維持する。ファイル選択・プレビューは保持され、再選択不要で追加は無効のままである。

<a id="playwright-deck-import-15"></a>

### PLAYWRIGHT-DECK-IMPORT-15 [TODO] System 言語変更でも有効な CSV の選択を保つ

カテゴリ: `interaction`

区分: 正常系

Given:

- System 設定でブラウザー言語が英語のインポート画面に、有効な CSV のプレビューがあり、追加未確定である。

When:

- ブラウザー言語を日本語へ変更する。

Then:

- 同じファイル選択とプレビューを保持し、言語変更だけで追加を始めない。

<a id="playwright-deck-import-16"></a>

### PLAYWRIGHT-DECK-IMPORT-16 [TODO] System 言語変更でも再試行内容と通知期限を保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- System 設定でブラウザー言語が英語のインポート画面に、認証・権限・接続・容量不足・未知の準備または取り込み失敗を表示している。原因ごとに独立した条件とし、再試行する内容と通知の消去予定時刻を確認できる。

When:

- 画面を開いたままブラウザー言語を日本語へ変更する。

Then:

- 原因別の安全な日本語案内を表示し、未知のエラーの生の内部メッセージを露出しない。
- 再試行する入力・選択を維持し、通知は言語変更で表示期限を延長せず元の消去予定時刻で消える。

<a id="playwright-deck-import-17"></a>

### PLAYWRIGHT-DECK-IMPORT-17 [TODO] 取り込み中の離脱と再入場でも競合操作と古い遷移を防ぐ

カテゴリ: `interaction`

区分: 正常系

Given:

- 有効な CSV または例を選択し、保存先の結果が保留されている。

When:

- 追加を確定し、処理中にファイル・例の選択、再確定を試み、画面を離れて再入場した後に保存を成功させる。

Then:

- CSV 検証・取り込み・例の選択は同時に一つだけ進み、待機中は競合する選択や追加を受け付けない。
- 再入場しても処理中表示を保ち、全結果がそろうと操作可能になり成功を通知する。古い操作の完了で現在の画面から Deck 一覧へ自動遷移しない。
