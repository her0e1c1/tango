# Card 表示の単体テスト仕様

## 目的

Card の表示 component に渡された本文・カテゴリ・表示モードが描画と操作通知に反映されることを確認する。学習画面全体や保存処理ではなく、component の props・描画・公開 callback を境界とする。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-CARD-VIEW-01](#unit-card-view-01) | `read` | 通常の表面は本文を表示してクリック・Enter を通知する |
| [UNIT-CARD-VIEW-02](#unit-card-view-02) | `read` | 閲覧モードの表面は Space による反転操作を提供しない |
| [UNIT-CARD-VIEW-03](#unit-card-view-03) | `read` | 数式・コードの本文を失わずに描画する |
| [UNIT-CARD-VIEW-04](#unit-card-view-04) | `read` | 裏面の本文クリックを通知する |
| [UNIT-CARD-VIEW-05](#unit-card-view-05) | `read` | 回答表示に指定した言語とテーマを反映する |
| [UNIT-CARD-VIEW-06](#unit-card-view-06) | `read` | bare 表示は外側の回答 region を作らず操作を通知する |

## ケース詳細

<a id="unit-card-view-01"></a>

### UNIT-CARD-VIEW-01: 通常の表面は本文を表示してクリック・Enter を通知する

カテゴリ: `read`

対応テスト: [ui/FrontText.spec.tsx][front] — `preserves content and click interaction` / [ui/FrontText.spec.tsx][front] — `activates FrontText with Enter`

**Given**: 通常モードの表面に、長い英字を含む本文または `Front` と操作通知先が渡されている。

**When**: 本文を表示し、クリックまたは Enter で操作する。

**Then**: 本文は見える状態で保持され、操作通知先が呼ばれる。Enter は `Front` の名前を持つ button に対して受け付ける。

<a id="unit-card-view-02"></a>

### UNIT-CARD-VIEW-02: 閲覧モードの表面は Space による反転操作を提供しない

カテゴリ: `read`

対応テスト: [ui/FrontText.spec.tsx][front] — `renders reading content without a Space-activated flip button`

**Given**: 閲覧モードが有効で、表の本文 `Reading front` と操作通知先が渡されている。

**When**: 本文を表示して Space の押下・解放を行う。

**Then**: 本文は見えるが button は存在せず、操作通知先は呼ばれない。

<a id="unit-card-view-03"></a>

### UNIT-CARD-VIEW-03: 数式・コードの本文を失わずに描画する

カテゴリ: `read`

対応テスト: [ui/FrontText.spec.tsx][front] — `renders math content` / [ui/BackText.spec.tsx][back] — `preserves code and math rendering`

**Given**: 表に数式 `$x^2$`、裏に TypeScript の `const value = 1` または数式 `$x^2$` が渡され、それぞれ対応するカテゴリ・コード表示が指定されている。

**When**: 各 component を描画する。

**Then**: 表と裏の数式では `x^2` を取得でき、裏のコードでは `const value = 1` の内容が保持される。色や組版の正しさまでの検証ではない。

<a id="unit-card-view-04"></a>

### UNIT-CARD-VIEW-04: 裏面の本文クリックを通知する

カテゴリ: `read`

対応テスト: [ui/BackText.spec.tsx][back] — `preserves plain text and click behavior`

**Given**: 裏面に長い英字を含むプレーンテキストと操作通知先が渡されている。

**When**: 本文をクリックする。

**Then**: 本文を取得でき、操作通知先が呼ばれる。

<a id="unit-card-view-05"></a>

### UNIT-CARD-VIEW-05: 回答表示に指定した言語とテーマを反映する

カテゴリ: `read`

対応テスト: [ui/CardView.spec.tsx][view] — `renders prepared answer content`

**Given**: 回答本文 `const answer = 42;`、カテゴリ `typescript`、コード表示、ダーク表示が指定されている。

**When**: CardView を描画する。

**Then**: 本文が保持され、言語 `typescript` とテーマ `dark` が描画に渡される。回答内容はアクセシブル名 `Card answer` の region 内に表示される。

<a id="unit-card-view-06"></a>

### UNIT-CARD-VIEW-06: bare 表示は外側の回答 region を作らず操作を通知する

カテゴリ: `read`

対応テスト: [ui/CardView.spec.tsx][view] — `supports the bare study layout and click behavior`

**Given**: CardView に本文 `Card answer`、`bare` variant、操作通知先が渡されている。

**When**: 本文をクリックする。

**Then**: 本文は取得できるが外側の `Card answer` region は存在せず、操作通知先が呼ばれる。

## 検証範囲の注意

ブラウザ実機でのレイアウト、数式・コードの見た目、実際の反転や学習進行は対象外。クリック callback の通知だけから、保存・遷移・反転が完了したとは判断しない。Storybook play の結合契約は別に管理する。

[front]: ../../../src/entities/card/ui/FrontText.spec.tsx
[back]: ../../../src/entities/card/ui/BackText.spec.tsx
[view]: ../../../src/entities/card/ui/CardView.spec.tsx
