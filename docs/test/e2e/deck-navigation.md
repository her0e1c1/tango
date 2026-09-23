# Deck Navigation E2E テスト仕様書

## 目的

Deck と Card 一覧の主要な route を開き、存在しない Deck から利用可能な画面へ復帰できることを確認する。
一覧と学習の filter 分離は [Card Filter](./card-filter.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-NAVIGATION-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-navigation-01) |
| DECK-NAVIGATION-02 | read | [存在しない Deck から復帰できる](#deck-navigation-02) |
| DECK-NAVIGATION-03 | read | [remote Deck を学習データを変更せずに閲覧できる](#deck-navigation-03) |
| DECK-NAVIGATION-04 | read | [local-only Deck の閲覧位置を保存せずに再入場できる](#deck-navigation-04) |
| DECK-NAVIGATION-05 | read | [学習条件に依存せず全 Card を標準順で閲覧できる](#deck-navigation-05) |
| DECK-NAVIGATION-06 | read | [復習期日前の Card も閲覧できる](#deck-navigation-06) |
| DECK-NAVIGATION-07 | read | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](#deck-navigation-07) |
| DECK-NAVIGATION-08 | read | [1件の Card の長い解答を touch で閲覧して終了できる](#deck-navigation-08) |
| DECK-NAVIGATION-09 | write | [閲覧と学習で表示設定と操作ヘルプを共有できる](#deck-navigation-09) |
| DECK-NAVIGATION-10 | read | [学習データを保存せずに閲覧を自動再生できる](#deck-navigation-10) |
| DECK-NAVIGATION-11 | read | [閲覧の進捗スライダーで前後へ移動できる](#deck-navigation-11) |
| DECK-NAVIGATION-12 | read | [保持中の復習件数と学習導線を表示できる](#deck-navigation-12) |
| DECK-NAVIGATION-13 | read | [復習期限の到達で一覧を更新できる](#deck-navigation-13) |
| DECK-NAVIGATION-14 | write | [view mode で長い表面を読みながら移動を防止できる](#deck-navigation-14) |
| DECK-NAVIGATION-15 | write | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](#deck-navigation-15) |
| DECK-NAVIGATION-16 | write | [view mode 中も閲覧ボタンと自動再生を使える](#deck-navigation-16) |

<a id="deck-navigation-01"></a>

### DECK-NAVIGATION-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- 認証済みユーザーが所有する Deck が存在する。
- 対象 Deck に Card が存在する。
- 追加のサーバー seed ケースとして、通常の英数字 ID と、その ID に query／fragment の区切り文字を含む接尾辞を付けた Deck が共存し、それぞれ異なる名前と Card 本文を持つ。これらは現在のスキーマが受け付ける保存済みデータであり、作成フォームによる ID 指定ではない。

When:

- Deck 一覧上部の「追加」を開き、作成とインポートの項目を確認する。
- keyboard の矢印キーで項目を移動し、Escape で閉じる。mobile では下部メニューの「閉じる」と背景のタップでも閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。
- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存操作をせず一覧へ戻る。
- 対象 Deck を選択する。
- 特殊 ID のケースでは各 Deck を一覧から開き、生成された URL の直接表示と reload も行う。

Then:

- 一覧のアクションには作成とインポートが表示され、一覧が空の場合も利用できる。
- Escape、mobile の「閉じる」、背景のタップでメニューが閉じ、操作を実行せずに開いたボタンへ focus が戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- 作成とインポートの項目は、それぞれ既存の作成画面とインポート画面へ遷移する。
- 対象 Deck の Card 一覧へ遷移する。デッキ名の読み上げ名は「Open cards in …」／「…のカード一覧を開く」とし、学習進捗を変更しない View／閲覧メニューと区別できる。
- 対象 Card の front text が表示される。
- 特殊 ID のケースでは選択した完全な ID の各 Card が1件ずつ表示され、同じ接頭辞の別 Deck の Card は存在しない。
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

- Deck 一覧の対象 Deck の三点メニューを開き、View を選択する。
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
- 匿名のまま作成 UI で Local Deck と2枚の Card を用意し、必要な Session は学習開始 UI で開始する。生成 ID は URL から取得する。
- 作成順を閲覧順と仮定せず、最初の View で表示された Card を先頭として、移動と再入場後の順序を確認する。
- local-only Deck に複数の Card と学習 session が存在する。

When:

- Deck 一覧の対象 Deck の三点メニューから View を開き、Card の裏面と次の Card を閲覧する。
- 途中で reload し、戻るボタンで一覧へ戻って再入場する。
- 前後ボタンでそれぞれ閲覧の端を越える。

Then:

- 移動先と reload・再入場後は表面を表示し、reload・再入場後は先頭に戻る。
- 戻るボタンと両端を越える操作で Deck 一覧へ戻る。
- local-only Deck、Card、学習履歴、学習 session、設定は変化せず、remote にも作成されない。
- browser error が発生しない。

<a id="deck-navigation-05"></a>

### DECK-NAVIGATION-05 学習条件に依存せず全 Card を標準順で閲覧できる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 学習用の tag filter に一致する Card が学習の枚数上限を超えて存在する。
- 学習用の tag filter に一致しない Card も同じ Deck に存在する。
- 学習の shuffle が有効であり、Card フィルターは未設定である。

When:

- Deck 一覧の対象 Deck の三点メニューから View を開き、対象 Deck の全 Card を順に閲覧する。

Then:

- 絞り込みなしの Card 一覧と同じ標準順で、対象 Deck の全 Card を表示する。
- 学習用の tag filter、学習の枚数上限、shuffle は閲覧対象と順序に適用しない。
- 最終 Card の次で Deck 一覧へ戻る。
- 保存済みの学習条件、Card、学習履歴、設定を変更せず、学習 session を作成しない。
- browser error が発生しない。

<a id="deck-navigation-06"></a>

### DECK-NAVIGATION-06 復習期日前の Card も閲覧できる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日を過ぎた Card、未来に復習予定の Card、期日未設定の Card が存在する。
- Respect review schedule が有効であり、Card フィルターは未設定である。

When:

- Deck の閲覧画面を開き、対象の全 Card を順に閲覧する。

Then:

- 復習期日にかかわらず、対象 Deck の全 Card を標準順で表示する。
- 未来に復習予定の Card も表裏を閲覧でき、総数にはその Card も含まれる。
- Card の復習期日や学習履歴、設定を変更せず、学習 session を作成しない。
- browser error が発生しない。

<a id="deck-navigation-07"></a>

### DECK-NAVIGATION-07 閲覧対象が空または Deck が存在しない場合に一覧へ戻れる

カテゴリ: `read`

検証状況: 未実装

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card が1枚も存在しない Deck がある。学習用の条件に一致しないだけの Deck ではない。
- 別の route が参照する Deck は存在しない。

When:

- Card が存在しない Deck の View を開いて戻る操作を行い、存在しない Deck の閲覧 route を直接開いて復帰する。

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
- 閲覧表面の鉛筆リンクから現在の Card の既存編集画面を開く。
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
- 匿名のまま作成 UI で Local Deck と2枚の Card を用意し、必要な Session は学習開始 UI で開始する。生成 ID は URL から取得する。
- 作成順を閲覧順と仮定せず、最初の View で表示された Card を先頭として、移動と再入場後の順序を確認する。
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

### DECK-NAVIGATION-12 保持中の復習件数と学習導線を表示できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日を過ぎた、未来の、未設定の Card があり、間隔反復が有効である。
- 追加の Page / query ケースでは学習中、空、filter 不一致、future-only、new-only の Deck が共存する。tag の AND / OR 条件を使用する。

When:

- 一覧の合計と Deck 別の件数を確認し、「件数について」と0件の理由を必要に応じて展開する。keyboard で Review または Study new を選択する。
- 追加ケースでは間隔反復を無効にし、英語・日本語、mobile、dark、zoom 表示も確認する。

Then:

- 「件数について」を開くと、現在保持中のデータと保存済み filter に基づく件数である旨を表示する。maximum cards と shuffle は件数に影響しない。
- 「学習中」「今学習できるデッキ」「その他」の見出し付き一覧に各 Deck を一度だけ表示し、空の区分は隠す。名前から Card 一覧を開ける。各カードは Card 数、学習中の現在位置、復習・新規件数と1つの主学習操作を表示し、閲覧・管理は右上の三点メニューにまとめる。名前の読み上げには Card 数と学習中の現在位置を含める。カテゴリと最終学習時刻は表示しない。
- mobile では1列のカードと横幅いっぱいの主学習ボタンを表示する。広い画面では複数列とし、長い名前も折り返して表示する。主要操作は44px以上の高さを持つ。学習中のバーは現在位置の視覚的な目安であり、完了率ではない。
- 学習中の Deck は recent-first で先頭に並び、Continue と現在位置を表示する。その後、復習対象を最も早い dueAt 順、new-only、その他を名前順に並べる。同順位は名前順となる。現在位置は完了枚数ではない。
- 合計には学習中の Deck も一度だけ含める。0件の行は「復習・新規なし」を表示し、展開すると保持中 Card がない場合、filter 不一致、future-only を区別する理由を表示する。future-only は次回復習日時を表示し、Study は常に利用できる。完全同期や学習完了は断定しない。
- Review / Study new は既存の開始設定画面へ遷移するだけで Session を作成・置換しない。Continue は既存 Session を再開する。
- 間隔反復 OFF では復習・新規件数とその補足を隠し、Continue または Study と閲覧・管理操作を維持する。
- 一覧表示と開始設定画面への遷移で保存済み Deck・Card・Session を変更しない。browser error が発生しない。

<a id="deck-navigation-13"></a>

### DECK-NAVIGATION-13 復習期限の到達で一覧を更新できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、browser clock は future Card の期日直前で停止している。
- 追加の query ケースでは複数 Deck に未来の期限があり、Card・Deck・filter・設定・Session の変更と画面復帰を確認する。

When:

- 一覧を表示したまま browser clock を期日まで進める。

Then:

- dueAt <= now となった Card を due に加算し、同じ時刻で一覧の並び順と合計を更新する。
- 入力変更、focus / visibility 復帰でも再評価し、一覧全体で期限 timer は最大1つ、unmount で解除する。
- Session の順序・位置、Card の schedule、永続データを変更しない。browser error が発生しない。

<a id="deck-navigation-14"></a>

### DECK-NAVIGATION-14 view mode で長い表面を読みながら移動を防止できる

カテゴリ: `write`

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い front text を持つ Card を Deck 閲覧画面で表示している。

When:

- view mode を ON にして wheel・touch・方向キーでスクロールし、左右・上下へドラッグする。

Then:

- 本文の先頭と末尾を読める。スワイプ・方向キーは前後の Card への移動や画面退出を起こさず、view mode を維持する。
- 学習データは変更されない。
- browser error が発生しない。

<a id="deck-navigation-15"></a>

### DECK-NAVIGATION-15 閲覧の view mode 終了後に通常の表裏操作へ戻れる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Deck 閲覧画面で view mode が ON である。

When:

- 本文タップと Enter でそれぞれ view mode を終了し、通常の表面から裏面へ切り替える。

Then:

- 終了操作では表面を維持する。終了後の表裏切り替えと裏面のスクロール・タップ・左右移動は従来どおり動作する。
- browser error が発生しない。

<a id="deck-navigation-16"></a>

### DECK-NAVIGATION-16 view mode 中も閲覧ボタンと自動再生を使える

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card を閲覧でき、view mode が ON、自動再生の間隔が正の値である。

When:

- 次の Card ボタンと再生ボタンで順に次の Card へ進む。

Then:

- ボタンと自動再生で次の Card へ進み、view mode を維持する。学習データは変更されない。
- browser error が発生しない。
