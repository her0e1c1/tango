# Settings E2E テスト仕様書

## 目的

Settings の自動保存が reload を越えて維持され、保存した学習設定が次の学習 session に反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SETTINGS-01 | write | [Dark mode を自動保存して reload 後も反映できる](#settings-01) |
| SETTINGS-02 | write | [Maximum cards 設定を次の学習 session に反映できる](#settings-02) |

<a id="settings-01"></a>

### SETTINGS-01 Dark mode を自動保存して reload 後も反映できる

カテゴリ: `write`

Given:

- 認証済みユーザーが Settings 画面を開き、変更前の Dark mode 設定が画面に反映されている。

When:

- Dark mode を現在と異なる状態に変更し、自動保存後にページを reload する。

Then:

- Dark mode が reload 後も変更後の状態を維持する。
- アプリケーションの配色に Dark mode の変更が反映される。
- browser error が発生しない。

<a id="settings-02"></a>

### SETTINGS-02 Maximum cards 設定を次の学習 session に反映できる

カテゴリ: `write`

Given:

- 認証済みユーザーが所有する Deck に、変更後の上限より多くの学習対象 Card が存在する。
- 対象 Deck に進行中の学習 session が存在しない。

When:

- Settings 画面で `Maximum cards` を現在と異なる上限に変更し、自動保存後にページを reload して対象 Deck の学習開始画面を開く。

Then:

- 学習開始画面に表示される session の Card 数が変更後の上限と一致する。
- start action に変更後の上限と同じ Card 数が表示される。
- browser error が発生しない。
