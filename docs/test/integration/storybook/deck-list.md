# Deck List Storybook 結合テスト仕様書

## 目的

Deck 一覧の状態表示、操作要求、メニューの排他制御、キーボード操作と処理中の操作抑止を確認する。

## 検証境界

DeckList / DeckListCard / DeckActionsMenu と実際の子 UI。渡された表示データと callback を境界とし、実際の画面遷移、ダウンロード内容、件数集計、永続化は対象外。

関連 E2E: [deck-navigation](../../e2e/deck-navigation.md) / [study-session](../../e2e/study-session.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-DECK-LIST-01 | interaction | [一覧から Deck 作成を要求する](#storybook-deck-list-01) | DeckList :: `ListActions` |
| STORYBOOK-DECK-LIST-02 | interaction | [一覧から Deck インポートを要求する](#storybook-deck-list-02) | DeckList :: `ListActions` |
| STORYBOOK-DECK-LIST-03 | render | [固定文言を日本語にし Deck 名を保持する](#storybook-deck-list-03) | DeckList :: `Japanese` |
| STORYBOOK-DECK-LIST-04 | interaction | [Deck の閲覧を要求する](#storybook-deck-list-04) | DeckList :: `ViewDeck` |
| STORYBOOK-DECK-LIST-05 | render | [空の一覧にも追加導線を表示する](#storybook-deck-list-05) | DeckList :: `Empty` |
| STORYBOOK-DECK-LIST-06 | render | [復習対象件数と新規件数の説明を表示する](#storybook-deck-list-06) | DeckList :: `ReviewCounts` |
| STORYBOOK-DECK-LIST-07 | interaction | [ダウンロードを要求してメニューを閉じる](#storybook-deck-list-07) | DeckActionsMenu :: `Interaction` |
| STORYBOOK-DECK-LIST-08 | interaction | [学習履歴の表示を要求する](#storybook-deck-list-08) | DeckActionsMenu :: `History` |
| STORYBOOK-DECK-LIST-09 | render | [学習中と未開始の Deck を一つの一覧で表示する](#storybook-deck-list-09) | DeckList :: `SectionPresentation`（未実装） |
| STORYBOOK-DECK-LIST-10 | interaction | [追加メニューと各 Deck メニューを同時に開かない](#storybook-deck-list-10) | DeckList :: `ExclusiveMenus`（未実装） |
| STORYBOOK-DECK-LIST-11 | interaction | [追加メニューをキーボードで開閉する](#storybook-deck-list-11) | DeckList :: `KeyboardAddMenu`（未実装） |
| STORYBOOK-DECK-LIST-12 | interaction | [作成要求後に追加ボタンへフォーカスを戻す](#storybook-deck-list-12) | DeckList :: `AddMenuFocus`（未実装） |
| STORYBOOK-DECK-LIST-13 | render | [確認中に空の一覧と断定しない](#storybook-deck-list-13) | DeckList :: `CheckingContract`（未実装） |
| STORYBOOK-DECK-LIST-14 | interaction | [初期データ取得失敗から操作を選べる](#storybook-deck-list-14) | DeckList :: `BootstrapErrorActions`（未実装） |
| STORYBOOK-DECK-LIST-15 | interaction | [復習対象0件の理由を区別する](#storybook-deck-list-15) | DeckListCard :: `ZeroReviewReasons`（未実装） |
| STORYBOOK-DECK-LIST-16 | interaction | [復習と新規学習を区別して開始を要求する](#storybook-deck-list-16) | DeckListCard :: `StudyIntent`（未実装） |
| STORYBOOK-DECK-LIST-17 | render | [学習中・復元済みの位置を簡潔に表示する](#storybook-deck-list-17) | DeckListCard :: `ProgressContract`（未実装） |
| STORYBOOK-DECK-LIST-18 | interaction | [未開始の Study 操作で行の閲覧を起動しない](#storybook-deck-list-18) | DeckListCard :: `InactiveStudy`（未実装） |
| STORYBOOK-DECK-LIST-19 | interaction | [各操作に対象 Deck の ID を渡す](#storybook-deck-list-19) | DeckListCard :: `ActionTargets`（未実装） |
| STORYBOOK-DECK-LIST-20 | render | [ローカル Deck にリモート表示を付けない](#storybook-deck-list-20) | DeckListCard :: `LocalContract`（未実装） |
| STORYBOOK-DECK-LIST-21 | render | [処理中の Deck 行だけを無効にする](#storybook-deck-list-21) | DeckListCard :: `PendingRowContract`（未実装） |
| STORYBOOK-DECK-LIST-22 | render | [未開始の Deck に Restart を表示しない](#storybook-deck-list-22) | DeckActionsMenu :: `InactiveContract`（未実装） |
| STORYBOOK-DECK-LIST-23 | interaction | [メニューを矢印キーで移動し Escape で戻る](#storybook-deck-list-23) | DeckActionsMenu :: `KeyboardContract`（未実装） |
| STORYBOOK-DECK-LIST-24 | interaction | [メニュー内のフォーカス移動で操作を失わない](#storybook-deck-list-24) | DeckActionsMenu :: `InternalFocusChange`（未実装） |
| STORYBOOK-DECK-LIST-25 | interaction | [外へ移ったフォーカスを奪わずメニューを閉じる](#storybook-deck-list-25) | DeckActionsMenu :: `ExternalFocusChange`（未実装） |
| STORYBOOK-DECK-LIST-26 | interaction | [無効化でメニューを閉じ再有効化でも閉じたままにする](#storybook-deck-list-26) | DeckActionsMenu :: `DisableAndReenable`（未実装） |

対応ファイルは [DeckList.stories.tsx](../../../../src/pages/deck-list/ui/DeckList.stories.tsx)、[DeckListCard.stories.tsx](../../../../src/pages/deck-list/ui/DeckListCard.stories.tsx)、[DeckActionsMenu.stories.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.stories.tsx)。09 以降の named export は追加予定であり、既存 `play` の検証済み項目ではない。

<a id="storybook-deck-list-01"></a>

### STORYBOOK-DECK-LIST-01 一覧から Deck 作成を要求する

カテゴリ: `interaction`

対応 Story: DeckList :: `ListActions`

Given:

- Deck 一覧に作成・インポート callback を渡す。

When:

- Add を開き、Create deck を選択する。

Then:

- 作成 callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-02"></a>

### STORYBOOK-DECK-LIST-02 一覧から Deck インポートを要求する

カテゴリ: `interaction`

対応 Story: DeckList :: `ListActions`

Given:

- Deck 一覧に作成・インポート callback を渡す。

When:

- Add を開き、Import decks を選択する。

Then:

- インポート callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-03"></a>

### STORYBOOK-DECK-LIST-03 固定文言を日本語にし Deck 名を保持する

カテゴリ: `render`

対応 Story: DeckList :: `Japanese`

Given:

- 日本語 locale の一覧にユーザーが名付けた Deck を渡す。

When:

- 一覧を描画する。

Then:

- 固定文言を日本語で表示し、Deck 名は入力された文字列のまま表示する。

<a id="storybook-deck-list-04"></a>

### STORYBOOK-DECK-LIST-04 Deck の閲覧を要求する

カテゴリ: `interaction`

対応 Story: DeckList :: `ViewDeck`

Given:

- Deck の閲覧 callback と Card 一覧への callback を区別して渡す。

When:

- 先頭 Deck のメニューを開き、View を選択する。

Then:

- Deck 閲覧 callback に対象 ID が渡され、Card 一覧 callback は通知されない。

<a id="storybook-deck-list-05"></a>

### STORYBOOK-DECK-LIST-05 空の一覧にも追加導線を表示する

カテゴリ: `render`

対応 Story: DeckList :: `Empty`

Given:

- Deck は0件で、空状態が確定している。

When:

- 一覧を描画し、Add メニューを開く。

Then:

- 0 decks、No decks yet、Create deck の導線を表示する。
- メニューの Create deck と Import decks は有効である。

<a id="storybook-deck-list-06"></a>

### STORYBOOK-DECK-LIST-06 復習対象件数と新規件数の説明を表示する

カテゴリ: `render`

対応 Story: DeckList :: `ReviewCounts`

Given:

- 復習対象5件、新規5件の表示データを持つ Deck を用意する。

When:

- 一覧を描画し、About counts を開く。

Then:

- 5 due / 5 new と件数の説明が表示される。

<a id="storybook-deck-list-07"></a>

### STORYBOOK-DECK-LIST-07 ダウンロードを要求してメニューを閉じる

カテゴリ: `interaction`

対応 Story: DeckActionsMenu :: `Interaction`

Given:

- Japanese verbs のメニューが閉じており、開閉を Story 側の状態に反映する。

When:

- メニューを開き、Download を選択する。

Then:

- ダウンロード callback が一度通知され、メニューが閉じる。

<a id="storybook-deck-list-08"></a>

### STORYBOOK-DECK-LIST-08 学習履歴の表示を要求する

カテゴリ: `interaction`

対応 Story: DeckActionsMenu :: `History`

Given:

- 学習履歴 callback を持つ Deck の操作メニューを用意する。

When:

- メニューを開き、Study history を選択する。

Then:

- 学習履歴 callback が一度通知される。

<a id="storybook-deck-list-09"></a>

### STORYBOOK-DECK-LIST-09 学習中と未開始の Deck を一つの一覧で表示する

カテゴリ: `render`

対応予定 Story: DeckList :: `SectionPresentation`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `renders a single list with active decks before other decks` / `keeps inactive decks available without a section heading`。

Given:

- Active deck が学習中、Other deck が未開始の2件を渡す場合と、未開始の1件だけを渡す場合を用意する。

When:

- 一覧を描画する。

Then:

- 2件の場合、Decks の一つの領域内に Active deck、Other deck の順で article を表示し、グループごとの見出しは作らない。
- 未開始だけでも Deck を表示し、存在しない学習中 Deck の Continue は表示しない。

<a id="storybook-deck-list-10"></a>

### STORYBOOK-DECK-LIST-10 追加メニューと各 Deck メニューを同時に開かない

カテゴリ: `interaction`

対応予定 Story: DeckList :: `ExclusiveMenus`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `opens one deck actions menu at a time` / `keeps the list and deck menus mutually exclusive`。

Given:

- 複数 Deck のある一覧を表示する。

When:

- Deck A、Deck B、Add、Deck A の順にメニューを開く。

Then:

- 直前のメニューは閉じ、常に最後に開いた一つだけを表示する。

<a id="storybook-deck-list-11"></a>

### STORYBOOK-DECK-LIST-11 追加メニューをキーボードで開閉する

カテゴリ: `interaction`

対応予定 Story: DeckList :: `KeyboardAddMenu`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `supports keyboard selection and Escape without executing an action`。

Given:

- Add にフォーカスしている。

When:

- Enter、ArrowDown、Escape の順に押す。

Then:

- Create deck、Import decks の順にフォーカスし、Escape で閉じて Add へ戻る。
- 作成・インポートは要求しない。

<a id="storybook-deck-list-12"></a>

### STORYBOOK-DECK-LIST-12 作成要求後に追加ボタンへフォーカスを戻す

カテゴリ: `interaction`

対応予定 Story: DeckList :: `AddMenuFocus`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `reports create and import intents and closes the list menu`。

Given:

- Add メニューを開いている。

When:

- Create deck を選択する。

Then:

- 作成のみを要求し、閉じたメニューの代わりに Add へフォーカスを戻す。

<a id="storybook-deck-list-13"></a>

### STORYBOOK-DECK-LIST-13 確認中に空の一覧と断定しない

カテゴリ: `render`

対応予定 Story: DeckList :: `CheckingContract`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `renders checking status without confirmed empty guidance`。

Given:

- 表示 Deck は0件だが、初期データを確認中である。

When:

- 一覧を描画する。

Then:

- status に Checking for sample deck… を表示し、No decks yet の見出しは表示しない。

<a id="storybook-deck-list-14"></a>

### STORYBOOK-DECK-LIST-14 初期データ取得失敗から操作を選べる

カテゴリ: `interaction`

対応予定 Story: DeckList :: `BootstrapErrorActions`（未実装）。元テスト: [DeckList.spec.tsx](../../../../src/pages/deck-list/ui/DeckList.spec.tsx) :: `renders bootstrap error with Retry, Create deck, and Import actions`。

Given:

- Deck が0件で初期データの取得に失敗し、各操作 callback を渡している。

When:

- Retry、Create deck、Import decks の各ボタンを操作する。

Then:

- alert と Unable to load sample deck を表示し、選んだ操作に対応する callback を通知する。
- 再取得の成功や実際の遷移は確認しない。

<a id="storybook-deck-list-15"></a>

### STORYBOOK-DECK-LIST-15 復習対象0件の理由を区別する

カテゴリ: `interaction`

対応予定 Story: DeckListCard :: `ZeroReviewReasons`（未実装、下記の3条件）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `distinguishes zero-count decks (%s cards)`。

Given:

- 復習対象・新規とも0件で、保持 Card 0件、保持3件で次回時刻なし、保持3件で次回時刻ありの3条件を用意する。

When:

- No due or new cards を開く。

Then:

- 初期状態では隠れていた説明が開き、それぞれ端末上に Card がない、保存済みフィルターに一致しない、次回復習日時を示す。
- どの条件でも Study ボタンは有効である。

<a id="storybook-deck-list-16"></a>

### STORYBOOK-DECK-LIST-16 復習と新規学習を区別して開始を要求する

カテゴリ: `interaction`

対応予定 Story: DeckListCard :: `StudyIntent`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `opens study settings for due=%s and new=%s`。

Given:

- Deck name の復習対象1件・新規2件の場合と、復習対象0件・新規2件の場合を用意する。

When:

- 主操作を押す。

Then:

- 前者は Review Deck name、後者は Study new cards in Deck name という名前になる。
- どちらも学習開始 callback に対象 Deck の ID を渡す。

<a id="storybook-deck-list-17"></a>

### STORYBOOK-DECK-LIST-17 学習中・復元済みの位置を簡潔に表示する

カテゴリ: `render`

対応予定 Story: DeckListCard :: `ProgressContract`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `renders compact progress for an active deck` / `shows the restored position without inventing a last-studied time`。

Given:

- 保持8件・学習対象3件の index 1 と、保持2件・学習対象2件の index 1・最終学習時刻不明の2条件を用意する。

When:

- Deck 行を描画する。

Then:

- 前者は 8 cards / Studying · Card 2 of 3 を表示し、一覧を開くボタンの説明にも件数と位置を関連付ける。カテゴリや progressbar は表示しない。
- 後者は 2 cards / Studying · Card 2 of 2 を説明に使い、不明な時刻を補わない。
- どちらも Continue を表示する。

<a id="storybook-deck-list-18"></a>

### STORYBOOK-DECK-LIST-18 未開始の Study 操作で行の閲覧を起動しない

カテゴリ: `interaction`

対応予定 Story: DeckListCard :: `InactiveStudy`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `renders the card count and Study action for an inactive deck` / `routes inactive Study without opening the row`。

Given:

- 学習セッションのない Deck name を表示し、学習と行の閲覧に別の callback を渡す。

When:

- Study Deck name を押す。

Then:

- 保持 Card 数と Study を表示し、学習開始 callback だけに対象 ID を渡す。
- 行を開く callback は通知されない。

<a id="storybook-deck-list-19"></a>

### STORYBOOK-DECK-LIST-19 各操作に対象 Deck の ID を渡す

カテゴリ: `interaction`

対応予定 Story: DeckListCard :: `ActionTargets`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `passes the deck id to navigation and management actions`。

Given:

- ID が deck-id の学習中 Deck を、各操作の callback とともに表示する。

When:

- 名前のボタン、Continue、メニューの View / Restart / Download / Edit / Delete をそれぞれ操作する。

Then:

- 各操作の callback に deck-id を渡し、未開始用の Study callback は通知しない。
- View は独立した行内ボタンではなく、メニューから選べる。

<a id="storybook-deck-list-20"></a>

### STORYBOOK-DECK-LIST-20 ローカル Deck にリモート表示を付けない

カテゴリ: `render`

対応予定 Story: DeckListCard :: `LocalContract`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `does not show the remote mode icon for a local deck`。

Given:

- ローカル Deck を用意する。

When:

- Deck 行を描画する。

Then:

- Remote deck のアイコンを表示しない。

<a id="storybook-deck-list-21"></a>

### STORYBOOK-DECK-LIST-21 処理中の Deck 行だけを無効にする

カテゴリ: `render`

対応予定 Story: DeckListCard :: `PendingRowContract`（未実装）。元テスト: [DeckListCard.spec.tsx](../../../../src/pages/deck-list/ui/DeckListCard.spec.tsx) :: `makes only the pending Deck row unavailable`。

Given:

- 2件の Deck のうち1件だけが処理中である。

When:

- 両方の行を描画する。

Then:

- 処理中の行は aria-busy が true で、名前、Study、メニューのボタンが無効になる。
- もう一方の行では同じボタンが有効なままである。

<a id="storybook-deck-list-22"></a>

### STORYBOOK-DECK-LIST-22 未開始の Deck に Restart を表示しない

カテゴリ: `render`

対応予定 Story: DeckActionsMenu :: `InactiveContract`（未実装）。元テスト: [DeckActionsMenu.spec.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.spec.tsx) :: `omits Restart for inactive decks`。

Given:

- 再開する学習セッションのない Deck のメニューを開いた状態にする。

When:

- メニューを描画する。

Then:

- View、Download、Edit、Study history、Delete の順に表示し、Restart は表示しない。

<a id="storybook-deck-list-23"></a>

### STORYBOOK-DECK-LIST-23 メニューを矢印キーで移動し Escape で戻る

カテゴリ: `interaction`

対応予定 Story: DeckActionsMenu :: `KeyboardContract`（未実装）。元テスト: [DeckActionsMenu.spec.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.spec.tsx) :: `supports arrow navigation and returns focus to the trigger on Escape`。

Given:

- Restart が利用できる Deck のメニューが閉じている。

When:

- メニューを開き、ArrowDown、Escape の順に押す。

Then:

- 開いた直後は View、ArrowDown 後は Restart にフォーカスする。
- Escape で閉じ、開くボタンへフォーカスを戻す。

<a id="storybook-deck-list-24"></a>

### STORYBOOK-DECK-LIST-24 メニュー内のフォーカス移動で操作を失わない

カテゴリ: `interaction`

対応予定 Story: DeckActionsMenu :: `InternalFocusChange`（未実装、Download / Edit / Delete の3条件）。元テスト: [DeckActionsMenu.spec.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.spec.tsx) :: `keeps management actions active when an ambiguous blur settles inside the menu`。

Given:

- 開いたメニューの View にフォーカスしている。

When:

- 一時的にフォーカスを外した後、同じメニュー内の対象項目へ移して選択する。

Then:

- フォーカス移動中に操作不能にならず、対象 callback を一度通知する。

<a id="storybook-deck-list-25"></a>

### STORYBOOK-DECK-LIST-25 外へ移ったフォーカスを奪わずメニューを閉じる

カテゴリ: `interaction`

対応予定 Story: DeckActionsMenu :: `ExternalFocusChange`（未実装）。元テスト: [DeckActionsMenu.spec.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.spec.tsx) :: `closes when an ambiguous blur settles on an external element`。

Given:

- メニュー内にフォーカスし、外側にも操作可能なボタンがある。

When:

- メニューからフォーカスを外し、その外側のボタンへ移す。

Then:

- メニューは閉じるが、フォーカスは外側のボタンに残る。

<a id="storybook-deck-list-26"></a>

### STORYBOOK-DECK-LIST-26 無効化でメニューを閉じ再有効化でも閉じたままにする

カテゴリ: `interaction`

対応予定 Story: DeckActionsMenu :: `DisableAndReenable`（未実装）。元テスト: [DeckActionsMenu.spec.tsx](../../../../src/pages/deck-list/ui/DeckActionsMenu.spec.tsx) :: `disables its trigger and hides a controlled open menu` / `closes controlled state when disabled so the menu stays closed when re-enabled`。

Given:

- Deck のメニューを開いている。

When:

- Story 側から無効状態にし、その後有効状態へ戻す。

Then:

- 無効化時は開くボタンが無効になり、メニューが消える。
- 再有効化時はボタンだけが有効に戻り、メニューは閉じたままである。

## 自動アサーションに含めない項目

`Checking` と `BootstrapError` は表示専用 Story である。13・14 の追加予定ケースを記載しても、確認中の表示や失敗時の再試行が現在の `play` で検証されたことにはならない。
