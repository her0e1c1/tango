# 設定の単体テスト仕様

## 目的

設定の既定値、部分更新、操作用 helper、保存と復元、不正・旧形式データの扱いを確認する。保存先にはテストごとのメモリストレージを使い、実際のブラウザ保存領域には依存しない。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-PREFERENCE-01](#unit-preference-01) | `read` | 学習操作の表示に既定値を持つ |
| [UNIT-PREFERENCE-02](#unit-preference-02) | `write` | 閲覧モードを切り替えて保存・復元できる |
| [UNIT-PREFERENCE-03](#unit-preference-03) | `write` | 編集リンクを非表示にして保存し、再表示できる |
| [UNIT-PREFERENCE-04](#unit-preference-04) | `write` | 一部の設定更新で別の項目を初期化しない |
| [UNIT-PREFERENCE-05](#unit-preference-05) | `write` | 言語だけを変更して保存できる |
| [UNIT-PREFERENCE-06](#unit-preference-06) | `write` | 範囲外の設定値を既定値に戻す |
| [UNIT-PREFERENCE-07](#unit-preference-07) | `write` | 公開 helper で設定を変更できる |
| [UNIT-PREFERENCE-08](#unit-preference-08) | `write` | 変更した設定を現在の保存形式へ書き出す |
| [UNIT-PREFERENCE-09](#unit-preference-09) | `write` | 同じ保存 version の追加項目は既定値で補う |
| [UNIT-PREFERENCE-10](#unit-preference-10) | `write` | 旧スワイプ設定を復元し独自設定を保持する |
| [UNIT-PREFERENCE-11](#unit-preference-11) | `write` | 非互換 version を移行せず既定値を使う |
| [UNIT-PREFERENCE-12](#unit-preference-12) | `write` | 壊れた保存データでは現在の既定値を使う |

## ケース詳細

<a id="unit-preference-01"></a>

### UNIT-PREFERENCE-01: 学習操作の表示に既定値を持つ

カテゴリ: `read`

対応テスト: [model/store.spec.ts][store] — `shows the study skip control by default` / [model/store.spec.ts][store] — `shows the study Help shortcut by default` / [model/store.spec.ts][store] — `keeps back text swipe overlays off by default`

**Given**: 利用者の設定変更を適用していない。

**When**: 学習操作の既定設定を参照する。

**Then**: スキップと Help は表示、裏面のスワイプ overlay は非表示である。

<a id="unit-preference-02"></a>

### UNIT-PREFERENCE-02: 閲覧モードを切り替えて保存・復元できる

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `persists view mode without changing other preferences`

**Given**: 既定設定、または一度切り替えて閲覧モードを有効にした設定がある。

**When**: 閲覧モードを切り替えて保存値から再読込する。

**Then**: 無効から有効、有効から無効へ切り替わり、再読込後もその値を保持する。他の設定は変更しない。

<a id="unit-preference-03"></a>

### UNIT-PREFERENCE-03: 編集リンクを非表示にして保存し、再表示できる

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `persists hiding and restoring the view edit link`

**Given**: 編集リンクは既定で表示されている。非表示状態からの再切り替えも対象とする。

**When**: 編集リンク表示を切り替える。非表示への切り替え後は保存値から再読込する。

**Then**: 非表示にした値が復元される。再び切り替えると表示になる。再表示後の再読込は既存テストでは未検証。

<a id="unit-preference-04"></a>

### UNIT-PREFERENCE-04: 一部の設定更新で別の項目を初期化しない

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `updates each preference group without resetting other settings`

**Given**: 既定設定から、サンプル読込無効、ダーク表示、間隔 `15`、詳細非表示、裏面 overlay 有効へ変更した状態がある。

**When**: スワイプボタン、再生操作、スキップを、それぞれ部分更新で非表示にする。

**Then**: 指定した操作表示だけが変更され、先に変更した各設定と、指定していない既定設定を保持する。

<a id="unit-preference-05"></a>

### UNIT-PREFERENCE-05: 言語だけを変更して保存できる

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `updates and persists the %s language without resetting other preferences`

**Given**: ダーク表示を有効にしている。

**When**: 言語を `system`、`en`、`ja` のいずれかへ更新する。

**Then**: 指定言語が現在値と保存値の両方に反映され、ダーク表示と他の設定を保持する。保存形式は `tango-config` の version `1` とする。

<a id="unit-preference-06"></a>

### UNIT-PREFERENCE-06: 範囲外の設定値を既定値に戻す

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `validates numeric ranges during updates`

**Given**: 既定設定がある。

**When**: 学習枚数上限 `101`、カード間隔 `-1`、裏面文字サイズ `-1` で更新する。

**Then**: それぞれ既定値の `10`、`60`、`0` になる。不正値のまま利用しない。

<a id="unit-preference-07"></a>

### UNIT-PREFERENCE-07: 公開 helper で設定を変更できる

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `updates preferences through the public helpers`

**Given**: 既定設定がある。

**When**: ダーク表示を有効にし、サンプル読込を無効、カード間隔を `15` にする。スワイプボタン、再生操作、詳細、Help、スキップの表示を helper で切り替える。

**Then**: 指定した表示操作は非表示になり、指定したダーク表示・サンプル読込・間隔も反映される。他の値は既定値を保持する。

<a id="unit-preference-08"></a>

### UNIT-PREFERENCE-08: 変更した設定を現在の保存形式へ書き出す

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `persists preference changes`

**Given**: 既定設定と空のメモリストレージがある。

**When**: サンプル読込を無効、ダーク表示を有効、詳細を非表示、裏面 overlay を有効に更新する。

**Then**: `tango-config` に version `1`、`state.preferences` として現在の設定一式を保存する。指定していない設定も保持される。

<a id="unit-preference-09"></a>

### UNIT-PREFERENCE-09: 同じ保存 version の追加項目は既定値で補う

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `hydrates version 1 preferences with defaults for additive fields`

**Given**: version `1` の保存データに既存の変更済み設定はあるが、言語と追加の操作表示項目が存在しない。

**When**: 保存データを復元する。

**Then**: 言語は `system`、閲覧モードは無効、Help・編集リンク・スキップは表示、裏面 overlay は非表示で補う。サンプル読込、ダーク表示、選択タグ、スワイプボタン表示など既存の変更値を保持する。

<a id="unit-preference-10"></a>

### UNIT-PREFERENCE-10: 旧スワイプ設定を復元し独自設定を保持する

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `hydrates the version-1 mapping with up=$up without resetting other preferences`

**Given**: version `1` の保存データで、下は `GoToNextCardNotMastered`、左は `GoToPrevCard`、右は `GoToNextCard` である。上は次の値のいずれかとし、日本語・ダーク表示・間隔 `15`・スワイプボタン非表示も保存済みである。

**When**: 保存データを復元する。

**Then**: 旧既定の組み合わせは4方向すべてを現行評価へ変換する。上が利用者設定の場合は有効な操作を保持し、廃止された下・左だけを現行既定値へ戻す。言語や外観など他の設定は保持する。

| 保存済みの上 | 復元後の上 | 復元後の下 | 復元後の左 | 復元後の右 |
| --- | --- | --- | --- | --- |
| `GoToNextCardMastered` | `RateEasy` | `RateHard` | `RateAgain` | `RateGood` |
| `GoBack` | `GoBack` | `RateHard` | `RateAgain` | `GoToNextCard` |
| `RateHard` | `RateHard` | `RateHard` | `RateAgain` | `GoToNextCard` |

<a id="unit-preference-11"></a>

### UNIT-PREFERENCE-11: 非互換 version を移行せず既定値を使う

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `discards version 2 preferences without migration`

**Given**: 現在の設定は既定値であり、異なる値が入った version `2` の保存データがある。

**When**: 保存データを復元する。

**Then**: version `2` の値を採用せず、現在の既定設定のままになる。

<a id="unit-preference-12"></a>

### UNIT-PREFERENCE-12: 壊れた保存データでは現在の既定値を使う

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `uses current defaults for %s`

**Given**: 現在の設定は既定値である。保存値が JSON でない、`state.preferences` が文字列である、または `state.preferences` ではなく旧 `state.config` がある。

**When**: 各保存値から設定を復元する。

**Then**: 現在の既定設定を使う。

## 検証範囲の注意

ブラウザの再起動、保存容量超過、端末間同期、画面への反映は対象外。数値検証のケースは記載した不正値を対象とし、許容範囲の全境界を網羅したものではない。

[store]: ../../src/entities/preference/model/store.spec.ts
