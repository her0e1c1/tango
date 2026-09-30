# 学習開始画面 Storybook 結合テスト仕様書

## 目的

学習開始画面を入口とした `play` で、対象 Deck と学習条件に基づく開始、対象なしと開始失敗の案内を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-SESSION-START-01 | interaction | 正常系 | [学習を開始する](#storybook-study-session-start-01) |
| STORYBOOK-STUDY-SESSION-START-02 | render | 正常系 | [対象がない場合に理由を示す](#storybook-study-session-start-02) |
| STORYBOOK-STUDY-SESSION-START-03 | interaction | 異常系 | [開始に失敗した場合に復旧できる](#storybook-study-session-start-03) |

<a id="storybook-study-session-start-01"></a>

### STORYBOOK-STUDY-SESSION-START-01 学習を開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に学習対象の Card があり、開始に必要な処理は成功する。

When:

- 学習開始画面で開始を選ぶ。

Then:

- 同じ Deck の最初の学習対象が学習画面に表示される。

<a id="storybook-study-session-start-02"></a>

### STORYBOOK-STUDY-SESSION-START-02 対象がない場合に理由を示す

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card はあるが、選んだ学習条件に一致する対象はない。

When:

- 学習開始画面を開く。

Then:

- 学習対象がないことを表示し、対象のないセッションを開始したかのように表示しない。

<a id="storybook-study-session-start-03"></a>

### STORYBOOK-STUDY-SESSION-START-03 開始に失敗した場合に復旧できる

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習対象はあるが、開始に必要な処理が失敗する。

When:

- 学習開始画面で開始を選ぶ。

Then:

- 失敗と復旧のための操作が表示され、学習が始まったと誤認させない。
