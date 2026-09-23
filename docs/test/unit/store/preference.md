# Preference Store 単体テスト仕様書

## 目的

設定の初期利用、部分変更、操作による切り替え、再起動後の復元、および既存設定を失わない補完・互換復元を確認する。画面への描画、ブラウザーの Storage 実装、保存 JSON の内部構造は判定対象にしない。

関連テスト: [`store.spec.ts`](../../../../src/entities/preference/model/store.spec.ts)

関連 E2E: [STUDY-CONTROLS-09](../../e2e/study-controls.md#study-controls-09)、[SETTINGS-06](../../e2e/settings.md#settings-06)、[NAVIGATION-14](../../e2e/navigation.md#navigation-14)

対応状況は既存テストとの静的な照合結果であり、テストの実行結果ではない。共通の検証境界と対応状況の意味は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| UNIT-STORE-PREF-01 | initial | 正常系 | [保存設定がない初回利用では標準の設定を提供する](#unit-store-pref-01) |
| UNIT-STORE-PREF-02 | state-change | 正常系 | [一部の設定を変更しても未指定の設定を維持する](#unit-store-pref-02) |
| UNIT-STORE-PREF-03 | state-change | 正常系 | [切り替え操作は対象設定だけをオン・オフする](#unit-store-pref-03) |
| UNIT-STORE-PREF-04 | persistence | 正常系 | [変更した設定を再起動後も利用できる](#unit-store-pref-04) |
| UNIT-STORE-PREF-05 | validation | 正常系 / 異常系 | [数値設定の境界を受け付け、不正値だけを既定値へ戻す](#unit-store-pref-05) |
| UNIT-STORE-PREF-06 | persistence | 正常系 / 異常系 | [互換性のある保存設定は不足・不正な項目だけを補完する](#unit-store-pref-06) |
| UNIT-STORE-PREF-07 | compatibility | 正常系 | [旧標準スワイプ配置を更新し、利用者の有効な割り当ては維持する](#unit-store-pref-07) |
| UNIT-STORE-PREF-08 | persistence | 異常系 | [読み込めない保存設定でも初期設定で利用を開始できる](#unit-store-pref-08) |
| UNIT-STORE-PREF-09 | state-change | 正常系 | [確定したタグ選択は入力元の後編集で変わらない](#unit-store-pref-09) |

<a id="unit-store-pref-01"></a>

### UNIT-STORE-PREF-01 保存設定がない初回利用では標準の設定を提供する

カテゴリ: `initial`

区分: 正常系

対応テスト: `shows the study skip control by default`、`keeps back text swipe overlays off by default`、`shows the study Help shortcut by default`（要補完：既存テストは定数の確認のみ）。

Given:

保存設定が存在しない新しい実行環境である。期待する設定を事前に書き込まない。

When:

設定モデルを初期化して現在の設定を取得する。

Then:

言語は system、ダークモードと View Mode はオフ、学習枚数上限は 10、カード間隔は 60、選択タグは空である。Help・編集リンク・スキップは表示する設定で、裏面テキストのスワイプオーバーレイは表示しない設定である。スワイプの上・下・左・右にはそれぞれ Easy・Hard・Again・Good が割り当てられる。

<a id="unit-store-pref-02"></a>

### UNIT-STORE-PREF-02 一部の設定を変更しても未指定の設定を維持する

カテゴリ: `state-change`

区分: 正常系

対応テスト: `updates each preference group without resetting other settings`、`updates and persists the %s language without resetting other preferences`（要補完：タグの置換・空配列、同一グループ内の非既定値の保持）。

Given:

言語 en、ダークモードオン、学習枚数上限 25、カード間隔 15、選択タグ typescript、Help 非表示に変更済みである。

When:

次の部分変更を、それぞれ同じ変更前の状態から行う。

| 変更対象 | 指定する内容 |
| --- | --- |
| 言語 | system、en、ja の各値 |
| 外観 | 裏面文字サイズを 2 にする |
| 学習 | 学習枚数上限を 20 にする |
| 操作表示 | 編集リンクを非表示にする |
| 選択タグ | go のみにする、または空にする |

Then:

指定した設定だけが変更され、同一グループ内を含めて未指定の設定は変更前の値を保つ。タグは追記ではなく選択した集合に置き換わり、空の指定ではすべて解除される。

<a id="unit-store-pref-03"></a>

### UNIT-STORE-PREF-03 切り替え操作は対象設定だけをオン・オフする

カテゴリ: `state-change`

区分: 正常系

対応テスト: `persists view mode without changing other preferences`、`persists hiding and restoring the view edit link`、`updates preferences through the public helpers`（要補完：各切り替えの両方向と非既定の他設定の保持）。

Given:

対象設定がオンの場合とオフの場合を用意し、言語やカード間隔などの対象外の設定も既定値から変更しておく。対象は View Mode、編集リンク、Help、スキップ、スワイプボタン、再生コントロール、カード詳細である。

When:

各対象の切り替え操作を 1 回行う。ダークモードについては切り替えではなく、オン・オフの各値を指定する設定操作を行う。

Then:

切り替え対象は元と反対の値になり、ダークモードは指定値になる。対象外の設定は変更されない。

<a id="unit-store-pref-04"></a>

### UNIT-STORE-PREF-04 変更した設定を再起動後も利用できる

カテゴリ: `persistence`

区分: 正常系

対応テスト: `persists preference changes`、`persists view mode without changing other preferences`、`persists hiding and restoring the view edit link`、`updates and persists the %s language without resetting other preferences`（要補完：保存前のメモリ状態を引き継がない復元）。

Given:

言語、外観、学習、操作表示を既定値から変更して保存している。代表値は言語 ja、ダークモードオン、学習枚数上限 25、カード間隔 15、選択タグ go、View Mode オン、編集リンク非表示とし、言語は system と en も確認する。

When:

保存した内容だけを引き継いだ新しい実行環境で設定を読み込む。

Then:

変更した設定と未変更の設定の値が再起動前に一致する。

<a id="unit-store-pref-05"></a>

### UNIT-STORE-PREF-05 数値設定の境界を受け付け、不正値だけを既定値へ戻す

カテゴリ: `validation`

区分: 正常系 / 異常系

対応テスト: `validates numeric ranges during updates`（要補完：既存値が非既定の場合、有効な境界値、小数、同時に指定した正常値の保持）。

Given:

学習枚数上限 25、カード間隔 15、裏面文字サイズ 2、ダークモードオンである。各入力を独立して検証する。

| 設定 | そのまま受け付ける値 | 不正として扱う値 | 不正時の値 |
| --- | --- | --- | --- |
| 学習枚数上限 | 0、100 | -1、101、1.5 | 10 |
| カード間隔 | 0、60、0.5 | -1、61 | 60 |
| 裏面文字サイズ | 0、1.5 | -1 | 0 |

When:

表の値と、正常な言語設定 ja を同時に設定する。

Then:

有効な入力はその値になり、不正な入力は表の既定値になる。不正値は変更前の値を維持する「無視」でも、上限・下限への丸めでもない。正常な言語変更は反映され、未指定のダークモードはオンのままである。

<a id="unit-store-pref-06"></a>

### UNIT-STORE-PREF-06 互換性のある保存設定は不足・不正な項目だけを補完する

カテゴリ: `persistence`

区分: 正常系 / 異常系

対応テスト: `hydrates version 1 preferences with defaults for additive fields`（要補完：不正な単一項目と欠落した設定グループの補完）。

Given:

保存先 tango-config にバージョン 1 の設定がある。各行で不足・不正にする項目以外は、ダークモードオン、選択タグ typescript、スワイプボタン非表示などの正常な変更済み設定を保存している。次の条件を独立して用意する。

| 保存設定の状態 | 補完される内容 |
| --- | --- |
| 言語・View Mode・Help・編集リンク・スキップ・裏面オーバーレイの項目がない | 各項目の標準設定 |
| 学習枚数上限だけが 101 | 学習枚数上限 10 |
| 言語だけが未対応の値 | 言語 system |
| 外観設定のグループがない | ダークモード・全画面・スワイプ時フィードバックはオフ、裏面文字サイズは 0、カード変更時に裏面を隠す設定はオン |

When:

新しい実行環境で保存設定を読み込む。

Then:

不足・不正な項目だけが表の値で補完され、それ以外の正常な保存設定は維持される。1 項目の問題を理由に設定全体を初期化しない。

<a id="unit-store-pref-07"></a>

### UNIT-STORE-PREF-07 旧標準スワイプ配置を更新し、利用者の有効な割り当ては維持する

カテゴリ: `compatibility`

区分: 正常系

対応テスト: `hydrates the version-1 mapping with up=$up without resetting other preferences`（既存対応：下記 3 行）。

Given:

保存先 tango-config にバージョン 1 の設定があり、言語 ja、ダークモードオン、カード間隔 15、スワイプボタン非表示も保存されている。各行を独立して用意する。

| 保存された上・下・左・右 | 復元後の上・下・左・右 |
| --- | --- |
| GoToNextCardMastered / GoToNextCardNotMastered / GoToPrevCard / GoToNextCard | RateEasy / RateHard / RateAgain / RateGood |
| GoBack / GoToNextCardNotMastered / GoToPrevCard / GoToNextCard | GoBack / RateHard / RateAgain / GoToNextCard |
| RateHard / GoToNextCardNotMastered / GoToPrevCard / GoToNextCard | RateHard / RateHard / RateAgain / GoToNextCard |

When:

保存設定を読み込む。

Then:

割り当ては表に一致する。旧標準の 4 方向がそろう場合だけ新標準へ一括更新し、カスタム配置では廃止された割り当てだけを既定値で補う。有効な割り当てと言語・外観・学習設定・操作表示は維持される。

<a id="unit-store-pref-08"></a>

### UNIT-STORE-PREF-08 読み込めない保存設定でも初期設定で利用を開始できる

カテゴリ: `persistence`

区分: 異常系

対応テスト: `discards version 2 preferences without migration`、`uses current defaults for %s`（既存対応：下記 4 条件で初期設定に復帰すること）。

Given:

新しい実行環境であり、保存先 tango-config が次のいずれかになっている。各条件を独立して検証する。

- 未対応のバージョン 2 として保存されている。
- JSON として読めない。
- 設定全体が文字列などの互換性のない値である。
- 設定として認識できない形式で保存されている。

When:

保存設定を読み込む。

Then:

現在の初期設定を取得でき、読み込みの失敗が利用側へ例外として伝播しない。これは起動時の復帰を保証するケースであり、読み込み前からある変更済みの設定を必ず初期化することや、保存データの物理削除は保証しない。

<a id="unit-store-pref-09"></a>

### UNIT-STORE-PREF-09 確定したタグ選択は入力元の後編集で変わらない

カテゴリ: `state-change`

区分: 正常系

対応テスト: 未検証：参照した既存テストには入力元配列の後編集の検証がない。

Given:

入力元で作ったタグ一覧 go、typescript を使って設定を確定済みである。

When:

設定変更操作を行わずに、入力元のタグ一覧へ rust を追加する、またはタグを取り除く。各条件を独立して検証する。

Then:

現在の選択タグは確定した go、typescript のままである。
