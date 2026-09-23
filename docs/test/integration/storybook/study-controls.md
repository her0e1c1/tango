# Study Controls Storybook 結合テスト仕様書

## 目的

学習用の再生切替とスキップの操作通知を確認する。

## 検証境界

Controller とその実際の子 UI、Story 側の再生状態、および StudySaveControls。時間経過、自動カード送り、回答記録や FSRS 更新は対象外。

関連 E2E: [study-controls](../../e2e/study-controls.md) / [study-actions](../../e2e/study-actions.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | [再生を要求して一時停止の表示に切り替える](#storybook-study-controls-01) |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | [処理中でないときにスキップを要求する](#storybook-study-controls-02) |

<a id="storybook-study-controls-01"></a>

### STORYBOOK-STUDY-CONTROLS-01 再生を要求して一時停止の表示に切り替える

カテゴリ: `interaction`

Given:

- 自動再生が停止中で、24件中の index 3 を表示する Controller を用意する。
- 再生切替を Story 側の状態に反映する。

When:

- Play を押す。

Then:

- 再生切替 callback が一度通知される。
- Pause ボタンが表示され、pressed 状態になる。

<a id="storybook-study-controls-02"></a>

### STORYBOOK-STUDY-CONTROLS-02 処理中でないときにスキップを要求する

カテゴリ: `interaction`

Given:

- 保存処理中ではない StudySaveControls を表示する。

When:

- Skip を押す。

Then:

- スキップ callback が一度通知される。

## 自動アサーションに含めない項目

SwipeButtonList の評価ボタンと無効化状態は表示専用で、Again / Hard / Good / Easy の通知や操作抑止の自動アサーションはない。Controller / StudySaveControls の保存中表示も同様に別途検証が必要である。
