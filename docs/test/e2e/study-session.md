# Study Session E2E テスト仕様書

## 目的

学習の開始・再開・やり直し・完了が、選択した filter、学習上限、Deck ごとの再開位置を維持することを確認する。再読み込み後も学習を続けられ、学習記録を確認できる。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-SESSION-01 | write | 正常系 | [filter と学習上限を反映して session を開始できる](#study-session-01) |
| STUDY-SESSION-02 | read | 正常系 | [filter に一致する Card がない場合は session を開始できない](#study-session-02) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](#study-session-03) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい session を先頭から開始できる](#study-session-04) |
| STUDY-SESSION-05 | write | 正常系 | [最後の Card を完了して completion screen を表示できる](#study-session-05) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習 session を独立して維持できる](#study-session-06) |
| STUDY-SESSION-07 | write | 正常系 | [匿名での学習結果と再開位置を reload 後も維持できる](#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開した tag filter を保存して学習 session に適用できる](#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](#study-session-09) |
| STUDY-SESSION-10 | read | 正常系 | [URL と Deck 選択が再読み込み・戻る・進むでも一致する](#study-session-10) |
| STUDY-SESSION-11 | read | 異常系 | [表示できない Deck を勝手に全件表示へ切り替えない](#study-session-11) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](#study-session-12) |
| STUDY-SESSION-13 | read | 正常系 | [期間を選んで学習記録を確認できる](#study-session-13) |

<a id="study-session-01"></a>

### STUDY-SESSION-01 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

区分: 正常系

検証状況: 未実装（今回変更した閲覧分離の期待結果は未検証）

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、tags が異なる複数の Card が存在する。
- 対象 Deck に tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- 正の学習上限、0、1 のそれぞれで、対象 Deck の学習開始画面から新しい session を開始する。

Then:

- 開始時に選択している filter に一致する Card だけが出題される。開始前に Card、設定、時刻が変わった場合は、開始した時点の条件が反映される。
- 間隔反復 ON では、復習期限に達した Card を期限が古い順に優先し、その後にまだ評価していない Card を含める。期限が現在時刻と一致する Card も対象となり、未来の期限は対象外となる。同じ優先順位では標準の相対順序を維持する。
- 間隔反復 ON の shuffle は、上限内に選ばれた Card の順序だけを変える。間隔反復 OFF では未来の期限も含む全候補を標準順で扱い、shuffle が有効なら全候補の順序を変えた後に上限内の Card を出題する。
- 復習予定は保存済みの学習結果に基づく。学習結果が読み込めない場合はエラーを表示し、未評価や対象0件として扱わない。
- 学習開始画面と開始操作には学習条件を適用する。Card 一覧と Deck 閲覧は、学習条件とは独立した Card フィルターで表示対象を選ぶ。学習条件を閲覧フィルターへ引き継がない。詳細は [Card Filter](./card-filter.md) を参照する。
- 学習開始画面では、復習期限の到来、画面への復帰、Card や設定の変更で対象件数が更新される。時計が進んだり戻ったりした場合も、その時点の復習対象が表示される。
- 正の上限では、学習する Card 数が設定した上限と一致する。上限0では枚数を制限せず、filter と適用される復習条件に一致するすべての Card を含める。上限1では選ばれた先頭の Card だけを含める。
- 学習開始画面の件数と、実際に始まった学習の Card 数が一致する。
- session が作成されると学習画面へ遷移し、最初の Card の front text が表示される。
- アカウントを切り替えた後に、以前のアカウントのデータへ新しい学習が追加されない。
- 保存した学習を開き直すと、開始時の出題順と現在位置が維持される。再開だけで元の開始日時が変わらない。
- オフラインでの再読み込み直後や、別の Deck の保存を待っている間も Start / Restart を利用できる。後から同期に失敗した場合は通知されるが、その同期を待つために開始操作が無効になることはない。
- browser error が発生しない。

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
- browser error が発生しない。

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
- このブラウザーで保存済みの学習は、オフラインで再読み込みした後も、クラウドの応答を待たずに Continue できる。Start / Restart も利用できる。
- 保存済みの学習 URL を直接開いた場合は、読み込み中に勝手に一覧へ戻らず、読み込み後に保存された位置を表示する。再開の読み込み待ちだけで Start / Restart が利用できなくなることはない。
- ページ移動、アプリ終了、時間経過だけでは学習が終了しない。同期済みの学習は、同じアカウントの別ブラウザーでも同じ出題順と位置から再開できる。
- 端末間の時計ずれによって、以前に終了した学習が新しい学習の代わりに再開されることはない。
- 最近学習した時刻が分からない場合は、推測した経過時間を表示しない。
- 読み込めない過去の学習があっても、利用できる学習を再開できる。
- Deck 一覧へ戻る前に表示されていた Card の front text が表示される。
- browser error が発生しない。

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

- 新しい学習が先頭から始まる。新しい学習を保存できなかった場合は、以前の学習の Card・出題順・現在位置を失わずに再試行できる。
- やり直し前の学習は完了ではなく中止として扱われ、新しい学習の代わりに Continue されない。明示的な終了や Deck の削除でも、未完了の学習を完了として数えない。
- 同じ Deck で順に複数の学習を始めた場合は、最後に新しく始めた学習を利用できる。複数端末からの同時開始や、未同期の変更同士の競合は対象外とする。
- 新しい学習の現在位置は先頭になる。
- 新しい学習の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="study-session-05"></a>

### STUDY-SESSION-05 最後の Card を完了して completion screen を表示できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- 認証済みユーザーが所有する Deck の学習 session で、最後の Card が表示されている。

When:

- 最後の Card に評価を行う。

Then:

- 最後の Card の学習結果が保存される。
- 対象 Deck の学習が完了となり、進行中の学習としては表示されない。学習記録では完了した日時を確認できる。
- 完了画面に完了メッセージと学習した Card 数が表示される。
- 自動で Deck 一覧へ戻らず、Deck 一覧へ戻る操作を利用できる。
- Deck 一覧へ戻った後、対象 Deck に Continue は表示されない。
- browser error が発生しない。

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
- browser error が発生しない。

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
- 間隔反復 ON で新しい学習を始める場合は、評価した Card は復習期限前には対象外となり、画面を開いたまま期限を迎えると対象に戻る。
- 期限に達した後は、新しい学習で同じ Card を再評価でき、それまでの記憶状態を引き継ぐ。再評価に関する保存の仕様は [FIRESTORE-STUDY-ANSWER-20](../integration/firestore/study-answer.md#firestore-study-answer-20) を参照する。
- 学習の現在位置は次の Card に維持される。
- 次の Card の front text が表示され、back text は表示されない。
- 匿名での学習結果と再開位置はこのブラウザーだけに保持され、クラウドへ送信されない。
- browser error が発生しない。

<a id="study-session-08"></a>

### STUDY-SESSION-08 展開した tag filter を保存して学習 session に適用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- 認証済みユーザーが所有する Deck に、それぞれ異なる tag を持つ複数の Card が存在する。
- 対象 tag は最初の表示では折りたたまれており、まだ filter に選択されていない。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- 学習開始画面で追加の tag を展開し、対象 tag を選択する。
- filter の保存完了後に画面を reload し、学習 session を開始する。

Then:

- tag の変更は自動保存され、保存ボタンは表示されない。
- reload 後も対象 tag が表示され、選択状態を維持する。
- 対象 Deck の tag filter では対象 tag だけが選択されている。
- 対象 tag を持つ Card だけが学習に含まれる。
- 対象 Card の front text が表示される。
- browser error が発生しない。

## 学習記録の共通の期待結果

- 開始数は学習を始めた日、完了数は最後まで学習を終えた日で独立して数える。日付は表示している端末の暦日に従う。
- 初期期間は今日を含む30日間とする。7日・30日・90日、または開始日・終了日を選択できる。範囲指定では開始日の0時から終了日の翌日0時までを対象とし、両端の日付を含む。
- 同じ学習の再開では開始数を増やさず、新しく始めた学習は別の1件とする。中止は完了数に含めない。
- 100件を超えても集計を打ち切らず、削除済みの Deck と別アカウントの Deck は除外する。完了率は表示しない。
- コンパクトな合計と横スクロール不要のグラフの下に、同じアカウント・Deck・期間の最近の学習を表示する。最初は3件で、展開すると最大10件を確認できる。
- 日別表は最初は閉じており、開くと新しい日付から30日ずつ確認できる。
- グラフは31日以内なら日単位、32〜180日なら7日単位、181〜366日なら30日単位、それより長い期間は最大24区間にまとめる。区間は選択した開始日を基準とし、最後は終了日までとする。日別の値と期間合計はまとめずに確認できる。
- 最近の学習には、期間内に開始または完了した学習を一度ずつ表示する。期間内の開始・完了のうち新しい日時から並べ、同日時でも表示順は安定する。
- 期間前に開始して期間内に完了した学習は含める。期間前に開始して期間内に中止しただけの学習は含めず、中止だけで並び順を更新しない。
- 削除済みの Deck は最近の学習の10件に含めない。日別集計と期間合計は、画面に表示する最近の学習だけでなく、対象の全記録から求める。
- 各記録に現在の Deck 名、開始日時、終了日時（未終了は「—」）、対象 Card 数、未完了／完了／中止を表示する。
- 表示の展開・折りたたみだけでは学習記録を変更しない。アカウント・Deck・期間の切り替え後に、以前の条件の結果を混ぜない。
- 今日を基準とする期間は、表示・条件変更・再試行・端末の日付変更に合わせて更新する。開始日と終了日を指定した場合は、その日付を維持する。
- 集計に必要な結果がそろうまでは読み込み中とする。一部でも取得に失敗した場合は0件や部分的な合計として表示せず、画面内のエラーから再試行できる。

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
- 取得に失敗した場合は部分的な集計を表示せず、再試行が成功した後に全体の集計を確認できる。
- browser error が発生しない。

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
- browser error が発生しない。

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
- browser error が発生しない。

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
- ログイン中の通信断でも、一度読み込んだ学習記録を表示できる。その表示をクラウドの全履歴とは断定しない。
- browser error が発生しない。

<a id="study-session-13"></a>

### STUDY-SESSION-13 期間を選んで学習記録を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示でき、履歴はまだない。

When:

- 学習記録で7日・90日を選び、日別表を開いて古い日付のページへ進む。
- 期間指定で過去の開始日・終了日を入力して適用し、Deck を選択する。
- 戻る・進む・再読み込みで同じ範囲を復元する。

Then:

- 合計・グラフ・最近の学習・日別表が選択期間と Deck に一致する。空の履歴を架空の件数で埋めない。
- 期間は URL の `days` または `start` / `end` に反映され、Deck の選択を変えても期間は変わらない。
- 7日なら日ごと、90日なら7日ごとのグラフとなり、表はすべての日付を30日ずつ確認できる。
- 範囲指定は両端の日付を含む。1日だけ、月・年またぎ、夏時間をまたぐ範囲も端末の暦日で集計する。
- 履歴がある場合、範囲外の開始や完了は集計せず、範囲内の完了は開始日が範囲外でも集計する。
- 未入力・存在しない日付・終了日が開始日より前・未来の終了日は入力エラーとして表示し、適用中の範囲を変えない。
- 無効な URL の期間はエラーとして表示し、別期間の集計に読み替えない。有効な期間の選び直しで復帰できる。
- 範囲を変えた直後は以前の範囲の結果を表示せず、後から以前の結果が届いても混ぜない。範囲指定は再試行でも維持する。
- 画面を開いたまま端末の日付が変わると、今日を基準とする期間と入力可能な最終日が更新される。範囲指定の両端は維持される。
- 範囲指定では日付変更だけで表示済みの結果が消えない。明示的な再試行では、同じ期間の最新の結果を確認できる。
- browser error が発生しない。
