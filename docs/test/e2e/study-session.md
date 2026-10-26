# Study Session E2E テスト仕様書

## 目的

学習の開始・再開・やり直し・完了が、選択した filter、学習上限、Deck ごとの再開位置を維持することを確認する。再読み込み後も学習を続けられ、学習記録を確認できる。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-SESSION-02 | read | 正常系 | [filter に一致する Card がない場合は session を開始できない](#study-session-02) |
| STUDY-SESSION-10 | read | 正常系 | [URL と Deck 選択が再読み込み・戻る・進むでも一致する](#study-session-10) |
| STUDY-SESSION-13 | read | 正常系 | [プリセット期間を選んで学習記録と日別表を確認できる](#study-session-13) |
| STUDY-SESSION-17 | read | 正常系 | [学習条件を Card 一覧と Deck 閲覧のフィルターへ引き継がない](#study-session-17) |
| STUDY-SESSION-18 | read | 正常系 | [期限・画面復帰・Card と設定の変更に合わせて学習対象件数を更新する](#study-session-18) |
| STUDY-SESSION-22 | read | 正常系 | [保存済みの学習をオフラインの reload や別ブラウザーから再開できる](#study-session-22) |
| STUDY-SESSION-24 | read | 正常系 | [保存済みの学習 URL を直接開くと読み込み後に保存位置を表示する](#study-session-24) |
| STUDY-SESSION-30 | read | 正常系 | [匿名で評価した Card は復習期限を迎えると新しい学習の対象に戻る](#study-session-30) |
| STUDY-SESSION-34 | read | 正常系 | [ログイン中の通信断でも読み込み済みの学習記録を表示できる](#study-session-34) |
| STUDY-SESSION-35 | read | 正常系 | [開始日と終了日を指定して Deck と期間を再読み込み後も維持できる](#study-session-35) |
| STUDY-SESSION-38 | read | 正常系 | [期間の切り替え後に以前の期間の結果を混ぜない](#study-session-38) |
| STUDY-SESSION-39 | read | 正常系 | [端末の日付変更時に相対期間を更新し指定期間を維持する](#study-session-39) |
| STUDY-SESSION-01 | write | 正常系 | [filter と学習上限を反映して session を開始できる](#study-session-01) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい session を先頭から開始できる](#study-session-04) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習 session を独立して維持できる](#study-session-06) |
| STUDY-SESSION-14 | write | 正常系 | [開始時点の Card・設定・時刻で出題対象を選び直す](#study-session-14) |
| STUDY-SESSION-15 | write | 正常系 | [間隔反復と shuffle の設定に従って出題順と上限内の Card を選ぶ](#study-session-15) |
| STUDY-SESSION-19 | write | 正常系 | [アカウント切り替え後に以前のアカウントへ新しい学習を追加しない](#study-session-19) |
| STUDY-SESSION-20 | write | 正常系 | [通常アカウントの Start・Restart・Continue は保存成功まで遷移を待つ](#study-session-20) |
| STUDY-SESSION-32 | write | 正常系 | [保存済みの tag filter に一致する Card だけで学習を開始できる](#study-session-32) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](#study-session-03) |
| STUDY-SESSION-05 | write | 正常系 | [最後の Card を完了して completion screen を表示できる](#study-session-05) |
| STUDY-SESSION-07 | write | 正常系 | [匿名での学習結果と再開位置を reload 後も維持できる](#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開した tag filter を自動保存して reload 後も維持できる](#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](#study-session-09) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](#study-session-12) |
| STUDY-SESSION-21 | write | 正常系 | [Continue 処理中にアカウントや画面が変わると元の学習へ遷移しない](#study-session-21) |
| STUDY-SESSION-25 | write | 正常系 | [端末間の時計ずれがあっても終了済みの学習を再開しない](#study-session-25) |
| STUDY-SESSION-28 | write | 正常系 | [明示的に終了した未完了の学習を完了として数えない](#study-session-28) |
| STUDY-SESSION-31 | write | 正常系 | [期限に達した匿名の Card を新しい学習で再評価できる](#study-session-31) |
| STUDY-SESSION-29 | batch | 正常系 | [Deck の削除で終了した未完了の学習を完了として数えない](#study-session-29) |
| STUDY-SESSION-11 | read | 異常系 | [表示できない Deck を勝手に全件表示へ切り替えない](#study-session-11) |
| STUDY-SESSION-16 | read | 異常系 | [学習結果を読み込めない場合は未評価や対象0件として扱わない](#study-session-16) |
| STUDY-SESSION-23 | read | 異常系 | [利用できない学習を案内し後から届いた学習を表示する](#study-session-23) |
| STUDY-SESSION-33 | read | 異常系 | [学習記録の取得失敗後に同じ期間で全体の集計を再試行できる](#study-session-33) |
| STUDY-SESSION-36 | read | 異常系 | [無効な日付入力を適用せず現在の期間を維持する](#study-session-36) |
| STUDY-SESSION-37 | read | 異常系 | [無効な URL の期間をエラーとして示し有効な期間で復帰できる](#study-session-37) |
| STUDY-SESSION-27 | write | 異常系 | [Restart の保存失敗後も以前の学習を失わずに再試行できる](#study-session-27) |
| STUDY-SESSION-26 | write | 異常系 | [読み込めない過去の学習があっても利用できる学習を再開できる](#study-session-26) |

<a id="study-session-02"></a>

### STUDY-SESSION-02 filter に一致する Card がない場合は session を開始できない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 認証済みユーザーが所有する Deck に Card が存在する。
- 学習開始画面の tag の filter に一致する Card が存在しない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- filter に一致する Card がないことが表示される。
- 学習の開始ボタンが無効になる。
- 対象 Deck に新しい学習は始まらず、再開できる学習も追加されない。

<a id="study-session-10"></a>

### STUDY-SESSION-10 URL と Deck 選択が再読み込み・戻る・進むでも一致する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck 一覧を表示でき、学習記録はまだない。

When:

- Deck 操作メニューから学習記録を開く。
- すべての Deck を選び、ブラウザーの戻る・進む・再読み込みを行う。

Then:

- 操作メニューで選んだ Deck が学習記録でも選択される。戻る・進む・再読み込みの後も、URL が示す Deck と選択中の Deck が一致する。
- 0件のサマリー・グラフ・表と記録なしの案内が表示される。

<a id="study-session-13"></a>

### STUDY-SESSION-13 プリセット期間を選んで学習記録と日別表を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示でき、履歴はまだない。

When:

- 学習記録で7日・90日を選び、日別表を開いて古い日付のページへ進む。

Then:

- 合計・グラフ・最近の学習・日別表が選択期間と Deck に一致する。空の履歴を架空の件数で埋めない。
- 7日なら日ごと、90日なら7日ごとのグラフとなり、表はすべての日付を30日ずつ確認できる。
- 選んだ期間は URL の `days` に反映される。

<a id="study-session-17"></a>

### STUDY-SESSION-17 [TODO] 学習条件を Card 一覧と Deck 閲覧のフィルターへ引き継がない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、tags が異なる複数の Card が存在する。
- 対象 Deck には学習条件と、それとは独立した Card フィルターが保存されている。

When:

- 学習開始画面の対象件数を確認した後、Card 一覧と Deck 閲覧を開く。

Then:

- 学習開始画面と開始操作には学習条件を適用する。Card 一覧と Deck 閲覧は、学習条件とは独立した Card フィルターで表示対象を選ぶ。学習条件を閲覧フィルターへ引き継がない。詳細は [Card Filter](./card-filter.md) を参照する。

<a id="study-session-18"></a>

### STUDY-SESSION-18 [TODO] 期限・画面復帰・Card と設定の変更に合わせて学習対象件数を更新する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck の学習開始画面を開いている。
- 間隔反復が ON で、保存済みの学習結果と学習条件を読み込める。

When:

- 復習期限の到来、画面への復帰、Card や設定の変更を迎える。時計が進む場合と戻る場合も含む。

Then:

- 学習開始画面では、復習期限の到来、画面への復帰、Card や設定の変更で対象件数が更新される。時計が進んだり戻ったりした場合も、その時点の復習対象が表示される。

<a id="study-session-22"></a>

### STUDY-SESSION-22 [TODO] 保存済みの学習をオフラインの reload や別ブラウザーから再開できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、保存済みの進行中の学習が存在する。
- 端末内へ読み込み済みであり、別ブラウザーで確認する学習は同期済みである。

When:

- 学習画面を離れ、アプリ終了または時間経過の後に学習を開き直す。オフラインの再読み込みと、同じアカウントの別ブラウザーでの再開を含む。

Then:

- ページ移動、アプリ終了、時間経過だけでは学習が終了しない。
- 保存済みの学習はオフラインで再読み込みしても復元できる。
- 同期済みの学習は、同じアカウントの別ブラウザーでも同じ出題順と位置から再開できる。

<a id="study-session-24"></a>

### STUDY-SESSION-24 [TODO] 保存済みの学習 URL を直接開くと読み込み後に保存位置を表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、保存済みの進行中の学習が存在する。

When:

- 保存済みの学習 URL を直接開き、読み込み完了を待つ。

Then:

- 保存済みの学習 URL を直接開いた場合は、読み込み中に勝手に一覧へ戻らず、読み込み後に保存された位置を表示する。再開の読み込み待ちだけで Start / Restart が利用できなくなることはない。

<a id="study-session-30"></a>

### STUDY-SESSION-30 匿名で評価した Card は復習期限を迎えると新しい学習の対象に戻る

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーの Deck で Card を評価済みで、復習予定が保存されている。
- 間隔反復が ON で、評価した Card の復習期限前に学習開始画面を開いている。

When:

- 学習開始画面を開いたまま、評価した Card の復習期限を迎える。

Then:

- 間隔反復 ON で新しい学習を始める場合は、評価した Card は復習期限前には対象外となり、画面を開いたまま期限を迎えると対象に戻る。

<a id="study-session-34"></a>

### STUDY-SESSION-34 [TODO] ログイン中の通信断でも読み込み済みの学習記録を表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 通常アカウントでログインし、学習記録を一度読み込んでいる。

When:

- 通信が切れた状態で、読み込み済みの学習記録を表示する。

Then:

- ログイン中の通信断でも、一度読み込んだ学習記録を表示できる。その表示をクラウドの全履歴とは断定しない。

<a id="study-session-35"></a>

### STUDY-SESSION-35 開始日と終了日を指定して Deck と期間を再読み込み後も維持できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示できる。履歴がない場合と、指定期間の内外に開始・完了した学習記録がある場合を含む。
- 深夜0時が存在しない夏時間切替をまたぐ場合を含む。例として、端末のタイムゾーンが `America/Santiago` で、2026年9月6日には履歴がなく、翌7日正午の学習で1開始・1完了を記録した状態を用いる。

When:

- 期間指定で過去の開始日・終了日を入力して適用し、Deck を選択する。
- 戻る・進む・再読み込みで同じ範囲を復元する。

Then:

- 合計・グラフ・最近の学習・日別表が選択期間と Deck に一致する。空の履歴を架空の件数で埋めない。
- 期間は URL の `days` または `start` / `end` に反映され、Deck の選択を変えても期間は変わらない。
- 範囲指定は両端の日付を含む。1日だけ、月・年またぎ、夏時間をまたぐ範囲も端末の暦日で集計する。
- 深夜0時が存在しない夏時間切替日を含んでも、その翌日の正常な履歴が日別集計から欠落しない。上記の9月6日〜7日の範囲では、9月7日の日別集計に1開始・1完了が含まれ、期間合計と一致する。
- 終了日が深夜0時の存在しない切替日でも、翌日の履歴や日付を含めない。上記の9月5日〜6日の範囲では、9月7日0時以降を集計せず、日別表には9月5日と6日だけを含む。
- 履歴がある場合、範囲外の開始や完了は集計せず、範囲内の完了は開始日が範囲外でも集計する。

<a id="study-session-38"></a>

### STUDY-SESSION-38 [TODO] 期間の切り替え後に以前の期間の結果を混ぜない

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示しており、以前の期間の結果がまだ届いていない。

When:

- 期間を変更し、その後に以前の期間の結果が届く。

Then:

- 範囲を変えた直後は以前の範囲の結果を表示せず、後から以前の結果が届いても混ぜない。

<a id="study-session-39"></a>

### STUDY-SESSION-39 [TODO] 端末の日付変更時に相対期間を更新し指定期間を維持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示している。今日を基準とする期間と、開始日・終了日を指定した期間のそれぞれで確認する。

When:

- 画面を開いたまま端末の日付が変わる。

Then:

- 画面を開いたまま端末の日付が変わると、今日を基準とする期間と入力可能な最終日が更新される。範囲指定の両端は維持される。
- 範囲指定では日付変更だけで表示済みの結果が消えない。

<a id="study-session-01"></a>

### STUDY-SESSION-01 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、tags が異なる複数の Card が存在する。
- 認証と設定の読み込みが完了し、設定画面を利用できる。
- 対象 Deck に tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- 正の学習上限、0、1 のそれぞれで、対象 Deck の学習開始画面から新しい session を開始する。

Then:

- 開始時に選択している filter に一致する Card だけが出題される。
- 正の上限では、学習する Card 数が設定した上限と一致する。上限0では枚数を制限せず、filter と適用される復習条件に一致するすべての Card を含める。上限1では選ばれた先頭の Card だけを含める。
- 学習開始画面の件数と、実際に始まった学習の Card 数が一致する。
- session が作成されると学習画面へ遷移し、最初の Card の front text が表示される。

<a id="study-session-04"></a>

### STUDY-SESSION-04 Restart で新しい session を先頭から開始できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で session を開始する。

Then:

- 新しい学習が先頭から始まる。
- やり直し前の学習は完了ではなく中止として扱われ、新しい学習の代わりに Continue されない。
- 同じ Deck で順に複数の学習を始めた場合は、最後に新しく始めた学習を利用できる。複数端末からの同時開始や、未同期の変更同士の競合は対象外とする。
- 新しい学習の現在位置は先頭になる。
- 新しい学習の先頭 Card の front text が表示される。

<a id="study-session-06"></a>

### STUDY-SESSION-06 複数 Deck の学習 session を独立して維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する複数の Deck に、それぞれ異なる位置の学習 session が存在する。

When:

- 一方の Deck で評価を行って Deck 一覧へ戻り、もう一方の Deck を Continue する。

Then:

- 最初の Deck の学習結果と進んだ位置が維持される。
- 学習した Card の内容と作成日時は変わらず、今回の評価が記憶状態と最終復習に反映される。
- もう一方の Deck は操作前と同じ学習の現在位置から再開する。
- 各 Deck の Card と学習結果・現在位置が混在しない。

<a id="study-session-14"></a>

### STUDY-SESSION-14 [TODO] 開始時点の Card・設定・時刻で出題対象を選び直す

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck の学習開始画面を開いている。
- 表示後に Card、設定、または時刻が変わり、学習対象の条件が変化している。

When:

- 対象 Deck の学習を開始する。

Then:

- 画面を開いた時点ではなく、開始した時点の Card・設定・時刻と選択中の filter に一致する Card が出題される。

<a id="study-session-15"></a>

### STUDY-SESSION-15 [TODO] 間隔反復と shuffle の設定に従って出題順と上限内の Card を選ぶ

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーの Deck で、保存済みの学習結果と学習条件を読み込める。
- filter に一致する Card に、復習期限が過去・現在時刻・未来の Card と、まだ評価していない Card が含まれる。
- 間隔反復と shuffle の ON / OFF、および学習上限を選択できる。

When:

- 選択した間隔反復と shuffle の設定で、新しい学習を開始する。

Then:

- 間隔反復 ON では、復習期限に達した Card を期限が古い順に優先し、その後にまだ評価していない Card を含める。期限が現在時刻と一致する Card も対象となり、未来の期限は対象外となる。同じ優先順位では標準の相対順序を維持する。
- 間隔反復 ON の shuffle は、上限内に選ばれた Card の順序だけを変える。間隔反復 OFF では未来の期限も含む全候補を標準順で扱い、shuffle が有効なら全候補の順序を変えた後に上限内の Card を出題する。
- 復習予定は保存済みの学習結果に基づく。

<a id="study-session-19"></a>

### STUDY-SESSION-19 [TODO] アカウント切り替え後に以前のアカウントへ新しい学習を追加しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck の学習開始画面を開いている。

When:

- アカウントを切り替えた後、学習を開始する。

Then:

- アカウントを切り替えた後に、以前のアカウントのデータへ新しい学習が追加されない。

<a id="study-session-20"></a>

### STUDY-SESSION-20 [TODO] 通常アカウントの Start・Restart・Continue は保存成功まで遷移を待つ

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 通常アカウントが、読み込み済みの条件と保存済みの学習を利用できる。
- 通信が切れており、サーバーへの保存を完了できない。匿名利用との違いも確認する。

When:

- Start・Restart・Continue のいずれかを実行し、通常アカウントでは保存待ちの後に再接続する。

Then:

- 通常アカウントではサーバー保存成功まで学習画面への遷移を待つ。
- オフライン中も読み込んだ条件を参照できる。Start / Restart の保存中は重複開始を防ぐ。
- 匿名利用ではサーバー応答を待たずに利用できる。

<a id="study-session-32"></a>

### STUDY-SESSION-32 保存済みの tag filter に一致する Card だけで学習を開始できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- 認証済みユーザーが所有する Deck に、それぞれ異なる tag を持つ複数の Card が存在する。
- 追加の tag を展開して選択した filter は保存済みで、画面を reload した後も対象 tag だけが選択されている。
- 対象 Deck に進行中の学習は存在しない。

When:

- 対象 Deck の学習を開始する。

Then:

- 対象 tag を持つ Card だけが学習に含まれる。
- 対象 Card の front text が表示される。

<a id="study-session-03"></a>

### STUDY-SESSION-03 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- 学習画面から Deck 一覧へ戻り、同じ Deck の Continue を実行する。

Then:

- Deck 一覧へ戻る前と同じ学習の出題順と現在位置が維持される。評価によって復習期限が変わっても、進行中の学習の Card が選び直されることはない。
- 再開した Deck は、最近学習した Deck として学習中の並び順に反映される。
- 最近学習した日時は端末で学習・再開した日時であり、サーバーへの同期が遅れても同期日時へ置き換わらない。
- 最近学習した時刻が分からない場合は、推測した経過時間を表示しない。
- Deck 一覧へ戻る前に表示されていた Card の front text が表示される。
- 再開だけで元の開始日時が変わらない。

<a id="study-session-05"></a>

### STUDY-SESSION-05 最後の Card を完了して completion screen を表示できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- 認証済みユーザーが所有する Deck の学習 session で、最後の Card が表示されている。
- 途中の Card には回答せず、最後の Card だけを評価する場合も含む。

When:

- 最後の Card に評価を行う。

Then:

- 最後の Card の学習結果が保存される。ローカル反映でセッションが消えた場合、サーバー応答待ちの間は読み込み表示に切り替え、完了画面には進まない。
- 対象 Deck の学習が完了となり、進行中の学習としては表示されない。学習記録では完了した日時を確認できる。
- 完了画面に完了メッセージと、その session の対象 Card 数が表示される。回答数や閲覧数ではなく、skip や slider で進めた Card も含む。
- 件数は日本語で「対象カード: ○枚」、英語で「Session: ○ card」（1枚）／「Session: ○ cards」（複数枚）と表示する。
- 完了メッセージの見出しにフォーカスが移る。
- 自動で Deck 一覧へ戻らず、Deck 一覧へ戻る操作を利用できる。
- Deck 一覧へ戻った後、対象 Deck に Continue は表示されない。

<a id="study-session-07"></a>

### STUDY-SESSION-07 匿名での学習結果と再開位置を reload 後も維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck に、複数の Card と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は easy action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag し、次の Card が表示されてからページを reload する。

Then:

- 評価した Card の easy の学習結果と復習予定が維持される。
- 学習の現在位置は次の Card に維持される。
- 次の Card の front text が表示され、back text は表示されない。
- 匿名での学習結果と再開位置はこのブラウザーだけに保持され、クラウドへ送信されない。

<a id="study-session-08"></a>

### STUDY-SESSION-08 展開した tag filter を自動保存して reload 後も維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- 認証済みユーザーが所有する Deck に、それぞれ異なる tag を持つ複数の Card が存在する。
- 対象 tag は最初の表示では折りたたまれており、まだ filter に選択されていない。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- 学習開始画面で追加の tag を展開し、対象 tag を選択する。
- filter の保存完了後に画面を reload する。

Then:

- tag の変更は自動保存され、保存ボタンは表示されない。
- reload 後も対象 tag が表示され、選択状態を維持する。
- 対象 Deck の tag filter では対象 tag だけが選択されている。

<a id="study-session-09"></a>

### STUDY-SESSION-09 学習を完了すると30日分の開始・完了数を確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を学習でき、履歴はまだない。

When:

- 新しい学習を開始して最後まで進め、ナビゲーションから学習記録を開く。

Then:

- 今日の開始と完了はそれぞれ1件で、期間合計・グラフ・日別表が一致する。
- 記録のない日も含め30日分の値と延べ数の説明が表示される。
- 日別表は折りたたまれており、開くと日別の開始・完了を確認できる。最近の学習は表を開かずに確認できる。
- 最近の学習に完了した学習が1件表示され、Deck 名・開始と終了の日時・対象 Card 数・完了状態を確認できる。

<a id="study-session-12"></a>

### STUDY-SESSION-12 匿名の学習記録を同じブラウザーで再表示できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーが、このブラウザーで利用できる Deck を所有している。

When:

- 学習を開始して完了し、学習記録を開いて再読み込みする。

Then:

- クラウドの応答を待たずに開始・完了数が表示され、このブラウザーの未同期データであることが案内される。
- 同じ匿名アカウントのまま再読み込みしても件数は変わらず、最近の学習も1件表示される。

<a id="study-session-21"></a>

### STUDY-SESSION-21 [TODO] Continue 処理中にアカウントや画面が変わると元の学習へ遷移しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習が存在し、Deck 一覧を開いている。

When:

- Continue を実行し、完了前にアカウントを切り替える、または一覧を離れる。

Then:

- Continue の処理中にアカウントが変わった場合や一覧を離れた場合は、元の学習画面へ遷移しない。

<a id="study-session-25"></a>

### STUDY-SESSION-25 [TODO] 端末間の時計ずれがあっても終了済みの学習を再開しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーの Deck に、以前に終了した学習と、それより後に始めた新しい学習が存在する。
- 学習に使った端末間で時計がずれている。

When:

- 対象 Deck の学習を再開する。

Then:

- 端末間の時計ずれによって、以前に終了した学習が新しい学習の代わりに再開されることはない。

<a id="study-session-28"></a>

### STUDY-SESSION-28 [TODO] 明示的に終了した未完了の学習を完了として数えない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に未完了の学習が存在する。

When:

- 未完了の学習を明示的に終了する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-31"></a>

### STUDY-SESSION-31 期限に達した匿名の Card を新しい学習で再評価できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーの Deck で評価した Card が復習期限に達している。
- 以前の学習結果と復習予定が保存されている。

When:

- 新しい学習を開始し、同じ Card を再評価する。

Then:

- 期限に達した後は、新しい学習で同じ Card を再評価でき、それまでの記憶状態を引き継ぐ。再評価に関する保存の仕様は [FIRESTORE-STUDY-ANSWER-20](../integration/firestore/study-answer.md#firestore-study-answer-20) を参照する。

<a id="study-session-29"></a>

### STUDY-SESSION-29 [TODO] Deck の削除で終了した未完了の学習を完了として数えない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に未完了の学習が存在する。

When:

- 対象 Deck を削除する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-11"></a>

### STUDY-SESSION-11 表示できない Deck を勝手に全件表示へ切り替えない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 指定した Deck は自分の表示対象に存在しない。

When:

- その Deck を指定した学習記録の URL へ直接アクセスする。

Then:

- 読み込み完了後に対象の Deck を表示できない旨と、すべての Deck へ戻る操作を表示する。
- URL の Deck 指定は維持され、別の Deck や全 Deck の集計に勝手に切り替わらない。

<a id="study-session-16"></a>

### STUDY-SESSION-16 [TODO] 学習結果を読み込めない場合は未評価や対象0件として扱わない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に Card が存在する。
- 復習予定の判定に必要な保存済みの学習結果を読み込めない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- 学習結果を読み込めないエラーを表示し、未評価や対象0件として扱わない。

<a id="study-session-23"></a>

### STUDY-SESSION-23 [TODO] 利用できない学習を案内し後から届いた学習を表示する

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーの学習画面で、購読上の学習が存在しない。

When:

- 学習画面を表示し、その後に学習の snapshot が届く。

Then:

- 購読上の学習が存在しない場合は自動で一覧へ戻らず、利用できない旨と一覧へ戻る操作を表示する。後から学習の snapshot が届けばその状態を表示する。

<a id="study-session-33"></a>

### STUDY-SESSION-33 [TODO] 学習記録の取得失敗後に同じ期間で全体の集計を再試行できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示でき、集計に必要な結果の取得が失敗する。
- 開始日と終了日を指定した期間でも確認し、再試行時には最新の結果を取得できる。

When:

- 学習記録を開き、取得失敗後に再試行する。

Then:

- 取得に失敗した場合は部分的な集計を表示せず、再試行が成功した後に全体の集計を確認できる。
- 範囲指定は再試行でも維持する。明示的な再試行では、同じ期間の最新の結果を確認できる。

<a id="study-session-36"></a>

### STUDY-SESSION-36 [TODO] 無効な日付入力を適用せず現在の期間を維持する

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を、有効な期間で表示している。

When:

- 未入力・存在しない日付・終了日が開始日より前・未来の終了日のいずれかを入力し、適用する。

Then:

- 未入力・存在しない日付・終了日が開始日より前・未来の終了日は入力エラーとして表示し、適用中の範囲を変えない。

<a id="study-session-37"></a>

### STUDY-SESSION-37 [TODO] 無効な URL の期間をエラーとして示し有効な期間で復帰できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を利用できる。

When:

- 無効な期間を指定した学習記録 URL を開き、有効な期間を選び直す。

Then:

- 無効な URL の期間はエラーとして表示し、別期間の集計に読み替えない。有効な期間の選び直しで復帰できる。

<a id="study-session-27"></a>

### STUDY-SESSION-27 [TODO] Restart の保存失敗後も以前の学習を失わずに再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習が存在する。
- 新しい学習の保存が失敗し、再試行時には成功できる。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で session を開始する。
- 保存失敗後に再試行する。

Then:

- 新しい学習を保存できなかった場合は、以前の学習の Card・出題順・現在位置を失わずに再試行できる。

<a id="study-session-26"></a>

### STUDY-SESSION-26 [TODO] 読み込めない過去の学習があっても利用できる学習を再開できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーの Deck に、利用できる進行中の学習と、読み込めない過去の学習が存在する。

When:

- 対象 Deck の学習を再開する。

Then:

- 読み込めない過去の学習があっても、利用できる学習を再開できる。
