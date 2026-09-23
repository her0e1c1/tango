# Deck List Storybook 結合テスト仕様書

## 目的

一覧の状態、操作要求、復習件数、メニューの排他とフォーカス、処理中の操作抑止を確認する。

## 検証境界

DeckList と実際の DeckListCard / DeckActionsMenu を組み合わせ、表示データと callback を境界にする。実際の画面遷移、ダウンロード内容、件数集計と永続化は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [deck-navigation](../../e2e/deck-navigation.md) と [study-session](../../e2e/study-session.md) を参照する。

09〜26 は Vitest から追加した契約で、各条件の準備とアサーションは未実装である。DeckListCard の契約は実際の行を含む DeckList の Story に紐付ける。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-DECK-LIST-01 | interaction | [Deck 作成を要求する](#storybook-deck-list-01) |
| STORYBOOK-DECK-LIST-02 | interaction | [Deck インポートを要求する](#storybook-deck-list-02) |
| STORYBOOK-DECK-LIST-03 | render | [固定文言だけを日本語にする](#storybook-deck-list-03) |
| STORYBOOK-DECK-LIST-04 | interaction | [Deck の閲覧を要求する](#storybook-deck-list-04) |
| STORYBOOK-DECK-LIST-05 | render | [空の一覧にも追加導線を表示する](#storybook-deck-list-05) |
| STORYBOOK-DECK-LIST-06 | render | [復習対象・新規件数と説明を表示する](#storybook-deck-list-06) |
| STORYBOOK-DECK-LIST-07 | interaction | [ダウンロードを要求してメニューを閉じる](#storybook-deck-list-07) |
| STORYBOOK-DECK-LIST-08 | interaction | [学習履歴を要求する](#storybook-deck-list-08) |
| STORYBOOK-DECK-LIST-09 | render | [学習中と未開始を一つの一覧に表示する](#storybook-deck-list-09) |
| STORYBOOK-DECK-LIST-10 | interaction | [複数のメニューを同時に開かない](#storybook-deck-list-10) |
| STORYBOOK-DECK-LIST-11 | interaction | [追加メニューをキーボードで開閉する](#storybook-deck-list-11) |
| STORYBOOK-DECK-LIST-12 | interaction | [作成要求後に追加ボタンへ戻る](#storybook-deck-list-12) |
| STORYBOOK-DECK-LIST-13 | render | [確認中に空の一覧と断定しない](#storybook-deck-list-13) |
| STORYBOOK-DECK-LIST-14 | interaction | [初期データ取得失敗から操作を選ぶ](#storybook-deck-list-14) |
| STORYBOOK-DECK-LIST-15 | interaction | [復習対象0件の理由を区別する](#storybook-deck-list-15) |
| STORYBOOK-DECK-LIST-16 | interaction | [復習と新規学習を区別して要求する](#storybook-deck-list-16) |
| STORYBOOK-DECK-LIST-17 | render | [学習位置を表示する](#storybook-deck-list-17) |
| STORYBOOK-DECK-LIST-18 | interaction | [Study で行の閲覧を起動しない](#storybook-deck-list-18) |
| STORYBOOK-DECK-LIST-19 | interaction | [各操作に対象 ID を渡す](#storybook-deck-list-19) |
| STORYBOOK-DECK-LIST-20 | render | [ローカル Deck にリモート表示を付けない](#storybook-deck-list-20) |
| STORYBOOK-DECK-LIST-21 | render | [処理中の行だけを無効にする](#storybook-deck-list-21) |
| STORYBOOK-DECK-LIST-22 | render | [未開始なら Restart を表示しない](#storybook-deck-list-22) |
| STORYBOOK-DECK-LIST-23 | interaction | [メニューを矢印キーで移動する](#storybook-deck-list-23) |
| STORYBOOK-DECK-LIST-24 | interaction | [メニュー内のフォーカス移動で操作を失わない](#storybook-deck-list-24) |
| STORYBOOK-DECK-LIST-25 | interaction | [外へ移ったフォーカスを奪わない](#storybook-deck-list-25) |
| STORYBOOK-DECK-LIST-26 | interaction | [再有効化してもメニューを閉じたままにする](#storybook-deck-list-26) |

<a id="storybook-deck-list-01"></a>

### STORYBOOK-DECK-LIST-01 Deck 作成を要求する

カテゴリ: `interaction`

Given:

- 作成・インポート callback を渡す。

When:

- Add を開き、Create deck を選ぶ。

Then:

- 作成 callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-02"></a>

### STORYBOOK-DECK-LIST-02 Deck インポートを要求する

カテゴリ: `interaction`

Given:

- 作成・インポート callback を渡す。

When:

- Add を開き、Import decks を選ぶ。

Then:

- インポート callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-03"></a>

### STORYBOOK-DECK-LIST-03 固定文言だけを日本語にする

カテゴリ: `render`

Given:

- 日本語 locale でユーザーが名付けた Deck を渡す。

When:

- 一覧を描画する。

Then:

- 固定文言は日本語になり、Deck 名は元の文字列を保持する。

<a id="storybook-deck-list-04"></a>

### STORYBOOK-DECK-LIST-04 Deck の閲覧を要求する

カテゴリ: `interaction`

Given:

- Deck 閲覧と Card 一覧への callback を区別して渡す。

When:

- 先頭 Deck のメニューから View を選ぶ。

Then:

- Deck 閲覧 callback に対象 ID を渡し、Card 一覧 callback は通知しない。

<a id="storybook-deck-list-05"></a>

### STORYBOOK-DECK-LIST-05 空の一覧にも追加導線を表示する

カテゴリ: `render`

Given:

- Deck が0件で、空状態が確定している。

When:

- 一覧を描画して Add を開く。

Then:

- 0 decks、No decks yet、Create deck の導線を表示する。メニューの Create deck / Import decks は有効である。

<a id="storybook-deck-list-06"></a>

### STORYBOOK-DECK-LIST-06 復習対象・新規件数と説明を表示する

カテゴリ: `render`

Given:

- 復習対象5件、新規5件の Deck を用意する。

When:

- 一覧を描画して About counts を開く。

Then:

- 5 due / 5 new と件数の説明を表示する。

<a id="storybook-deck-list-07"></a>

### STORYBOOK-DECK-LIST-07 ダウンロードを要求してメニューを閉じる

カテゴリ: `interaction`

Given:

- Japanese verbs のメニューが閉じており、開閉を Story 側に反映する。

When:

- メニューから Download を選ぶ。

Then:

- ダウンロード callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-08"></a>

### STORYBOOK-DECK-LIST-08 学習履歴を要求する

カテゴリ: `interaction`

Given:

- 学習履歴 callback を渡す。

When:

- メニューから Study history を選ぶ。

Then:

- 学習履歴 callback が一度通知される。

<a id="storybook-deck-list-09"></a>

### STORYBOOK-DECK-LIST-09 学習中と未開始を一つの一覧に表示する

カテゴリ: `render`

検証状況: 未実装

Given:

- 学習中 Active deck と未開始 Other deck の2件、未開始だけの1件を別条件にする。

When:

- 一覧を描画する。

Then:

- 2件なら一つの Decks 領域に Active deck、Other deck の順で article を表示し、グループ見出しは作らない。
- 未開始だけでも行を表示し、存在しない学習中 Deck の Continue は表示しない。

<a id="storybook-deck-list-10"></a>

### STORYBOOK-DECK-LIST-10 複数のメニューを同時に開かない

カテゴリ: `interaction`

検証状況: 未実装

Given:

- 複数 Deck の一覧を表示する。

When:

- Deck A、Deck B、Add、Deck A の順でメニューを開く。

Then:

- 直前のメニューは閉じ、最後に開いた一つだけを表示する。

<a id="storybook-deck-list-11"></a>

### STORYBOOK-DECK-LIST-11 追加メニューをキーボードで開閉する

カテゴリ: `interaction`

検証状況: 未実装

Given:

- Add にフォーカスしている。

When:

- Enter、ArrowDown、Escape を押す。

Then:

- Create deck、Import decks の順にフォーカスし、Escape で閉じて Add へ戻る。作成・インポートは要求しない。

<a id="storybook-deck-list-12"></a>

### STORYBOOK-DECK-LIST-12 作成要求後に追加ボタンへ戻る

カテゴリ: `interaction`

検証状況: 未実装

Given:

- Add メニューを開いている。

When:

- Create deck を選ぶ。

Then:

- 作成のみを要求し、メニューが閉じて Add にフォーカスが戻る。

<a id="storybook-deck-list-13"></a>

### STORYBOOK-DECK-LIST-13 確認中に空の一覧と断定しない

カテゴリ: `render`

検証状況: 未実装

Given:

- 表示0件だが、初期データを確認中である。

When:

- 一覧を描画する。

Then:

- status に Checking for sample deck… を表示し、No decks yet は表示しない。

<a id="storybook-deck-list-14"></a>

### STORYBOOK-DECK-LIST-14 初期データ取得失敗から操作を選ぶ

カテゴリ: `interaction`

検証状況: 未実装

Given:

- 初期データ取得に失敗し、Deck は0件で、各操作 callback を渡している。

When:

- Retry、Create deck、Import decks の各操作を行う。

Then:

- alert と Unable to load sample deck を表示し、選んだ操作の callback を通知する。再取得成功や実遷移は確認しない。

<a id="storybook-deck-list-15"></a>

### STORYBOOK-DECK-LIST-15 復習対象0件の理由を区別する

カテゴリ: `interaction`

検証状況: 未実装

Given:

- 復習対象・新規とも0件とし、保持0件、保持3件で次回時刻なし、保持3件で次回時刻ありを個別に用意する。

When:

- No due or new cards を開く。

Then:

- 初期状態では隠れていた説明が開き、端末上に Card がない、保存済みフィルターに一致しない、次回復習日時をそれぞれ示す。Study は有効である。

<a id="storybook-deck-list-16"></a>

### STORYBOOK-DECK-LIST-16 復習と新規学習を区別して要求する

カテゴリ: `interaction`

検証状況: 未実装

Given:

- Deck name の復習対象1件・新規2件と、復習対象0件・新規2件を別条件にする。

When:

- 主操作を押す。

Then:

- 前者は Review Deck name、後者は Study new cards in Deck name という名前になり、学習開始 callback に対象 ID を渡す。

<a id="storybook-deck-list-17"></a>

### STORYBOOK-DECK-LIST-17 学習位置を表示する

カテゴリ: `render`

検証状況: 未実装

Given:

- 保持8件・学習対象3件の index 1 と、保持2件・対象2件の index 1・最終学習時刻不明を別条件にする。

When:

- Deck 行を描画する。

Then:

- 前者は 8 cards / Studying · Card 2 of 3 を表示し、一覧を開くボタンの説明に関連付ける。カテゴリや progressbar は表示しない。
- 後者は 2 cards / Studying · Card 2 of 2 を説明に使い、不明な時刻を補わない。両方に Continue を表示する。

<a id="storybook-deck-list-18"></a>

### STORYBOOK-DECK-LIST-18 Study で行の閲覧を起動しない

カテゴリ: `interaction`

検証状況: 未実装

Given:

- 未開始の Deck name を表示し、学習と行の閲覧に別の callback を渡す。

When:

- Study Deck name を押す。

Then:

- 保持件数と Study を表示し、学習開始 callback だけに対象 ID を渡す。行を開く callback は通知しない。

<a id="storybook-deck-list-19"></a>

### STORYBOOK-DECK-LIST-19 各操作に対象 ID を渡す

カテゴリ: `interaction`

検証状況: 未実装

Given:

- ID deck-id の学習中 Deck に各操作 callback を渡す。

When:

- 名前、Continue、メニューの View / Restart / Download / Edit / Delete をそれぞれ操作する。

Then:

- 各操作の callback に deck-id を渡し、未開始用の Study は通知しない。View は独立した行内ボタンではなくメニューから選べる。

<a id="storybook-deck-list-20"></a>

### STORYBOOK-DECK-LIST-20 ローカル Deck にリモート表示を付けない

カテゴリ: `render`

検証状況: 未実装

Given:

- ローカル Deck を用意する。

When:

- 行を描画する。

Then:

- Remote deck のアイコンを表示しない。

<a id="storybook-deck-list-21"></a>

### STORYBOOK-DECK-LIST-21 処理中の行だけを無効にする

カテゴリ: `render`

検証状況: 未実装

Given:

- 2件中1件だけが処理中である。

When:

- 両方の行を描画する。

Then:

- 処理中の行は aria-busy が true で、名前、Study、メニューが無効になる。もう一方は同じ操作が有効なままである。

<a id="storybook-deck-list-22"></a>

### STORYBOOK-DECK-LIST-22 未開始なら Restart を表示しない

カテゴリ: `render`

検証状況: 未実装

Given:

- 再開するセッションがない Deck のメニューを開く。

When:

- メニューを描画する。

Then:

- View、Download、Edit、Study history、Delete の順に表示し、Restart は表示しない。

<a id="storybook-deck-list-23"></a>

### STORYBOOK-DECK-LIST-23 メニューを矢印キーで移動する

カテゴリ: `interaction`

検証状況: 未実装

Given:

- Restart が利用でき、メニューは閉じている。

When:

- メニューを開き、ArrowDown、Escape を押す。

Then:

- 開いた直後は View、ArrowDown 後は Restart にフォーカスする。Escape で閉じ、開くボタンへ戻る。

<a id="storybook-deck-list-24"></a>

### STORYBOOK-DECK-LIST-24 メニュー内のフォーカス移動で操作を失わない

カテゴリ: `interaction`

検証状況: 未実装

Given:

- View にフォーカスし、Download / Edit / Delete を個別の対象条件にする。

When:

- 一時的にフォーカスを外した後、同じメニュー内の対象へ移して選ぶ。

Then:

- 移動中に操作不能にならず、対象 callback を一度通知する。

<a id="storybook-deck-list-25"></a>

### STORYBOOK-DECK-LIST-25 外へ移ったフォーカスを奪わない

カテゴリ: `interaction`

検証状況: 未実装

Given:

- 開いたメニュー内にフォーカスし、外側にも操作可能なボタンがある。

When:

- メニューから外側のボタンへフォーカスを移す。

Then:

- メニューは閉じ、フォーカスは外側のボタンに残る。

<a id="storybook-deck-list-26"></a>

### STORYBOOK-DECK-LIST-26 再有効化してもメニューを閉じたままにする

カテゴリ: `interaction`

検証状況: 未実装

Given:

- メニューを開いている。

When:

- 無効状態へ変更し、その後有効状態に戻す。

Then:

- 無効化時は開くボタンが無効になり、メニューが消える。再有効化ではボタンだけが有効に戻り、メニューは閉じたままである。
