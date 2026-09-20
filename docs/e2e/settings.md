# Settings E2E テスト仕様書

## 目的

Settings の自動保存が reload を越えて維持され、保存した学習設定が学習開始画面や次の学習 session に反映され、言語設定と無効な保存済み設定からの復旧がアプリケーションへ反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SETTINGS-01 | write | [Dark mode を自動保存して reload 後も反映できる](#settings-01) |
| SETTINGS-02 | write | [Maximum cards 設定を学習開始画面に反映できる](#settings-02) |
| SETTINGS-03 | batch | [Respect review schedule を次の学習 session に反映できる](#settings-03) |
| SETTINGS-04 | write | [日本語設定を自動保存して reload 後も反映できる](#settings-04) |
| SETTINGS-05 | write | [System 設定で browser locale を解決して reload 後も反映できる](#settings-05) |
| SETTINGS-06 | read | [無効な保存済み設定から現在の既定値へ復旧できる](#settings-06) |
| SETTINGS-07 | read | [詳細設定をキーボードで開閉してフォーカス位置を確認できる](#settings-07) |
| SETTINGS-08 | write | [Card の検証エラーが言語変更に追随し入力を保持する](#settings-08) |
| SETTINGS-09 | write | [CSV の検証結果が再読み込みなしで言語変更に追随する](#settings-09) |

<a id="settings-01"></a>

### SETTINGS-01 Dark mode を自動保存して reload 後も反映できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings 画面を開き、変更前の Dark mode 設定が画面に反映されている。

When:

- Dark mode を現在と異なる状態に変更し、自動保存後にページを reload する。

Then:

- Dark mode が reload 後も変更後の状態を維持する。
- アプリケーションの配色に Dark mode の変更が反映される。
- browser error が発生しない。

<a id="settings-02"></a>

### SETTINGS-02 Maximum cards 設定を学習開始画面に反映できる

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck に、変更後の上限より多くの学習対象 Card が存在する。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- Settings 画面で `Maximum cards` を現在と異なる上限に変更し、自動保存後にページを reload して対象 Deck の学習開始画面を開く。

Then:

- 学習開始画面に表示される対象 Card 数が変更後の上限と一致する。
- start action に変更後の上限と同じ Card 数が表示される。
- browser error が発生しない。

<a id="settings-03"></a>

### SETTINGS-03 Respect review schedule を次の学習 session に反映できる

カテゴリ: `batch`

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 認証済みユーザーが所有する Deck に、過去または将来の next seeing time を持つ Card と、next seeing time を持たない Card が存在する。
- `Respect review schedule` は無効である。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- Settings 画面で `Respect review schedule` を有効にし、自動保存後にページを reload する。
- 対象 Deck の学習開始画面から session を開始する。

Then:

- `Respect review schedule` が reload 後も有効である。
- 過去の next seeing time を持つ Card と、next seeing time を持たない Card が session に含まれる。
- 将来の next seeing time を持つ Card は session に含まれない。
- browser error が発生しない。

<a id="settings-04"></a>

### SETTINGS-04 日本語設定を自動保存して reload 後も反映できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが、E2E 共通の English language 設定で Settings 画面を開いている。

When:

- Language selector で `日本語` を選択し、自動保存後にページを reload する。

Then:

- Settings heading と language selector の accessible name が日本語で表示される。
- browser storage の language preference が `ja` として保存される。
- `html[lang]` が `ja` になる。
- reload 後も日本語 UI、language preference、`html[lang]` が維持される。
- reload 後に Deck 一覧を開くと、見出しと作成 action が日本語で表示される。
- browser error が発生しない。

<a id="settings-05"></a>

### SETTINGS-05 System 設定で browser locale を解決して reload 後も反映できる

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- browser context の locale がこのケースだけ `ja-JP` に設定されている。
- 認証済みユーザーが、E2E 共通の English language 設定で Settings 画面を開いている。

When:

- Language selector で `System` を選択し、自動保存後にページを reload する。

Then:

- Settings heading と language selector の accessible name が日本語で表示される。
- browser storage の language preference が `system` として保存される。
- `ja-JP` が有効な locale の `ja` に解決され、`html[lang]` が `ja` になる。
- reload 後も日本語 UI、language preference、`html[lang]` が維持される。
- browser error が発生しない。

<a id="settings-06"></a>

### SETTINGS-06 無効な保存済み設定から現在の既定値へ復旧できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- browser storage の現在の persistence version に、Preferences schema と一致しない snapshot が保存されている。

When:

- Settings 画面を reload する。

Then:

- Settings 画面が表示される。
- Dark mode は現在の既定値である無効へ復旧する。
- Maximum cards は現在の既定値である `10` へ復旧する。
- Language は現在の既定値である `System` へ復旧する。
- browser error が発生しない。

<a id="settings-07"></a>

### SETTINGS-07 詳細設定をキーボードで開閉してフォーカス位置を確認できる

カテゴリ: `read`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Deck 一覧から Settings を開き、詳細設定が閉じている。
- 広い画面と狭い画面、明色と暗色のそれぞれで確認する。

When:

- Tab と Shift+Tab で自動再生の間隔スライダーと詳細設定の見出しを往復する。
- Enter と Space で詳細設定を開閉する。コミット情報があるビルドでは Tab でコミットリンクへ進み、Shift+Tab で見出しへ戻る。
- 開いた状態でページを reload する。

Then:

- 開閉どちらの状態でも見出しの可視領域に明確なフォーカス枠があり、別の操作要素へ移動すると表示も移る。ブラウザー画像でも四辺の枠を確認する。
- native な開閉操作と通常の Tab 順序を維持し、余分な停止位置がない。
- 見出しの名前、開いたときのバージョン・コミット表示が維持される。コミット情報があるビルドではリンク、ないビルドでは既存の `unknown` 表示を維持する。
- 設定、認証、Deck、Card、学習 session とその保存内容が操作前後で変わらず、reload 後は詳細設定が閉じている。
- browser error が発生しない。

<a id="settings-08"></a>

### SETTINGS-08 Card の検証エラーが言語変更に追随し入力を保持する

カテゴリ: `write`

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- Language を System に設定し、英語の browser locale で Card 編集画面を開いている。
- 裏面に未保存の入力があり、表面を空にして送信した検証エラーが表示されている。

When:

- 画面を開いたまま browser locale を日本語へ変更し、languagechange を発生させる。

Then:

- 表示中の必須エラー、フィールドの accessible name、html[lang] が日本語へ更新される。
- ルート、空の表面、裏面の入力、タグと未保存状態を保持する。保存や再送信を行わず、Deck、Card と StudySession の保存内容を変更しない。
- 未知の検証エラーは現在の言語の汎用メッセージで表示する。

<a id="settings-09"></a>

### SETTINGS-09 CSV の検証結果が再読み込みなしで言語変更に追随する

カテゴリ: `write`

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Language を System に設定し、英語の browser locale で CSV import 画面を開いている。
- 日本語を含む有効行、必須項目が空の行、閉じ引用符がない行を含む CSV の検証結果が表示されている。

When:

- 画面を開いたまま browser locale を日本語へ変更し、languagechange を発生させる。

Then:

- 必須項目、重複キー、列数、空ファイル、既知の解析エラーは現在の言語で表示し、未知の解析エラーは翻訳済みの汎用メッセージを表示する。
- 代表 CSV の有効1件・無効2件・診断3件と元の行の文脈、日本語のユーザー入力を保持し、import は無効のままとする。
- ファイルを読み直さず、解析結果と選択済み source を保持する。有効な preview でも準備済み Deck/Card ID を変更しない。
- プレビュー準備や import の既知の認証・権限・接続・容量不足は現在の言語で案内し、未知の例外の生のメッセージは表示しない。
- 再試行 ID と共通 toast の寿命を維持する。
