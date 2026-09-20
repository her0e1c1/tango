# Study Session E2E テスト仕様書

## 目的

学習 session の開始・再開・再作成・完了・永続化が、filter の選択と保存、学習上限、Deck ごとの分離を維持できることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-06 | write | [filter と学習上限を反映して session を開始できる](#swipe-06) |
| SWIPE-07 | read | [filter に一致する Card がない場合は session を開始できない](#swipe-07) |
| SWIPE-08 | write | [学習画面から戻った後に同じ位置から Continue できる](#swipe-08) |
| SWIPE-09 | write | [Restart で新しい session を先頭から開始できる](#swipe-09) |
| SWIPE-10 | write | [最後の Card を完了して completion screen を表示できる](#swipe-10) |
| SWIPE-11 | batch | [複数 Deck の学習 session を独立して維持できる](#swipe-11) |
| SWIPE-17 | write | [local-only Deck の学習結果と session を reload 後も維持できる](#swipe-17) |
| SWIPE-26 | batch | [展開した tag filter を保存して学習 session に適用できる](#swipe-26) |

<a id="swipe-06"></a>

### SWIPE-06 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、difficulty と tags の組み合わせが異なる複数の Card が存在する。
- 対象 Deck に difficulty と tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- fixture の正の学習上限、0、1 のそれぞれで対象 Deck の学習開始画面から新しい session を開始する。

Then:

- session には保存済み filter に一致する Card だけが含まれる。
- 正の上限では session の Card 数が設定済みの学習上限と一致する。
- 上限 0 では枚数を制限せず、filter と適用される復習条件に一致するすべての Card を含む。上限 1 ではそのうち先頭の Card だけを含む。
- 学習開始画面と start action の件数が新しい session の件数と一致する。
- session の先頭 Card の front text が表示される。
- 開始操作は実行時点の認証を使い、別アカウントへの切替後に以前の UID で保存しない。
- ログイン済みユーザーの remote Deck では、session ID を document ID として Firestore の `studySession` に所有者、Deck、出題順、現在位置、開始時刻を保存する。回答情報は含めない。
- `createdAt` / `updatedAt` は server timestamp の技術メタ情報であり、開始・終了時刻や最近学習した時刻とは分ける。
- オフライン再読み込み直後や別 Deck の保存待ちでも Start / Restart を許可し、書き込みは Firestore SDK のオフラインキューへ渡す。同期失敗は共通の通知で知らせ、開始操作を禁止しない。
- browser error が発生しない。

<a id="swipe-07"></a>

### SWIPE-07 filter に一致する Card がない場合は session を開始できない

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

<a id="swipe-08"></a>

### SWIPE-08 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- 学習画面から Deck 一覧へ戻り、同じ Deck の Continue を実行する。

Then:

- Deck 一覧へ戻る前と同じ学習 session が維持される。
- Continue は遷移前に対象 session の最終学習時刻を更新する。
- browser storage に残る同一ユーザーの session は、オフライン再読み込み後も初回同期を待たずに Continue できる。Start / Restart も初回同期を待たない。
- 保存済み session の学習 URL を直接開いた場合は、初回受信前に一覧へ戻らず、受信した位置から表示する。この読込表示は Start / Restart の可否には影響しない。
- ページ移動、アプリ終了、時間経過だけでは終了しない。remote session は browser storage がない同一ユーザーの client でも同じ ID・出題順・位置から再開できる。
- 端末間の時計ずれによって古い終了済み session を最新と誤認しない。session 間の作成順には server の `createdAt` を使い、最近学習した時刻の代用にはしない。
- 別端末から復元して最近学習した時刻が不明な場合は、一覧に架空の経過時間を表示しない。
- 不正または旧形式の remote document が混在しても、有効な session の同期・再開を妨げない。
- Deck 一覧へ戻る前に表示されていた Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-09"></a>

### SWIPE-09 Restart で新しい session を先頭から開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、先頭より後の Card まで進んだ学習 session が存在する。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で session を開始する。

Then:

- 以前とは異なる新しい学習 session が保存される。
- この端末で既知の以前の remote session は `endReason: abandoned` と server timestamp の終了時刻を保持する。明示的な session 終了操作や Deck 削除も破棄として扱う。
- 複数の remote session がある場合は、読み込み時に最新の作成時刻の session を採用する。複数端末の同時操作・未送信状態との厳密な競合調停と、未取得の旧 session をすべて終了する保証は対象外とする。同時開始の収束は別 Issue #1658 で扱う。
- 新しい session の位置が先頭になる。
- 新しい session の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-10"></a>

### SWIPE-10 最後の Card を完了して completion screen を表示できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-last`](./fixture/study-session-last.yaml)
- 認証済みユーザーが所有する Deck の学習 session で、最後の Card が表示されている。

When:

- 最後の Card に学習結果を保存する action を実行する。

Then:

- 最後の Card の学習結果が保存される。
- 対象 Deck の学習 session がローカルの進行中一覧から削除され、remote document は `endReason: completed` と server timestamp の終了時刻を保持する。
- 進捗更新では終了状態を変更しない。Firestore Rules は認証と所有者を検証し、位置や終了理由の状態遷移は制約しない。
- Study completion screen に完了 message と学習した Card 数が表示される。
- Deck 一覧へ automatic redirect せず、Deck 一覧へ戻る action が利用できる。
- Deck 一覧へ戻った後、対象 Deck に Continue action が表示されない。
- browser error が発生しない。

<a id="swipe-11"></a>

### SWIPE-11 複数 Deck の学習 session を独立して維持できる

カテゴリ: `batch`

Given:

- Fixture: [`multi-study-sessions`](./fixture/multi-study-sessions.yaml)
- 認証済みユーザーが所有する複数の Deck に、それぞれ異なる位置の学習 session が存在する。

When:

- 一方の Deck で学習 action を実行して Deck 一覧へ戻り、もう一方の Deck を Continue する。

Then:

- 最初の Deck の学習結果と session の位置が保存される。
- もう一方の Deck は操作前の session と位置から再開する。
- 各 Deck の Card と session が混在しない。
- browser error が発生しない。

<a id="swipe-17"></a>

### SWIPE-17 local-only Deck の学習結果と session を reload 後も維持できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- browser storage に、複数の Card を含む local-only Deck と進行中の学習 session が存在する。
- 現在の Card の表面が表示されている。
- 上方向の drag は mastered action に設定されている。

When:

- primary mouse button で現在の Card を上方向へ drag し、次の Card への遷移完了後にページを reload する。

Then:

- 現在だった Card の mastered 学習結果が browser storage に維持されている。
- session の位置が次の Card に維持されている。
- 次の Card の front text が表示され、back text は表示されない。
- local-only Deck と匿名ユーザーの session は Firestore へ書き込まない。
- browser error が発生しない。

<a id="swipe-26"></a>

### SWIPE-26 展開した tag filter を保存して学習 session に適用できる

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
