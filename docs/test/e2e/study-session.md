# Study Session E2E テスト仕様書

## 目的

学習条件に従った開始、Deck ごとの再開・やり直し・完了と、学習記録の表示を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-SESSION-02 | read | 正常系 | [対象 Card が0件なら学習を開始できない](#study-session-02) |
| STUDY-SESSION-10 | read | 正常系 | [URL と Deck 選択が再読み込み・戻る・進むでも一致する](#study-session-10) |
| STUDY-SESSION-13 | read | 正常系 | [プリセット期間を選んで学習記録と日別表を確認できる](#study-session-13) |
| STUDY-SESSION-17 | read | 正常系 | [学習条件を Card 一覧と Deck 閲覧のフィルターへ引き継がない](#study-session-17) |
| STUDY-SESSION-18 | read | 正常系 | [期限・画面復帰・データ変更で学習対象件数を更新する](#study-session-18) |
| STUDY-SESSION-22 | read | 正常系 | [保存済みの学習をオフラインや別ブラウザーで再開できる](#study-session-22) |
| STUDY-SESSION-24 | read | 正常系 | [学習 URL を直接開くと保存位置を表示する](#study-session-24) |
| STUDY-SESSION-30 | read | 正常系 | [匿名で評価した Card が期限到来で学習対象に戻る](#study-session-30) |
| STUDY-SESSION-34 | read | 正常系 | [通信断でも読み込み済みの学習記録を表示する](#study-session-34) |
| STUDY-SESSION-35 | read | 正常系 | [指定した Deck と期間を再読み込み後も維持する](#study-session-35) |
| STUDY-SESSION-38 | read | 正常系 | [期間の切り替え後に以前の期間の結果を混ぜない](#study-session-38) |
| STUDY-SESSION-39 | read | 正常系 | [端末の日付変更時に相対期間を更新し指定期間を維持する](#study-session-39) |
| STUDY-SESSION-01 | write | 正常系 | [フィルターと学習上限を反映して学習を開始できる](#study-session-01) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい学習を先頭から開始できる](#study-session-04) |
| STUDY-SESSION-14 | write | 正常系 | [開始時点の Card・設定・時刻で出題対象を選び直す](#study-session-14) |
| STUDY-SESSION-15 | write | 正常系 | [間隔反復・シャッフル・上限に従って出題する](#study-session-15) |
| STUDY-SESSION-19 | write | 正常系 | [アカウント切り替え後に以前のアカウントへ新しい学習を追加しない](#study-session-19) |
| STUDY-SESSION-20 | write | 正常系 | [通常アカウントの Start・Restart・Continue は保存成功まで遷移を待つ](#study-session-20) |
| STUDY-SESSION-32 | write | 正常系 | [保存済みのタグフィルターで学習を開始する](#study-session-32) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](#study-session-03) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習を独立して維持できる](#study-session-06) |
| STUDY-SESSION-05 | write | 正常系 | [最後の評価を保存すると完了画面を表示する](#study-session-05) |
| STUDY-SESSION-07 | write | 正常系 | [匿名での学習結果と再開位置を再読み込み後も維持できる](#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開したタグの選択を自動保存する](#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](#study-session-09) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](#study-session-12) |
| STUDY-SESSION-21 | write | 正常系 | [Continue 中のアカウント変更・離脱後は遷移しない](#study-session-21) |
| STUDY-SESSION-25 | write | 正常系 | [端末間の時計ずれがあっても終了済みの学習を再開しない](#study-session-25) |
| STUDY-SESSION-28 | write | 正常系 | [明示的に終了した未完了の学習を完了として数えない](#study-session-28) |
| STUDY-SESSION-31 | write | 正常系 | [期限に達した匿名の Card を新しい学習で再評価できる](#study-session-31) |
| STUDY-SESSION-29 | batch | 正常系 | [Deck の削除で終了した未完了の学習を完了として数えない](#study-session-29) |
| STUDY-SESSION-11 | read | 異常系 | [表示できない Deck を勝手に全件表示へ切り替えない](#study-session-11) |
| STUDY-SESSION-16 | read | 異常系 | [学習結果を読み込めない場合は未評価や対象0件として扱わない](#study-session-16) |
| STUDY-SESSION-23 | read | 異常系 | [利用できない学習を案内し後から届いた学習を表示する](#study-session-23) |
| STUDY-SESSION-33 | read | 異常系 | [取得失敗後も同じ期間の学習記録を再取得できる](#study-session-33) |
| STUDY-SESSION-36 | read | 異常系 | [無効な日付入力を適用せず現在の期間を維持する](#study-session-36) |
| STUDY-SESSION-37 | read | 異常系 | [URL の無効な期間を選び直して復帰できる](#study-session-37) |
| STUDY-SESSION-27 | write | 異常系 | [Restart の保存失敗後も以前の学習を失わずに再試行できる](#study-session-27) |
| STUDY-SESSION-26 | write | 異常系 | [読み込めない過去の学習があっても利用できる学習を再開できる](#study-session-26) |

<a id="study-session-02"></a>

### STUDY-SESSION-02 対象 Card が0件なら学習を開始できない

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 対象0件の案内と開始不可（[PLAYWRIGHT-STUDY-SESSION-START-02](../integration/playwright/study-session-start.md#playwright-study-session-start-02)、[PLAYWRIGHT-STUDY-SESSION-START-15](../integration/playwright/study-session-start.md#playwright-study-session-start-15)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter-no-matches`](./fixture/study-filter-no-matches.yaml)
- ログイン中のアカウントの Deck に Card がある。
- 学習タグフィルターに一致する Card はない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- 対象0件と表示し、開始ボタンは無効になる。新しい学習や再開対象は追加されない。

<a id="study-session-10"></a>

### STUDY-SESSION-10 URL と Deck 選択が再読み込み・戻る・進むでも一致する

カテゴリ: `read`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: Deck選択・router履歴とURLの一致、0件表示（[PLAYWRIGHT-STUDY-HISTORY-10](../integration/playwright/study-history.md#playwright-study-history-10)）。置換実装後の E2E 目的: ブラウザー再読込後もURLとDeck選択を復元。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck 一覧を表示でき、学習記録はまだない。

When:

- Deck 操作メニューから学習記録を開く。
- すべての Deck を選び、ブラウザーの戻る・進む・再読み込みを行う。

Then:

- 選んだ Deck が学習記録でも選択され、履歴移動・再読み込み後も URL と選択が一致する。
- 0件のサマリー・グラフ・表と記録なしの案内が表示される。

<a id="study-session-13"></a>

### STUDY-SESSION-13 プリセット期間を選んで学習記録と日別表を確認できる

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 7日・90日・URL・0件表示・日別30日ページの連動（[PLAYWRIGHT-STUDY-HISTORY-11](../integration/playwright/study-history.md#playwright-study-history-11)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示でき、履歴はまだない。

When:

- 学習記録で7日・90日を選び、日別表を開いて古い日付のページへ進む。

Then:

- 合計・グラフ・最近の学習・日別表は選択期間と Deck に一致し、履歴がなければ0件で表示する。
- 7日なら日ごと、90日なら7日ごとのグラフとなり、表はすべての日付を30日ずつ確認できる。
- 選んだ期間は URL の `days` に反映される。

<a id="study-session-17"></a>

### STUDY-SESSION-17 [TODO] 学習条件を Card 一覧と Deck 閲覧のフィルターへ引き継がない

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 学習条件とCard一覧・Deck閲覧のフィルターを分離（[PLAYWRIGHT-STUDY-SESSION-START-08](../integration/playwright/study-session-start.md#playwright-study-session-start-08)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck に、タグが異なる複数の Card がある。
- 対象 Deck には学習条件と、それとは独立した Card フィルターが保存されている。

When:

- 学習開始画面の対象件数を確認した後、Card 一覧と Deck 閲覧を開く。

Then:

- 学習には学習条件を、Card 一覧・Deck 閲覧には独立した [Card フィルター](./card-filter.md) を適用する。

<a id="study-session-18"></a>

### STUDY-SESSION-18 [TODO] 期限・画面復帰・データ変更で学習対象件数を更新する

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 期限・画面復帰・Card/設定変更・時計前後移動で件数更新（[PLAYWRIGHT-STUDY-SESSION-START-07](../integration/playwright/study-session-start.md#playwright-study-session-start-07)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck の学習開始画面を開いている。
- 間隔反復が ON で、保存済みの学習結果と学習条件を読み込める。

When:

- 復習期限の到来、画面への復帰、Card や設定の変更を迎える。時計が進む場合と戻る場合も含む。

Then:

- その時点の Card・設定・時刻に従って対象件数を更新する。時計の前進・後退にも追従する。

<a id="study-session-22"></a>

### STUDY-SESSION-22 [TODO] 保存済みの学習をオフラインや別ブラウザーで再開できる

カテゴリ: `read`

区分: 正常系

関連仕様: E2E維持。E2E の目的: オフライン再読込と別ブラウザーで同期済みの順序・位置を復元。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 直接URLの読込待ちと受信位置の表示、読込中に自動遷移しない（[PLAYWRIGHT-STUDY-SESSION-34](../integration/playwright/study-session.md#playwright-study-session-34)）。置換実装後の E2E 目的: 保存済みの学習を直接URLで実購読して復元。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に、保存済みの未完了の学習がある。

When:

- 保存済みの学習 URL を直接開き、読み込み完了を待つ。

Then:

- 読み込み中に一覧へ戻らず、完了後に保存位置を表示する。
- 読み込み待ちだけでは Start / Restart を無効にしない。

<a id="study-session-30"></a>

### STUDY-SESSION-30 匿名で評価した Card が期限到来で学習対象に戻る

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 匿名Cardの与えられた復習期限到来で件数更新（[PLAYWRIGHT-STUDY-SESSION-START-07](../integration/playwright/study-session-start.md#playwright-study-session-start-07)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーの Deck で Card を評価済みで、復習予定が保存されている。
- 間隔反復が ON で、評価した Card の復習期限前に学習開始画面を開いている。

When:

- 学習開始画面を開いたまま、評価した Card の復習期限を迎える。

Then:

- 評価済み Card は期限前には対象外で、画面を開いたまま期限を迎えると対象に戻る。

<a id="study-session-34"></a>

### STUDY-SESSION-34 [TODO] 通信断でも読み込み済みの学習記録を表示する

カテゴリ: `read`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: cache由来の記録を全クラウド履歴と区別して表示（[PLAYWRIGHT-STUDY-HISTORY-12](../integration/playwright/study-history.md#playwright-study-history-12)）。置換実装後の E2E 目的: 通信断後に読み込み済み履歴を実cacheから取得。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 通常アカウントでログインし、学習記録を一度読み込んでいる。

When:

- 通信が切れた状態で、読み込み済みの学習記録を表示する。

Then:

- 読み込み済みの記録を表示し、クラウドの全履歴とは断定しない。

<a id="study-session-35"></a>

### STUDY-SESSION-35 指定した Deck と期間を再読み込み後も維持する

カテゴリ: `read`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 指定暦日/DST境界の集計、Deck・URL・router履歴の一致（[PLAYWRIGHT-STUDY-HISTORY-13](../integration/playwright/study-history.md#playwright-study-history-13)）。置換実装後の E2E 目的: 指定Deck・期間URLのブラウザー再読込復元と実履歴取得。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck を表示でき、履歴なしと、指定期間内外に開始・完了記録がある状態を確認する。
- 深夜0時のない夏時間切替も確認する。`America/Santiago` の2026年9月6日は履歴なし、7日正午は1開始・1完了とする。

When:

- 期間指定で過去の開始日・終了日を入力して適用し、Deck を選択する。
- 戻る・進む・再読み込みで同じ範囲を復元する。

Then:

- 合計・グラフ・最近の学習・日別表は選択期間と Deck に一致し、履歴がなければ0件で表示する。
- 期間は URL の `days` または `start` / `end` に反映され、Deck の選択を変えても期間は変わらない。
- 1日・月またぎ・年またぎ・夏時間切替を含め、両端を含む端末の暦日で集計する。
- 9月6日〜7日の指定では、7日の1開始・1完了が日別集計と期間合計に含まれる。
- 9月5日〜6日の指定では、日別表に5日・6日だけを表示し、7日0時以降の履歴は集計しない。
- 範囲外の開始・完了は除外する。範囲内の完了は開始日が範囲外でも数える。

<a id="study-session-38"></a>

### STUDY-SESSION-38 [TODO] 期間の切り替え後に以前の期間の結果を混ぜない

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 期間切替直後と古い結果の後着時に前期間を混ぜない（[PLAYWRIGHT-STUDY-HISTORY-14](../integration/playwright/study-history.md#playwright-study-history-14)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示しており、以前の期間の結果がまだ届いていない。

When:

- 期間を変更し、その後に以前の期間の結果が届く。

Then:

- 変更直後も遅れて届いた場合も、以前の期間の結果を表示しない。

<a id="study-session-39"></a>

### STUDY-SESSION-39 [TODO] 端末の日付変更時に相対期間を更新し指定期間を維持する

カテゴリ: `read`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 日付変更時に相対期間を更新して指定期間を維持（[PLAYWRIGHT-STUDY-HISTORY-15](../integration/playwright/study-history.md#playwright-study-history-15)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示している。今日を基準とする期間と、開始日・終了日を指定した期間のそれぞれで確認する。

When:

- 画面を開いたまま端末の日付が変わる。

Then:

- 今日を基準とする期間と入力可能な最終日を更新する。
- 指定期間では両端の日付と表示済みの結果を維持する。

<a id="study-session-01"></a>

### STUDY-SESSION-01 フィルターと学習上限を反映して学習を開始できる

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 学習タグと上限0・1・正値による選別、件数一致と先頭表示（[PLAYWRIGHT-STUDY-SESSION-START-04](../integration/playwright/study-session-start.md#playwright-study-session-start-04)）。置換実装後の E2E 目的: 新しい学習の実保存と購読反映。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck に、タグが異なる複数の Card がある。
- 認証と設定の読み込みが完了し、設定画面を利用できる。
- Deck のタグフィルターは保存済みで、一致する Card は学習上限より多い。

When:

- 正の学習上限、0、1 のそれぞれで、対象 Deck の学習開始画面から新しい学習を開始する。

Then:

- 開始時に選択しているフィルターに一致する Card だけが出題される。
- 正の上限では設定枚数を出題する。0ならフィルターと復習条件に合う全 Card、1なら選ばれた先頭の Card だけを出題する。
- 学習開始画面の件数と、実際に始まった学習の Card 数が一致する。
- 作成後に学習画面へ進み、先頭 Card の表面を表示する。

<a id="study-session-04"></a>

### STUDY-SESSION-04 Restart で新しい学習を先頭から開始できる

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: Restart成功後は以前の位置へ戻らず新しい先頭を表示（[PLAYWRIGHT-STUDY-SESSION-START-11](../integration/playwright/study-session-start.md#playwright-study-session-start-11)）。置換実装後の E2E 目的: 旧学習の中止と新学習の実保存、同Deckの最新学習の選択。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で、先頭より後の Card を学習中である。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で学習を開始する。

Then:

- 以前の学習を中止扱いとし、新しい学習の代わりに再開しない。
- 同じ Deck で順に開始した場合は最後の学習を利用する。複数端末の同時開始・未同期変更の競合は対象外とする。
- 新しい学習の先頭 Card の表面を表示する。

<a id="study-session-14"></a>

### STUDY-SESSION-14 [TODO] 開始時点の Card・設定・時刻で出題対象を選び直す

カテゴリ: `write`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 開始操作時点のCard・設定・時刻で出題を再選別（[PLAYWRIGHT-STUDY-SESSION-START-05](../integration/playwright/study-session-start.md#playwright-study-session-start-05)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck の学習開始画面を開いている。
- 表示後に Card、設定、または時刻が変わり、学習対象の条件が変化している。

When:

- 対象 Deck の学習を開始する。

Then:

- 開始時点の Card・設定・時刻と選択中のフィルターで出題対象を選ぶ。

<a id="study-session-15"></a>

### STUDY-SESSION-15 [TODO] 間隔反復・シャッフル・上限に従って出題する

カテゴリ: `write`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 期限優先順、シャッフル、上限の組合せで出題を選別（[PLAYWRIGHT-STUDY-SESSION-START-06](../integration/playwright/study-session-start.md#playwright-study-session-start-06)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck で、保存済みの学習結果と条件を読み込める。
- フィルターに一致する Card に、復習期限が過去・現在時刻・未来の Card と、まだ評価していない Card が含まれる。
- 間隔反復とシャッフルの ON / OFF、および学習上限を選択できる。

When:

- 選択した間隔反復とシャッフルの設定で、新しい学習を開始する。

Then:

- 間隔反復 ON: 期限が現在以前の Card を古い期限順に優先し、次に未評価 Card を選ぶ。同順位は標準順を維持し、未来の期限は除外する。
- 間隔反復 ON のシャッフルは、上限内に選んだ Card だけを並べ替える。
- 間隔反復 OFF: 未来の期限を含む全候補を標準順で選ぶ。シャッフル ON なら全候補を並べ替えてから上限を適用する。
- 復習予定は保存済みの学習結果に基づく。

<a id="study-session-19"></a>

### STUDY-SESSION-19 [TODO] アカウント切り替え後に以前のアカウントへ新しい学習を追加しない

カテゴリ: `write`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: アカウント変更後に元Deckの開始操作を拒む（[PLAYWRIGHT-STUDY-SESSION-START-09](../integration/playwright/study-session-start.md#playwright-study-session-start-09)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck の学習開始画面を開いている。

When:

- アカウントを切り替えた後、学習を開始する。

Then:

- 以前のアカウントへ新しい学習は追加されない。

<a id="study-session-20"></a>

### STUDY-SESSION-20 [TODO] 通常アカウントの Start・Restart・Continue は保存成功まで遷移を待つ

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 保存の未完了/成功に従う開始と再開の遷移・重複防止（[PLAYWRIGHT-STUDY-SESSION-START-10](../integration/playwright/study-session-start.md#playwright-study-session-start-10)、[PLAYWRIGHT-DECK-LIST-38](../integration/playwright/deck-list.md#playwright-deck-list-38)）。置換実装後の E2E 目的: 通常アカウントの再接続後の実保存応答と匿名の受付完了の違い。

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

### STUDY-SESSION-32 保存済みのタグフィルターで学習を開始する

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 与えられた学習タグで対象Cardを選別して先頭表示（[PLAYWRIGHT-STUDY-SESSION-START-04](../integration/playwright/study-session-start.md#playwright-study-session-start-04)）。置換実装後の E2E 目的: タグの実保存・再読込後の選択復元。

Given:

- Fixture: [`study-tag-disclosure`](./fixture/study-tag-disclosure.yaml)
- ログイン中のアカウントの Deck に、タグが異なる複数の Card がある。
- 追加のタグを展開して選択し、保存・再読み込み後も対象タグだけが選択されている。
- 対象 Deck に進行中の学習は存在しない。

When:

- 対象 Deck の学習を開始する。

Then:

- 対象タグを持つ Card だけで学習を開始し、その表面を表示する。

<a id="study-session-03"></a>

### STUDY-SESSION-03 学習画面から戻った後に同じ位置から Continue できる

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 元の順序・位置・開始日時で再開し一覧の最近学習順へ反映、時刻不明時に経過時間を推測表示しない（[PLAYWRIGHT-DECK-LIST-37](../integration/playwright/deck-list.md#playwright-deck-list-37)、[PLAYWRIGHT-DECK-LIST-31](../integration/playwright/deck-list.md#playwright-deck-list-31)）。置換実装後の E2E 目的: 再開日時と学習位置の実保存、同期で端末の学習日時を保持。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 複数Deckの対象・順序・位置を混在させず再開（[PLAYWRIGHT-DECK-LIST-37](../integration/playwright/deck-list.md#playwright-deck-list-37)）。置換実装後の E2E 目的: 最初のDeckの評価・記憶状態・現在位置を実保存して維持。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 最後の保存待ち・完了件数・フォーカス・一覧へ戻る導線（[PLAYWRIGHT-STUDY-SESSION-27](../integration/playwright/study-session.md#playwright-study-session-27)、[PLAYWRIGHT-STUDY-SESSION-33](../integration/playwright/study-session.md#playwright-study-session-33)）。置換実装後の E2E 目的: 最後の回答と学習完了日時の実保存・購読反映。

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

### STUDY-SESSION-07 匿名での学習結果と再開位置を再読み込み後も維持できる

カテゴリ: `write`

区分: 正常系

関連仕様: E2E維持。E2E の目的: 匿名の評価・復習予定・次位置を永続cacheから再読込しクラウドへ送信しない。

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーが、このブラウザーの Deck で複数の Card を学習中である。
- 現在の Card の表面が表示されている。
- 上方向のドラッグは easy の評価に設定されている。

When:

- マウスの主ボタンで現在の Card を上方向へドラッグし、次の Card が表示されてからページを再読み込みする。

Then:

- easy の評価結果・復習予定と次の学習位置を復元し、次の Card の表面だけを表示する。
- 匿名での学習結果と再開位置はこのブラウザーだけに保持され、クラウドへ送信されない。

<a id="study-session-08"></a>

### STUDY-SESSION-08 展開したタグの選択を自動保存する

カテゴリ: `batch`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: タグ展開と選択の自動保存操作、選択表示（[PLAYWRIGHT-STUDY-SESSION-START-14](../integration/playwright/study-session-start.md#playwright-study-session-start-14)）。置換実装後の E2E 目的: 学習タグの実保存と再読込後の復元。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 開始・完了の記録による30日集計・表・グラフ・最近の学習の一致（[PLAYWRIGHT-STUDY-HISTORY-16](../integration/playwright/study-history.md#playwright-study-history-16)）。置換実装後の E2E 目的: 開始から完了までの実保存と履歴の購読反映。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 匿名の未同期案内と記録表示（[PLAYWRIGHT-STUDY-HISTORY-12](../integration/playwright/study-history.md#playwright-study-history-12)、[PLAYWRIGHT-STUDY-HISTORY-16](../integration/playwright/study-history.md#playwright-study-history-16)）。置換実装後の E2E 目的: 匿名の開始・完了記録を永続cacheから再読込して同件数を復元。

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーが、このブラウザーで利用できる Deck を所有している。

When:

- 学習を開始して完了し、学習記録を開いて再読み込みする。

Then:

- クラウドの応答を待たずに開始・完了数が表示され、このブラウザーの未同期データであることが案内される。
- 同じ匿名アカウントのまま再読み込みしても件数は変わらず、最近の学習も1件表示される。

<a id="study-session-21"></a>

### STUDY-SESSION-21 [TODO] Continue 中のアカウント変更・離脱後は遷移しない

カテゴリ: `write`

区分: 正常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: Continueの古い結果で離脱先や新アカウントから遷移しない（[PLAYWRIGHT-DECK-LIST-46](../integration/playwright/deck-list.md#playwright-deck-list-46)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントに進行中の学習があり、Deck 一覧を開いている。

When:

- Continue を実行し、完了前にアカウントを切り替える、または一覧を離れる。

Then:

- 元の学習画面へ遷移しない。

<a id="study-session-25"></a>

### STUDY-SESSION-25 [TODO] 端末間の時計ずれがあっても終了済みの学習を再開しない

カテゴリ: `write`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 受信済みの最新未完了学習を再開対象として表示（[PLAYWRIGHT-DECK-LIST-47](../integration/playwright/deck-list.md#playwright-deck-list-47)）。置換実装後の E2E 目的: 時計が異なる端末の実保存から終了済みを除外して新学習を購読。

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

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 明示的中止後の一覧遷移と中止記録を完了数に含めない表示（[PLAYWRIGHT-STUDY-SESSION-29](../integration/playwright/study-session.md#playwright-study-session-29)、[PLAYWRIGHT-STUDY-HISTORY-17](../integration/playwright/study-history.md#playwright-study-history-17)）。置換実装後の E2E 目的: 明示的中止の実保存と開始・完了記録の契約。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に未完了の学習がある。

When:

- 未完了の学習を明示的に終了する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-31"></a>

### STUDY-SESSION-31 期限に達した匿名の Card を新しい学習で再評価できる

カテゴリ: `write`

区分: 正常系

関連仕様: E2E維持。E2E の目的: 匿名cacheの記憶状態を引き継ぎ同Cardを再評価して保存。

Given:

- Fixture: [`study-session-start-local`](./fixture/study-session-start-local.yaml)
- 匿名ユーザーがこのブラウザーの Deck で評価した Card が復習期限に達している。
- 以前の学習結果と復習予定が保存されている。

When:

- 新しい学習を開始し、同じ Card を再評価する。

Then:

- それまでの記憶状態を引き継いで再評価できる。保存仕様は [FIRESTORE-STUDY-ANSWER-20](../integration/firestore/study-answer.md#firestore-study-answer-20) を参照する。

<a id="study-session-29"></a>

### STUDY-SESSION-29 [TODO] Deck の削除で終了した未完了の学習を完了として数えない

カテゴリ: `batch`

区分: 正常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 削除済みDeckの記録を履歴集計から除外（[PLAYWRIGHT-STUDY-HISTORY-17](../integration/playwright/study-history.md#playwright-study-history-17)）。置換実装後の E2E 目的: Deck削除と未完了学習の終了の実保存、完了数を増やさない。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に未完了の学習がある。

When:

- 対象 Deck を削除する。

Then:

- 未完了の学習を完了として数えない。

<a id="study-session-11"></a>

### STUDY-SESSION-11 表示できない Deck を勝手に全件表示へ切り替えない

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 対象外DeckのエラーとURL維持、全Deckへの勝手な切替を防ぐ（[PLAYWRIGHT-STUDY-HISTORY-21](../integration/playwright/study-history.md#playwright-study-history-21)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 指定した Deck は自分の表示対象に存在しない。

When:

- その Deck を指定した学習記録の URL へ直接アクセスする。

Then:

- 読み込み完了後に対象の Deck を表示できない旨と、すべての Deck へ戻る操作を表示する。
- URL の Deck 指定を維持し、別 Deck・全 Deck の集計へ切り替えない。

<a id="study-session-16"></a>

### STUDY-SESSION-16 [TODO] 学習結果を読み込めない場合は未評価や対象0件として扱わない

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 学習結果の取得失敗を未評価や対象0件と混同しない（[PLAYWRIGHT-STUDY-SESSION-START-13](../integration/playwright/study-session-start.md#playwright-study-session-start-13)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-filter`](./fixture/study-filter.yaml)
- ログイン中のアカウントの Deck に Card がある。
- 復習予定の判定に必要な保存済みの学習結果を読み込めない。

When:

- 対象 Deck の学習開始画面を開く。

Then:

- 学習結果を読み込めないエラーを表示し、未評価や対象0件として扱わない。

<a id="study-session-23"></a>

### STUDY-SESSION-23 [TODO] 利用できない学習を案内し後から届いた学習を表示する

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 学習不在の案内と一覧導線、後着状態の表示（[PLAYWRIGHT-STUDY-SESSION-39](../integration/playwright/study-session.md#playwright-study-session-39)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの学習画面で、受信した内容に学習が存在しない。

When:

- 学習画面を表示した後、保存済みの学習が届く。

Then:

- 一覧へ自動遷移せず、利用できない旨と一覧へ戻る操作を表示する。後から学習が届くと、その内容を表示する。

<a id="study-session-33"></a>

### STUDY-SESSION-33 [TODO] 取得失敗後も同じ期間の学習記録を再取得できる

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 取得失敗時の部分集計抑止、指定期間を保って再試行（[PLAYWRIGHT-STUDY-HISTORY-18](../integration/playwright/study-history.md#playwright-study-history-18)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を表示でき、集計に必要な結果の取得が失敗する。
- 開始日と終了日を指定した期間でも確認し、再試行時には最新の結果を取得できる。

When:

- 学習記録を開き、取得失敗後に再試行する。

Then:

- 取得失敗時は部分集計を表示しない。再試行では指定期間を維持し、最新の全体集計を表示する。

<a id="study-session-36"></a>

### STUDY-SESSION-36 [TODO] 無効な日付入力を適用せず現在の期間を維持する

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 無効日付を拒否して適用済み期間を維持（[PLAYWRIGHT-STUDY-HISTORY-19](../integration/playwright/study-history.md#playwright-study-history-19)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を、有効な期間で表示している。

When:

- 未入力・存在しない日付・終了日が開始日より前・未来の終了日のいずれかを入力し、適用する。

Then:

- 入力エラーを表示し、適用中の期間を変えない。

<a id="study-session-37"></a>

### STUDY-SESSION-37 [TODO] URL の無効な期間を選び直して復帰できる

カテゴリ: `read`

区分: 異常系

関連仕様: IT移行予定（既存 E2E 契約は継続）。IT の目的: 無効URL期間のエラーと有効期間の選び直し（[PLAYWRIGHT-STUDY-HISTORY-20](../integration/playwright/study-history.md#playwright-study-history-20)）。置換実装後の E2E 目的: なし（移行実装後に縮小予定）。

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 自分の Deck の学習記録を利用できる。

When:

- 無効な期間を指定した学習記録 URL を開き、有効な期間を選び直す。

Then:

- 無効な期間はエラーとし、別期間へ読み替えない。有効な期間の選び直しで復帰できる。

<a id="study-session-27"></a>

### STUDY-SESSION-27 [TODO] Restart の保存失敗後も以前の学習を失わずに再試行できる

カテゴリ: `write`

区分: 異常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: Restart失敗後の旧対象・順序・位置保持と再試行（[PLAYWRIGHT-STUDY-SESSION-START-12](../integration/playwright/study-session-start.md#playwright-study-session-start-12)）。置換実装後の E2E 目的: 新学習の保存失敗でも旧学習の保存内容を維持。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck で、先頭より後の Card を学習中である。
- 新しい学習の保存が失敗し、再試行時には成功できる。

When:

- Deck 一覧から対象 Deck の Restart を選択し、学習開始画面で学習を開始する。
- 保存失敗後に再試行する。

Then:

- 以前の学習の Card・出題順・現在位置を維持して再試行できる。

<a id="study-session-26"></a>

### STUDY-SESSION-26 [TODO] 読み込めない過去の学習があっても利用できる学習を再開できる

カテゴリ: `write`

区分: 異常系

関連仕様: 目的分割予定（既存 E2E 契約は継続）。IT の目的: 利用可能な学習がある場合のContinue（[PLAYWRIGHT-DECK-LIST-48](../integration/playwright/deck-list.md#playwright-deck-list-48)）。置換実装後の E2E 目的: 不正な過去保存値の解析・購読除外と有効学習の取得。

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- ログイン中のアカウントの Deck に、再開可能な学習と、読み込めない過去の学習がある。

When:

- 対象 Deck の学習を再開する。

Then:

- 読み込めない過去の学習があっても、利用できる学習を再開できる。
