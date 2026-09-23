# Study Controls Storybook 結合テスト仕様書

## 目的

学習用の再生切替、スキップ、キーボード操作とヘルプダイアログの振る舞いを確認する。

## 検証境界

Controller とその実際の子 UI、Story 側の再生状態、StudySaveControls、SwipeButtonList、および StudyHelpDialog と ToastViewport。時間経過、自動カード送り、回答記録や FSRS 更新は対象外。

関連 E2E: [study-controls](../../e2e/study-controls.md) / [study-actions](../../e2e/study-actions.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | [再生を要求して一時停止の表示に切り替える](#storybook-study-controls-01) | [Controller.stories.tsx](../../../../src/features/card-player/ui/Controller.stories.tsx) :: `Interaction` |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | [処理中でないときにスキップを要求する](#storybook-study-controls-02) | [StudySaveControls.stories.tsx](../../../../src/pages/study-session/ui/StudySaveControls.stories.tsx) :: `Default` |
| STORYBOOK-STUDY-CONTROLS-03 | interaction | [Enter で再生を要求する](#storybook-study-controls-03) | Controller :: `KeyboardPlayback`（未実装） |
| STORYBOOK-STUDY-CONTROLS-04 | interaction | [スライダーで表示位置を要求する](#storybook-study-controls-04) | Controller :: `ManualPosition`（未実装） |
| STORYBOOK-STUDY-CONTROLS-05 | interaction | [無効な方向を表示したままキーボード移動から除く](#storybook-study-controls-05) | SwipeButtonList :: `DisabledKeyboard`（未実装） |
| STORYBOOK-STUDY-CONTROLS-06 | interaction | [Enter でスワイプ操作を要求する](#storybook-study-controls-06) | SwipeButtonList :: `KeyboardAction`（未実装） |
| STORYBOOK-STUDY-CONTROLS-07 | interaction | [ヘルプをモーダルとして開く](#storybook-study-controls-07) | StudyHelpDialog :: `ModalSemantics`（未実装） |
| STORYBOOK-STUDY-CONTROLS-08 | interaction | [ヘルプ内にフォーカスを保ち Escape で戻る](#storybook-study-controls-08) | StudyHelpDialog :: `KeyboardDismissal`（未実装） |
| STORYBOOK-STUDY-CONTROLS-09 | interaction | [ヘルプ表示中に背景の通知を操作させない](#storybook-study-controls-09) | StudyHelpDialog :: `PersistentToast`（未実装） |
| STORYBOOK-STUDY-CONTROLS-10 | interaction | [ヘルプを閉じると通知を再び操作できる](#storybook-study-controls-10) | StudyHelpDialog :: `ToastAfterClose`（未実装） |

03 以降の named export は追加予定であり、現在の `play` による検証済みを意味しない。Controller は上記の Story ファイル、SwipeButtonList は [SwipeButtonList.stories.tsx](../../../../src/features/card-player/ui/SwipeButtonList.stories.tsx) が対応先である。StudyHelpDialog は `src/features/card-player/ui/StudyHelpDialog.stories.tsx` を対応予定ファイルとする。

<a id="storybook-study-controls-01"></a>

### STORYBOOK-STUDY-CONTROLS-01 再生を要求して一時停止の表示に切り替える

カテゴリ: `interaction`

対応 Story: [Controller.stories.tsx](../../../../src/features/card-player/ui/Controller.stories.tsx) :: `Interaction`

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

対応 Story: [StudySaveControls.stories.tsx](../../../../src/pages/study-session/ui/StudySaveControls.stories.tsx) :: `Default`

Given:

- 保存処理中ではない StudySaveControls を表示する。

When:

- Skip を押す。

Then:

- スキップ callback が一度通知される。

<a id="storybook-study-controls-03"></a>

### STORYBOOK-STUDY-CONTROLS-03 Enter で再生を要求する

カテゴリ: `interaction`

対応予定 Story: Controller :: `KeyboardPlayback`（未実装）。元テスト: [Controller.spec.tsx](../../../../src/features/card-player/ui/Controller.spec.tsx) :: `supports native keyboard activation`。

Given:

- 停止中の Play ボタンにフォーカスする。

When:

- Enter を押す。

Then:

- 再生切替 callback が一度通知される。

<a id="storybook-study-controls-04"></a>

### STORYBOOK-STUDY-CONTROLS-04 スライダーで表示位置を要求する

カテゴリ: `interaction`

対応予定 Story: Controller :: `ManualPosition`（未実装）。元テスト: [Controller.spec.tsx](../../../../src/features/card-player/ui/Controller.spec.tsx) :: `delegates manual index changes`。

Given:

- 5件中の index 0 を表示する。

When:

- スライダーの値を 3 に変更する。

Then:

- 表示位置の変更 callback に数値 3 が渡される。カードの保存や実際の学習進捗更新は確認しない。

<a id="storybook-study-controls-05"></a>

### STORYBOOK-STUDY-CONTROLS-05 無効な方向を表示したままキーボード移動から除く

カテゴリ: `interaction`

対応予定 Story: SwipeButtonList :: `DisabledKeyboard`（未実装）。元テスト: [SwipeButtonList.spec.tsx](../../../../src/features/card-player/ui/SwipeButtonList.spec.tsx) :: `keeps disabled directions visible and skips them during keyboard navigation`。

Given:

- 左方向だけが無効な操作ボタン列を表示する。

When:

- Swipe left を押し、ボタン列の前から Tab で移動する。

Then:

- 左ボタンは表示されたまま無効で、左方向の callback は通知されない。
- 無効な左ボタンを飛ばし、Swipe up にフォーカスする。

<a id="storybook-study-controls-06"></a>

### STORYBOOK-STUDY-CONTROLS-06 Enter でスワイプ操作を要求する

カテゴリ: `interaction`

対応予定 Story: SwipeButtonList :: `KeyboardAction`（未実装）。元テスト: [SwipeButtonList.spec.tsx](../../../../src/features/card-player/ui/SwipeButtonList.spec.tsx) :: `activates swipe actions with Enter`。

Given:

- 有効な Swipe left にフォーカスする。

When:

- Enter を押す。

Then:

- 左方向の callback が一度通知される。

<a id="storybook-study-controls-07"></a>

### STORYBOOK-STUDY-CONTROLS-07 ヘルプをモーダルとして開く

カテゴリ: `interaction`

対応予定 Story: StudyHelpDialog :: `ModalSemantics`（未実装）。元テスト: [StudyHelpDialog.spec.tsx](../../../../src/features/card-player/ui/StudyHelpDialog.spec.tsx) :: `provides modal semantics and focuses a safe close control`。

Given:

- 上方向の評価と表裏切替の説明を持つヘルプが閉じている。

When:

- Open study help を押す。

Then:

- Study controls という名前と操作説明を持つ dialog が、`aria-modal="true"` で表示される。
- Arrow Up / Swipe Up の説明が表示され、Close help にフォーカスする。

<a id="storybook-study-controls-08"></a>

### STORYBOOK-STUDY-CONTROLS-08 ヘルプ内にフォーカスを保ち Escape で戻る

カテゴリ: `interaction`

対応予定 Story: StudyHelpDialog :: `KeyboardDismissal`（未実装）。元テスト: [StudyHelpDialog.spec.tsx](../../../../src/features/card-player/ui/StudyHelpDialog.spec.tsx) :: `traps focus, closes on Escape, and returns focus to the Help trigger after a pointer click`。

Given:

- ポインターで開いたヘルプの Close help にフォーカスしている。

When:

- Tab、Shift+Tab、Escape の順に操作する。

Then:

- Tab と Shift+Tab ではフォーカスがヘルプ内に留まる。
- Escape でダイアログが閉じ、開いたボタンにフォーカスが戻る。

<a id="storybook-study-controls-09"></a>

### STORYBOOK-STUDY-CONTROLS-09 ヘルプ表示中に背景の通知を操作させない

カテゴリ: `interaction`

対応予定 Story: StudyHelpDialog :: `PersistentToast`（未実装）。元テスト: [StudyHelpDialog.spec.tsx](../../../../src/features/card-player/ui/StudyHelpDialog.spec.tsx) :: `keeps a persistent Toast non-interactive and restores programmatic dismissal inside the modal`。

Given:

- 手動で閉じられる永続通知と、閉じたヘルプを表示する。

When:

- ヘルプを開き、その表示中に通知が外部から閉じられる。

Then:

- ヘルプ表示中は背景の Dismiss notification を操作対象にしない。
- 通知が閉じられてもフォーカスは Close help に保たれる。

<a id="storybook-study-controls-10"></a>

### STORYBOOK-STUDY-CONTROLS-10 ヘルプを閉じると通知を再び操作できる

カテゴリ: `interaction`

対応予定 Story: StudyHelpDialog :: `ToastAfterClose`（未実装）。元テスト: [StudyHelpDialog.spec.tsx](../../../../src/features/card-player/ui/StudyHelpDialog.spec.tsx) :: `restores persistent Toast interaction after Strict Mode modal cleanup`。

Given:

- Strict Mode で、永続通知のある画面からヘルプを開いている。

When:

- Close help を押す。

Then:

- ダイアログが消え、Dismiss notification が再び操作できる。

## 自動アサーションに含めない項目

[SwipeButtonList.stories.tsx](../../../../src/features/card-player/ui/SwipeButtonList.stories.tsx) の `Ratings` や `Disabled` は表示専用で、Again / Hard / Good / Easy の通知や操作抑止の自動アサーションはない。Controller / StudySaveControls の `Saving` も同様に別途検証が必要である。上記の追加予定ケースは既存 Vitest の UI 契約の記録であり、これらの Story を実装済みとするものではない。
