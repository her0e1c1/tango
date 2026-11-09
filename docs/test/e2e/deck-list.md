# Deck 一覧 E2E テスト仕様書

## 目的

Deck 一覧の表示・並び順、復習と新規の件数、追加・管理画面への遷移、既存の学習の再開を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-LIST-01 | read | 正常系 | [Deck 一覧から Card 一覧へ遷移できる](#deck-list-01) |
| DECK-LIST-02 | read | 正常系 | [読み込み済みの復習件数と集計条件を表示できる](#deck-list-02) |
| DECK-LIST-03 | read | 正常系 | [復習期限の到達で一覧を更新できる](#deck-list-03) |
| DECK-LIST-04 | read | 正常系 | [Deck 一覧の追加メニューを開閉して操作項目を選べる](#deck-list-04) |
| DECK-LIST-05 | read | 正常系 | [追加メニューから作成・インポート画面を開く](#deck-list-05) |
| DECK-LIST-06 | read | 正常系 | [Deck 一覧を学習状態ごとに表示する](#deck-list-06) |
| DECK-LIST-07 | read | 正常系 | [Deck 一覧を学習状態と復習期限の順に並べる](#deck-list-07) |
| DECK-LIST-08 | read | 正常系 | [復習と新規が0件の Deck では理由を区別して表示する](#deck-list-08) |
| DECK-LIST-09 | read | 正常系 | [Deck 一覧の Review と Study new から開始設定へ進める](#deck-list-09) |
| DECK-LIST-10 | read | 正常系 | [間隔反復 OFF では件数を隠して学習と管理の導線を維持する](#deck-list-10) |
| DECK-LIST-11 | read | 正常系 | [条件の変更と画面復帰で一覧の復習件数を更新する](#deck-list-11) |
| DECK-LIST-12 | read | 正常系 | [空の Deck 一覧でも追加メニューを利用できる](#deck-list-12) |
| DECK-LIST-13 | write | 正常系 | [Deck 一覧の Continue から既存の学習を再開できる](#deck-list-13) |

<a id="deck-list-01"></a>

### DECK-LIST-01 Deck 一覧から Card 一覧へ遷移できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- ログイン中のユーザーが Card の入った Deck を所有し、Deck 一覧を開いている。

When:

- 一覧から利用したい Deck を選ぶ。

Then:

- 選択した Deck の Card 一覧が開き、その Deck の Card を閲覧できる。
- 似た識別子の取り違えと URL の境界値は [RTL の遷移契約](../integration/rtl/navigation.md#rtl-navigation-01) で確認する。

<a id="deck-list-02"></a>

### DECK-LIST-02 読み込み済みの復習件数と集計条件を表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 復習期日に達した、未来の、未設定の Card があり、間隔反復が有効である。
- 学習中、空、filter に一致しない、未来の復習だけがある、未評価の Card だけがある、という状態の Deck を区別できる。tag の AND / OR 条件を使用する。

When:

- 一覧の合計と Deck 別の件数を確認し、「件数について」を展開する。

Then:

- 「件数について」を開くと、読み込み済みのデータと保存済み filter に基づく件数である旨を表示する。maximum cards と shuffle は件数に影響しない。
- 合計には学習中の Deck も一度だけ含める。

<a id="deck-list-03"></a>

### DECK-LIST-03 復習期限の到達で一覧を更新できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、現在時刻は未来に復習予定の Card の期日直前である。
- 複数の Deck に未来の復習期限がある場合も、同じ時点の件数を比較できる。

When:

- 一覧を開いたまま復習期日を迎える。

Then:

- 期日に達した Card が復習件数に加わり、一覧の並び順と合計が同じ時点の復習対象に基づいて更新される。
- 表示の更新だけでは学習の出題順・現在位置や Card の復習予定を変更しない。

<a id="deck-list-04"></a>

### DECK-LIST-04 Deck 一覧の追加メニューを開閉して操作項目を選べる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- ユーザーが Deck のある一覧を開いている。

When:

- 一覧上部の「追加」を開き、キーボードの矢印キーで項目を移動し、Escape で閉じる。mobile では下部メニューの「閉じる」と背景のタップでも閉じる。
- 一覧のアクションと各 Deck の操作メニューを順に開く。

Then:

- 作成とインポートを表示する。
- Escape、mobile の「閉じる」、背景のタップでメニューが閉じ、操作を実行せずに開いたボタンへフォーカスが戻る。
- 一覧と各 Deck の操作メニューは同時に複数開かない。
- メニューの表示と開閉によって Deck・Card の内容や学習結果は変わらない。

<a id="deck-list-05"></a>

### DECK-LIST-05 追加メニューから作成・インポート画面を開く

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-navigation`](./fixture/deck-navigation.yaml)
- ユーザーが Deck 一覧を開いている。

When:

- 一覧の「デッキを作成」と「デッキをインポート」をそれぞれ選択し、保存せず一覧へ戻る。

Then:

- 選択した作成画面またはインポート画面へ遷移する。
- 表示と遷移によって Deck・Card の内容や学習結果は変わらない。

<a id="deck-list-06"></a>

### DECK-LIST-06 [TODO] Deck 一覧を学習状態ごとに表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、学習中、今学習できる、その他の状態の Deck がある。
- 英語・日本語、mobile、dark mode、拡大表示でも一覧を利用する。

When:

- Deck 一覧の見出しと各 Deck の表示を確認し、名前から Card 一覧を開く。

Then:

- 各 Deck を「学習中」「今学習できるデッキ」「その他」に一度だけ表示し、空の区分は隠す。
- Deck 名から Card 一覧を開ける。Card 数・学習中の現在位置・復習／新規件数・1つの主学習操作を表示し、閲覧・管理は右上の三点メニューにまとめる。
- Deck 名の読み上げに Card 数と現在位置を含め、カテゴリと最終学習時刻は表示しない。
- 狭い画面は1列で主学習ボタンを横幅いっぱいに表示し、広い画面は複数列にする。長い名前は折り返し、主要操作の高さは44px以上にする。
- 学習中のバーは現在位置を示し、完了率は示さない。

<a id="deck-list-07"></a>

### DECK-LIST-07 [TODO] Deck 一覧を学習状態と復習期限の順に並べる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 学習中、復習対象がある、未評価の Card だけがある、その他の状態の Deck がある。
- 学習時刻、復習期限または名前が並び順の比較対象となる。

When:

- Deck 一覧を開いて並び順と学習中の現在位置を確認する。

Then:

- 学習中の Deck を最近学習した順に並べ、Continue と現在位置を表示する。現在位置は完了枚数ではない。
- 続いて、復習対象のある Deck を最も早い復習期限順、未評価 Card だけの Deck、その他の Deck の順に並べる。同順位は名前順にする。

<a id="deck-list-08"></a>

### DECK-LIST-08 [TODO] 復習と新規が0件の Deck では理由を区別して表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効であり、空、filter に一致しない、未来の復習だけがある状態の Deck を区別できる。
- tag の AND / OR 条件を使用する。

When:

- Deck 一覧で0件の理由を展開する。

Then:

- 0件の行に「復習・新規なし」を表示する。展開時は未読み込み・フィルター不一致・復習期日前だけの状態を区別し、期日前だけなら次回復習日時を表示する。
- Study は常に利用できる。0件でも完全な同期や学習完了とは断定しない。

<a id="deck-list-09"></a>

### DECK-LIST-09 Deck 一覧の Review と Study new から開始設定へ進める

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、復習対象または新規の対象がある Deck がある。既存の学習がある場合も含む。

When:

- キーボードで Review または Study new を選択する。

Then:

- 開始設定画面へ遷移し、学習の新規開始や置き換えは行わない。

<a id="deck-list-10"></a>

### DECK-LIST-10 [TODO] 間隔反復 OFF では件数を隠して学習と管理の導線を維持する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- ユーザーが Deck 一覧を利用でき、間隔反復が OFF である。

When:

- Deck 一覧の件数と操作の表示を確認する。

Then:

- 復習・新規件数と補足を隠し、Continue または Study と閲覧・管理操作を維持する。

<a id="deck-list-11"></a>

### DECK-LIST-11 [TODO] 条件の変更と画面復帰で一覧の復習件数を更新する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 間隔反復が有効で、Deck 一覧の復習件数を確認できる。

When:

- Card・Deck・filter・設定・学習の状態が変わった後と、別画面から一覧へ戻った後の表示を確認する。

Then:

- その時点の対象に表示が更新され、以前の時刻の件数が残らない。
- 表示の更新だけでは学習の出題順・現在位置や Card の復習予定を変更しない。

<a id="deck-list-12"></a>

### DECK-LIST-12 [TODO] 空の Deck 一覧でも追加メニューを利用できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Deck 一覧が空であり、Sample Deck の自動生成は無効である。

When:

- 一覧上部の「追加」を開く。

Then:

- 作成とインポートを表示し、どちらも利用できる。

<a id="deck-list-13"></a>

### DECK-LIST-13 Deck 一覧の Continue から既存の学習を再開できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- Deck に既存の学習があり、Deck 一覧に Continue が表示されている。

When:

- Deck 一覧で Continue を選択する。

Then:

- 既存の学習を再開する。
- 一覧表示と再開によって、Deck・Card の内容や学習結果・現在位置を変更しない。
