# Study Session E2E テスト仕様書

## 目的

学習の再開・やり直し・完了、保存した学習条件、匿名での結果の保持、学習記録の再表示を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-SESSION-22 | read | 正常系 | [保存済みの学習をオフラインや別ブラウザーで再開できる](#study-session-22) |
| STUDY-SESSION-24 | read | 正常系 | [学習 URL を直接開くと保存位置を表示する](#study-session-24) |
| STUDY-SESSION-34 | read | 正常系 | [通信断でも読み込み済みの学習記録を表示する](#study-session-34) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい学習を先頭から開始できる](#study-session-04) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](#study-session-03) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習を独立して維持できる](#study-session-06) |
| STUDY-SESSION-05 | write | 正常系 | [最後の評価を保存すると完了画面を表示する](#study-session-05) |
| STUDY-SESSION-07 | write | 正常系 | [匿名の学習結果と再開位置を再読み込み後も利用できる](#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開したタグの選択を自動保存する](#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](#study-session-09) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](#study-session-12) |
| STUDY-SESSION-25 | write | 正常系 | [端末間の時計ずれがあっても終了済みの学習を再開しない](#study-session-25) |
| STUDY-SESSION-28 | write | 正常系 | [明示的に終了した未完了の学習を完了として数えない](#study-session-28) |
| STUDY-SESSION-29 | batch | 正常系 | [Deck の削除で終了した未完了の学習を完了として数えない](#study-session-29) |
| STUDY-SESSION-27 | write | 異常系 | [Restart の保存失敗後も以前の学習を失わずに再試行できる](#study-session-27) |

<a id="study-session-22"></a>

### STUDY-SESSION-22 [TODO] 保存済みの学習をオフラインや別ブラウザーで再開できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に、保存済みの未完了の学習がある。
- 学習は端末に読み込み済みで、別ブラウザーで確認するものは同期済みである。

When:

- 学習画面を離れ、アプリ終了・時間経過後に開き直す。オフラインの再読み込みと同じアカウントの別ブラウザーでも再開する。

Then:

- 画面移動・アプリ終了・時間経過で学習は終了せず、オフラインでも保存内容を復元できる。
- 別ブラウザーでも同期済みの出題順と位置から再開できる。

<a id="study-session-24"></a>

### STUDY-SESSION-24 [TODO] 学習 URL を直接開くと保存位置を表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に、保存済みの未完了の学習がある。

When:

- 保存済みの学習 URL を直接開き、読み込み完了を待つ。

Then:

- 読み込み中に一覧へ戻らず、完了後に保存位置を表示する。
- 読み込み待ちだけでは Start / Restart を無効にしない。

<a id="study-session-34"></a>

### STUDY-SESSION-34 [TODO] 通信断でも読み込み済みの学習記録を表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 通常アカウントでログインし、学習記録を一度読み込んでいる。

When:

- 通信が切れた状態で、読み込み済みの学習記録を表示する。

Then:

- 読み込み済みの記録を表示し、クラウドの全履歴とは断定しない。

<a id="study-session-04"></a>

### STUDY-SESSION-04 Restart で新しい学習を先頭から開始できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で、先頭より後の Card を学習中である。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で学習を開始する。

Then:

- 以前の学習を中止扱いとし、新しい学習の代わりに再開しない。
- 同じ Deck で順に開始した場合は最後の学習を利用する。複数端末の同時開始・未同期変更の競合は対象外とする。
- 新しい学習の先頭 Card の表面を表示する。

<a id="study-session-03"></a>

### STUDY-SESSION-03 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で、先頭より後の Card を学習中である。

When:

- 学習画面から Deck 一覧へ戻り、同じ Deck の Continue を実行する。

Then:

- 元の出題順・現在位置から再開し、評価後の復習期限で Card を選び直さない。
- 再開した Deck は、最近学習した Deck として学習中の並び順に反映される。
- 最近の学習日時は端末で学習・再開した日時とし、同期が遅れても同期日時へ置き換えない。
- 最近学習した時刻が分からない場合は、推測した経過時間を表示しない。
- 同じ Card の表面を表示し、元の開始日時を維持する。

<a id="study-session-06"></a>

### STUDY-SESSION-06 複数 Deck の学習を独立して維持できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- ログイン中のアカウントの複数 Deck に、再開位置が異なる学習がある。

When:

- 一方の Deck で評価を行って Deck 一覧へ戻り、もう一方の Deck を Continue する。

Then:

- 最初の Deck の評価結果と進んだ位置を維持する。
- 学習した Card の内容と作成日時は変わらず、今回の評価が記憶状態と最終復習に反映される。
- もう一方の Deck は操作前と同じ学習の現在位置から再開する。
- 各 Deck の Card と学習結果・現在位置が混在しない。

<a id="study-session-05"></a>

### STUDY-SESSION-05 最後の評価を保存すると完了画面を表示する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- ログイン中のアカウントの Deck で最後の Card を学習中である。
- 途中の Card には回答せず、最後の Card だけを評価する場合も含む。

When:

- 最後の Card に評価を行う。

Then:

- 最後の評価結果を保存する。ローカル反映で学習が消えても、サーバー応答待ちは読み込み表示とし、完了画面へ進まない。
- 対象 Deck の学習は完了扱いとなり、学習記録で完了日時を確認できる。
- 完了画面に完了メッセージと対象 Card 数を表示する。件数は回答数・閲覧数ではなく、スキップ・スライダー移動分も含む。
- 件数は日本語で「対象カード: ○枚」、英語で「Session: ○ card」（1枚）／「Session: ○ cards」（複数枚）と表示する。
- 完了メッセージの見出しにフォーカスが移る。
- 自動遷移せず、Deck 一覧へ戻る操作を表示する。
- Deck 一覧へ戻った後、対象 Deck に Continue は表示されない。

<a id="study-session-07"></a>

### STUDY-SESSION-07 匿名の学習結果と再開位置を再読み込み後も利用できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーの複数 Card を学習中で、現在の表面を表示している。

When:

- 現在の Card を評価してから再読み込みし、Deck 一覧から学習を再開する。
- 評価した Card の復習予定を確認し、その時刻を過ぎた別の学習で再び評価してから再読み込みする。

Then:

- 最初の評価結果と次の位置を復元し、続きの Card の表面を表示する。
- 評価した Card の記憶状態を確認でき、再度の学習も次の Card から再開できる。
- 学習結果と再開位置は同じ匿名アカウントのブラウザーだけに保持され、クラウドへ送信されない。

<a id="study-session-08"></a>

### STUDY-SESSION-08 展開したタグの選択を自動保存する

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- ログイン中のアカウントの Deck に、タグが異なる複数の Card がある。
- 対象タグは最初の表示では折りたたまれており、まだフィルターに選択されていない。
- 対象 Deck に進行中の学習が存在しない。

When:

- 学習開始画面で追加のタグを展開し、対象タグを選択する。
- フィルターの保存完了後に画面を再読み込みする。

Then:

- 変更を自動保存し、保存ボタンは表示しない。
- 再読み込み後も対象タグを表示し、そのタグだけが選択された状態を維持する。

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
- 日別表を開くと開始・完了数を確認でき、閉じたままでも最近の学習に完了した1件を確認できる。

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

<a id="study-session-25"></a>

### STUDY-SESSION-25 [TODO] 端末間の時計ずれがあっても終了済みの学習を再開しない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に、終了済みの学習と、その後に開始した新しい学習がある。
- 学習に使った端末間で時計がずれている。

When:

- 対象 Deck の学習を再開する。

Then:

- 新しい学習を再開し、時計ずれで終了済みの学習を選ばない。

<a id="study-session-28"></a>

### STUDY-SESSION-28 [TODO] 明示的に終了した未完了の学習を完了として数えない

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に未完了の学習がある。

When:

- 未完了の学習を明示的に終了する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-29"></a>

### STUDY-SESSION-29 [TODO] Deck の削除で終了した未完了の学習を完了として数えない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に未完了の学習がある。

When:

- 対象 Deck を削除する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-27"></a>

### STUDY-SESSION-27 [TODO] Restart の保存失敗後も以前の学習を失わずに再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で、先頭より後の Card を学習中である。
- 新しい学習の保存が失敗し、再試行時には成功できる。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で学習を開始する。
- 保存失敗後に再試行する。

Then:

- 以前の学習の Card・出題順・現在位置を維持して再試行できる。
