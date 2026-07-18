# 設定ページモダン化デザイン

## 背景

現行の設定ページは、Account、Layout、Study、Autoplay、Metadataの5セクションに全機能を表示している。機能は揃っているが、ページ全体の大きな外枠、Accountだけのカード表現、残りの区切り線ベースの表現が混在し、情報階層が不均一である。

また、設定名だけでは効果を理解しにくい項目があり、SwitchやSliderの視覚的な近さに比べて、ラベルと入力要素のアクセシブルな関連付けが弱い。Version、GitHub Access Token、User IDのような低頻度の技術情報も常時表示され、日常的な設定を探す際のノイズになっている。

## 目的

- 設定を目的別に整理し、必要な項目を素早く見つけられるようにする。
- 既存のCalm Focusトークンとデッキ一覧の方向性に合う、統一されたモダンな見た目にする。
- スマートフォンでもラベル、説明、現在値、操作を無理なく読み比べられるようにする。
- 現行の設定値、自動保存、認証操作、ダークモードを維持する。
- 入力ラベル、フォーカス、タッチ領域を改善する。

## 非目標

- 設定項目、保存形式、初期値、認証フローを変更しない。
- 新しい設定、検索、カテゴリナビゲーション、保存ボタンを追加しない。
- 設定以外のページの情報設計を変更しない。
- GitHub Access Tokenの保存方式や表示方式を変更しない。
- Calm Focusのグローバルトークンを再設計しない。

## 検討した案

### A. 統一リスト（採用）

1列のカード群に、セクション見出しと設定行を並べる。読む順序が画面幅で変わらず、説明、現在値、操作の対応を追いやすい。スマートフォンに最も適し、現在の項目数にも過不足がない。

### B. ダッシュボード

デスクトップではセクションカードを2列に並べる。全体を一度に見渡しやすいが、モバイルで1列へ戻すと読む順序と密度が変わり、設定間の比較もしにくい。

### C. カテゴリナビゲーション

左側または上部のカテゴリから表示内容を切り替える。項目が大幅に増えた場合には有効だが、現在の項目数では移動操作と状態管理が過剰である。

## 採用するページ構成

ページは1列の統一リストとし、Account、Appearance、Study、Advancedの4グループに整理する。

```text
Settings                    Changes are saved automatically

┌ Account ─────────────────────────────────────┐
│ avatar  Settings User · Google account  Log out │
└───────────────────────────────────────────────┘

┌ Appearance · Navigation and visual feedback ┐
│ Show header             description       [on] │
│ Show study buttons      description       [on] │
│ Show swipe feedback     description       [on] │
│ Dark mode               description      [off] │
└───────────────────────────────────────────────┘

┌ Study · Card order, session size, autoplay ─┐
│ Shuffle cards           description       [on] │
│ Maximum cards           description   ───  24  │
│ Use card interval       description       [on] │
│ Start autoplay          description      [off] │
│ Autoplay interval       description   ───  7s  │
└───────────────────────────────────────────────┘

┌ Advanced · Version, token, and user ID ── ︾ ┐
└───────────────────────────────────────────────┘
```

### ページヘッダー

- 見出しは`Settings`を維持し、デッキ一覧と揃うtitleスケールへ下げる。
- `Changes are saved automatically`を補助文として表示し、保存ボタンがない理由を明示する。
- `Layout`がすでに提供するsurface内に、設定ページ専用の大きな入れ子surfaceを作らない。
- 読み幅は既存の`max-w-reading`を維持する。

### Account

- ログイン済みの場合は表示名、Google accountであること、Logoutを1行にまとめる。
- ログアウト時はGoogle Loginの説明とLoginを同じ構造で表示する。
- 長い表示名は操作を押し出さず、本文側で折り返す。
- UIDは日常的なアカウント情報から外し、Advancedへ移す。

### Appearance

現行のLayoutを、目的が分かりやすいAppearanceへ変更する。次の4項目を表示する。

- Show header
- Show study buttons（現行Show Button List）
- Show swipe feedback
- Dark mode

各行は設定名、短い説明、Switchの順で構成する。設定キーや保存値は変更しない。

### Study

現行のStudyとAutoplayを統合する。学習中のカード順、セッション量、再生速度を一つの文脈で読めるようにする。

- Shuffle cards
- Maximum cards
- Use card interval
- Start autoplay
- Autoplay interval

Sliderは現在値を操作部の隣に常時表示し、Maximum cardsは数値、Autoplay intervalは秒単位を示す。既存のmin、max、step、保存処理は維持する。

### Advanced

- ネイティブの`details`と`summary`で実装し、初期状態は閉じる。
- summaryにはVersion、token、user IDを含むことを補助文で示す。
- 展開時にVersion、GitHub Access Token、User IDを表示する。
- GitHub Access Tokenの入力値、callback、入力タイプは現行どおり維持する。
- 長いtokenとUser IDは横スクロールを発生させず、入力または値の領域内で収める。

## 視覚表現

