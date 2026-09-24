# Navigation E2E テスト仕様書

## 目的

Deck、Card 一覧、閲覧、および全ページの主要画面の表示・遷移、存在しない画面や予期しない障害からの復帰を確認する。閲覧だけでは学習結果や再開位置が変わらない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| NAVIGATION-01 | read | 異常系 | [存在しない route から Deck 一覧へ復帰できる](#navigation-01) |
| NAVIGATION-02 | read | 正常系 | [画面の keyboard shortcut で主要 route へ遷移できる](#navigation-02) |
| NAVIGATION-03 | write | 異常系 | [共通エラー画面が現在の言語で表示され Reload で復旧する](#navigation-03) |
| NAVIGATION-04 | read | 異常系 | [処理中の予期しないエラーから復旧できる](#navigation-04) |
| NAVIGATION-05 | write | 異常系 | [不正な PWA キャッシュによる起動失敗から復旧できる](#navigation-05) |
| NAVIGATION-06 | read | 正常系 | [Deck 一覧から Card 一覧へ遷移できる](#navigation-06) |
| NAVIGATION-07 | read | 異常系 | [存在しない Deck から復帰できる](#navigation-07) |
| NAVIGATION-08 | read | 正常系 | [ログイン中の Deck を学習データを変更せずに閲覧できる](#navigation-08) |
| NAVIGATION-09 | read | 正常系 | [匿名利用中の Deck を先頭から閲覧し直せる](#navigation-09) |
| NAVIGATION-10 | read | 正常系 | [学習条件に依存せず全 Card を標準順で閲覧できる](#navigation-10) |
| NAVIGATION-11 | read | 正常系 | [復習期日前の Card も閲覧できる](#navigation-11) |
| NAVIGATION-12 | read | 正常系 / 異常系 | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](#navigation-12) |
| NAVIGATION-13 | read | 正常系 | [1件の Card の長い解答を touch で閲覧して終了できる](#navigation-13) |
| NAVIGATION-14 | write | 正常系 | [閲覧と学習で表示設定と操作ヘルプを共有できる](#navigation-14) |
| NAVIGATION-15 | read | 正常系 | [学習データを変更せずに閲覧を自動再生できる](#navigation-15) |
| NAVIGATION-16 | read | 正常系 | [閲覧の進捗スライダーで前後へ移動できる](#navigation-16) |
| NAVIGATION-17 | read | 正常系 | [読み込み済みの復習件数と学習導線を表示できる](#navigation-17) |
| NAVIGATION-18 | read | 正常系 | [復習期限の到達で一覧を更新できる](#navigation-18) |
| NAVIGATION-19 | write | 正常系 | [view mode で長い表面を読みながら移動を防止できる](#navigation-19) |
| NAVIGATION-20 | write | 正常系 | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](#navigation-20) |
| NAVIGATION-21 | write | 正常系 | [view mode 中も閲覧ボタンと自動再生を使える](#navigation-21) |

<a id="navigation-01"></a>

### NAVIGATION-01 存在しない route から Deck 一覧へ復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーがアプリケーションにアクセスできる。
- Sample Deck の自動生成が無効である。

When:

- 存在しない route を直接開き、`Go home` を選択する。

Then:

- Deck 一覧へ遷移する。
- not-found 表示が残らない。

<a id="navigation-02"></a>

### NAVIGATION-02 画面の keyboard shortcut で主要 route へ遷移できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧と Card 一覧を利用できる。

When:

- Deck 一覧で `s` を入力して Settings を開き、Deck 一覧へ戻って `i` を入力して Import を開く。
- Card 一覧で `t` を入力して Deck 一覧を開き、Card 一覧へ戻って `s` を入力して Settings を開く。

Then:

- 各 shortcut に設定された画面へ1回だけ遷移する。
- Deck と Card の内容は変更されない。

<a id="navigation-03"></a>

### NAVIGATION-03 共通エラー画面が現在の言語で表示され Reload で復旧する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが日本語の Settings 画面を開いている。
- 配色の変更時に一時的な障害が発生する。
- ブラウザーに設定、Tango の PWA キャッシュ、Tango 以外の保存データがある。

When:

- Dark mode を変更して共通エラー画面を表示し、再読み込みを選択する。
- 再び同じ障害が発生した後、キャッシュを削除して再読み込みする。

Then:

- 日本語の見出し・説明・再読み込みボタンが表示され、ページの言語も日本語になる。
- 保存した言語をまだ利用できない場合は、英語のエラー画面を表示する。
- 通常の再読み込み後は保存データを削除せず、日本語の Settings へ復旧する。
- キャッシュ削除では、このブラウザーに残る Tango の古いアプリを再利用せず、現在の URL を再読み込みする。
- 認証状態、端末内の Deck・Card・学習データと未同期の変更、設定、他アプリの保存データは保持する。
- キャッシュ削除に失敗した場合はエラーを通知し、自動再読み込みせず復旧画面から再試行できる。

<a id="navigation-04"></a>

### NAVIGATION-04 処理中の予期しないエラーから復旧できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings を利用している。
- 画面の利用中または操作後の待ち時間に、予期しないエラーが発生する。エラーの詳細がある場合とない場合がある。

When:

- それぞれのエラーが発生した後、共通の復旧画面で Reload を選択する。

Then:

- エラーの詳細の有無にかかわらず共通の復旧画面が表示され、Reload で Settings に戻る。
- 同じ障害が重ねて通知されても復旧画面や操作が重複せず、データ削除・ログアウト・自動遷移を行わない。
- 個別の画像などの読み込み失敗や、画面内で案内済みの操作失敗だけでは、画面全体を復旧画面に置き換えない。
- 画面を開き直した後も、一つの障害に対して復旧操作を一度だけ実行できる。
- ブラウザーの元のエラー診断は保持する。

<a id="navigation-05"></a>

### NAVIGATION-05 不正な PWA キャッシュによる起動失敗から復旧できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが Deck 一覧を表示でき、設定が保存されている。
- ブラウザーの PWA キャッシュにある Tango のアプリが不正になり、起動途中でエラーになる。復旧画面は表示できる。
- サーバーから取得できるアプリは正常であり、クラウドの Deck と Card は変更されていない。

When:

- アプリを再読み込みして起動エラーを表示する。
- 通常の Reload を試してから、Clear cache and reload を選択する。

Then:

- 保存済みの不正なアプリを開くと、起動時に共通の復旧画面が表示される。
- 通常の Reload だけでは不正なキャッシュが残り、同じ起動エラーになる。
- キャッシュクリア後は正常なアプリを読み込み、元の URL で Deck 一覧を表示する。
- 復旧画面は消え、再読み込みしても不正なアプリによる起動エラーが再発しない。
- 保存済みの設定と認証 UID を保持し、クラウドの Deck と Card の内容を変更しない。
- 不正なキャッシュによるブラウザーの診断は許容する。復旧後は通常の操作を利用できる。

<a id="navigation-06"></a>

### NAVIGATION-06 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-07"></a>

### NAVIGATION-07 存在しない Deck から復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 開こうとしている URL の Deck は存在しない。

When:

- 存在しない Deck の Card 一覧を直接開き、Deck が利用できない旨の画面からホームへ戻る操作を選ぶ。

Then:

- Deck 一覧が表示される。

<a id="navigation-08"></a>

### NAVIGATION-08 ログイン中の Deck を学習データを変更せずに閲覧できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-09"></a>

### NAVIGATION-09 匿名利用中の Deck を先頭から閲覧し直せる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-10"></a>

### NAVIGATION-10 学習条件に依存せず全 Card を標準順で閲覧できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 学習用のタグ条件に一致する Card が学習の枚数上限を超えて存在する。
- 学習用のタグ条件に一致しない Card も同じ Deck に存在する。
- 学習の shuffle が有効であり、Card フィルターは未設定である。

When:

- Deck 一覧の対象 Deck の三点メニューから View を開き、対象 Deck の全 Card を順に閲覧する。

Then:

- 絞り込みなしの Card 一覧と同じ標準順で、対象 Deck の全 Card を表示する。
- 学習用のタグ条件、学習の枚数上限、shuffle は閲覧対象と順序に適用しない。
- 最終 Card の次で Deck 一覧へ戻る。
- 学習条件、Card、学習履歴、設定を変更せず、新しい学習 session も始まらない。

<a id="navigation-11"></a>

### NAVIGATION-11 復習期日前の Card も閲覧できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日に達した Card、未来に復習予定の Card、期日未設定の Card が存在する。
- Respect review schedule が有効であり、Card フィルターは未設定である。

When:

- Deck の閲覧画面を開き、対象の全 Card を順に閲覧する。

Then:

- 復習期日にかかわらず、対象 Deck の全 Card を標準順で表示する。
- 未来に復習予定の Card も表裏を閲覧でき、総数にはその Card も含まれる。
- Card の復習期日や学習履歴、設定を変更せず、新しい学習 session も始まらない。

<a id="navigation-12"></a>

### NAVIGATION-12 閲覧対象が空または Deck が存在しない場合に一覧へ戻れる

カテゴリ: `read`

区分: 正常系 / 異常系

Given:

- Fixture: [`browse-filter`](./fixture/browse-filter.yaml)
- Card が1枚も存在しない Deck がある。学習用の条件に一致しないだけの Deck ではない。
- 別の閲覧 URL が示す Deck は存在しない。

When:

- Card が存在しない Deck の View を開いて戻る操作を行い、存在しない Deck の閲覧 URL を直接開いて復帰する。

Then:

- 空状態では対象がない旨と一覧へ戻る操作を表示する。
- 存在しない Deck では Deck が利用できない旨と一覧へ戻る操作を表示する。
- どちらも Card の操作を表示せず、保存済みの内容や学習結果は変わらない。

<a id="navigation-13"></a>

### NAVIGATION-13 1件の Card の長い解答を touch で閲覧して終了できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-14"></a>

### NAVIGATION-14 閲覧と学習で表示設定と操作ヘルプを共有できる

カテゴリ: `write`

区分: 正常系

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

<a id="navigation-15"></a>

### NAVIGATION-15 学習データを変更せずに閲覧を自動再生できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-16"></a>

### NAVIGATION-16 閲覧の進捗スライダーで前後へ移動できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-17"></a>

### NAVIGATION-17 読み込み済みの復習件数と学習導線を表示できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-18"></a>

### NAVIGATION-18 復習期限の到達で一覧を更新できる

カテゴリ: `read`

区分: 正常系

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

<a id="navigation-19"></a>

### NAVIGATION-19 view mode で長い表面を読みながら移動を防止できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-back-text-long`](./fixture/study-back-text-long.yaml)
- 長い front text を持つ Card を Deck 閲覧画面で表示している。

When:

- view mode を ON にして wheel・touch・方向キーでスクロールし、左右・上下へドラッグする。

Then:

- 本文の先頭と末尾を読める。スワイプ・方向キーは前後の Card への移動や画面退出を起こさず、view mode を維持する。
- 学習データは変更されない。

<a id="navigation-20"></a>

### NAVIGATION-20 閲覧の view mode 終了後に通常の表裏操作へ戻れる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- Deck 閲覧画面で view mode が ON である。

When:

- 本文タップと Enter でそれぞれ view mode を終了し、通常の表面から裏面へ切り替える。

Then:

- 終了操作では表面を維持する。終了後は表裏を切り替えられ、裏面をスクロール・タップでき、左右の操作で Card を移動できる。

<a id="navigation-21"></a>

### NAVIGATION-21 view mode 中も閲覧ボタンと自動再生を使える

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 複数の Card を閲覧でき、view mode が ON、自動再生の間隔が正の値である。

When:

- 次の Card ボタンと再生ボタンで順に次の Card へ進む。

Then:

- ボタンと自動再生で次の Card へ進み、view mode を維持する。学習データは変更されない。
