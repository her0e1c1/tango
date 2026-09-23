# Deck Navigation E2E テスト仕様書

## 目的

Deck と Card 一覧の主要な画面を開き、存在しない Deck から利用可能な画面へ復帰できることを確認する。閲覧だけでは学習結果や再開位置が変わらない。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-NAVIGATION-01 | read | [Deck 一覧から Card 一覧へ遷移できる](#deck-navigation-01) |
| DECK-NAVIGATION-02 | read | [存在しない Deck から復帰できる](#deck-navigation-02) |
| DECK-NAVIGATION-03 | read | [ログイン中の Deck を学習データを変更せずに閲覧できる](#deck-navigation-03) |
| DECK-NAVIGATION-04 | read | [匿名利用中の Deck を先頭から閲覧し直せる](#deck-navigation-04) |
| DECK-NAVIGATION-05 | write | [現在の tag filter に一致する全 Card を標準順で閲覧できる](#deck-navigation-05) |
| DECK-NAVIGATION-06 | read | [復習期日の設定を閲覧対象へ反映できる](#deck-navigation-06) |
| DECK-NAVIGATION-07 | read | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](#deck-navigation-07) |
| DECK-NAVIGATION-08 | read | [1件の Card の長い解答を touch で閲覧して終了できる](#deck-navigation-08) |
| DECK-NAVIGATION-09 | write | [閲覧と学習で表示設定と操作ヘルプを共有できる](#deck-navigation-09) |
| DECK-NAVIGATION-10 | read | [学習データを変更せずに閲覧を自動再生できる](#deck-navigation-10) |
| DECK-NAVIGATION-11 | read | [閲覧の進捗スライダーで前後へ移動できる](#deck-navigation-11) |
| DECK-NAVIGATION-12 | read | [読み込み済みの復習件数と学習導線を表示できる](#deck-navigation-12) |
| DECK-NAVIGATION-13 | read | [復習期限の到達で一覧を更新できる](#deck-navigation-13) |
| DECK-NAVIGATION-14 | write | [view mode で長い表面を読みながら移動を防止できる](#deck-navigation-14) |
| DECK-NAVIGATION-15 | write | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](#deck-navigation-15) |
| DECK-NAVIGATION-16 | write | [view mode 中も閲覧ボタンと自動再生を使える](#deck-navigation-16) |

<a id="deck-navigation-01"></a>

### DECK-NAVIGATION-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- 認証済みユーザーが所有する Deck と Card が存在する。
- URL の識別子が通常の英数字だけの Deck と、同じ英数字に `?` や `#` を含む接尾辞が続く Deck がある。それぞれ異なる名前と Card 本文で区別できる。

When:

- Deck 一覧上部の「追加」を開き、作成とインポートの項目を確認する。
- keyboard の矢印キーで項目を移動し、Escape で閉じる。mobile では下部メニューの「閉じる」と背景のタップでも閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。
- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存せず一覧へ戻る。
- 各 Deck を一覧から開き、その URL の直接表示と reload も行う。

Then:

- 一覧のアクションには作成とインポートが表示され、一覧が空の場合も利用できる。
- Escape、mobile の「閉じる」、背景のタップでメニューが閉じ、操作を実行せずに開いたボタンへ focus が戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- 作成とインポートの項目は、それぞれの画面へ遷移する。
- 対象 Deck の Card 一覧へ遷移する。デッキ名の読み上げ名は「Open cards in …」／「…のカード一覧を開く」とし、学習進捗を変更しない View／閲覧メニューと区別できる。
- 選択した Deck の Card 本文が表示され、似た識別子を持つ別の Deck の Card は表示されない。
- 識別子内の `?` と `#` は URL のパス内にエンコードされ、query と fragment は空のままとなる。直接表示と reload 後も同じ Deck と Card が表示される。
- 表示と遷移によって Deck・Card の内容や学習結果は変わらない。
- browser error が発生しない。

<a id="deck-navigation-02"></a>

### DECK-NAVIGATION-02 存在しない Deck から復帰できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 開こうとしている URL の Deck は存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。
- browser error が発生しない。

<a id="deck-navigation-03"></a>

### DECK-NAVIGATION-03 ログイン中の Deck を学習データを変更せずに閲覧できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に複数の Card と途中の学習 session が存在する。
- 学習の swipe の割り当て、裏面維持、自動再生で開始の設定が有効である。

When:

- Deck 一覧の対象 Deck の三点メニューを開き、View を選択する。
- Card をクリックして表裏を切り替え、両面で左右の primary mouse drag と左右キー、表面で前後ボタンを使う。
- non-primary mouse drag、上下の drag と上下キーを操作する。
- 先頭から前、末尾から次へ移動し、再入場も行う。

Then:

- 閲覧画面で現在位置／総数を表示し、最初の Card の表面から停止状態で開始する。表面の読み上げには Card 本文も含める。
- 左は前、右は次へ移動し、移動先は常に表面を表示する。drag 直後の click で誤反転しない。
- non-primary mouse と上下操作は Card を移動せず、表裏も変更しない。
- 裏面にリンクや入力部品が含まれる場合、その操作では Card を反転せず、部品本来の動作を維持する。
- 両端を越えると Deck 一覧へ戻る。上下の操作ボタンは無効で、評価は行わない。再生操作を表示するが、自動では開始しない。
- 裏面では本文だけを表示し、ツールバー・詳細・操作パネルを隠す。左右の drag と左右キーは引き続き利用でき、前後ボタンは表面で利用する。
- 閲覧、退出、再入場によって Deck、Card、学習履歴、学習の再開位置、設定は変化しない。
- browser error が発生しない。

<a id="deck-navigation-04"></a>

### DECK-NAVIGATION-04 匿名利用中の Deck を先頭から閲覧し直せる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、複数の Card と途中の学習 session が存在する。

When:

- Deck 一覧の対象 Deck の三点メニューから View を開き、Card の裏面と次の Card を閲覧する。
- 途中で reload し、戻るボタンで一覧へ戻って再入場する。
- 前後ボタンでそれぞれ閲覧の端を越える。

Then:

- 移動先は表面を表示する。reload・再入場後は最初に閲覧した先頭の Card の表面へ戻る。
- 戻るボタンと両端を越える操作で Deck 一覧へ戻る。
- Deck、Card、学習履歴、学習の再開位置、設定は変化せず、クラウドにも追加されない。
- browser error が発生しない。

<a id="deck-navigation-05"></a>

### DECK-NAVIGATION-05 現在の tag filter に一致する全 Card を標準順で閲覧できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- tag に一致する Card が学習の枚数上限を超えて存在する。
- tag が条件から外れる Card も存在する。
- 学習の shuffle が有効である。
- Card 一覧の filter の保存に時間がかかっており、その間も追加の条件を選択できる。

When:

- Deck 一覧の対象 Deck の三点メニューから View を開き、対象の全 Card を順に閲覧する。
- Card 一覧へ戻って tag filter を変更し、保存の完了前にさらに条件を変更する。
- 保存完了前に Deck 一覧を経由して View を開き、閲覧終了後に保存完了を待つ。

Then:

- Card 一覧の標準順で条件に一致する全 Card を表示し、学習の枚数上限と shuffle は適用しない。
- 条件から外れる Card は表示せず、最終 Card の次で一覧へ戻る。
- クラウドへの同期を待っている間も、最後に選んだ tag の条件で閲覧できる。
- 閲覧そのものでは Deck、Card、学習履歴、設定を変更せず、新しい学習 session も始まらない。保存が完了するのは、明示的に変更した filter だけである。
- browser error が発生しない。

<a id="deck-navigation-06"></a>

### DECK-NAVIGATION-06 復習期日の設定を閲覧対象へ反映できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日に達した Card、未来に復習予定の Card、期日未設定の Card が存在する。
- Respect review schedule が有効である。

When:

- Deck の閲覧画面を開き、対象の全 Card を順に閲覧する。

Then:

- 期日に達した Card と期日未設定の Card だけを標準順で表示する。
- Card の復習期日や学習履歴、設定を変更せず、新しい学習 session も始まらない。
- browser error が発生しない。

<a id="deck-navigation-07"></a>

### DECK-NAVIGATION-07 閲覧対象が空または Deck が存在しない場合に一覧へ戻れる

カテゴリ: `read`

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 現在の filter に一致する Card がない Deck が存在する。
- 別の閲覧 URL が示す Deck は存在しない。

When:

- 対象 Deck の View を開いて戻る操作を行い、存在しない Deck の閲覧 URL を直接開いて復帰する。

Then:

- 空状態では対象がない旨と一覧へ戻る操作を表示する。
- 存在しない Deck では Deck が利用できない旨と一覧へ戻る操作を表示する。
- どちらも Card の操作を表示せず、保存済みの内容や学習結果は変わらない。
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
- Deck、Card、学習履歴、学習の再開位置、設定は変化しない。
- browser error が発生しない。

<a id="deck-navigation-09"></a>

### DECK-NAVIGATION-09 閲覧と学習で表示設定と操作ヘルプを共有できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- Card の詳細、Help、方向ボタン、再生操作、閲覧画面の編集リンクを表示する設定である。

When:

- Deck の View を開き、Help の操作説明を確認する。
- 閲覧表面の鉛筆リンクから現在の Card の編集画面を開き、保存せず閲覧へ戻る。
- 「…」内の鉛筆で編集リンクの表示・非表示を切り替え、他の表示設定も切り替える。
- reload してから同じ Deck の学習を Continue する。

Then:

- 閲覧の Help は左右を前後移動、上下を無効として説明し、反転・再生・表示切替・退出の操作を示す。
- Help を閉じると起動ボタンに focus が戻り、開いている間は背景の shortcut を実行しない。
- 閲覧の編集リンクは初期状態で表示され、アイコンのみで現在の Card の編集画面を開く。表示設定の変更では編集画面へ遷移しない。
- 編集リンクの表示設定は reload 後も維持される。非表示でも「…」から再表示できる。
- 裏面では他の操作群と同じく編集リンクを隠す。狭い画面でも操作が重ならず、英語・日本語の読み上げ名とキーボード操作を利用できる。
- 編集リンクは閲覧専用とし、その他の表示設定は reload 後と学習画面で共通に反映される。
- 明示的に変更した表示設定だけが保存され、Deck、Card、学習履歴と閲覧前の学習再開位置は変わらない。
- browser error が発生しない。

<a id="deck-navigation-10"></a>

### DECK-NAVIGATION-10 学習データを変更せずに閲覧を自動再生できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 自動再生で開始が有効で、再生間隔は正の値である。
- 再生間隔が0の場合と匿名利用の場合にも、以下の該当する条件を適用する。

When:

- View を開いて待ち、再生ボタンまたは Space で再生を開始する。
- Help を開閉し、再生の停止と再開、手動移動、最後の Card の自動送りを行う。
- 閲覧を退出して再入場する。

Then:

- 閲覧は常に停止状態で開始し、明示的に再生するまで移動しない。
- 再生間隔ごとに次の Card の表面へ移動し、最後の次では Deck 一覧へ戻る。
- Help を開いている間は自動送りされない。閉じると、選択済みの再生状態に従って設定された間隔を待ってから次へ進む。
- 手動移動後も設定された間隔を待ってから次へ進む。退出前の再生によって、再入場後に勝手に Card が進むことはない。
- 間隔0では再生操作とスライダーを表示せず、自動送りしない。Help には利用不可の説明を表示する。
- Deck、Card、学習履歴、学習の再開位置、設定を変更しない。
- browser error が発生しない。

<a id="deck-navigation-11"></a>

### DECK-NAVIGATION-11 閲覧の進捗スライダーで前後へ移動できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、閲覧対象の Card が複数ある。
- 再生操作を表示する設定である。

When:

- View の進捗スライダーを pointer または keyboard で前方と後方へ動かす。
- Card を反転し、左右キーで移動する。再入場する。

Then:

- スライダーで前後の任意の Card へ移動でき、位置表示と本文が一致する。
- 移動先と再入場後は表面を表示し、再入場後は先頭に戻る。
- スライダーに focus がある間はその標準キー操作を優先し、Card 移動を二重に実行しない。
- 本文上の Enter は反転、Space は再生切替、b は方向ボタンの表示切替として働く。入力欄やボタンの標準キー操作を妨げず、裏面のスクロール領域に focus がある場合の Space はスクロールを優先する。
- Deck、Card、学習履歴、学習の再開位置、設定を変更しない。表示設定を明示的に切り替えた場合のみ、その設定が保存される。
- browser error が発生しない。

<a id="deck-navigation-12"></a>

### DECK-NAVIGATION-12 読み込み済みの復習件数と学習導線を表示できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日に達した、未来の、未設定の Card があり、間隔反復が有効である。
- 学習中、空、filter に一致しない、未来の復習だけがある、未評価の Card だけがある、という状態の Deck を区別できる。tag の AND / OR 条件を使用する。

When:

- 一覧の合計と Deck 別の件数を確認し、「件数について」と0件の理由を必要に応じて展開する。keyboard で Review または Study new を選択する。
- 間隔反復を無効にした表示と、英語・日本語、mobile、dark mode、拡大表示を確認する。

Then:

- 「件数について」を開くと、読み込み済みのデータと保存済み filter に基づく件数である旨を表示する。maximum cards と shuffle は件数に影響しない。
- 「学習中」「今学習できるデッキ」「その他」の見出し付き一覧に各 Deck を一度だけ表示し、空の区分は隠す。名前から Card 一覧を開ける。各 Deck は Card 数、学習中の現在位置、復習・新規件数と1つの主学習操作を表示し、閲覧・管理は右上の三点メニューにまとめる。名前の読み上げには Card 数と学習中の現在位置を含める。カテゴリと最終学習時刻は表示しない。
- mobile では1列と横幅いっぱいの主学習ボタンを表示する。広い画面では複数列とし、長い名前も折り返して表示する。主要操作は44px以上の高さを持つ。学習中のバーは現在位置の視覚的な目安であり、完了率ではない。
- 学習中の Deck は最近学習したものから先頭に並び、Continue と現在位置を表示する。その後、復習対象がある Deck を最も早い復習期限順、未評価の Card だけがある Deck、その他の Deck の順に並べる。同順位は名前順となる。現在位置は完了枚数ではない。
- 合計には学習中の Deck も一度だけ含める。0件の行は「復習・新規なし」を表示し、展開すると Card を読み込んでいない、filter に一致しない、期限前の Card だけである、という理由を区別する。期限前だけの場合は次回復習日時を表示し、Study は常に利用できる。完全な同期や学習完了は断定しない。
- Review / Study new は開始設定画面へ遷移するだけで、学習を新しく開始したり、既存の学習を置き換えたりしない。Continue は既存の学習を再開する。
- 間隔反復 OFF では復習・新規件数とその補足を隠し、Continue または Study と閲覧・管理操作を維持する。
- 一覧表示と開始設定画面への遷移で、Deck・Card の内容や学習結果・現在位置を変更しない。
- browser error が発生しない。

<a id="deck-navigation-13"></a>

### DECK-NAVIGATION-13 復習期限の到達で一覧を更新できる

カテゴリ: `read`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、現在時刻は未来に復習予定の Card の期日直前である。
- 複数の Deck に未来の復習期限がある場合も、同じ時点の件数を比較できる。

When:

- 一覧を開いたまま復習期日を迎える。
- Card・Deck・filter・設定・学習の状態が変わった後と、別画面から一覧へ戻った後の表示を確認する。

Then:

- 期日に達した Card が復習件数に加わり、一覧の並び順と合計が同じ時点の復習対象に基づいて更新される。
- 条件の変更や画面への復帰でも、その時点の対象に表示が更新され、以前の時刻の件数が残らない。
- 表示の更新だけでは学習の出題順・現在位置や Card の復習予定を変更しない。
- browser error が発生しない。

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

- 終了操作では表面を維持する。終了後は表裏を切り替えられ、裏面をスクロール・タップでき、左右の操作で Card を移動できる。
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
