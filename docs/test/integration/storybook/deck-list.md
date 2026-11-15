# Deck 一覧画面 Storybook 結合テスト仕様書

## 目的

Deck 一覧画面を入口とした `play` で、一覧の表示、Deck ごとの操作、追加導線、メニューとヘッダーの振る舞いを確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-LIST-01 | interaction | 正常系 | [Deck 作成画面を開く](#storybook-deck-list-01) |
| STORYBOOK-DECK-LIST-02 | interaction | 正常系 | [Deck インポート画面を開く](#storybook-deck-list-02) |
| STORYBOOK-DECK-LIST-03 | render | 正常系 | [固定文言だけを日本語にする](#storybook-deck-list-03) |
| STORYBOOK-DECK-LIST-04 | interaction | 正常系 | [選んだ Deck を閲覧する](#storybook-deck-list-04) |
| STORYBOOK-DECK-LIST-05 | render | 正常系 | [空の一覧にも追加導線を表示する](#storybook-deck-list-05) |
| STORYBOOK-DECK-LIST-06 | render | 正常系 | [復習対象・新規件数と説明を表示する](#storybook-deck-list-06) |
| STORYBOOK-DECK-LIST-07 | interaction | 正常系 | [ダウンロード操作後にメニューを閉じる](#storybook-deck-list-07) |
| STORYBOOK-DECK-LIST-08 | interaction | 正常系 | [学習履歴画面を開く](#storybook-deck-list-08) |
| STORYBOOK-DECK-LIST-09 | render | 正常系 | [学習中と未開始を一つの一覧に表示する](#storybook-deck-list-09) |
| STORYBOOK-DECK-LIST-10 | interaction | 正常系 | [複数のメニューを同時に開かない](#storybook-deck-list-10) |
| STORYBOOK-DECK-LIST-11 | interaction | 正常系 | [追加メニューをキーボードで開閉する](#storybook-deck-list-11) |
| STORYBOOK-DECK-LIST-12 | interaction | 正常系 | [作成操作後に追加メニューを残さない](#storybook-deck-list-12) |
| STORYBOOK-DECK-LIST-13 | render | 正常系 | [確認中に空の一覧と断定しない](#storybook-deck-list-13) |
| STORYBOOK-DECK-LIST-14 | interaction | 異常系 | [初期データ取得失敗から復旧操作を選ぶ](#storybook-deck-list-14) |
| STORYBOOK-DECK-LIST-15 | interaction | 正常系 | [復習対象0件の理由を区別する](#storybook-deck-list-15) |
| STORYBOOK-DECK-LIST-16 | interaction | 正常系 | [復習と新規学習を区別して開始する](#storybook-deck-list-16) |
| STORYBOOK-DECK-LIST-17 | render | 正常系 | [学習位置を表示する](#storybook-deck-list-17) |
| STORYBOOK-DECK-LIST-18 | interaction | 正常系 | [学習操作で閲覧画面を開かない](#storybook-deck-list-18) |
| STORYBOOK-DECK-LIST-19 | interaction | 正常系 | [各操作を選んだ Deck に適用する](#storybook-deck-list-19) |
| STORYBOOK-DECK-LIST-20 | render | 正常系 | [ローカル Deck にリモート表示を付けない](#storybook-deck-list-20) |
| STORYBOOK-DECK-LIST-21 | render | 正常系 | [処理中の Deck だけを操作不可にする](#storybook-deck-list-21) |
| STORYBOOK-DECK-LIST-22 | render | 正常系 | [未開始なら再開し直す操作を表示しない](#storybook-deck-list-22) |
| STORYBOOK-DECK-LIST-23 | interaction | 正常系 | [メニューを矢印キーで移動する](#storybook-deck-list-23) |
| STORYBOOK-DECK-LIST-24 | interaction | 正常系 | [メニュー内のフォーカス移動で操作を失わない](#storybook-deck-list-24) |
| STORYBOOK-DECK-LIST-25 | interaction | 正常系 | [メニューの外へ移ったフォーカスを奪わない](#storybook-deck-list-25) |
| STORYBOOK-DECK-LIST-26 | interaction | 正常系 | [操作が再び有効になってもメニューを開かない](#storybook-deck-list-26) |
| STORYBOOK-APP-LAYOUT-01 | interaction | 正常系 | [固定ヘッダーと本文を重ねずにスクロールする](#storybook-app-layout-01) |
| STORYBOOK-APP-LAYOUT-02 | render | 正常系 | [初期表示でヘッダーと本文を重ねない](#storybook-app-layout-02) |
| STORYBOOK-DECK-LIST-27 | interaction | 正常系 | [識別子を取り違えず名前から Card 一覧へ進む](#storybook-deck-list-27) |
| STORYBOOK-DECK-LIST-28 | interaction | 正常系 | [読み込み済みの全 Deck の件数と集計条件を説明する](#storybook-deck-list-28) |
| STORYBOOK-DECK-LIST-29 | interaction | 正常系 | [復習期日の到来で件数と並び順を更新する](#storybook-deck-list-29) |
| STORYBOOK-DECK-LIST-30 | interaction | 正常系 | [追加メニューを各入力方法で閉じてフォーカスを戻す](#storybook-deck-list-30) |
| STORYBOOK-DECK-LIST-31 | interaction | 正常系 | [学習状態で区分した Deck を各表示条件で操作できる](#storybook-deck-list-31) |
| STORYBOOK-DECK-LIST-32 | render | 正常系 | [学習状態と復習期日を基準に Deck を並べる](#storybook-deck-list-32) |
| STORYBOOK-DECK-LIST-33 | interaction | 正常系 | [0件の理由を同期完了や学習完了と区別する](#storybook-deck-list-33) |
| STORYBOOK-DECK-LIST-34 | render | 正常系 | [間隔反復が無効なら件数を隠して操作を維持する](#storybook-deck-list-34) |
| STORYBOOK-DECK-LIST-35 | interaction | 正常系 | [状態の変化と画面復帰に現在の復習件数を反映する](#storybook-deck-list-35) |
| STORYBOOK-DECK-LIST-36 | interaction | 正常系 | [空の一覧の追加メニューから作成とインポートを選ぶ](#storybook-deck-list-36) |
| STORYBOOK-DECK-LIST-37 | interaction | 正常系 | [複数 Deck の既存学習を作り直さず個別に再開する](#storybook-deck-list-37) |
| STORYBOOK-DECK-LIST-38 | interaction | 正常系 | [Continue の待機中は全 Deck の再開を重ねない](#storybook-deck-list-38) |
| STORYBOOK-DECK-LIST-39 | interaction | 異常系 | [Continue の失敗を通知し別 Deck で再試行する](#storybook-deck-list-39) |
| STORYBOOK-DECK-LIST-40 | interaction | 正常系 | [長い Deck 名の削除確認を読んで取り消す](#storybook-deck-list-40) |
| STORYBOOK-DECK-LIST-41 | interaction | 正常系 | [削除の成功を通知して対象の利用を終了する](#storybook-deck-list-41) |
| STORYBOOK-DECK-LIST-42 | interaction | 異常系 | [削除失敗後に確認を開き直して再試行する](#storybook-deck-list-42) |
| STORYBOOK-DECK-LIST-43 | interaction | 異常系 | [学習終了の後処理が失敗しても削除成功を取り消さない](#storybook-deck-list-43) |
| STORYBOOK-DECK-LIST-44 | interaction | 正常系 | [対象 Deck の内容を CSV 出力へ引き渡す](#storybook-deck-list-44) |
| STORYBOOK-DECK-LIST-45 | interaction | 正常系 | [自動追加した Sample Deck を画面復帰で重複させない](#storybook-deck-list-45) |
| STORYBOOK-DECK-LIST-46 | interaction | 正常系 | [Continue の古い完了で離脱先や別アカウントから遷移しない](#storybook-deck-list-46) |
| STORYBOOK-DECK-LIST-47 | interaction | 正常系 | [時計がずれても終了済みの学習を再開しない](#storybook-deck-list-47) |
| STORYBOOK-DECK-LIST-48 | interaction | 異常系 | [読取不能な過去の学習を現在の再開対象へ混ぜない](#storybook-deck-list-48) |
| STORYBOOK-DECK-LIST-49 | interaction | 正常系 | [一覧のショートカットで設定とインポートへ進む](#storybook-deck-list-49) |
| STORYBOOK-DECK-LIST-50 | interaction | 正常系 | [復習と新規の操作では学習をまだ作り直さない](#storybook-deck-list-50) |

<a id="storybook-deck-list-01"></a>

### STORYBOOK-DECK-LIST-01 Deck 作成画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加メニューを操作できる。

When:

- 追加メニューから作成を選ぶ。

Then:

- Deck 作成画面と名前の入力欄が表示される。

<a id="storybook-deck-list-02"></a>

### STORYBOOK-DECK-LIST-02 Deck インポート画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加メニューを操作できる。

When:

- 追加メニューからインポートを選ぶ。

Then:

- Deck インポート画面とファイル選択が表示される。

<a id="storybook-deck-list-03"></a>

### STORYBOOK-DECK-LIST-03 固定文言だけを日本語にする

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、名前が Japanese verbs の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 見出しと操作名は日本語になり、Deck 名は Japanese verbs のままである。

<a id="storybook-deck-list-04"></a>

### STORYBOOK-DECK-LIST-04 選んだ Deck を閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前の異なる二つの Deck が一覧にある。

When:

- 片方の Deck の閲覧操作を選ぶ。

Then:

- 選んだ Deck の閲覧画面が表示され、他方の Card は表示されない。

<a id="storybook-deck-list-05"></a>

### STORYBOOK-DECK-LIST-05 空の一覧にも追加導線を表示する

カテゴリ: `render`

区分: 正常系

Given:

- Deck の取得が完了し、Deck が一つもない。

When:

- Deck 一覧画面を開く。

Then:

- 空状態の案内と、作成・インポートを選べる追加操作が表示される。

<a id="storybook-deck-list-06"></a>

### STORYBOOK-DECK-LIST-06 復習対象・新規件数と説明を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 復習対象が2件、新規が3件の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 復習対象2件と新規3件を区別し、それぞれの意味を確認できる。

<a id="storybook-deck-list-07"></a>

### STORYBOOK-DECK-LIST-07 ダウンロード操作後にメニューを閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- ダウンロード可能な Deck のメニューを開いている。

When:

- ダウンロードを選ぶ。

Then:

- 選んだ Deck のダウンロード処理が開始され、メニューが閉じる。ファイル内容の保証はこの画面の範囲に含めない。

<a id="storybook-deck-list-08"></a>

### STORYBOOK-DECK-LIST-08 学習履歴画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面を表示している。

When:

- 学習履歴の操作を選ぶ。

Then:

- 学習履歴画面が表示される。

<a id="storybook-deck-list-09"></a>

### STORYBOOK-DECK-LIST-09 学習中と未開始を一つの一覧に表示する

カテゴリ: `render`

区分: 正常系

Given:

- 学習を中断した Deck と、未開始の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 両方の Deck が同じ一覧に表示され、学習中の Deck を区別できる。

<a id="storybook-deck-list-10"></a>

### STORYBOOK-DECK-LIST-10 複数のメニューを同時に開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- 二つの Deck があり、片方のメニューが開いている。

When:

- もう片方のメニューを開く。

Then:

- 後から開いたメニューだけが表示される。

<a id="storybook-deck-list-11"></a>

### STORYBOOK-DECK-LIST-11 追加メニューをキーボードで開閉する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加ボタンにフォーカスしている。

When:

- Enter で開き、Escape で閉じる。

Then:

- 作成・インポートを選べるメニューが開閉し、閉じると追加ボタンへフォーカスが戻る。

<a id="storybook-deck-list-12"></a>

### STORYBOOK-DECK-LIST-12 作成操作後に追加メニューを残さない

カテゴリ: `interaction`

区分: 正常系

Given:

- 追加メニューを開いている。

When:

- 作成を選んでから一覧へ戻る。

Then:

- 追加メニューは閉じており、追加ボタンから再び操作できる。

<a id="storybook-deck-list-13"></a>

### STORYBOOK-DECK-LIST-13 確認中に空の一覧と断定しない

カテゴリ: `render`

区分: 正常系

Given:

- 最初の Deck 取得がまだ完了していない。

When:

- Deck 一覧画面を開く。

Then:

- 取得待ちが示され、Deck が存在しないという空状態の案内は表示されない。

<a id="storybook-deck-list-14"></a>

### STORYBOOK-DECK-LIST-14 初期データ取得失敗から復旧操作を選ぶ

カテゴリ: `interaction`

区分: 異常系

Given:

- 最初の Deck 取得に失敗し、復旧方法の案内がある。

When:

- 案内された再試行操作を選び、取得が成功する。

Then:

- 失敗表示が解消され、取得した Deck を一覧で操作できる。

<a id="storybook-deck-list-15"></a>

### STORYBOOK-DECK-LIST-15 復習対象0件の理由を区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 未評価の Card だけがある Deck と、次の復習期限を待つ Deck がある。

When:

- 各 Deck の件数と学習操作を確認し、復習期限を待つ Deck の説明を開く。

Then:

- 未評価の Card がある Deck には復習0件と新規件数、新規学習の操作が表示される。
- 復習期限を待つ Deck には対象がない案内と次の復習期限が表示される。

<a id="storybook-deck-list-16"></a>

### STORYBOOK-DECK-LIST-16 復習と新規学習を区別して開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 復習対象と新規 Card の両方がある Deck と、新規 Card だけがある Deck を表示している。

When:

- それぞれ独立した操作例として、復習対象のある Deck の復習操作と、新規 Card だけの Deck の新規学習操作を選ぶ。

Then:

- 選んだ Deck の学習開始画面が表示され、別の Deck が対象にならない。

<a id="storybook-deck-list-17"></a>

### STORYBOOK-DECK-LIST-17 学習位置を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 中断したセッションで全5件のうち3件目まで進んでいる。

When:

- Deck 一覧画面を開く。

Then:

- その Deck の学習位置が他の Deck と取り違えられずに表示される。

<a id="storybook-deck-list-18"></a>

### STORYBOOK-DECK-LIST-18 学習操作で閲覧画面を開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の行と学習操作が同時に表示されている。

When:

- その行の学習操作を選ぶ。

Then:

- 対象 Deck の学習開始画面が表示され、行の閲覧画面へ二重に遷移しない。

<a id="storybook-deck-list-19"></a>

### STORYBOOK-DECK-LIST-19 各操作を選んだ Deck に適用する

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前と内容の異なる二つの Deck がある。

When:

- 片方の閲覧・編集・学習を、独立した操作例として選ぶ。

Then:

- いずれも選んだ Deck の名前と内容を持つ画面が表示される。

<a id="storybook-deck-list-20"></a>

### STORYBOOK-DECK-LIST-20 ローカル Deck にリモート表示を付けない

カテゴリ: `render`

区分: 正常系

Given:

- ローカルのみで利用する Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- その Deck にリモート同期済みと誤認させる表示が付かない。

<a id="storybook-deck-list-21"></a>

### STORYBOOK-DECK-LIST-21 処理中の Deck だけを操作不可にする

カテゴリ: `render`

区分: 正常系

Given:

- 二つの Deck のうち片方だけが処理中である。

When:

- Deck 一覧画面を確認する。

Then:

- 処理中の Deck の操作は無効になり、もう片方は操作できる。

<a id="storybook-deck-list-22"></a>

### STORYBOOK-DECK-LIST-22 未開始なら再開し直す操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- 学習セッションを開始していない Deck がある。

When:

- その Deck のメニューを開く。

Then:

- Restart は表示されず、学習を開始する操作を選べる。

<a id="storybook-deck-list-23"></a>

### STORYBOOK-DECK-LIST-23 メニューを矢印キーで移動する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作メニューを開き、先頭項目にフォーカスしている。

When:

- 上下の矢印キーを押す。

Then:

- メニュー内の有効な項目にフォーカスが移り、移動だけでは操作を実行しない。

<a id="storybook-deck-list-24"></a>

### STORYBOOK-DECK-LIST-24 メニュー内のフォーカス移動で操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作メニューが開いている。

When:

- メニュー内の別項目へフォーカスを移し、その項目を選ぶ。

Then:

- 移動中にメニューが閉じず、選んだ操作を実行できる。

<a id="storybook-deck-list-25"></a>

### STORYBOOK-DECK-LIST-25 メニューの外へ移ったフォーカスを奪わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck のメニューが開いている。

When:

- メニュー外の別の操作へフォーカスを移す。

Then:

- メニューは閉じ、移動先のフォーカスが維持される。

<a id="storybook-deck-list-26"></a>

### STORYBOOK-DECK-LIST-26 操作が再び有効になってもメニューを開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作が処理中になり、メニューが閉じている。

When:

- 処理が完了する。

Then:

- 操作は再び有効になり、メニューは利用者が開くまで閉じたままである。

<a id="storybook-app-layout-01"></a>

### STORYBOOK-APP-LAYOUT-01 固定ヘッダーと本文を重ねずにスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面に縦スクロールが必要な件数の Deck があり、ヘッダーが固定される表示条件である。

When:

- 本文を下へスクロールする。

Then:

- ヘッダーは同じ位置に留まり、先頭の本文や操作を覆わない。

<a id="storybook-app-layout-02"></a>

### STORYBOOK-APP-LAYOUT-02 初期表示でヘッダーと本文を重ねない

カテゴリ: `render`

区分: 正常系

Given:

- 通常の Deck 一覧画面を開く。

When:

- ヘッダーと最初の Deck を確認する。

Then:

- 本文はヘッダーの下に配置され、ヘッダーと重ならない。

<a id="storybook-deck-list-27"></a>

### STORYBOOK-DECK-LIST-27 [TODO] 識別子を取り違えず名前から Card 一覧へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧に、英数字だけの識別子の Deck と、その末尾に ?・# を含む接尾辞を付けた Deck がある。名前と Card の本文は異なる。

When:

- 各 Deck の名前から Card 一覧を開く。

Then:

- 選んだ Deck の Card だけを表示し、Deck 名の読み上げ名は「Open cards in …」／「…のカード一覧を開く」とする。閲覧メニューと区別できる。
- 識別子の ?・# はパス内でエンコードされ、query と fragment は空である。表示と遷移で Deck・Card・学習結果を変更しない。

<a id="storybook-deck-list-28"></a>

### STORYBOOK-DECK-LIST-28 [TODO] 読み込み済みの全 Deck の件数と集計条件を説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔反復が有効で、学習中、空、タグ条件に不一致、復習期日前、未評価だけの Deck がある。Card に過去・未来・未設定の期日があり、タグの AND / OR 条件と maximum cards・shuffle の設定がある。

When:

- 一覧の合計と Deck 別件数を確認し、「件数について」を展開する。

Then:

- 件数は読み込み済みデータと保存済みフィルターを基準とし、maximum cards と shuffle に左右されない旨を表示する。
- 合計には学習中の Deck も一度だけ含め、Deck 別件数と同じ条件で集計する。

<a id="storybook-deck-list-29"></a>

### STORYBOOK-DECK-LIST-29 [TODO] 復習期日の到来で件数と並び順を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔反復が有効で、複数の Deck に未来の復習期日を持つ Card があり、現在はその期日直前である。

When:

- 一覧を開いたまま対象 Card の復習期日を迎える。

Then:

- 期日に達した Card が件数に加わり、並び順と合計も同時点の対象に従って更新される。
- 表示の更新で Card の復習予定、学習の出題順と現在位置を変えない。

<a id="storybook-deck-list-30"></a>

### STORYBOOK-DECK-LIST-30 [TODO] 追加メニューを各入力方法で閉じてフォーカスを戻す

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck のある一覧で追加メニューを開ける。キーボード操作と mobile の下部メニューは独立した表示条件とする。

When:

- 追加メニュー内を矢印キーで移動し Escape で閉じる。mobile では「閉じる」と背景タップを独立した操作例として行う。
- 追加メニューと各 Deck の操作メニューを順に開く。

Then:

- 作成とインポートを表示し、取消しでは操作を実行せず開いたボタンへフォーカスを戻す。
- 同時に開くメニューは一つであり、表示と開閉で Deck・Card・学習結果を変えない。

<a id="storybook-deck-list-31"></a>

### STORYBOOK-DECK-LIST-31 [TODO] 学習状態で区分した Deck を各表示条件で操作できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習中、今学習できる、その他の Deck があり、長い名前の Deck を含む。英語・日本語、mobile・広い画面、明暗テーマ、拡大表示を独立した表示条件とする。
- 最近学習した時刻が分からない Deck も含む。

When:

- 一覧の見出しと Deck 表示を確認し、名前から Card 一覧を開く。

Then:

- 各 Deck を「学習中」「今学習できるデッキ」「その他」に一度だけ表示し、空の区分を隠す。
- Card 数、学習中の現在位置、復習／新規件数、一つの主学習操作を表示し、閲覧・管理は三点メニューから利用できる。名前の読み上げに Card 数と現在位置を含め、カテゴリと最終学習時刻は表示しない。
- 最近学習した時刻が分からない場合も、推測した経過時間を表示しない。
- 狭い画面は1列で主学習ボタンを横幅いっぱいに、広い画面は複数列にする。長い名前は折り返し、主要操作の高さは44px以上とする。バーは現在位置を示し、完了率は示さない。

<a id="storybook-deck-list-32"></a>

### STORYBOOK-DECK-LIST-32 [TODO] 学習状態と復習期日を基準に Deck を並べる

カテゴリ: `render`

区分: 正常系

Given:

- 学習中、復習対象あり、未評価 Card だけ、その他の Deck がある。最終学習時刻・最も早い復習期日・名前で順位の違いと同順位を区別できる。

When:

- Deck 一覧を開く。

Then:

- 学習中は最近学習した順で Continue と現在位置を表示する。位置を完了枚数として示さない。
- 続いて復習対象ありを最も早い復習期日順、未評価だけ、その他の順に表示し、同順位は名前順とする。

<a id="storybook-deck-list-33"></a>

### STORYBOOK-DECK-LIST-33 [TODO] 0件の理由を同期完了や学習完了と区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔反復が有効で、空、未読み込み、タグの AND / OR 条件に不一致、復習期日前だけの Deck がある。

When:

- 0件の理由を展開する。

Then:

- 「復習・新規なし」を表示し、未読み込み・フィルター不一致・期日前だけを区別する。期日前だけなら次回復習日時を示す。
- Study を利用でき、0件だけで完全な同期や学習完了とは断定しない。

<a id="storybook-deck-list-34"></a>

### STORYBOOK-DECK-LIST-34 [TODO] 間隔反復が無効なら件数を隠して操作を維持する

カテゴリ: `render`

区分: 正常系

Given:

- 学習中と未開始の Deck がある一覧で、間隔反復が無効である。

When:

- 件数と操作を確認する。

Then:

- 復習・新規件数と補足を隠し、Continue または Study と閲覧・管理操作を維持する。

<a id="storybook-deck-list-35"></a>

### STORYBOOK-DECK-LIST-35 [TODO] 状態の変化と画面復帰に現在の復習件数を反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔反復が有効で、一覧の復習件数を確認できる。
- 最近学習した時刻が異なる複数の学習中 Deck があり、以前は先頭でなかった Deck の学習結果が更新される条件も確認する。

When:

- Card・Deck・フィルター・設定・学習の状態が変化し、別画面から一覧へ戻る。各状態の変化は独立した操作例とする。
- 学習の状態変化では、対象 Deck の評価の成功応答と更新された状態を受け取り、学習画面から一覧へ戻る。

Then:

- 現在の対象と時刻に従って件数・並び順・合計が更新され、以前の件数が残らない。
- 評価した Deck は今回学習した Deck として、学習中の最近学習順に反映される。
- 表示更新では Card の復習予定、出題順と現在位置を変えない。

<a id="storybook-deck-list-36"></a>

### STORYBOOK-DECK-LIST-36 [TODO] 空の一覧の追加メニューから作成とインポートを選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck がなく、Sample Deck の自動生成が無効である。

When:

- 一覧上部の追加メニューを開き、作成とインポートを独立した操作例として選ぶ。

Then:

- どちらも操作可能であり、選んだ画面が表示される。

<a id="storybook-deck-list-37"></a>

### STORYBOOK-DECK-LIST-37 [TODO] 複数 Deck の既存学習を作り直さず個別に再開する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数の Deck に異なる出題順・現在位置・開始日時の再開可能な学習がある。学習開始後に maximum cards を正の値・1・0へ変更した状態も独立した入力例とする。
- Continue の保存先は成功を返す。

When:

- 各 Deck を独立した操作例として一覧の Continue から再開し、学習画面から一覧へ戻る。

Then:

- 選んだ Deck の対象 Card・出題順・現在位置・開始日時を維持して再開し、最近学習した日時だけを更新する。
- 一覧へ戻ると、再開した Deck は今回再開した Deck として学習中の最近学習順に反映される。
- 再開だけでは回答、Deck・Card の内容と学習結果を変えず、他の Deck の学習も元の対象・順序・位置・開始日時を維持する。

<a id="storybook-deck-list-38"></a>

### STORYBOOK-DECK-LIST-38 [TODO] Continue の待機中は全 Deck の再開を重ねない

カテゴリ: `interaction`

区分: 正常系

Given:

- 通常アカウントの複数 Deck に再開可能な学習があり、最初の Continue の応答は保留される。英語・日本語を独立した表示条件とする。

When:

- 一つの Deck の Continue を選び、待機中に同じ Deck・別 Deck の Continue を続けて操作する。画面に留まる場合と一覧を離れて戻る場合を独立した操作例とし、その後応答を成功させる。

Then:

- 待機中はすべての Continue が無効になり、対象 Deck だけに読み上げ可能な再開中の案内を表示する。対象の閲覧・管理も無効になり、別 Deck の閲覧・管理と一覧から離れる操作は利用できる。
- 後続の再開を予約せず、留まっている場合だけ最初の Deck を元の順序と位置から再開する。離脱・再入場後の古い完了では自動遷移しない。
- 待機状態は再入場しても維持され、完了後は操作可能になる。回答と既存の出題順・現在位置は変わらない。

<a id="storybook-deck-list-39"></a>

### STORYBOOK-DECK-LIST-39 [TODO] Continue の失敗を通知し別 Deck で再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- 通常アカウントの複数 Deck に再開可能な学習があり、最初の Continue は遅れて失敗し、次に選んだ Deck の保存先は成功を返す。

When:

- 一つの Deck の Continue を選び、待機中に同じ Deck・別 Deck の Continue を続けて操作した後、失敗の案内から別 Deck の Continue を明示的に選ぶ。

Then:

- 待機中はすべての Continue が無効で、失敗を通知すると再び操作可能になる。失敗時は一覧に留まり、待機中の再操作による別の通知や予約済み再開はない。
- 再試行で選んだ Deck を元の順序と位置から再開し、以前の Deck の学習も保持する。

<a id="storybook-deck-list-40"></a>

### STORYBOOK-DECK-LIST-40 [TODO] 長い Deck 名の削除確認を読んで取り消す

カテゴリ: `interaction`

区分: 正常系

Given:

- Card・学習状態・回答履歴と途中の学習を持つ Deck がある。名前は START 、Long deletion target name の12回繰り返し、END を順に連結した321文字である。
- 一覧から削除確認を開き、初期フォーカスは Cancel にある。幅360pxで高さ360pxと640pxを独立した表示条件とする。

When:

- 全体と名前欄をスクロールし、見出し・名前の先頭と末尾・関連 Card と学習 session への影響・取消不能の説明を読む。Tab／Shift+Tab で名前欄・Cancel・Delete を辿り、Cancel を選ぶ。

Then:

- 全内容の同時表示を要求せず、各説明と操作に到達できる。取消しで確認が閉じ、対象の操作メニューボタンへフォーカスが戻る。
- Deck・Card・学習状態・回答履歴は変わらず、元の位置で Continue できる。

<a id="storybook-deck-list-41"></a>

### STORYBOOK-DECK-LIST-41 [TODO] 削除の成功を通知して対象の利用を終了する

カテゴリ: `interaction`

区分: 正常系

Given:

- 複数 Deck に Card と再開可能な学習があり、対象の削除先は成功を返し、対象 Deck を利用できない状態になる。学習終了の後処理も成功を返す。

When:

- 一覧から対象 Deck の削除を確定する。

Then:

- 削除成功を通知し、操作待ちを解除する。対象 Deck は一覧になく、その Card と学習を表示・再開できない。
- 別 Deck と Card、別 Deck の学習は継続して利用できる。

<a id="storybook-deck-list-42"></a>

### STORYBOOK-DECK-LIST-42 [TODO] 削除失敗後に確認を開き直して再試行する

カテゴリ: `interaction`

区分: 異常系

Given:

- Card と途中の学習を持つ Deck の最初の削除は拒否を返す。その後も対象を利用でき、次の削除は成功を返す。

When:

- 一覧から削除を確定し、失敗後に確認を開き直して再試行する。

Then:

- 失敗を通知した後も対象を再試行できる。成功時は確認が閉じ、削除成功を通知し、対象 Deck・Card と学習の再開を表示しない。

<a id="storybook-deck-list-43"></a>

### STORYBOOK-DECK-LIST-43 [TODO] 学習終了の後処理が失敗しても削除成功を取り消さない

カテゴリ: `interaction`

区分: 異常系

Given:

- 複数 Deck に Card と途中の学習がある。対象 Deck の削除先は成功を返すが、学習終了の後処理は保留後に失敗を返す。

When:

- 一覧から対象 Deck の削除を確定し、後処理の失敗を待つ。

Then:

- Deck の削除成功を通知し、後処理完了を待たずに操作待ちを解除する。
- 後処理の失敗は別に通知し、対象 Deck・Card・学習の利用を復活させない。他の Deck・Card・学習は利用できる。

<a id="storybook-deck-list-44"></a>

### STORYBOOK-DECK-LIST-44 [TODO] 対象 Deck の内容を CSV 出力へ引き渡す

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に日本語・カンマ・二重引用符・改行を含む Card とタグなしの Card があり、別 Deck にも Card がある。

When:

- 一覧から対象 Deck の CSV ダウンロードを選ぶ。

Then:

- 対象 Deck の名前に対応するファイル名と、対象 Card ごとの front text・back text・tags・unique key の4列を持つ CSV を出力する。各 Card は一つの論理レコードに対応する。
- 特殊文字と本文の改行を保持し、タグなしではタグ列が空で後続キーをずらさない。他の Deck の Card を含めず、両 Deck の内容・件数を変更しない。

<a id="storybook-deck-list-45"></a>

### STORYBOOK-DECK-LIST-45 [TODO] 自動追加した Sample Deck を画面復帰で重複させない

カテゴリ: `interaction`

区分: 正常系

Given:

- 認証済みユーザーの Deck は空で、Sample Deck の初期生成が有効である。Deck とすべての Card の保存先は成功を返す。

When:

- 一覧を開いて生成結果を待ち、別画面から一覧へ戻って CSV ダウンロードを選ぶ。

Then:

- Sample Deck を一つだけ利用でき、CSV 出力には全 Card が含まれる。
- 生成後は自動初期生成が無効になり、画面復帰だけでは重複した Deck や Card を追加しない。

<a id="storybook-deck-list-46"></a>

### STORYBOOK-DECK-LIST-46 [TODO] Continue の古い完了で離脱先や別アカウントから遷移しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 一覧の Continue で選んだ Deck の保存結果が保留されている。

When:

- 応答前に別画面へ移るか、アカウントを変更する。独立した操作例として、その後古い保存結果を成功させる。

Then:

- 離脱先または新しいアカウントの画面を維持し、古い Deck の学習へ自動遷移しない。古い処理の完了で新しいアカウントの学習を置き換えない。

<a id="storybook-deck-list-47"></a>

### STORYBOOK-DECK-LIST-47 [TODO] 時計がずれても終了済みの学習を再開しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 同じ Deck に終了済みの学習と、その後に開始した再開可能な学習がある。端末間の時計ずれにより、端末で記録した日時では終了済みの学習のほうが未来に見える。

When:

- 一覧でその Deck の Continue を選ぶ。

Then:

- 終了済みの学習へ戻らず、利用可能な学習の対象・順序・位置から再開する。

<a id="storybook-deck-list-48"></a>

### STORYBOOK-DECK-LIST-48 [TODO] 読取不能な過去の学習を現在の再開対象へ混ぜない

カテゴリ: `interaction`

区分: 異常系

Given:

- 対象 Deck に利用可能な学習があり、別の過去の学習は読み取れないという取得結果がある。現在の再開処理は成功を返す。

When:

- 一覧から対象 Deck の Continue を選ぶ。

Then:

- 利用可能な学習の元の順序・位置から再開でき、読取不能な過去の学習や別 Deck の内容へ置き換えない。

<a id="storybook-deck-list-49"></a>

### STORYBOOK-DECK-LIST-49 [TODO] 一覧のショートカットで設定とインポートへ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧を開いている。

When:

- s で Settings を開く。一覧へ戻った後、i で Import を開く。

Then:

- 選んだ画面と操作欄が表示され、1回のキー操作で二重に遷移しない。Deck・Card・学習内容を変更しない。

<a id="storybook-deck-list-50"></a>

### STORYBOOK-DECK-LIST-50 [TODO] 復習と新規の操作では学習をまだ作り直さない

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔反復が有効で、復習対象または新規 Card がある Deck がある。既存の学習がある状態も独立した入力例とする。

When:

- キーボードで Review または Study new を選ぶ。

Then:

- 選んだ Deck の開始設定画面へ進み、この操作だけでは学習を新規開始・置換しない。Deck・Card・学習結果と現在位置を変更しない。
