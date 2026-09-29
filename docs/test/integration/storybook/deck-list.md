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

<a id="storybook-deck-list-01"></a>

### STORYBOOK-DECK-LIST-01 [TODO] Deck 作成画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加メニューを操作できる。

When:

- 追加メニューから作成を選ぶ。

Then:

- Deck 作成画面と名前の入力欄が表示される。

<a id="storybook-deck-list-02"></a>

### STORYBOOK-DECK-LIST-02 [TODO] Deck インポート画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加メニューを操作できる。

When:

- 追加メニューからインポートを選ぶ。

Then:

- Deck インポート画面とファイル選択が表示される。

<a id="storybook-deck-list-03"></a>

### STORYBOOK-DECK-LIST-03 [TODO] 固定文言だけを日本語にする

カテゴリ: `render`

区分: 正常系

Given:

- 表示言語は日本語で、名前が Japanese verbs の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 見出しと操作名は日本語になり、Deck 名は Japanese verbs のままである。

<a id="storybook-deck-list-04"></a>

### STORYBOOK-DECK-LIST-04 [TODO] 選んだ Deck を閲覧する

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前の異なる二つの Deck が一覧にある。

When:

- 片方の Deck の閲覧操作を選ぶ。

Then:

- 選んだ Deck の閲覧画面が表示され、他方の Card は表示されない。

<a id="storybook-deck-list-05"></a>

### STORYBOOK-DECK-LIST-05 [TODO] 空の一覧にも追加導線を表示する

カテゴリ: `render`

区分: 正常系

Given:

- Deck の取得が完了し、Deck が一つもない。

When:

- Deck 一覧画面を開く。

Then:

- 空状態の案内と、作成・インポートを選べる追加操作が表示される。

<a id="storybook-deck-list-06"></a>

### STORYBOOK-DECK-LIST-06 [TODO] 復習対象・新規件数と説明を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 復習対象が2件、新規が3件の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 復習対象2件と新規3件を区別し、それぞれの意味を確認できる。

<a id="storybook-deck-list-07"></a>

### STORYBOOK-DECK-LIST-07 [TODO] ダウンロード操作後にメニューを閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- ダウンロード可能な Deck のメニューを開いている。

When:

- ダウンロードを選ぶ。

Then:

- 選んだ Deck のダウンロード処理が開始され、メニューが閉じる。ファイル内容の保証はこの画面の範囲に含めない。

<a id="storybook-deck-list-08"></a>

### STORYBOOK-DECK-LIST-08 [TODO] 学習履歴画面を開く

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面を表示している。

When:

- 学習履歴の操作を選ぶ。

Then:

- 学習履歴画面が表示される。

<a id="storybook-deck-list-09"></a>

### STORYBOOK-DECK-LIST-09 [TODO] 学習中と未開始を一つの一覧に表示する

カテゴリ: `render`

区分: 正常系

Given:

- 学習を中断した Deck と、未開始の Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- 両方の Deck が同じ一覧に表示され、学習中の Deck を区別できる。

<a id="storybook-deck-list-10"></a>

### STORYBOOK-DECK-LIST-10 [TODO] 複数のメニューを同時に開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- 二つの Deck があり、片方のメニューが開いている。

When:

- もう片方のメニューを開く。

Then:

- 後から開いたメニューだけが表示される。

<a id="storybook-deck-list-11"></a>

### STORYBOOK-DECK-LIST-11 [TODO] 追加メニューをキーボードで開閉する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面の追加ボタンにフォーカスしている。

When:

- Enter で開き、Escape で閉じる。

Then:

- 作成・インポートを選べるメニューが開閉し、閉じると追加ボタンへフォーカスが戻る。

<a id="storybook-deck-list-12"></a>

### STORYBOOK-DECK-LIST-12 [TODO] 作成操作後に追加メニューを残さない

カテゴリ: `interaction`

区分: 正常系

Given:

- 追加メニューを開いている。

When:

- 作成を選んでから一覧へ戻る。

Then:

- 追加メニューは閉じており、追加ボタンから再び操作できる。

<a id="storybook-deck-list-13"></a>

### STORYBOOK-DECK-LIST-13 [TODO] 確認中に空の一覧と断定しない

カテゴリ: `render`

区分: 正常系

Given:

- 最初の Deck 取得がまだ完了していない。

When:

- Deck 一覧画面を開く。

Then:

- 取得待ちが示され、Deck が存在しないという空状態の案内は表示されない。

<a id="storybook-deck-list-14"></a>

### STORYBOOK-DECK-LIST-14 [TODO] 初期データ取得失敗から復旧操作を選ぶ

カテゴリ: `interaction`

区分: 異常系

Given:

- 最初の Deck 取得に失敗し、復旧方法の案内がある。

When:

- 案内された再試行操作を選び、取得が成功する。

Then:

- 失敗表示が解消され、取得した Deck を一覧で操作できる。

<a id="storybook-deck-list-15"></a>

### STORYBOOK-DECK-LIST-15 [TODO] 復習対象0件の理由を区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 未評価の Card だけがある Deck と、次の復習期限を待つ Deck がある。

