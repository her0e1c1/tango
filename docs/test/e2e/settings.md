# Settings E2E テスト仕様書

## 目的

Settings で変更した設定が再読み込み後も維持され、学習の開始・再開や表示言語へ反映されることを確認する。読み込めない設定がある場合も、既定値で利用を再開できる。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| SETTINGS-01 | write | 正常系 | [Dark mode を自動保存して reload 後も反映できる](#settings-01) |
| SETTINGS-02 | write | 正常系 | [Maximum cards 設定を学習開始画面に反映できる](#settings-02) |
| SETTINGS-03 | batch | 正常系 | [Respect review schedule を次の学習 session に反映できる](#settings-03) |
| SETTINGS-04 | write | 正常系 | [日本語設定を自動保存して reload 後も反映できる](#settings-04) |
| SETTINGS-05 | write | 正常系 | [System 設定でブラウザーの言語を reload 後も反映できる](#settings-05) |
| SETTINGS-06 | read | 異常系 | [無効な保存済み設定から現在の既定値へ復旧できる](#settings-06) |
| SETTINGS-07 | read | 正常系 | [詳細設定をキーボードで開閉してフォーカス位置を確認できる](#settings-07) |
| SETTINGS-08 | write | 異常系 | [Card の検証エラーが言語変更に追随し入力を保持する](#settings-08) |
| SETTINGS-09 | write | 異常系 | [CSV の検証結果が再読み込みなしで言語変更に追随する](#settings-09) |
| SETTINGS-10 | write | 正常系 | [自動再生の間隔の0の意味を表示して reload 後も維持できる](#settings-10) |
| SETTINGS-11 | batch | 正常系 | [間隔0から正の値へ戻して同じ学習 session の再生操作を利用できる](#settings-11) |
| SETTINGS-12 | write | 正常系 | [Maximum cards を変更しても進行中の学習を同じ位置から再開できる](#settings-12) |
| SETTINGS-13 | read | 正常系 | [旧既定の方向操作だけを現在の4評価へ移行できる](#settings-13) |
| SETTINGS-14 | write | 正常系 | [有効な CSV preview は言語変更後も選択を保持して取り込みを待つ](#settings-14) |
| SETTINGS-15 | write | 異常系 | [CSV の準備・取り込みのエラー案内は言語変更後も再試行内容と通知期限を保持する](#settings-15) |
| SETTINGS-16 | write | 正常系 | [自動再生の間隔を0から正の値へ戻すと秒数表示へ戻る](#settings-16) |
| SETTINGS-17 | batch | 正常系 | [間隔0では自動送りと再生操作を無効にして手動で学習できる](#settings-17) |

<a id="settings-01"></a>

### SETTINGS-01 Dark mode を自動保存して reload 後も反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings 画面を開き、変更前の Dark mode 設定が画面に反映されている。

When:

- Dark mode を現在と異なる状態に変更し、自動保存後にページを reload する。

Then:

- Dark mode のチェック状態は操作で切り替わり、reload 後も選んだ状態を維持する。
- アプリケーションの配色に Dark mode の変更が反映される。

<a id="settings-02"></a>

### SETTINGS-02 Maximum cards 設定を学習開始画面に反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck に学習対象 Card が存在し、正の上限を選ぶ場合は変更後の上限より多い。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- 正の上限、1、0 のそれぞれで Settings の `Maximum cards` をスライダーのキーボード操作で変更し、自動保存後に reload して新しい学習 session を開始する。0 の表示は英語・日本語で確認する。

Then:

- 正の上限では数値が表示され、学習開始画面の対象件数と実際に始まった学習の Card 数が上限と一致する。
- 0 の表示値と読み上げ用の値は「条件に一致するすべてのカード」（英語では `All matching cards`）となる。補足説明は、0 が枚数の制限なしを意味し、tags・適用される復習条件による絞り込みは維持されることを説明する。
- reload 後も0の選択と説明が維持され、学習開始画面と新しい学習にはすべての学習対象 Card が含まれる。

<a id="settings-03"></a>

### SETTINGS-03 Respect review schedule を次の学習 session に反映できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`study-review-schedule`](./fixture/study-review-schedule.yaml)
- 認証済みユーザーが所有する Deck に、過去または将来の復習期限を持つ Card と、復習期限を持たない Card が存在する。
- `Respect review schedule` は無効である。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- Settings 画面で `Respect review schedule` を有効にし、自動保存後にページを reload する。
- 対象 Deck の学習開始画面から session を開始する。

Then:

- `Respect review schedule` が reload 後も有効である。
- 復習期限に達した Card と、復習期限を持たない Card が学習に含まれる。
- 将来の復習期限を持つ Card は学習に含まれない。

<a id="settings-04"></a>

### SETTINGS-04 日本語設定を自動保存して reload 後も反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが、英語表示の Settings 画面を開いている。

When:

- Language selector で `日本語` を選択し、自動保存後にページを reload する。

Then:

- Settings の見出しと Language selector の読み上げ名が日本語になる。
- Language selector の選択は `日本語` になり、ページの言語も日本語になる。
- reload 後も日本語の UI、Language の選択、ページの言語が維持される。
- reload 後に Deck 一覧を開くと、見出しと作成操作が日本語で表示される。

<a id="settings-05"></a>

### SETTINGS-05 System 設定でブラウザーの言語を reload 後も反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- ブラウザーの言語は `ja-JP` である。
- 認証済みユーザーが、英語表示の Settings 画面を開いている。

When:

- Language selector で `System` を選択し、自動保存後にページを reload する。

Then:

- Settings の見出しと Language selector の読み上げ名が日本語になる。
- Language selector は `System` の選択を維持する。
- ブラウザーの `ja-JP` に従って UI とページの言語が日本語になる。
- reload 後も日本語の UI、`System` の選択、ページの言語が維持される。

<a id="settings-06"></a>

### SETTINGS-06 無効な保存済み設定から現在の既定値へ復旧できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- このブラウザーに読み込めない設定が保存されている。

When:

- Settings 画面を reload する。

Then:

- Settings 画面を利用できる。
- Dark mode は現在の既定値である無効へ復旧する。
- Maximum cards は現在の既定値である `10` へ復旧する。
- Language は現在の既定値である `System` へ復旧する。

<a id="settings-07"></a>

### SETTINGS-07 詳細設定をキーボードで開閉してフォーカス位置を確認できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Deck 一覧から Settings を開き、詳細設定が閉じている。狭い画面ではヘッダーの Menu から Open settings を選び、広い画面ではヘッダーの Open settings を選ぶ。
- 広い画面と狭い画面、明色と暗色で利用できる。

When:

- Tab と Shift+Tab で自動再生の間隔スライダーと詳細設定の見出しを往復する。
- Enter と Space で詳細設定を開閉する。コミット情報がある場合は Tab でコミットリンクへ進み、Shift+Tab で見出しへ戻る。
- 開いた状態でページを reload する。

Then:

- 開閉どちらの状態でも見出しの四辺に明確なフォーカス枠があり、別の操作要素へ移動すると表示も移る。
- 通常のキー操作で開閉でき、Tab 移動で余分な停止位置がない。
- 見出しの名前、開いたときのバージョン・コミット表示が維持される。コミット情報がある場合はコミットを指すリンク、ない場合は `unknown` を表示し、リンクは存在しない。
- 設定、認証状態、Deck・Card の内容と学習の再開位置が操作前後で変わらず、reload 後は詳細設定が閉じている。

<a id="settings-08"></a>

### SETTINGS-08 Card の検証エラーが言語変更に追随し入力を保持する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- Language を System に設定し、ブラウザーの言語が英語の状態で Card 編集画面を開いている。
- 裏面に未保存の入力があり、表面を空にして送信した検証エラーが表示されている。

When:

- 画面を開いたままブラウザーの言語を日本語へ変更する。

Then:

- 表示中の必須エラー、入力欄の読み上げ名、ページの言語が日本語へ更新される。
- 現在の画面、空の表面、裏面の入力、タグと未保存の状態が維持される。言語変更だけで Card が保存されたり、学習の再開位置が変わったりしない。
- 詳細を説明できない検証エラーも、現在の言語の汎用メッセージで表示される。

<a id="settings-09"></a>

### SETTINGS-09 CSV の検証結果が再読み込みなしで言語変更に追随する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Language を System に設定し、ブラウザーの言語が英語の状態で CSV import 画面を開いている。
- 日本語を含む有効行、必須項目が空の行、閉じ引用符がない行を含む CSV の検証結果が表示されている。

When:

- 画面を開いたままブラウザーの言語を日本語へ変更する。

Then:

- 必須項目、重複キー、列数、空ファイル、説明可能な解析エラーは現在の言語で表示される。詳細を説明できない解析エラーは翻訳済みの汎用メッセージで表示される。
- 有効1件・無効2件・診断3件と元の行の文脈、日本語のユーザー入力が維持され、import は無効のままとなる。診断の順序と対象の内容は言語変更前後で変わらない。
- ファイルを選び直す必要はなく、選択中のファイルと preview の内容を維持する。

<a id="settings-10"></a>

### SETTINGS-10 自動再生の間隔の0の意味を表示して reload 後も維持できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings を開いている。
- 自動再生の間隔は既定の正の値である。「自動再生で開始」と「再生操作を表示」は有効または無効で、変更前の選択を確認できる。

When:

- 間隔スライダーを Home で0へ変更し、自動保存後に reload する。

Then:

- 0の表示値と読み上げ用の値は、英語・日本語ともに「自動送りなし」を意味する。近くの説明とスライダーの読み上げ説明は、再生／一時停止ボタンと進捗スライダーも表示されなくなることを伝える。
- reload 後も0の選択と説明を維持する。
- 範囲0〜60、既定値60とスライダー操作を維持する。
- 間隔以外の設定は変わらず、「自動再生で開始」と「再生操作を表示」の選択も保持される。もともと無効な選択を有効にすることもない。

<a id="settings-11"></a>

### SETTINGS-11 間隔0から正の値へ戻して同じ学習 session の再生操作を利用できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 間隔0、シャッフル無効で開始した学習 session があり、手動で次の Card へ移動した位置を確認できる。
- 「自動再生で開始」と「再生操作を表示」は有効である。

When:

- Settings で間隔を正の値へ戻して同じ Deck の学習を Continue し、再生を一時停止する。

Then:

- 保存済みの選択に従って再生操作が表示され、同じ学習の Card の順序と手動移動後の位置を保持する。
- 再入場時は保存済みの「自動再生で開始」に従い、一時停止してもその設定を無効にしない。
- 間隔以外の設定と Deck・Card の内容を変更しない。手動移動による学習の進行は維持される。

<a id="settings-12"></a>

### SETTINGS-12 Maximum cards を変更しても進行中の学習を同じ位置から再開できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 認証済みユーザーが所有する Deck で、Maximum cards を正の上限・0・1 のいずれかにして開始した学習 session が存在する。
- 同じ学習の Card・出題順・現在位置を確認できる。

When:

- Settings で Maximum cards を別の上限へ変更し、Deck 一覧から Continue する。

Then:

- 上限の設定は変更されても、同じ学習の Card・出題順・現在位置が維持される。

<a id="settings-13"></a>

### SETTINGS-13 [TODO] 旧既定の方向操作だけを現在の4評価へ移行できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 読み込める保存済み設定があり、方向操作は旧既定の割り当て（上＝習得済みにして次へ、下＝未習得として次へ、左＝前へ、右＝次へ）、または利用者が独自に変更した割り当てである。
- 他の読み込める設定も保存されている。

When:

- Settings 画面を reload する。

Then:

- 旧既定の方向操作が残っている場合は、現在の4評価（左＝again、下＝hard、右＝good、上＝easy）へまとめて切り替わる。
- 読み込める他の設定と、利用者が独自に変更した方向の割り当ては維持される。

<a id="settings-14"></a>

### SETTINGS-14 [TODO] 有効な CSV preview は言語変更後も選択を保持して取り込みを待つ

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Language を System に設定し、ブラウザーの言語が英語の状態で CSV import 画面を開いている。
- 有効な CSV の preview が表示され、取り込みを開始していない。

When:

- 画面を開いたままブラウザーの言語を日本語へ変更する。

Then:

- ファイルを選び直す必要はなく、選択中のファイルと preview の内容を維持する。
- 言語変更だけで取り込みが始まったり選択が解除されたりしない。

<a id="settings-15"></a>

### SETTINGS-15 [TODO] CSV の準備・取り込みのエラー案内は言語変更後も再試行内容と通知期限を保持する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- Language を System に設定し、ブラウザーの言語が英語の状態で CSV import 画面を開いている。
- preview の準備または import に関する認証・権限・接続・容量不足や予期しないエラーの案内が表示されている。
- 再試行できる内容や、表示中の通知の元の表示時間を確認できる。

When:

- 画面を開いたままブラウザーの言語を日本語へ変更する。

Then:

- preview の準備や import に関する認証・権限・接続・容量不足は現在の言語で案内され、予期しないエラーの生のメッセージは表示されない。
- 再試行する内容と、表示中の通知の元の表示時間は変わらない。

<a id="settings-16"></a>

### SETTINGS-16 自動再生の間隔を0から正の値へ戻すと秒数表示へ戻る

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings を開いており、自動再生の間隔は0である。
- 「自動再生で開始」と「再生操作を表示」の選択を確認できる。

When:

- 間隔スライダーを End で正の上限へ戻す。

Then:

- 正の値では秒数表示へ戻る。範囲0〜60、既定値60とスライダー操作を維持する。
- 間隔以外の設定は変わらず、「自動再生で開始」と「再生操作を表示」の選択も保持される。もともと無効な選択を有効にすることもない。

<a id="settings-17"></a>

### SETTINGS-17 間隔0では自動送りと再生操作を無効にして手動で学習できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- 対象 Deck に進行中の学習 session がなく、間隔は0、シャッフルは無効である。
- 「自動再生で開始」と「再生操作を表示」は有効である。

When:

- 学習開始画面から session を開始し、しばらく待ち、Help を開閉して Space を押した後、手動で次の Card へ移動する。

Then:

- 間隔0では自動送りを行わず、再生／一時停止ボタンと進捗スライダーを表示しない。
- Help は利用不可の説明を表示し、Space の操作で保存済み設定を書き換えない。
- 手動の次の Card への移動は利用でき、学習の進行が維持される。
