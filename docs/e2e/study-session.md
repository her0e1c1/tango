# Study Session E2E テスト仕様書

## 目的

学習 session の開始・再開・再作成・完了・永続化が、filter の選択と保存、学習上限、Deck ごとの分離を維持できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-SESSION-01 | write | [filter と学習上限を反映して session を開始できる](#study-session-01) |
| STUDY-SESSION-02 | read | [filter に一致する Card がない場合は session を開始できない](#study-session-02) |
| STUDY-SESSION-03 | write | [学習画面から戻った後に同じ位置から Continue できる](#study-session-03) |
| STUDY-SESSION-04 | write | [Restart で新しい session を先頭から開始できる](#study-session-04) |
| STUDY-SESSION-05 | write | [最後の Card を完了して completion screen を表示できる](#study-session-05) |
| STUDY-SESSION-06 | batch | [複数 Deck の学習 session を独立して維持できる](#study-session-06) |
| STUDY-SESSION-07 | write | [local-only Deck の学習結果と session を reload 後も維持できる](#study-session-07) |
| STUDY-SESSION-08 | batch | [展開した tag filter を保存して学習 session に適用できる](#study-session-08) |
| STUDY-SESSION-09 | write | [30日分の学習記録を確認できる](#study-session-09) |
| STUDY-SESSION-10 | read | [URLとデッキ選択が一致する](#study-session-10) |
| STUDY-SESSION-11 | read | [表示できないデッキを全件表示へ切り替えない](#study-session-11) |
| STUDY-SESSION-12 | write | [匿名の学習記録を再表示できる](#study-session-12) |
| STUDY-SESSION-13 | read | [期間を選んで学習記録を確認できる](#study-session-13) |

<a id="study-session-01"></a>

### STUDY-SESSION-01 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、difficulty と tags の組み合わせが異なる複数の Card が存在する。
- 対象 Deck に difficulty と tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- fixture の正の学習上限、0、1 のそれぞれで対象 Deck の学習開始画面から新しい session を開始する。

Then:

- session には現在のfilter draftに一致する Card だけが含まれる。開始actionはクリック時点のデータ・設定・時刻で再選定する。
- 間隔反復ONでは期限が古いdue（期限一致を含む）→期限なしのFSRS未開始の順に安定整列し、上限→選定済み集合だけのshuffleを適用する。未来期限は除外する。OFFでは閲覧回数順→全候補shuffle→上限を維持し、未来期限も含める。
- 有効なscheduleの期限を正本とし、scheduleなしではlegacy nextSeeingAtを使う。intervalだけでは期限を作らない。不正schedule・未対応version・不正期限は検証エラーとし、新規や0件に読み替えない。
- 開始画面・Card一覧・Deck閲覧は同じ期限ルールと各評価で一つのnowを使う。後二者にはSession専用の順序・上限を適用しない。
- mount中に最も近い未来期限のtimerを一つだけ持ち、期限到来・foreground復帰・データ/設定変更で再評価する。未来期限なしではtimerを置かず、遠い期限は安全なcheckpointで再計算する。遅延callback、時計の前後移動、timer置換・unmountを扱う。
- 正の上限では session の Card 数が設定済みの学習上限と一致する。
- 上限 0 では枚数を制限せず、filter と適用される復習条件に一致するすべての Card を含む。上限 1 ではそのうち先頭の Card だけを含む。
- 学習開始画面と start action の件数が新しい session の件数と一致する。
- session の先頭 Card の front text が表示される。
- 開始操作は実行時点の認証を使い、別アカウントへの切替後に以前の UID で保存しない。
- ログイン済みユーザーの remote Deck では、session ID を document ID として Firestore の `studySession` に所有者、Deck、出題順、現在位置、開始時刻を保存する。回答情報は含めない。
- `createdAt` / `updatedAt` は操作時に固定した client timestamp を保存する。`startedAt` は再開で変更せず、最近学習した時刻は `updatedAt` から復元する。
- オフライン再読み込み直後や別 Deck の保存待ちでも Start / Restart を許可し、書き込みは Firestore SDK のオフラインキューへ渡す。同期失敗は共通の通知で知らせ、開始操作を禁止しない。
- browser error が発生しない。

<a id="study-session-02"></a>

### STUDY-SESSION-02 filter に一致する Card がない場合は session を開始できない

カテゴリ: `read`

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 認証済みユーザーが所有する Deck に Card が存在する。
- 学習開始画面の difficulty と tag の filter に一致する Card が存在しない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- filter に一致する Card がないことが表示される。
- session の start action が無効になる。
- 対象 Deck の学習 session が作成されない。
- browser error が発生しない。

<a id="study-session-03"></a>

### STUDY-SESSION-03 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- 学習画面から Deck 一覧へ戻り、同じ Deck の Continue を実行する。

Then:

- Deck 一覧へ戻る前と同じ学習 session が維持される。評価で期限が変わっても保存済みの順序と位置は再構築しない。
- Continue は遷移前に対象 session の最終学習時刻を更新する。
- browser storage に残る同一ユーザーの session は、オフライン再読み込み後も初回同期を待たずに Continue できる。Start / Restart も初回同期を待たない。
- 保存済み session の学習 URL を直接開いた場合は、初回受信前に一覧へ戻らず、受信した位置から表示する。この読込表示は Start / Restart の可否には影響しない。
- ページ移動、アプリ終了、時間経過だけでは終了しない。remote session は browser storage がない同一ユーザーの client でも同じ ID・出題順・位置から再開できる。
- 端末間の時計ずれによって古い終了済み session を最新と誤認しない。session 間の作成順には server の `createdAt` を使い、最近学習した時刻の代用にはしない。
- 別端末から復元して最近学習した時刻が不明な場合は、一覧に架空の経過時間を表示しない。
- 不正または旧形式の remote document が混在しても、有効な session の同期・再開を妨げない。
- Deck 一覧へ戻る前に表示されていた Card の front text が表示される。
- browser error が発生しない。

<a id="study-session-04"></a>

### STUDY-SESSION-04 Restart で新しい session を先頭から開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で session を開始する。

Then:

- 以前とは異なる新しい学習 session が保存される。新規作成と既知の旧 session の終了は一つの batch で cache に反映し、cache 保存が失敗した場合は旧 session の ID・Card 順序・位置を維持して再試行できる。
- この端末で既知の以前の remote session は `endReason: abandoned` と 操作時に固定した終了時刻を保持する。明示的な session 終了操作や Deck 削除も破棄として扱う。
- 複数の remote session がある場合は、読み込み時に最新の作成時刻の session を採用する。複数端末の同時操作・未送信状態との厳密な競合調停と、未取得の旧 session をすべて終了する保証は対象外とする。同時開始の収束は別 Issue #1658 で扱う。
- 新しい session の位置が先頭になる。
- 新しい session の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="study-session-05"></a>

### STUDY-SESSION-05 最後の Card を完了して completion screen を表示できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- 認証済みユーザーが所有する Deck の学習 session で、最後の Card が表示されている。

When:

- 最後の Card に学習結果を保存する action を実行する。

Then:

- 最後の Card の学習結果が保存される。
- 対象 Deck の学習 session がローカルの進行中一覧から削除され、remote document は `endReason: completed` と 操作時に固定した終了時刻を保持する。
- 進捗更新では終了状態を変更しない。Firestore Rules は認証と所有者を検証し、位置や終了理由の状態遷移は制約しない。
- Study completion screen に完了 message と学習した Card 数が表示される。
- Deck 一覧へ automatic redirect せず、Deck 一覧へ戻る action が利用できる。
- Deck 一覧へ戻った後、対象 Deck に Continue action が表示されない。
- browser error が発生しない。

<a id="study-session-06"></a>

### STUDY-SESSION-06 複数 Deck の学習 session を独立して維持できる

カテゴリ: `batch`

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する複数の Deck に、それぞれ異なる位置の学習 session が存在する。

When:

- 一方の Deck で学習 action を実行して Deck 一覧へ戻り、もう一方の Deck を Continue する。

Then:

- 最初の Deck の学習結果と session の位置が保存される。
- 学習した Card の相対難易度は変わらず、学習回数が1増える。
- もう一方の Deck は操作前の session と位置から再開する。
- 各 Deck の Card と session が混在しない。
- browser error が発生しない。

<a id="study-session-07"></a>

### STUDY-SESSION-07 local-only Deck の学習結果と session を reload 後も維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- browser storage に、複数の Card を含む local-only Deck と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag し、次の Card への遷移完了後にページを reload する。

Then:

- 現在だった Card の easy 学習結果とFSRS scheduleが browser storage に維持されている。間隔反復ONの新しい学習候補から期限前は除外し、開いたまま期限を迎えると候補に復帰する。
- session の位置が次の Card に維持されている。
- 次の Card の front text が表示され、back text は表示されない。
- 匿名ユーザーの session と回答は Firestore の永続 cache に保存し、クラウドへ書き込まない。
- browser error が発生しない。

<a id="study-session-08"></a>

### STUDY-SESSION-08 展開した tag filter を保存して学習 session に適用できる

カテゴリ: `batch`

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- 認証済みユーザーが所有する Deck に、それぞれ異なる tag を持つ 10 枚の Card が存在する。
- 対象 tag は折りたたまれた最初の 8 件より後にあり、まだ filter に選択されていない。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- 学習開始画面で追加の tag を展開し、対象 tag を選択する。
- filter の保存完了後に画面を reload し、学習 session を開始する。

Then:

- tag の変更が自動保存され、保存ボタンは表示されない。
- reload 後も対象 tag が表示され、選択状態を維持する。
- 対象 Deck の保存済み tag filter に対象 tag だけが含まれる。
- session には対象 tag を持つ Card だけが含まれる。
- 対象 Card の front text が表示される。
- browser error が発生しない。

## 学習記録

開始数は startedAt、完了数は endReason が completed の endedAt を表示端末の暦日で独立して数える。
初期期間は今日を含む30日間（29日前の0時以上、翌日0時未満）。7日・30日・90日または開始日・終了日を選択できる。
範囲指定は開始日0時以上、終了日の翌日0時未満で扱い、日またぎ、期間前開始・期間内完了を含める。
同じ session の再開では増えず、新しい session は別件とする。abandoned は完了に含めない。
100件超も打ち切らず、削除済み・他 UID の Deck は除外する。完了率は表示しない。
コンパクトな合計と横スクロール不要のグラフの下に、同じ期間・UID・deckId・可視性を適用した最近の session を表示する。
最初は3件表示し、展開すると最大10件を確認できる。その下の日別表は初期状態で閉じ、新しい日付から30日ずつ表示する。
31日以内のグラフは日単位、32～180日は7日単位、181～366日は30日単位、それ以上は最大24区間にまとめる。
各区間は選択開始日を基準とし、最後の区間は選択終了日で切る。日別の数値と期間合計は集約せず保持する。
期間内開始または期間内 completed の記録を sessionId で重複除去し、期間内の最新の開始／完了日時の降順、同日時は sessionId 昇順とする。
期間前開始・期間内完了は含め、期間前開始・期間内中止だけの記録は含めない。中止日時や updatedAt は並び順に使わない。
削除済み Deck を除外してから10件を選び、日別集計は全取得結果から計算する。
現在の Deck 名、開始日時、終了日時（未終了は「—」）、対象カード数、未完了／完了／中止を表示する。
一覧は既存の取得・再試行・キャッシュ表示を共有し、追加の取得や保存は行わない。
UID・deckId・期間の変更と離脱で購読を解除し、旧結果を混ぜない。相対期間は表示・条件変更・再試行・端末の日付変更で再計算し、範囲指定の期間は維持する。
2つの read が揃うまで loading とし、片方の失敗を0件として表示せず、ページ内エラーから共通の再試行を提供する。

<a id="study-session-09"></a>

### STUDY-SESSION-09 学習を完了すると30日分の開始・完了数を確認できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を学習でき、履歴はまだない。

When:

- 新しい学習を開始して最後まで進め、ナビゲーションから学習記録を開く。

Then:

- 今日の開始と完了はそれぞれ1件で、期間合計・グラフ・日別表が一致する。
- 記録のない日も含め30日分の値と延べ数の説明が表示される。
- 日別表は折りたたまれており、開くと日別の開始・完了を確認できる。最近のセッションは表を開かずに確認できる。
- 最近のセッションに完了した学習が1件表示され、Deck 名・開始と終了の日時・対象カード数・完了状態を確認できる。
- 取得に失敗した場合は部分集計を表示せず、再試行で両方の read をやり直す。
- browser error が発生しない。

<a id="study-session-10"></a>

### STUDY-SESSION-10 URLとデッキ選択が再読み込み・戻る・進むでも一致する

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck 一覧を表示でき、学習記録はまだない。

When:

- Deck 操作メニューから学習記録を開く。
- すべてのデッキを選び、戻る・進む・再読み込みを行う。

Then:

- URLの deckId が選択値の正本となり、メニューからは該当 Deck が選ばれる。
- 0件のサマリー・グラフ・表と記録なしの案内を表示する。
- browser error が発生しない。

<a id="study-session-11"></a>

### STUDY-SESSION-11 表示できないデッキを勝手に全件表示へ切り替えない

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 指定した Deck は自分の表示対象に存在しない。

When:

- 該当 deckId の学習記録へ直接アクセスする。

Then:

- Deck 読込完了後に対象の Deck を表示できない旨と、すべてのデッキへ戻る操作を表示する。
- URLの deckId は維持され、集計を表示しない。
- browser error が発生しない。

<a id="study-session-12"></a>

### STUDY-SESSION-12 匿名の学習記録を端末内キャッシュから再表示できる

カテゴリ: `write`

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーの Deck が Firestore の端末内キャッシュに保存され、同期は停止している。

When:

- 学習を開始して完了し、学習記録を開いて再読み込みする。

Then:

- クラウド確定を待たず、開始・完了数と端末内の未同期データの案内を表示する。
- 同じ UID の再読み込みで件数が変わらず、最近のセッションも1件表示される。
- 通常ログインの通信断時もキャッシュを表示し、クラウドの全履歴とは断定しない。
- browser error が発生しない。

<a id="study-session-13"></a>

### STUDY-SESSION-13 期間を選んで学習記録を確認できる

カテゴリ: `read`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示でき、履歴はまだない。

When:

- 学習記録で7日・90日を選び、日別表を開いて古い日付のページへ進む。
- 期間指定で過去の開始日・終了日を入力して適用し、Deck を選択する。
- 戻る・進む・再読み込みで同じ範囲を復元する。

Then:

- 合計・グラフ・最近のセッション・日別表が選択期間と Deck に一致する。空の履歴を架空の件数で埋めない。
- 期間は URL の `days` または `start` / `end` で保持し、Deck の選択を変えても期間は変わらない。
- 7日なら日ごと、90日なら7日ごとのグラフとなり、表はすべての日付を30日ずつ確認できる。
- 範囲指定は両端の日付を含む。1日だけ、月・年またぎ、夏時間をまたぐ範囲も端末の暦日で集計する。
- 履歴がある場合、範囲外の開始や完了は集計せず、範囲内の完了は開始日が範囲外でも集計する。
- 未入力・存在しない日付・終了日が開始日より前・未来の終了日は入力エラーとして表示し、適用中の範囲を変えない。
- 無効な URL の期間はエラーを表示し、別期間の集計や購読へ読み替えない。有効な期間の選び直しで復帰できる。
- 範囲を変えた直後は旧結果を表示せず、購読解除後の遅延結果も混ぜない。範囲指定は再試行でも維持する。
- 画面を開いたまま端末の日付が変わると相対期間と入力可能な最終日を更新し、範囲指定の両端は維持する。
- 範囲指定では日付変更だけで取得済みの結果を隠したり購読を張り直したりしない。明示的な再試行では同じ期間でも両方の read をやり直す。
- browser error が発生しない。

#### 回答指標の取得・集計契約（表示は #416 / #417）

- 同じ期間・Deck 条件で回答履歴を独立して最大1000件取得する。回答取得の失敗で既存 Session 集計を隠さない。
- 回答指標は取得した回答だけの評価別件数、想起数（hard / good / easy）、想起率、日別、最近回答した Deck、sessionId ごとの集計とする。Session のカード数や位置を回答数にしない。
- 同じ日時・評価でも異なる回答 ID は別回答として数える。期間外と表示できない Deck を除き、日別境界は端末の暦日を使う。
- again / hard / good / easy が各1件なら回答4件・想起3件・again 1件・想起率0.75となる。0件の想起率は未定義とする。
- cache、上限超過、不正 document の除外、未同期書込を完全な集計と扱わない。cache の0件もサーバーに回答が存在しないことを意味しない。
- 回答側の loading / empty / cache-limited / truncated / error を区別する。UID・期間・Deck 変更後や再試行前の遅延応答を反映せず、再試行は現在の条件で行う。locale だけの変更は再取得しない。
