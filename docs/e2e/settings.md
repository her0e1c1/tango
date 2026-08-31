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