- 各グループは`rounded-surface`、`border-border`、`bg-surface`、`shadow-surface`で統一する。
- グループ見出しには小さなアイコン領域、見出し、補助文を置く。アイコンは装飾扱いとし、見出しを代替しない。
- 設定行は薄い境界線で区切り、カード内の余白を一定にする。
- Accountのボタンはquiet相当、Loginはprimary相当を維持する。
- 色は既存トークンだけを使い、lightとdarkで別のハードコード色を追加しない。
- hover、focus、checked状態は既存のdurationとfocus ringを使う。
- `prefers-reduced-motion`の既存挙動を維持する。

## レスポンシブ設計

- デスクトップ、モバイルともに1列で、読む順序を変えない。
- デスクトップでは設定名と説明を左、入力と現在値を右に配置する。
- 狭い画面でも各行の操作は44px以上を保つ。
- 長い表示名、version、UID、tokenは操作領域を縮めず、テキスト側を折り返すか入力幅内に収める。
- Sliderはモバイルで短くしても現在値を併記し、値の意味を色やつまみ位置だけに依存させない。

## コンポーネント境界

### `ConfigFormTemplate`

ページ見出し、自動保存の補助文、読み幅を担当する。設定データや入力callbackは扱わない。現行の入れ子になった大きな外枠は除去し、`Layout`のsurfaceをページ背景として使う。

### `ConfigForm`

4グループの構成と、既存のfield propsを各行へ割り当てる。config storeや画面遷移には依存しない。

### 設定ページ専用presentation部品

`SettingsSection`と`SettingsRow`をsettings feature内の小さなpresentation部品として定義する。

- `SettingsSection`は見出し、説明、アイコン、子要素、heading relationshipを担当する。
- `SettingsRow`はラベル、説明、操作、レスポンシブ配置を担当する。
- Advancedは同じ視覚規則を使うが、`details`と`summary`の意味論を維持する。

これらは設定ページ固有とし、他画面へ早期に一般化しない。

### 共有フォーム部品

`Switch`と`Slider`は、外部ラベルと入力を関連付けるために必要な`id`やARIA propsだけを追加する。既存の見た目、callback、公開APIとの互換性を維持する。必要がなければ`Button`、`Input`、`FormItem`は変更しない。

## データフローと状態

1. `ConfigContainer`が現在のconfig、認証状態、actionを取得する。
2. `useConfigFormState`が既存どおりReact Hook Formのfield propsとwatch値を作る。
3. `ConfigFormTemplate`がページ見出しと自動保存の補助文を描画する。
4. `ConfigForm`がfield propsを4グループへ割り当てる。
5. Switch、Slider、tokenの変更は既存のsubscribe経由で`configUpdate`へ自動送信される。
6. Headerからのdark mode変更は既存どおりform stateへ同期される。

Advancedの開閉は永続化しないローカルなブラウザ状態であり、設定データには含めない。

## エラーと整合性

- 保存処理とstate modelを変更しないため、新しい保存エラー状態は追加しない。
- 未確認の認証情報を表示しない既存の`ConfigContainer`の挙動を維持する。
- `config.darkMode`の外部変更をformへ同期する既存処理を維持する。
- propsが省略されたStorybookやテストでも、見出しとセクション構造が崩れないようにする。

## アクセシビリティ

- ページに一つの`h1`を置き、各通常グループは一意な`h2`と`aria-labelledby`で関連付ける。
- Advancedはフォーカス可能な`summary`を使い、EnterとSpaceで開閉できる。
- SwitchとSliderは表示ラベルと入力要素を`label`/`htmlFor`または同等のARIAで関連付ける。
- Sliderはアクセシブルな名前に加え、現在値と単位が読み取れるようにする。
- アイコンだけで項目名を伝えない。
- すべての操作で既存のfocus ringと44px以上のタッチ領域を維持する。
- 色だけでon/offや現在値を伝えない。

## テスト方針

### Component tests

- Account、Appearance、Study、Advancedが正しい意味論と一意な見出し関係で描画される。
- Advancedが初期状態で閉じ、Version、token、User IDを含む。
- 7つのSwitch、2つのSlider、token入力と既存値が保持される。
- Switch、Slider、tokenの変更callbackが従来どおり呼ばれる。
- LoginとLogoutが認証状態に応じて表示され、callbackを呼ぶ。
- SwitchとSliderが表示ラベルから取得できる。
- 長い表示名、UID、version、tokenを含むpropsでも構造が保たれる。

### Hook and container tests

- 既存の自動保存とdark mode同期テストを維持する。
- 確認済みAuthContextのidentityだけを表示する既存テストを維持する。

### Stories

- Logged out
- Logged in
- Long content
- Dark
- Mobile

各Storyを新しい4グループ構成へ更新する。

### Verification

- settings featureのテストを実行する。
- Storybook buildでstoriesの型と描画準備を確認する。
- 非ドキュメント変更の完了前に`make check`を実行する。
- Firestoreエミュレーターや`sample/build/output.json`など環境依存の失敗は、変更由来の失敗と分けて報告する。

## 完了条件

- 既存の10設定項目、認証操作、version、User ID、自動保存が失われていない。
- 設定がAccount、Appearance、Study、Advancedの4グループから素早く見つけられる。
- スマートフォンでも説明、現在値、操作が読みやすく、横スクロールが発生しない。
- lightとdarkの双方でCalm Focusと整合する。
- 入力が表示ラベルからアクセシブルに取得でき、キーボードで全操作を完了できる。
- 対象テストと`make check`の結果が確認されている。
