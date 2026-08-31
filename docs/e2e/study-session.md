# Study Session E2E テスト仕様書

## 目的

学習 session の開始・再開・再作成・完了・永続化と、target Card を利用できない場合の復旧が、filter の選択と保存、学習上限、Deck ごとの分離を維持できることを確認する。

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
| SWIPE-27 | read | [remote target Card の欠損理由を表示して学習設定へ復帰できる](#swipe-27) |
| SWIPE-28 | read | [remote target Card の確認失敗後に Retry して同じ Card へ復帰できる](#swipe-28) |
| SWIPE-29 | read | [local target Card の欠損理由を表示して学習設定へ復帰できる](#swipe-29) |

<a id="swipe-06"></a>

### SWIPE-06 filter と学習上限を反映して session を開始できる

カテゴリ: `write`

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- 認証済みユーザーが所有する Deck に、score と tags の組み合わせが異なる複数の Card が存在する。
- 対象 Deck に score と tag の filter が保存されている。
- 設定済みの学習上限より多くの Card が保存済み filter に一致する。

When:

- 対象 Deck の学習開始画面から session を開始する。

Then:

- session には保存済み filter に一致する Card だけが含まれる。
- session の Card 数が設定済みの学習上限を超えない。
- session の先頭 Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-07"></a>

### SWIPE-07 filter に一致する Card がない場合は session を開始できない

カテゴリ: `read`

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- 認証済みユーザーが所有する Deck に Card が存在する。
- 学習開始画面の score と tag の filter に一致する Card が存在しない。

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
- 対象 Deck の学習 session が削除される。
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

- reload 後も対象 tag が表示され、選択状態を維持する。
- 対象 Deck の保存済み tag filter に対象 tag だけが含まれる。
- session には対象 tag を持つ Card だけが含まれる。
- 対象 Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-27"></a>

### SWIPE-27 remote target Card の欠損理由を表示して学習設定へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-remote-absent`](./fixture/study-session-remote-absent.yaml)
- 認証済みユーザーが所有する remote Deck に進行中の学習 session が存在する。
- session の target Card は、server に存在しないか tombstone として保存されている。

When:

- missing target と tombstoned target の学習画面を開き、それぞれの recovery action で学習設定へ戻る。

Then:

- target の確認中は loading state が表示され、session は削除されない。
- server-confirmed missing と tombstone を区別する説明が表示される。
- Retry は表示されず、`Back to study setup` action が focus される。
- reason screen を automatic redirect で隠さず、recovery action を実行するまでは同じ URL と session の位置を維持する。
- recovery action 後は対象 session が削除され、同じ Deck の学習設定へ移動する。
- recovery を Study completion として表示しない。
- browser error が発生しない。

<a id="swipe-28"></a>

### SWIPE-28 remote target Card の確認失敗後に Retry して同じ Card へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-remote-absent`](./fixture/study-session-remote-absent.yaml)
- 認証済みユーザーが所有する remote Deck に進行中の学習 session が存在する。
- target Card の single-document verification だけが permission error になる。

When:

- verification error 画面から session-preserving `Exit` で Deck 一覧へ戻り、同じ session を Continue する。
- `Retry` を実行し、確認が pending の間に target Card が active として確認できる状態へ戻る。

Then:

- target Card が存在しないとは断定しない error explanation と `Retry`、`Exit` が表示される。
- error 表示時は `Retry` が focus される。
- `Exit` 後も session と current position が維持される。
- Retry pending 中は `Retry` が loading かつ disabled になり、同じ verification を重複実行できない。
- Retry 成功後は同じ Card の front text が表示され、Card に focus context が戻る。
- verification error と Retry pending の間も session と current position が維持される。
- browser error が発生しない。

<a id="swipe-29"></a>

### SWIPE-29 local target Card の欠損理由を表示して学習設定へ復帰できる

カテゴリ: `read`

Given:

- Fixture: [`study-session-local-absent`](./fixture/study-session-local-absent.yaml)
- browser storage に local-only Deck と進行中の学習 session が存在する。
- session の target Card は local Card persistence に存在しない。

When:

- 対象 Deck の学習画面を開き、recovery action で学習設定へ戻る。

Then:

- local target がこの device に保存されていないことを説明する reason screen が表示される。
- Retry は表示されず、`Back to study setup` action が focus される。
- reason screen を automatic redirect で隠さず、recovery action を実行するまでは同じ URL と session を維持する。
- recovery action 後は対象 session が削除され、同じ Deck の学習設定へ移動する。
- recovery を Study completion として表示しない。
- browser error が発生しない。
