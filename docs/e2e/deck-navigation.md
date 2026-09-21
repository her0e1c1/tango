# Deck Navigation E2E テスト仕様書

## 目的

Deck と Card 一覧の主要な route を開き、存在しない Deck から利用可能な画面へ復帰できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-NAVIGATION-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-navigation-01) |
| DECK-NAVIGATION-02 | read | [存在しない Deck から復帰できる](#deck-navigation-02) |
| DECK-NAVIGATION-03 | read | [remote Deck を学習データを変更せずに閲覧できる](#deck-navigation-03) |
| DECK-NAVIGATION-04 | read | [local-only Deck の閲覧位置を保存せずに再入場できる](#deck-navigation-04) |
| DECK-NAVIGATION-05 | write | [現在の難易度と tag filter に一致する全 Card を標準順で閲覧できる](#deck-navigation-05) |
| DECK-NAVIGATION-06 | read | [復習期日の設定を閲覧対象へ反映できる](#deck-navigation-06) |
| DECK-NAVIGATION-07 | read | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](#deck-navigation-07) |
| DECK-NAVIGATION-08 | read | [1件の Card の長い解答を touch で閲覧して終了できる](#deck-navigation-08) |
| DECK-NAVIGATION-09 | write | [閲覧と学習で表示設定と操作ヘルプを共有できる](#deck-navigation-09) |
| DECK-NAVIGATION-10 | read | [学習データを保存せずに閲覧を自動再生できる](#deck-navigation-10) |
| DECK-NAVIGATION-11 | read | [閲覧の進捗スライダーで前後へ移動できる](#deck-navigation-11) |
| DECK-NAVIGATION-12 | read | [Deck 一覧の復習件数から学習開始設定へ遷移できる](#deck-navigation-12) |
| DECK-NAVIGATION-13 | read | [開いたままの Deck 一覧が復習期日の到達を反映する](#deck-navigation-13) |

<a id="deck-navigation-01"></a>

### DECK-NAVIGATION-01 Deck 一覧から Card 一覧へ遷移できる

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

<a id="deck-navigation-02"></a>

### DECK-NAVIGATION-02 存在しない Deck から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーの保存先に、route が参照する Deck が存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面から home recovery action を実行する。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。

<a id="deck-navigation-03"></a>

### DECK-NAVIGATION-03 remote Deck を学習データを変更せずに閲覧できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- remote Deck に複数の Card と途中の学習 session が存在する。
- 学習の swipe mapping、裏面維持、自動再生で開始の設定が有効でも、閲覧には適用しない。

When:

- Deck 一覧の Continue の横にある View を選択する。
- Card をクリックして表裏を切り替え、両面で左右の primary mouse drag と左右キー、表面で前後ボタンを使う。
- non-primary mouse drag、上下の drag と上下キーを操作する。
- 先頭から前、末尾から次へ移動し、再入場も行う。

Then:

- 専用の閲覧 route で学習画面と共通の UI と現在位置／総数を表示し、最初の Card の表面から停止状態で開始する。表面の読み上げには Card 本文も含める。
- 左は前、右は次へ移動し、移動先は常に表面を表示する。drag 直後の click で誤反転しない。
- non-primary mouse と上下操作は Card を移動せず、表裏も変更しない。
- 裏面にリンクや入力部品が含まれる場合、その操作では Card を反転せず、部品本来の動作を維持する。
- 両端を越えると Deck 一覧へ戻る。上下の操作ボタンは無効で、rating は行わない。再生操作を表示するが、自動では開始しない。
- 裏面では本文だけを表示し、ツールバー・詳細・操作パネルを隠す。左右の drag と左右キーは引き続き利用でき、前後ボタンは表面で利用する。
- 閲覧、退出、再入場によって保存済み Deck、Card、学習履歴、学習 session、設定は変化しない。
- browser error が発生しない。

<a id="deck-navigation-04"></a>

### DECK-NAVIGATION-04 local-only Deck の閲覧位置を保存せずに再入場できる

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

<a id="deck-navigation-05"></a>

### DECK-NAVIGATION-05 現在の難易度と tag filter に一致する全 Card を標準順で閲覧できる

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
- remote 同期待ちでも cache に保存した最新の難易度と tag の選択条件を引き継ぎ、対象 Card を表示する。
- 保存保留中の閲覧で永続データは変化しない。保留の解除後は先に行った filter 編集だけを保存し、Card、学習履歴、設定を変更せず、学習 session を作成しない。
- browser error が発生しない。

<a id="deck-navigation-06"></a>

### DECK-NAVIGATION-06 復習期日の設定を閲覧対象へ反映できる

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

<a id="deck-navigation-07"></a>

### DECK-NAVIGATION-07 閲覧対象が空または Deck が存在しない場合に一覧へ戻れる

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

<a id="deck-navigation-08"></a>

### DECK-NAVIGATION-08 1件の Card の長い解答を touch で閲覧して終了できる

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

<a id="deck-navigation-09"></a>

### DECK-NAVIGATION-09 閲覧と学習で表示設定と操作ヘルプを共有できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- Card の詳細、Help、方向ボタン、再生操作、閲覧画面の編集リンクを表示する設定である。

When:

- Deck の View を開き、Help の操作説明を確認する。
- 閲覧表面の鉛筆リンクから現在の Card の既存編集画面を開き、保存せず閲覧へ戻る。
- 「…」内の鉛筆で編集リンクの表示・非表示を切り替え、他の表示設定も切り替える。
- reload してから同じ Deck の学習を Continue する。

Then:

- 閲覧の Help は左右を前後移動、上下を無効として説明し、反転・再生・表示切替・退出の操作を示す。
- Help を閉じると起動ボタンに focus が戻り、開いている間は背景の shortcut を実行しない。
- 閲覧の編集リンクは初期状態で表示され、アイコンのみで現在の Card の既存編集画面を開く。表示設定の変更では編集画面へ遷移しない。
- 編集リンクの表示設定は reload 後も維持される。非表示でも「…」から再表示できる。
- 裏面では既存の操作群と同じく編集リンクを隠す。狭い画面でも操作が重ならず、en/ja の読み上げ名とキーボード操作を利用できる。
- 編集リンクは閲覧専用とし、その他の表示設定は reload 後と学習画面で共通に反映される。
- 明示的に変更した表示設定だけを保存し、Deck、Card、学習履歴と閲覧前の学習再開位置を変更しない。
- browser error が発生しない。

<a id="deck-navigation-10"></a>

### DECK-NAVIGATION-10 学習データを保存せずに閲覧を自動再生できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 自動再生で開始が有効で、再生間隔は正の値である。
- 追加ケースとして、間隔0、local-only、退出と再入場も確認する。

When:

- View を開いて待ち、再生ボタンまたは Space で再生を開始する。
- Help を開閉し、再生の停止と再開、手動移動、最後の Card の自動送りを行う。

Then:

- 閲覧は常に停止状態で開始し、明示的に再生するまで移動しない。
- 再生間隔ごとに次の Card の表面へ移動し、最後の次では Deck 一覧へ戻る。
- Help 中はタイマーだけが停止し、閉じると選択済みの再生状態に従って新しい待ち時間を開始する。
- 手動移動後は待ち時間を更新する。退出した閲覧のタイマーは再入場後に作用しない。
- 間隔0では再生操作とスライダーを表示せず、自動送りしない。Help には利用不可の説明を表示する。
- Deck、Card、学習履歴、学習 session、設定を変更しない。
- browser error が発生しない。

<a id="deck-navigation-11"></a>

### DECK-NAVIGATION-11 閲覧の進捗スライダーで前後へ移動できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 閲覧対象の Card が複数あり、再生操作を表示する設定である。

When:

- View の進捗スライダーを pointer または keyboard で前方と後方へ動かす。
- Card を反転し、左右キーで移動する。再入場する。

Then:

- スライダーで前後の任意の Card へ移動でき、位置表示と本文が一致する。
- 移動先と再入場後は表面を表示し、再入場後は先頭に戻る。
- スライダーに focus がある間はその標準キー操作を優先し、Card 移動を二重に実行しない。
- 本文上の Enter は反転、Space は再生切替、b は方向ボタンの表示切替として働く。入力欄やボタンの標準キー操作を妨げず、裏面のスクロール領域に focus がある場合の Space はスクロールを優先する。
- Deck、Card、学習履歴、学習 session、設定を変更しない。表示設定を明示的に切り替えた場合のみ、その設定を保存する。
- browser error が発生しない。

<a id="deck-navigation-12"></a>

### DECK-NAVIGATION-12 Deck 一覧の復習件数から学習開始設定へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日を過ぎた Card、未来に復習予定の Card、期日未設定の Card が同じ Deck に存在する。
- Respect review schedule が有効で、Maximum cards は学習候補全体より少なく、shuffle が有効である。
- 同じ表示契約の追加ケースとして、複数 Deck、進行中 Session、new-only、Card 0 件、difficulty / tag filter に一致しない Card、future-only、間隔反復 OFF、日本語を unit / Page / Storybook で確認する。

When:

- Deck 一覧を開き、合計件数と Deck 別の件数・区分を確認する。
- keyboard で Review を実行し、学習開始設定画面を開く。Start は実行しない。

Then:

- 全 Card 数とは別に due / new の件数を表示し、合計に各 Deck を一度だけ加算する。
- difficulty の上下限と保存済み tag の AND / OR 条件を適用し、Maximum cards と shuffle は件数に影響しない。
- due は現在時刻以前の期日を指す。有効な FSRS schedule を旧 nextSeeingAt より優先し、期日がない Card は numberOfSeen に関係なく new に数える。不正な schedule を new や 0 件へ補完しない。
- Session がある Deck は件数が 0 でも Studying と既存 Continue・進捗を維持する。それ以外で due / new がある Deck は Review now に一度だけ表示する。
- Studying は既存の直近学習順、Review now は最も早い dueAt 順の Deck、new-only の Deck の順とし、同順位と Other decks は Deck 名順にする。空の区分の見出しは表示しない。
- Review と new-only の Study new は既存の学習開始設定画面へ遷移し、一覧から Session を作成・置換しない。Continue は既存の再開処理へ接続する。
- 保持中 Card 0 件、filter に一致する Card なし、future-only を区別する。future-only には filter 後の最も近い次回復習日時を表示する。
- 件数がこの端末の保持中データと保存済み filter に基づくことを説明し、0 件から完全同期や復習完了を断定しない。間隔反復 OFF では追加の件数・区分を表示しない。
- 英語と日本語で件数・操作・日時が読める。狭い画面・dark mode・拡大表示でも操作を維持する。
- 学習開始設定画面に到達しても Deck、Card、Session、回答履歴は変更されない。browser error が発生しない。

<a id="deck-navigation-13"></a>

### DECK-NAVIGATION-13 開いたままの Deck 一覧が復習期日の到達を反映する

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- Respect review schedule が有効である。
- browser clock はアプリの初期化前に固定する。ケース専用データの準備時に、fixture の未来の Card の復習期日を基準時刻の少し後へ設定する。
- 同じ期限更新契約の追加ケースとして、複数 Deck、遠い期日、入力変更、UID の切替、focus / visibility 復帰、間隔反復 OFF、unmount を unit / Page で確認する。

When:

- Deck 一覧を表示したまま、browser clock を次の復習期日の直前、期日ちょうどへ進める。

Then:

- 直前までは未来の Card を due に含めず、期日ちょうどに Deck 別と合計の due 件数へ加える。new 件数は変わらない。
- 同じ現在時刻で全 Deck を再評価し、必要な区分・順序も更新する。
- 次の起床時刻は filter 後の全 Deck の future な期日の最小値であり、filter 外の Card には起こされない。
- 一覧全体で timer は最大1つとし、遠い期限でも timeout の上限超過で連続実行しない。入力変更・画面復帰では現在時刻を使い、間隔反復 OFF と unmount では不要な timer を解除する。
- 再評価のための追加 query・listener・定期 polling を作らない。保存済み Session の順序・位置、Card の schedule、Deck、回答履歴を変更しない。
- 固定 sleep や本番コードのテスト専用 clock API を使わない。browser error が発生しない。
