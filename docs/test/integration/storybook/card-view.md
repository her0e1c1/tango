# Card 閲覧画面 Storybook 結合テスト仕様書

## 目的

Card 閲覧画面を入口とした `play` で、指定した一枚の Card の閲覧、編集への移動、存在しない場合の案内を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-VIEW-01 | interaction | 正常系 | [指定した Card の両面を読む](#storybook-card-view-01) |
| STORYBOOK-CARD-VIEW-02 | interaction | 正常系 | [表示している Card を編集する](#storybook-card-view-02) |
| STORYBOOK-CARD-VIEW-03 | render | 異常系 | [存在しない Card を案内する](#storybook-card-view-03) |

<a id="storybook-card-view-01"></a>

### STORYBOOK-CARD-VIEW-01 指定した Card の両面を読む

カテゴリ: `interaction`

区分: 正常系

Given:

- 表面 Hello、裏面 Hola の Card と、別の内容の Card がある。

When:

- Hello の Card 閲覧画面を開き、表裏を切り替える。

Then:

- Hello と Hola を確認でき、他の Card の内容は表示されない。

<a id="storybook-card-view-02"></a>

### STORYBOOK-CARD-VIEW-02 表示している Card を編集する

カテゴリ: `interaction`

区分: 正常系

Given:

- Card 閲覧画面で表面と編集操作が表示されている。

When:

- 編集を選ぶ。

Then:

- 同じ Card の表面・裏面を持つ編集画面が表示される。

<a id="storybook-card-view-03"></a>

### STORYBOOK-CARD-VIEW-03 存在しない Card を案内する

カテゴリ: `render`

区分: 異常系

Given:

- 指定した Card が存在しない。

When:

- その Card の閲覧画面を開く。

Then:

- 見つからないことと戻る操作が表示され、別の Card を代わりに表示しない。
