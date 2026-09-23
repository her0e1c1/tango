# Card Player Storybook 結合テスト仕様書

## 目的

読む操作と学習操作を区別し、誤操作の抑止、ツールバー、裏面の操作・スクロールと詳細表示を確認する。

## 検証境界

CardPlayer と実際の子 UI、CardOverlay、Story 側の表示状態と公開 callback を組み合わせる。学習進捗・回答記録・設定の実保存、FSRS 計算と実遷移は対象外。

書式・実行前提は [README](./README.md)、再生・スキップ・ヘルプの契約は [study-controls](./study-controls.md) を参照する。

この仕様は [CardPlayer.spec.tsx](../../../../src/features/card-player/ui/CardPlayer.spec.tsx) と [CardOverlay.spec.tsx](../../../../src/features/card-player/ui/CardOverlay.spec.tsx) の UI 契約を記録する。01〜04、06、08、10〜23 は未実装で、05・07 は既存 play の一部に追加アサーションが必要で、09 は既存 play と対応する。いずれも今回のテスト実行成功を示すものではない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-PLAYER-01 | interaction | 正常系 | [読書ジェスチャーを学習操作にしない](#storybook-card-player-01) |
| STORYBOOK-CARD-PLAYER-02 | interaction | 正常系 | [文字選択中に閲覧を終了しない](#storybook-card-player-02) |
| STORYBOOK-CARD-PLAYER-03 | interaction | 正常系 | [Space とタップを区別する](#storybook-card-player-03) |
| STORYBOOK-CARD-PLAYER-04 | interaction | 正常系 | [閲覧設定で裏面の許可済み操作を変えない](#storybook-card-player-04) |
| STORYBOOK-CARD-PLAYER-05 | interaction | 正常系 | [編集リンクの表示を切り替える](#storybook-card-player-05) |
| STORYBOOK-CARD-PLAYER-06 | render | 正常系 | [裏面と編集非対応画面に編集操作を出さない](#storybook-card-player-06) |
| STORYBOOK-CARD-PLAYER-07 | render | 正常系 | [裏面では解答に集中できる表示にする](#storybook-card-player-07) |
| STORYBOOK-CARD-PLAYER-08 | interaction | 正常系 | [端の操作と解答クリックを分離する](#storybook-card-player-08) |
| STORYBOOK-CARD-PLAYER-09 | interaction | 正常系 | [端のホイール入力をスクロールへ渡す](#storybook-card-player-09) |
| STORYBOOK-CARD-PLAYER-10 | interaction | 正常系 | [操作一覧から各操作を要求する](#storybook-card-player-10) |
| STORYBOOK-CARD-PLAYER-11 | interaction | 正常系 | [ヘルプの再表示操作を失わない](#storybook-card-player-11) |
| STORYBOOK-CARD-PLAYER-12 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](#storybook-card-player-12) |
| STORYBOOK-CARD-PLAYER-13 | interaction | 正常系 | [閲覧モードとボタン表示を区別する](#storybook-card-player-13) |
| STORYBOOK-CARD-PLAYER-14 | interaction | 正常系 | [表示設定に従ってショートカットを組み合わせる](#storybook-card-player-14) |
| STORYBOOK-CARD-PLAYER-15 | interaction | 正常系 | [詳細表示をまとめて切り替える](#storybook-card-player-15) |
| STORYBOOK-CARD-PLAYER-16 | interaction | 正常系 | [再生設定が使えない理由を確認できる](#storybook-card-player-16) |
| STORYBOOK-CARD-PLAYER-17 | render | 正常系 | [選択した下部操作だけを表示する](#storybook-card-player-17) |
| STORYBOOK-CARD-PLAYER-18 | interaction | 正常系 | [未許可の裏面スワイプを無視する](#storybook-card-player-18) |
| STORYBOOK-CARD-PLAYER-19 | interaction | 正常系 | [表面スワイプをボタン表示と独立して扱う](#storybook-card-player-19) |
| STORYBOOK-CARD-PLAYER-20 | interaction | 正常系 | [ドラッグをクリックとして重複処理しない](#storybook-card-player-20) |
| STORYBOOK-CARD-PLAYER-21 | interaction | 正常系 | [中・右ボタンのドラッグを無視する](#storybook-card-player-21) |
| STORYBOOK-CARD-PLAYER-22 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](#storybook-card-player-22) |
| STORYBOOK-CARD-PLAYER-23 | render | 正常系 | [未評価と FSRS 難易度を区別する](#storybook-card-player-23) |

<a id="storybook-card-player-01"></a>

### STORYBOOK-CARD-PLAYER-01 [TODO] 読書ジェスチャーを学習操作にしない

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モードで長い表面を表示し、上・左スワイプ、閲覧切替の callback を渡す。明示的な左ボタンは有効にする。

When:

- 上下・左右へタッチで動かし、マウスでもドラッグしてクリックする。その後 Swipe left ボタンを押す。

Then:

- 読書ジェスチャーと直後の click はスワイプ・閲覧切替を通知しない。明示的な左ボタンだけが callback を一度通知する。

<a id="storybook-card-player-02"></a>

### STORYBOOK-CARD-PLAYER-02 [TODO] 文字選択中に閲覧を終了しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モードの表面を実際の Selection API で選択している。

When:

- 選択中にクリックし、選択を解除してからもう一度クリックする。

Then:

- 選択中は閲覧切替を通知せず、解除後のクリックで初めて通知する。

<a id="storybook-card-player-03"></a>

### STORYBOOK-CARD-PLAYER-03 [TODO] Space とタップを区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モードで Card front text の領域にフォーカスしている。

When:

- Space を押して離し、その後テキストをタップする。

Then:

- Space は閲覧切替を通知せず、タップで一度通知する。Space による実スクロール量は元の Vitest では確認していない。

<a id="storybook-card-player-04"></a>

### STORYBOOK-CARD-PLAYER-04 [TODO] 閲覧設定で裏面の許可済み操作を変えない

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モード設定は有効で、裏面を表示し、裏面の横スワイプを許可する。

When:

- 解答をクリックし、左へスワイプする。

Then:

- 解答クリックと左スワイプの callback をそれぞれ一度通知する。

<a id="storybook-card-player-05"></a>

### STORYBOOK-CARD-PLAYER-05 [TODO] 編集リンクの表示を切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 編集リンクを表示した表面を、通常幅・iPhone 5・iPhone X で用意する。表示切替を Story 側の状態に反映する。

When:

- 操作一覧を開いて Edit link を切り替え、Escape で閉じる。同じ手順で再表示する。

Then:

- 既存 play: リンクの初期表示・非表示・再表示と、操作中のボタン同士が重ならないことを確認する。
- 要追加: 一覧を開いている間はリンク本体を表示せず、切替後の pressed は false になる。Escape で Open card actions にフォーカスを戻す。

<a id="storybook-card-player-06"></a>

### STORYBOOK-CARD-PLAYER-06 [TODO] 裏面と編集非対応画面に編集操作を出さない

カテゴリ: `render`

区分: 正常系

Given:

- 編集リンクを持つ裏面と、編集リンクを提供しない学習画面を別条件にする。

When:

- 裏面を描画する。編集非対応の画面では操作一覧を開く。

Then:

- 裏面には編集リンクがなく、編集非対応の一覧には Edit link の切替も追加しない。

<a id="storybook-card-player-07"></a>

### STORYBOOK-CARD-PLAYER-07 [TODO] 裏面では解答に集中できる表示にする

カテゴリ: `render`

区分: 正常系

Given:

- 通常幅と iPhone X で裏面を表示する。表面・詳細・再生・スワイプの入力も用意し、裏面の端の操作は指定しない。

When:

- 裏面を描画する。

Then:

- 既存 play: 解答が見え、スワイプボタンと Card actions がないことを確認する。
- 要追加: Study answer はフォーカス可能で、表面・詳細・戻る操作・操作一覧の開閉・再生操作も表示しない。

<a id="storybook-card-player-08"></a>

### STORYBOOK-CARD-PLAYER-08 [TODO] 端の操作と解答クリックを分離する

カテゴリ: `interaction`

区分: 正常系

Given:

- クリック可能な解答と左右の端の操作を表示する。

When:

- Swipe left / Swipe right を押し、その後表面へ切り替えてスワイプボタンを非表示にする。

Then:

- 左右の callback だけを通知し、解答クリックは通知しない。上下の端の操作は表示しない。
- 表面へ切り替えると裏面領域と左右の端の操作を表示しない。既存 play の左操作の確認だけでは、右操作とクリック分離は検証済みにならない。

<a id="storybook-card-player-09"></a>

### STORYBOOK-CARD-PLAYER-09 [TODO] 端のホイール入力をスクロールへ渡す

カテゴリ: `interaction`

区分: 正常系

Given:

- 表示領域より長い解答に左右の端の操作を表示する。

When:

- 左端で下向きの wheel を発生させ、その後左端をクリックする。

Then:

- 解答の scrollTop が増え、端のボタンの表示位置は変わらない。
- 左 callback は最後のクリックによる一度だけで、wheel を操作要求にしない。Story と元 Vitest の入力量は異なるが、同じスクロール契約を確認する。

<a id="storybook-card-player-10"></a>

### STORYBOOK-CARD-PLAYER-10 [TODO] 操作一覧から各操作を要求する

カテゴリ: `interaction`

区分: 正常系

Given:

- ヘルプ、詳細、スワイプ、再生、スキップを有効にし、操作一覧は閉じている。

When:

- 一覧を開き、戻る・スワイプ・再生・スキップ・詳細の各操作を押し、Escape で閉じる。

Then:

- expanded / pressed と名前で開閉・表示状態を確認でき、各 callback を通知する。
- 一覧内ではヘルプを開くボタンの代わりに Help button の表示切替を操作できる。閉じるとヘルプを再表示し、Open card actions にフォーカスを戻す。

<a id="storybook-card-player-11"></a>

### STORYBOOK-CARD-PLAYER-11 [TODO] ヘルプの再表示操作を失わない

カテゴリ: `interaction`

区分: 正常系

Given:

- 操作一覧を開き、ヘルプ表示が有効である。

When:

- 表示設定を無効に変更して Help button を押す。

Then:

- 切替ボタンは消えず、pressed は false、説明は Show help button になる。再表示を要求する callback を通知できる。

<a id="storybook-card-player-12"></a>

### STORYBOOK-CARD-PLAYER-12 [TODO] 閲覧モードの状態をボタンで示す

カテゴリ: `interaction`

区分: 正常系

Given:

- 一覧は閉じ、閲覧モードは無効である。変更を Story 側に反映する。

When:

- View mode を押して有効にする。

Then:

- 閲覧切替 callback を通知し、pressed は false から true、説明は Enter view mode から Exit view mode に変わる。

<a id="storybook-card-player-13"></a>

### STORYBOOK-CARD-PLAYER-13 [TODO] 閲覧モードとボタン表示を区別する

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モードと、そのボタン表示が有効である。

When:

- 一覧内で View mode の表示を無効にして閉じ、再度開いて表示を有効にする。

Then:

- 一覧内では閲覧そのものではなく表示設定の callback を通知する。非表示でも一覧から復帰でき、再表示後は Exit view mode を示す。
- Escape で一覧を閉じ、開くボタンへフォーカスを戻す。

<a id="storybook-card-player-14"></a>

### STORYBOOK-CARD-PLAYER-14 [TODO] 表示設定に従ってショートカットを組み合わせる

カテゴリ: `interaction`

区分: 正常系

Given:

- ヘルプ・閲覧・編集リンクの順に、true/false の組合せ TTT、FTT、TTF、FTF、TFT、FFF の6条件を用意する。

When:

- 通常表示から操作一覧を開き、Escape で閉じる。

Then:

- 通常時は Open card actions に続き、有効なヘルプ・閲覧の順でボタンを表示し、編集リンクも設定に従う。
- 一覧内では表示切替を操作でき、リンク本体は表示しない。閉じると元の組合せへ戻り、開くボタンへフォーカスが戻る。

<a id="storybook-card-player-15"></a>

### STORYBOOK-CARD-PLAYER-15 [TODO] 詳細表示をまとめて切り替える

カテゴリ: `interaction`

区分: 正常系

Given:

- 詳細を表示した表面で操作一覧を開いている。

When:

- 詳細表示を無効、有効の順に入力へ反映する。

Then:

- 詳細全体が非表示・再表示になり、Card details の pressed 状態と表示・非表示の説明も一致する。設定の実保存は確認しない。

<a id="storybook-card-player-16"></a>

### STORYBOOK-CARD-PLAYER-16 [TODO] 再生設定が使えない理由を確認できる

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔0のため再生操作は利用不可で、再生・スワイプの表示設定も無効である。

When:

- 一覧を開き、Playback controls にフォーカスして押す。

Then:

- スワイプ切替は pressed が false で再表示の説明を持つ。
- 再生切替はフォーカスできるが aria-disabled が true で、間隔0の理由を title と読み上げ説明で示す。押しても切替 callback を通知しない。

<a id="storybook-card-player-17"></a>

### STORYBOOK-CARD-PLAYER-17 [TODO] 選択した下部操作だけを表示する

カテゴリ: `render`

区分: 正常系

Given:

- 再生とスワイプを用意し、スワイプだけ非表示、再生だけ非表示を別条件にする。

When:

- 表面を描画する。

Then:

- 前者は Play を表示して Swipe left を隠し、後者はその逆になる。既存 play の中央配置チェックだけではこの表示契約を確認したことにはならない。

<a id="storybook-card-player-18"></a>

### STORYBOOK-CARD-PLAYER-18 [TODO] 未許可の裏面スワイプを無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- 裏面の横スワイプを許可せず、裏面を表示する。

When:

- 左と上へスワイプする。

Then:

- 左・上の callback をどちらも通知しない。

<a id="storybook-card-player-19"></a>

### STORYBOOK-CARD-PLAYER-19 [TODO] 表面スワイプをボタン表示と独立して扱う

カテゴリ: `interaction`

区分: 正常系

Given:

- 閲覧モードではない表面を表示し、スワイプボタンを隠している。

When:

- 上へスワイプする。

Then:

- 上方向の callback が一度通知される。

<a id="storybook-card-player-20"></a>

### STORYBOOK-CARD-PLAYER-20 [TODO] ドラッグをクリックとして重複処理しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 表面にクリックと上スワイプの操作を用意する。

When:

- 主ボタンで上へドラッグし、終了に続く click を発生させる。

Then:

- 上スワイプだけを一度通知し、表面クリックは通知しない。

<a id="storybook-card-player-21"></a>

### STORYBOOK-CARD-PLAYER-21 [TODO] 中・右ボタンのドラッグを無視する

カテゴリ: `interaction`

区分: 正常系

Given:

- 上方向の操作が可能な表面を表示する。

When:

- 中ボタンと右ボタンで上へドラッグする。

Then:

- どちらも上方向の callback を通知しない。

<a id="storybook-card-player-22"></a>

### STORYBOOK-CARD-PLAYER-22 [TODO] 裏面のドラッグ後に誤操作しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 裏面にクリック操作を用意し、裏面スワイプは許可しない。

When:

- 左へマウスドラッグし、終了に続く click を発生させる。

Then:

- 左スワイプも裏面クリックも通知しない。

<a id="storybook-card-player-23"></a>

### STORYBOOK-CARD-PLAYER-23 [TODO] 未評価と FSRS 難易度を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 実際の CardOverlay を詳細として使い、FSRS 状態なしと、評価済み・難易度8を別条件にする。

When:

- 詳細を描画する。

Then:

- 未評価なら未学習を示す表示、評価済みなら FSRS D:8 を表示する。難易度計算や回答による更新は確認しない。
