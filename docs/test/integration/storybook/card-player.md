# Card Player Storybook 結合テスト仕様書

## 目的

カードを読む操作と学習操作を区別し、誤操作の抑止、ツールバーの切替、裏面の表示・スクロールと操作通知を確認する。

## 検証境界

CardPlayer と実際の子 UI、CardOverlay、Story 側の表示状態と公開 callback。実際の学習進捗、回答記録、FSRS 計算、設定の永続化、画面遷移は対象外。

対応ファイルは [CardPlayer.stories.tsx](../../../../src/features/card-player/ui/CardPlayer.stories.tsx)。元テストは主に [CardPlayer.spec.tsx](../../../../src/features/card-player/ui/CardPlayer.spec.tsx)。再生単体・スキップ・ヘルプの仕様は [study-controls](./study-controls.md) を参照する。共通の書式・実行前提は [README](./README.md) を参照する。

以下の「未実装」は追加予定 named export を指す。「要追加」は既存 `play` に一部の確認があるが、ここに記載した契約全体はまだ確認していないことを表す。記載は実行成功の記録ではない。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story export |
| --- | --- | --- | --- |
| STORYBOOK-CARD-PLAYER-01 | interaction | [閲覧中の読書ジェスチャーを学習操作にしない](#storybook-card-player-01) | `ReadingGestureContract`（未実装） |
| STORYBOOK-CARD-PLAYER-02 | interaction | [文字選択中のクリックで閲覧を終了しない](#storybook-card-player-02) | `ReadingSelectionContract`（未実装） |
| STORYBOOK-CARD-PLAYER-03 | interaction | [閲覧中の Space とタップを区別する](#storybook-card-player-03) | `ReadingTapContract`（未実装） |
| STORYBOOK-CARD-PLAYER-04 | interaction | [表面の閲覧設定で裏面の許可済み操作を変えない](#storybook-card-player-04) | `AnswerReadingPreference`（未実装） |
| STORYBOOK-CARD-PLAYER-05 | interaction | [編集リンクの表示を操作メニューから切り替える](#storybook-card-player-05) | `ViewEditLink` / `ViewEditLinkNarrow` / `ViewEditLinkMobile`（要追加） |
| STORYBOOK-CARD-PLAYER-06 | render | [裏面や編集非対応の画面に編集操作を出さない](#storybook-card-player-06) | `EditLinkAvailability`（未実装） |
| STORYBOOK-CARD-PLAYER-07 | render | [裏面では解答に集中できる表示にする](#storybook-card-player-07) | `LongAnswer` / `MobileLongAnswer`（要追加） |
| STORYBOOK-CARD-PLAYER-08 | interaction | [裏面の端の操作を解答のクリックと分離する](#storybook-card-player-08) | `AnswerEdgeActions`（未実装） |
| STORYBOOK-CARD-PLAYER-09 | interaction | [端のホイール入力を解答スクロールへ渡す](#storybook-card-player-09) | `AnswerSwipeOverlays` |
| STORYBOOK-CARD-PLAYER-10 | interaction | [操作一覧から個別の切替を要求する](#storybook-card-player-10) | `ToolbarActionContract`（未実装） |
| STORYBOOK-CARD-PLAYER-11 | interaction | [ヘルプを隠しても再表示の操作を失わない](#storybook-card-player-11) | `HelpVisibilityContract`（未実装） |
| STORYBOOK-CARD-PLAYER-12 | interaction | [閲覧モードの状態をボタンで示す](#storybook-card-player-12) | `ViewModeToggleContract`（未実装） |
| STORYBOOK-CARD-PLAYER-13 | interaction | [閲覧モードとボタンの表示設定を区別する](#storybook-card-player-13) | `ViewModeVisibilityContract`（未実装） |
| STORYBOOK-CARD-PLAYER-14 | interaction | [表示設定に従ってショートカットを組み合わせる](#storybook-card-player-14) | `ShortcutCombinations`（未実装） |
| STORYBOOK-CARD-PLAYER-15 | interaction | [詳細表示をまとめて切り替える](#storybook-card-player-15) | `DetailsVisibilityContract`（未実装） |
| STORYBOOK-CARD-PLAYER-16 | interaction | [利用できない再生設定の理由を操作前に確認できる](#storybook-card-player-16) | `UnavailablePlaybackContract`（未実装） |
| STORYBOOK-CARD-PLAYER-17 | render | [選択した下部コントロールだけを表示する](#storybook-card-player-17) | `BottomControlsContract`（未実装） |
| STORYBOOK-CARD-PLAYER-18 | interaction | [未許可の裏面スワイプを無視する](#storybook-card-player-18) | `DisabledAnswerGestures`（未実装） |
| STORYBOOK-CARD-PLAYER-19 | interaction | [表面のスワイプをボタン表示と独立して受け付ける](#storybook-card-player-19) | `FrontTouchGesture`（未実装） |
| STORYBOOK-CARD-PLAYER-20 | interaction | [主ボタンのドラッグをクリックとして重複処理しない](#storybook-card-player-20) | `PrimaryMouseGesture`（未実装） |
| STORYBOOK-CARD-PLAYER-21 | interaction | [中・右ボタンのドラッグを学習操作にしない](#storybook-card-player-21) | `NonPrimaryMouseGesture`（未実装） |
| STORYBOOK-CARD-PLAYER-22 | interaction | [裏面のドラッグ後のクリックを誤操作にしない](#storybook-card-player-22) | `AnswerMouseDrag`（未実装） |
| STORYBOOK-CARD-PLAYER-23 | render | [未評価と FSRS 難易度を区別して表示する](#storybook-card-player-23) | `FsrsMetadataContract`（未実装） |

<a id="storybook-card-player-01"></a>

### STORYBOOK-CARD-PLAYER-01 閲覧中の読書ジェスチャーを学習操作にしない

カテゴリ: `interaction`

対応予定 Story: `ReadingGestureContract`（未実装）。元テスト: `ignores reading gestures and their trailing click while keeping explicit buttons active`。

Given:

- 閲覧モードの表面に長いテキストを表示し、上・左スワイプと閲覧切替の callback を渡す。明示的な左ボタンは有効にする。

When:

- 表面を上下・左右へタッチで動かし、マウスでもドラッグしてからクリックする。その後、Swipe left ボタンを押す。

Then:

- 読書ジェスチャーと直後のクリックはスワイプ操作や閲覧切替を通知しない。
- 明示的なボタン操作だけが左方向の callback を一度通知する。

<a id="storybook-card-player-02"></a>

### STORYBOOK-CARD-PLAYER-02 文字選択中のクリックで閲覧を終了しない

カテゴリ: `interaction`

対応予定 Story: `ReadingSelectionContract`（未実装）。元テスト: `keeps view mode active while the front text has a selection`。

Given:

- 閲覧モードの表面テキストを実際の Selection API で選択している。

When:

- 選択中に表面をクリックし、選択を解除してから再度クリックする。

Then:

- 選択中は閲覧切替を通知せず、選択解除後のクリックで初めて通知する。

<a id="storybook-card-player-03"></a>

### STORYBOOK-CARD-PLAYER-03 閲覧中の Space とタップを区別する

カテゴリ: `interaction`

対応予定 Story: `ReadingTapContract`（未実装）。元テスト: `exits reading on a tap, but reserves Space for scrolling`。

Given:

- 閲覧モードを開き、Card front text の領域にフォーカスしている。

When:

- Space の押下・解放を行い、その後テキストをタップする。

Then:

- Space は閲覧切替を通知せず、タップで一度通知する。
- Space による実スクロール量は元の Vitest では確認していない。

<a id="storybook-card-player-04"></a>

### STORYBOOK-CARD-PLAYER-04 表面の閲覧設定で裏面の許可済み操作を変えない

カテゴリ: `interaction`

対応予定 Story: `AnswerReadingPreference`（未実装）。元テスト: `keeps the reading preference from changing answer gestures`。

Given:

- 閲覧モード設定が有効で、裏面を表示し、裏面の横スワイプは許可されている。

When:

- 解答をクリックし、左へスワイプする。

Then:

- 解答クリックと左スワイプの callback がそれぞれ一度通知される。

<a id="storybook-card-player-05"></a>

### STORYBOOK-CARD-PLAYER-05 編集リンクの表示を操作メニューから切り替える

カテゴリ: `interaction`

対応 Story: `ViewEditLink` / `ViewEditLinkNarrow` / `ViewEditLinkMobile`（一部要追加）。元テスト: `uses the edit shortcut slot to toggle visibility only while actions are open`。

Given:

- 表面に編集リンクを表示し、通常幅・iPhone 5・iPhone X の3条件を用意する。表示切替は実際の Story 側の状態で保持する。

When:

- 操作一覧を開いて Edit link を切り替え、Escape で閉じる。同じ手順で再表示する。

Then:

- 既存 play: 初期リンクが表示され、切替後は非表示、再切替後は再表示になる。操作中のボタン同士は重ならない。
- 要追加: 操作一覧を開いている間は編集リンク本体を表示せず、切替後の pressed 状態が false になる。
- 要追加: Escape で Open card actions にフォーカスが戻る。

<a id="storybook-card-player-06"></a>

### STORYBOOK-CARD-PLAYER-06 裏面や編集非対応の画面に編集操作を出さない

カテゴリ: `render`

対応予定 Story: `EditLinkAvailability`（未実装）。元テスト: `hides the edit link on the answer and does not add editing to Study`。

Given:

- 編集リンクを持つ裏面表示と、編集リンクを提供しない学習画面の2条件を用意する。

When:

- 裏面を描画する。編集非対応の画面では操作一覧を開く。

Then:

- 裏面には編集リンクがなく、編集非対応の操作一覧には Edit link の切替を追加しない。

<a id="storybook-card-player-07"></a>

### STORYBOOK-CARD-PLAYER-07 裏面では解答に集中できる表示にする

カテゴリ: `render`

対応 Story: `LongAnswer` / `MobileLongAnswer`（一部要追加）。元テスト: `shows only the answer on the back`。

Given:

- 通常幅と iPhone X で裏面を表示する。表面、詳細、再生操作、スワイプ操作の入力も用意し、裏面の端の操作は指定しない。

When:

- 裏面を描画する。

Then:

- 既存 play: 解答を表示し、スワイプボタンと Card actions を表示しない。
- 要追加: Study answer はフォーカス可能な領域になり、表面・詳細・戻る操作・操作一覧の開閉・再生操作も表示しない。

<a id="storybook-card-player-08"></a>

### STORYBOOK-CARD-PLAYER-08 裏面の端の操作を解答のクリックと分離する

カテゴリ: `interaction`

対応予定 Story: `AnswerEdgeActions`（未実装）。元テスト: `runs configured back-text edge actions without clicking the answer`。

Given:

- 裏面にクリック可能な解答と左右の端の操作を用意する。

When:

- Swipe left / Swipe right を押す。その後、表面へ切り替えてスワイプボタン表示を無効にする。

Then:

- 裏面では左右それぞれの callback だけを通知し、解答のクリックは通知しない。上下の端の操作は表示しない。
- 表面へ切り替えると裏面領域と左右の端の操作を表示しない。
- 既存 `AnswerSwipeOverlays` は左操作の通知を確認するが、右操作と解答クリックの分離には追加アサーションが必要である。

<a id="storybook-card-player-09"></a>

### STORYBOOK-CARD-PLAYER-09 端のホイール入力を解答スクロールへ渡す

カテゴリ: `interaction`

対応 Story: `AnswerSwipeOverlays`。元テスト: `forwards edge wheel input to answer scrolling without running the action`。

Given:

- 領域より長い解答に左右の端の操作を表示する。

When:

- 左の端で下向きの wheel を発生させ、その後左の端をクリックする。

Then:

- 解答の scrollTop が増え、端の操作ボタンの表示位置は変わらない。
- 左 callback は最後のクリックによる一度だけで、wheel を操作要求として扱わない。
- Story は解答領域の高さに相当する入力、元の Vitest は64pxの入力を用いて同じスクロール契約を確認する。

<a id="storybook-card-player-10"></a>

### STORYBOOK-CARD-PLAYER-10 操作一覧から個別の切替を要求する

カテゴリ: `interaction`

対応予定 Story: `ToolbarActionContract`（未実装）。元テスト: `STUDY-CONTROLS-05 keeps Help available while opening the remaining study actions`。

Given:

- 表面のヘルプ、詳細、スワイプ、再生、スキップを有効にし、操作一覧は閉じている。

When:

- 操作一覧を開き、戻る・スワイプ・再生・スキップ・詳細の各操作を押し、Escape で閉じる。

Then:

- 開閉状態と各表示設定を accessible な expanded / pressed 状態と名前で確認でき、各操作の callback を通知する。
- 開いている間はヘルプを開くボタンの代わりに Help button の表示切替を操作できる。
- 閉じると Open card actions にフォーカスが戻り、ヘルプを開くボタンを再表示する。

<a id="storybook-card-player-11"></a>

### STORYBOOK-CARD-PLAYER-11 ヘルプを隠しても再表示の操作を失わない

カテゴリ: `interaction`

対応予定 Story: `HelpVisibilityContract`（未実装）。元テスト: `STUDY-CONTROLS-05 keeps the Help visibility toggle mounted while visibility changes`。

Given:

- 操作一覧を開き、ヘルプ表示が有効である。

When:

- ヘルプ表示を無効な入力へ変更し、Help button を押す。

Then:

- 切替ボタンは消えず、pressed が false、説明が Show help button になる。
- 再表示を要求する callback を通知できる。

<a id="storybook-card-player-12"></a>

### STORYBOOK-CARD-PLAYER-12 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

対応予定 Story: `ViewModeToggleContract`（未実装）。元テスト: `places view mode on the toolbar to the left of the Help icon and toggles it on and off`。

Given:

- 操作一覧は閉じ、閲覧モードは無効である。状態変更を Story の入力へ反映する。

When:

- View mode を押して有効にする。

Then:

- 閲覧切替 callback を通知し、pressed は false から true、説明は Enter view mode から Exit view mode に変わる。
- 位置の確認を内部 DOM の識別子や CSS クラス名の一致に依存させない。

<a id="storybook-card-player-13"></a>

### STORYBOOK-CARD-PLAYER-13 閲覧モードとボタンの表示設定を区別する

カテゴリ: `interaction`

対応予定 Story: `ViewModeVisibilityContract`（未実装）。元テスト: `places view mode on the toolbar to the left of the Help icon and toggles it on and off`。

Given:

- 閲覧モードが有効で、そのボタンも表示されている。

When:

- 操作一覧内で View mode の表示を無効にして一覧を閉じ、再度開いて表示を有効にする。

Then:

- 一覧内の操作は閲覧そのものではなく、ボタンの表示設定を通知する。
- 非表示設定でも一覧を開けば復帰操作を利用でき、再表示後は閲覧中を示す Exit view mode に戻る。
- Escape は操作一覧を閉じて開くボタンへフォーカスを戻す。

<a id="storybook-card-player-14"></a>

### STORYBOOK-CARD-PLAYER-14 表示設定に従ってショートカットを組み合わせる

カテゴリ: `interaction`

対応予定 Story: `ShortcutCombinations`（未実装）。元テスト: `STUDY-CONTROLS-05 composes visible shortcuts: %o`。

Given:

- ヘルプ・閲覧・編集リンクの表示を順に表す true/false の組として、TTT、FTT、TTF、FTF、TFT、FFF の6条件を別々に用意する。

When:

- 通常の表示から操作一覧を開き、Escape で閉じる。

Then:

- 通常時は Open card actions に続き、設定が有効なヘルプ・閲覧の順でボタンを表示し、編集リンクも設定に従う。
- 一覧内では各表示切替を操作でき、リンク本体は表示しない。
- 閉じると元の表示の組合せへ戻り、開くボタンへフォーカスが戻る。

<a id="storybook-card-player-15"></a>

### STORYBOOK-CARD-PLAYER-15 詳細表示をまとめて切り替える

カテゴリ: `interaction`

対応予定 Story: `DetailsVisibilityContract`（未実装）。元テスト: `shows and hides all card details from the persisted preference value`。

Given:

- 詳細を表示した表面で操作一覧を開いている。

When:

- 詳細表示を無効、有効の順に入力へ反映する。

Then:

- 詳細内容全体が非表示・再表示になり、Card details の pressed 状態と Show / Hide の説明も一致する。
- 設定が実際に永続化されたかどうかは確認しない。

<a id="storybook-card-player-16"></a>

### STORYBOOK-CARD-PLAYER-16 利用できない再生設定の理由を操作前に確認できる

カテゴリ: `interaction`

対応予定 Story: `UnavailablePlaybackContract`（未実装）。元テスト: `describes hidden controls and keeps the unavailable playback toggle disabled`。

Given:

- 再生間隔0により再生操作を利用できず、再生とスワイプの表示設定も無効である。

When:

- 操作一覧を開き、Playback controls にフォーカスして押す。

Then:

- スワイプの切替は pressed が false で再表示の説明を持つ。
- 再生切替はフォーカスできるが aria-disabled が true で、間隔0のため利用できないことを title と読み上げ説明に示す。
- 押しても再生表示の切替 callback を通知しない。

<a id="storybook-card-player-17"></a>

### STORYBOOK-CARD-PLAYER-17 選択した下部コントロールだけを表示する

カテゴリ: `render`

対応予定 Story: `BottomControlsContract`（未実装）。元テスト: `shows only the selected bottom control groups`。

Given:

- 再生とスワイプの両方の操作を用意し、スワイプだけ非表示、再生だけ非表示の2条件を用意する。

When:

- 表面を描画する。

Then:

- 前者は Play を表示して Swipe left を隠し、後者はその逆になる。
- 既存の非表示バリエーションの中央配置アサーションだけでは、この契約を検証済みとしない。

<a id="storybook-card-player-18"></a>

### STORYBOOK-CARD-PLAYER-18 未許可の裏面スワイプを無視する

カテゴリ: `interaction`

対応予定 Story: `DisabledAnswerGestures`（未実装）。元テスト: `ignores horizontal and vertical swipes on the back text`。

Given:

- 裏面を表示し、裏面の横スワイプを許可していない。

When:

- 裏面を左と上へスワイプする。

Then:

- 左・上の callback はどちらも通知しない。

<a id="storybook-card-player-19"></a>

### STORYBOOK-CARD-PLAYER-19 表面のスワイプをボタン表示と独立して受け付ける

カテゴリ: `interaction`

対応予定 Story: `FrontTouchGesture`（未実装）。元テスト: `reports a vertical swipe performed on the front text`。

Given:

- 閲覧モードでない表面を表示し、スワイプボタンは非表示である。

When:

- 表面を上へスワイプする。

Then:

- 上方向の callback を一度通知する。

<a id="storybook-card-player-20"></a>

### STORYBOOK-CARD-PLAYER-20 主ボタンのドラッグをクリックとして重複処理しない

カテゴリ: `interaction`

対応予定 Story: `PrimaryMouseGesture`（未実装）。元テスト: `treats a primary-button mouse swipe as only a swipe`。

Given:

- 表面にクリック操作と上スワイプ操作を用意する。

When:

- マウスの主ボタンで上へドラッグし、その終了に続く click を発生させる。

Then:

- 上スワイプだけを一度通知し、表面のクリックは通知しない。

<a id="storybook-card-player-21"></a>

### STORYBOOK-CARD-PLAYER-21 中・右ボタンのドラッグを学習操作にしない

カテゴリ: `interaction`

対応予定 Story: `NonPrimaryMouseGesture`（未実装）。元テスト: `ignores non-primary mouse drags on the front text`。

Given:

- 上方向の操作が可能な表面を表示する。

When:

- 中ボタンと右ボタンで上へドラッグする。

Then:

- どちらも上スワイプの callback を通知しない。

<a id="storybook-card-player-22"></a>

### STORYBOOK-CARD-PLAYER-22 裏面のドラッグ後のクリックを誤操作にしない

カテゴリ: `interaction`

対応予定 Story: `AnswerMouseDrag`（未実装）。元テスト: `keeps a mouse drag from swiping or clicking the back text`。

Given:

- 裏面にクリック操作を用意し、裏面スワイプは許可していない。

When:

- 左へマウスドラッグし、その終了に続く click を発生させる。

Then:

- 左スワイプも裏面のクリックも通知しない。

<a id="storybook-card-player-23"></a>

### STORYBOOK-CARD-PLAYER-23 未評価と FSRS 難易度を区別して表示する

カテゴリ: `render`

対応予定 Story: `FsrsMetadataContract`（未実装）。元テスト: [CardOverlay.spec.tsx](../../../../src/features/card-player/ui/CardOverlay.spec.tsx) :: `shows FSRS difficulty only after rating`。

Given:

- 実際の CardOverlay を詳細として表示する。FSRS 状態なしと、評価済み・難易度8の2条件を用意する。

When:

- 詳細を描画する。

Then:

- 未評価なら未学習を示す文を表示し、評価済みなら FSRS D:8 を表示する。
- 難易度の計算や回答による状態更新は確認しない。
