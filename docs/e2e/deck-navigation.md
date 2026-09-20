# Deck Navigation E2E テスト仕様書

## 目的

Deck と Card 一覧の主要な route を開き、存在しない Deck から利用可能な画面へ復帰できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-01) |
| DECK-06 | read | [存在しない Deck から復帰できる](#deck-06) |
| DECK-13 | read | [remote Deck を学習データを変更せずに閲覧できる](#deck-13) |
| DECK-14 | read | [local-only Deck の閲覧位置を保存せずに再入場できる](#deck-14) |
| DECK-15 | write | [現在の難易度と tag filter に一致する全 Card を標準順で閲覧できる](#deck-15) |
| DECK-16 | read | [復習期日の設定を閲覧対象へ反映できる](#deck-16) |
| DECK-17 | read | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](#deck-17) |
| DECK-18 | read | [1件の Card の長い解答を touch で閲覧して終了できる](#deck-18) |

<a id="deck-01"></a>

### DECK-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に Card が存在する。
- 追加の local-only ケースとして、通常の英数字 ID と、その ID に query／fragment の区切り文字を含む接尾辞を付けた Deck が共存し、それぞれ異なる名前と Card 本文を持つ。これらは現在のスキーマが受け付ける保存済みデータであり、作成フォームによる ID 指定ではない。

When:

- Deck 一覧上部の「アクション」を開き、作成とインポートの項目を確認する。
- keyboard の矢印キーで項目を移動し、Escape で閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。
- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存操作をせず一覧へ戻る。
- 対象 Deck を選択する。
- local-only ケースでは各 Deck を一覧から開き、生成された URL の直接表示と reload も行う。

Then:

- 一覧のアクションには作成とインポートが表示され、一覧が空の場合も利用できる。
- Escape でメニューが閉じ、開いたボタンに focus が戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- 作成とインポートの項目は、それぞれ既存の作成画面とインポート画面へ遷移する。
- 対象 Deck の Card 一覧へ遷移する。
- 対象 Card の front text が表示される。
- local-only ケースでは選択した完全な ID の Card だけが表示され、同じ接頭辞の別 Deck の Card は表示されない。
- ID 内の `?` と `#` は1つのパスパラメーターの値としてエンコードされ、query と fragment は空のままとなる。直接表示と reload 後も対象と内容が一致する。
- 表示と遷移によって保存済み Deck・Card の ID や内容は変更されない。
- browser error が発生しない。

<a id="deck-06"></a>

### DECK-06 存在しない Deck から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーの保存先に、route が参照する Deck が存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。

<a id="deck-13"></a>

### DECK-13 remote Deck を学習データを変更せずに閲覧できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- remote Deck に複数の Card と途中の学習 session が存在する。
- 学習の swipe mapping、裏面維持、自動再生の設定が有効でも、閲覧には適用しない。

When:

- Deck 一覧の Continue の横にある View を選択する。
- Card をクリックして表裏を切り替え、両面で左右の primary mouse drag、左右キー、前後ボタンを使う。
- non-primary mouse drag、上下の drag と上下キーを操作する。
- 先頭から前、末尾から次へ移動し、再入場も行う。

Then:

- 専用の閲覧 route で Deck 名と現在位置／総数を表示し、最初の Card の表面から開始する。
- 左は前、右は次へ移動し、移動先は常に表面を表示する。drag 直後の click で誤反転しない。
- non-primary mouse と上下操作は Card を移動せず、表裏も変更しない。
- 両端を越えると Deck 一覧へ戻る。rating と自動再生の操作は表示しない。
- 閲覧、退出、再入場によって保存済み Deck、Card、学習履歴、学習 session、設定は変化しない。
- browser error が発生しない。

<a id="deck-14"></a>

### DECK-14 local-only Deck の閲覧位置を保存せずに再入場できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- local-only Deck に複数の Card と学習 session が存在する。

When:

- Deck 一覧から View を開き、Card の裏面と次の Card を閲覧する。
- 途中で reload し、戻るボタンで一覧へ戻って再入場する。
- 前後ボタンでそれぞれ閲覧の端を越える。

Then:

- 移動先と reload・再入場後は表面を表示し、reload・再入場後は先頭に戻る。
- 戻るボタンと両端を越える操作で Deck 一覧へ戻る。
- local-only Deck、Card、学習履歴、学習 session、設定は変化せず、remote にも作成されない。
- browser error が発生しない。

<a id="deck-15"></a>

### DECK-15 現在の難易度と tag filter に一致する全 Card を標準順で閲覧できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 難易度と tag の両方に一致する Card が学習の枚数上限を超えて存在する。
- 難易度だけ、または tag だけが条件から外れる Card も存在する。
- 学習の shuffle が有効である。
- Card 一覧の filter 保存を一時保留でき、保留中も追加の条件を選択できる。

When:

- Deck 一覧の Study の横から View を開き、対象の全 Card を順に閲覧する。
- Card 一覧へ戻って難易度の保存を保留し、その後 tag 条件を変更する。
- 保存完了前に Deck 一覧を経由して View を開き、閲覧終了後に保留した保存を完了する。

Then:

- Card 一覧の標準順で条件に一致する全 Card を表示し、学習の枚数上限と shuffle は適用しない。
- 条件から外れる Card は表示せず、最終 Card の次で一覧へ戻る。
- 保存待ちでも最新の難易度と tag の選択条件を引き継ぎ、まだ remote に反映していない対象 Card を表示する。
- 保存保留中の閲覧で永続データは変化しない。保留の解除後は先に行った filter 編集だけを保存し、Card、学習履歴、設定を変更せず、学習 session を作成しない。
- browser error が発生しない。

<a id="deck-16"></a>

### DECK-16 復習期日の設定を閲覧対象へ反映できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日を過ぎた Card、未来に復習予定の Card、期日未設定の Card が存在する。
- Respect review schedule が有効である。

When:

- Deck の閲覧画面を開き、対象の全 Card を順に閲覧する。

Then:

- 期日を過ぎた Card と期日未設定の Card だけを標準順で表示する。
- Card の復習期日や学習履歴、設定を変更せず、学習 session を作成しない。
- browser error が発生しない。

<a id="deck-17"></a>

### DECK-17 閲覧対象が空または Deck が存在しない場合に一覧へ戻れる

カテゴリ: `read`

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 現在の filter に一致する Card がない Deck が存在する。
- 別の route が参照する Deck は存在しない。

When:

- 対象 Deck の View を開いて戻る操作を行い、存在しない Deck の閲覧 route を直接開いて復帰する。

Then:

- 空状態では対象がない旨と一覧へ戻る操作を表示する。
- 存在しない Deck では Deck が利用できない旨と一覧へ戻る操作を表示する。
- どちらも Card の操作を表示せず、保存データを変更しない。
- browser error が発生しない。

<a id="deck-18"></a>

### DECK-18 1件の Card の長い解答を touch で閲覧して終了できる

カテゴリ: `read`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- Deck に表示領域より長い裏面を持つ Card が1件存在する。
- 狭い画面で閲覧する。

When:

- 表面を touch で開き、裏面を wheel と縦方向の touch でスクロールする。
- 裏面から左へ swipe して一覧に戻り、再入場後は表面から右へ swipe する。

Then:

- 長い裏面が縦スクロールでき、縦操作で Card の移動や誤反転は起きない。
- 1件中1件の位置を表示し、左右どちらの端を越えても一覧へ戻る。
- Deck、Card、学習履歴、学習 session、設定は変化しない。
- browser error が発生しない。
