# Settings E2E テスト仕様書

## 目的

表示設定を保存して再読み込み後も利用でき、破損した設定から復旧できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| SETTINGS-01 | write | 正常系 | [Dark mode を自動保存して再読み込み後も反映できる](#settings-01) |
| SETTINGS-04 | write | 正常系 | [日本語設定を自動保存して再読み込み後も反映できる](#settings-04) |
| SETTINGS-06 | read | 異常系 | [無効な保存済み設定から現在の既定値へ復旧できる](#settings-06) |

<a id="settings-01"></a>

### SETTINGS-01 Dark mode を自動保存して再読み込み後も反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが Settings 画面を開き、変更前の Dark mode 設定が画面に反映されている。
- Maximum cards は0、自動再生の間隔は3秒で保存されており、どちらのスライダーも操作しない。

When:

- Dark mode を現在と異なる状態に変更し、自動保存後にページを再読み込みする。

Then:

- 選んだチェック状態と配色が、再読み込み後も反映される。
- 他の設定は変わらず、Maximum cards は0、自動再生の間隔は3秒を維持する。

<a id="settings-04"></a>

### SETTINGS-04 日本語設定を自動保存して再読み込み後も反映できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- 認証済みユーザーが、英語表示の Settings 画面を開いている。

When:

- Language selector で `日本語` を選択し、自動保存後にページを再読み込みする。

Then:

- `日本語` が選ばれ、Settings の見出し・言語選択の読み上げ名・ページの言語が日本語になる。再読み込み後も維持される。
- 再読み込み後に Deck 一覧を開くと、見出しと作成操作が日本語で表示される。

<a id="settings-06"></a>

### SETTINGS-06 無効な保存済み設定から現在の既定値へ復旧できる

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`empty`](./fixture/empty.yaml)
- このブラウザーに読み込めない設定が保存されている。

When:

- Settings 画面を再読み込みする。

Then:

- Settings を利用でき、既定値（Dark mode: 無効、Maximum cards: `10`、Language: `System`）へ復旧する。