When:

- 各 Deck の復習対象0件の説明を開く。

Then:

- 新規学習が必要な状態と、復習期限を待つ状態を区別する説明が表示される。

<a id="storybook-deck-list-16"></a>

### STORYBOOK-DECK-LIST-16 [TODO] 復習と新規学習を区別して開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 復習対象と新規 Card の両方がある Deck を表示している。

When:

- 復習と新規学習を、それぞれ独立した操作例として選ぶ。

Then:

- 選んだ学習種別の開始画面が表示される。

<a id="storybook-deck-list-17"></a>

### STORYBOOK-DECK-LIST-17 [TODO] 学習位置を表示する

カテゴリ: `render`

区分: 正常系

Given:

- 中断したセッションで全5件のうち3件目まで進んでいる。

When:

- Deck 一覧画面を開く。

Then:

- その Deck の学習位置が他の Deck と取り違えられずに表示される。

<a id="storybook-deck-list-18"></a>

### STORYBOOK-DECK-LIST-18 [TODO] 学習操作で閲覧画面を開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の行と学習操作が同時に表示されている。

When:

- その行の学習操作を選ぶ。

Then:

- 対象 Deck の学習開始画面が表示され、行の閲覧画面へ二重に遷移しない。

<a id="storybook-deck-list-19"></a>

### STORYBOOK-DECK-LIST-19 [TODO] 各操作を選んだ Deck に適用する

カテゴリ: `interaction`

区分: 正常系

Given:

- 名前と内容の異なる二つの Deck がある。

When:

- 片方の閲覧・編集・学習を、独立した操作例として選ぶ。

Then:

- いずれも選んだ Deck の名前と内容を持つ画面が表示される。

<a id="storybook-deck-list-20"></a>

### STORYBOOK-DECK-LIST-20 [TODO] ローカル Deck にリモート表示を付けない

カテゴリ: `render`

区分: 正常系

Given:

- ローカルのみで利用する Deck がある。

When:

- Deck 一覧画面を開く。

Then:

- その Deck にリモート同期済みと誤認させる表示が付かない。

<a id="storybook-deck-list-21"></a>

### STORYBOOK-DECK-LIST-21 [TODO] 処理中の Deck だけを操作不可にする

カテゴリ: `render`

区分: 正常系

Given:

- 二つの Deck のうち片方だけが処理中である。

When:

- Deck 一覧画面を確認する。

Then:

- 処理中の Deck の操作は無効になり、もう片方は操作できる。

<a id="storybook-deck-list-22"></a>

### STORYBOOK-DECK-LIST-22 [TODO] 未開始なら再開し直す操作を表示しない

カテゴリ: `render`

区分: 正常系

Given:

- 学習セッションを開始していない Deck がある。

When:

- その Deck のメニューを開く。

Then:

- Restart は表示されず、学習を開始する操作を選べる。

<a id="storybook-deck-list-23"></a>

### STORYBOOK-DECK-LIST-23 [TODO] メニューを矢印キーで移動する

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作メニューを開き、先頭項目にフォーカスしている。

When:

- 上下の矢印キーを押す。

Then:

- メニュー内の有効な項目にフォーカスが移り、移動だけでは操作を実行しない。

<a id="storybook-deck-list-24"></a>

### STORYBOOK-DECK-LIST-24 [TODO] メニュー内のフォーカス移動で操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作メニューが開いている。

When:

- メニュー内の別項目へフォーカスを移し、その項目を選ぶ。

Then:

- 移動中にメニューが閉じず、選んだ操作を実行できる。

<a id="storybook-deck-list-25"></a>

### STORYBOOK-DECK-LIST-25 [TODO] メニューの外へ移ったフォーカスを奪わない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck のメニューが開いている。

When:

- メニュー外の別の操作へフォーカスを移す。

Then:

- メニューは閉じ、移動先のフォーカスが維持される。

<a id="storybook-deck-list-26"></a>

### STORYBOOK-DECK-LIST-26 [TODO] 操作が再び有効になってもメニューを開かない

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck の操作が処理中になり、メニューが閉じている。

When:

- 処理が完了する。

Then:

- 操作は再び有効になり、メニューは利用者が開くまで閉じたままである。

<a id="storybook-app-layout-01"></a>

### STORYBOOK-APP-LAYOUT-01 [TODO] 固定ヘッダーと本文を重ねずにスクロールする

カテゴリ: `interaction`

区分: 正常系

Given:

- Deck 一覧画面に縦スクロールが必要な件数の Deck があり、ヘッダーが固定される表示条件である。

When:

- 本文を下へスクロールする。

Then:

- ヘッダーは同じ位置に留まり、先頭の本文や操作を覆わない。

<a id="storybook-app-layout-02"></a>

### STORYBOOK-APP-LAYOUT-02 [TODO] 初期表示でヘッダーと本文を重ねない

カテゴリ: `render`

区分: 正常系

Given:

- 通常の Deck 一覧画面を開く。

When:

- ヘッダーと最初の Deck を確認する。

Then:

- 本文はヘッダーの下に配置され、ヘッダーと重ならない。
