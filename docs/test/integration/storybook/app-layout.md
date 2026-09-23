# Application Layout Storybook 結合テスト仕様書

## 目的

共通 Header と画面コンテンツを組み合わせ、スクロール中の Header と本文の位置関係を確認する。

## 検証境界

実際の AppLayout、Header、ルーターとブラウザのレイアウト。ページの保存処理や認証初期化は対象外。

関連 E2E: [navigation](../../e2e/navigation.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-APP-LAYOUT-01 | interaction | 正常系 | [固定 Header が本文に重ならずスクロール中も同じ位置に残る](#storybook-app-layout-01) |
| STORYBOOK-APP-LAYOUT-02 | render | 正常系 | [固定を無効にした Header の下に本文を配置する](#storybook-app-layout-02) |

<a id="storybook-app-layout-01"></a>

### STORYBOOK-APP-LAYOUT-01 固定 Header が本文に重ならずスクロール中も同じ位置に残る

カテゴリ: `interaction`

区分: 正常系

Given:

- Header を表示する通常の AppLayout に、縦に並ぶ8セクションを配置する。

When:

- 初期表示の Header と先頭セクションの位置を確認する。
- Application shell を下端までスクロールする。

Then:

- 初期表示の先頭セクションは Header の下端と同じ位置か、それより下にある。
- Application shell のスクロール位置が移動しても、Header の上端位置は変化しない。

<a id="storybook-app-layout-02"></a>

### STORYBOOK-APP-LAYOUT-02 固定を無効にした Header の下に本文を配置する

カテゴリ: `render`

区分: 正常系

Given:

- Header の固定を無効にし、見出しを含む本文を渡す。

When:

- AppLayout を描画する。

Then:

- Header は通常の文書フローに配置され、本文の見出しは Header の下端と同じ位置か、それより下にある。

## 実行時の注意

画面がスクロールできる高さで実行する。スクロール位置は Story の終了時に戻す。
