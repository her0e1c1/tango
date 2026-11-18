# 共有表示部品 Playwright テスト仕様書

## 目的

共有部品とアプリのレイアウトの公開された表示・操作・通知先への引数を確認する。画面の store や action を通る契約は各画面の仕様書に置く。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-SHARED-01 | interaction | 正常系 | [メニューの選択を一度通知して閉じる](#playwright-shared-01) |
| PLAYWRIGHT-SHARED-02 | interaction | 正常系 | [タグの削除で対象ラベルを渡す](#playwright-shared-02) |
| PLAYWRIGHT-SHARED-03 | interaction | 正常系 | [装飾された内容のクリックを通知する](#playwright-shared-03) |
| PLAYWRIGHT-SHARED-04 | interaction | 正常系 | [スライダーの変更を一度通知する](#playwright-shared-04) |
| PLAYWRIGHT-SHARED-05 | interaction | 正常系 | [スイッチの変更を一度通知する](#playwright-shared-05) |
| PLAYWRIGHT-SHARED-06 | interaction | 正常系 | [固定ヘッダーと本文を重ねない](#playwright-shared-06) |
| PLAYWRIGHT-SHARED-07 | interaction | 正常系 | [設定行の変更を一度通知する](#playwright-shared-07) |
| PLAYWRIGHT-SHARED-08 | render | 正常系 | [複数の設定フォームの関連付けを分離する](#playwright-shared-08) |
| PLAYWRIGHT-SHARED-09 | interaction | 正常系 | [アカウント部品から認証操作を通知する](#playwright-shared-09) |
| PLAYWRIGHT-SHARED-10 | render | 正常系 | [アカウント部品の待機を読み上げる](#playwright-shared-10) |
| PLAYWRIGHT-SHARED-11 | render | 正常系 | [日本語のアカウント部品でプロフィールを保つ](#playwright-shared-11) |
| PLAYWRIGHT-SHARED-12 | interaction | 正常系 | [期間部品から数値のプリセットを通知する](#playwright-shared-12) |
| PLAYWRIGHT-SHARED-13 | render | 正常系 | [最近のセッション部品で終了状態を区別する](#playwright-shared-13) |
| PLAYWRIGHT-SHARED-14 | interaction | 正常系 | [セッションの全件表示と対象リストを関連付ける](#playwright-shared-14) |
| PLAYWRIGHT-SHARED-15 | render | 正常系 | [集計部品のグラフを表示する](#playwright-shared-15) |
| PLAYWRIGHT-SHARED-16 | interaction | 正常系 | [日別表部品を展開して古い日付へ進む](#playwright-shared-16) |
| PLAYWRIGHT-SHARED-20 | interaction | 正常系 | [アプリの標準ヘッダーを固定する](#playwright-shared-20) |
| PLAYWRIGHT-SHARED-21 | render | 正常系 | [アプリのヘッダー固定を解除する](#playwright-shared-21) |
| PLAYWRIGHT-SHARED-17 | interaction | 正常系 | [設定フォームの入力と渡されたビルド情報を表示する](#playwright-shared-17) |
| PLAYWRIGHT-SHARED-18 | interaction | 正常系 | [設定フォームで最大カード数の境界を説明する](#playwright-shared-18) |
| PLAYWRIGHT-SHARED-19 | interaction | 正常系 | [設定フォームで間隔の境界を独立に説明する](#playwright-shared-19) |

<a id="playwright-shared-01"></a>

### PLAYWRIGHT-SHARED-01 メニューの選択を一度通知して閉じる

カテゴリ: `interaction`

区分: 正常系

Given:

- 閉じた Document actions メニューと Download の通知先がある。

When:

- メニューを開き Download を選ぶ。

Then:

- メニューが表示された後、Download を一度通知し、選択後はメニューを閉じる。

<a id="playwright-shared-02"></a>

### PLAYWRIGHT-SHARED-02 タグの削除で対象ラベルを渡す

カテゴリ: `interaction`

区分: 正常系

Given:

- TypeScript の削除可能なタグがある。

When:

- Remove TypeScript filter を選ぶ。

Then:

- 削除の通知先へ TypeScript を一度渡す。

<a id="playwright-shared-03"></a>

### PLAYWRIGHT-SHARED-03 装飾された内容のクリックを通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- クリック可能な装飾された内容がある。

When:

- 内容をクリックする。

Then:

- 公開されたクリック通知を一度呼ぶ。

<a id="playwright-shared-04"></a>

### PLAYWRIGHT-SHARED-04 スライダーの変更を一度通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 値40の制御されたスライダーがある。

When:

- キーボードで一段階増やす。

Then:

- 値41を表示し、変更した値を一度通知する。

<a id="playwright-shared-05"></a>

### PLAYWRIGHT-SHARED-05 スイッチの変更を一度通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 未選択のスイッチがある。

When:

- スイッチを選ぶ。

Then:

- 選択済みとなり、変更を一度通知する。

<a id="playwright-shared-06"></a>

### PLAYWRIGHT-SHARED-06 固定ヘッダーと本文を重ねない

カテゴリ: `interaction`

区分: 正常系

Given:

- 固定ヘッダーとスクロールを必要とする8節の本文がある。

When:

- 本文を末尾へスクロールする。

Then:

- 最初の節はヘッダーより下に配置され、本文がスクロールしてもヘッダーの画面上の位置は変わらない。

<a id="playwright-shared-07"></a>

### PLAYWRIGHT-SHARED-07 設定行の変更を一度通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 選択済みのスワイプ設定と独立した未選択の設定を表示する。

When:

- スワイプ設定を切り替える。

Then:

- スワイプ設定が未選択となり、その変更を一度通知する。

<a id="playwright-shared-08"></a>

### PLAYWRIGHT-SHARED-08 複数の設定フォームの関連付けを分離する

カテゴリ: `render`

区分: 正常系

Given:

- 同じ画面に二つの設定フォームがある。

When:

- 各フォームの Language、Appearance、Study の関連付けを確認する。

Then:

- 各領域は自身の見出しと関連付き、言語の入力IDは互いに異なる。Dark mode の説明は正しく関連付き、領域のアイコンは読み上げ対象から除かれる。

<a id="playwright-shared-09"></a>

### PLAYWRIGHT-SHARED-09 アカウント部品から認証操作を通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 匿名状態と Maya Tanaka の連携済み状態を独立した表示例とする。

When:

- 各状態のログインまたはログアウトを選ぶ。

Then:

- 匿名では Anonymous account と Not available、連携済みでは Signed in with Google と Maya Tanaka を表示し、対応する公開操作を一度通知する。

<a id="playwright-shared-10"></a>

### PLAYWRIGHT-SHARED-10 アカウント部品の待機を読み上げる

カテゴリ: `render`

区分: 正常系

Given:

- ログイン待機とログアウト待機を独立した表示例とする。

When:

- 各アカウント状態を表示する。

Then:

- 対象操作は無効になり aria-busy が true となる。

<a id="playwright-shared-11"></a>

### PLAYWRIGHT-SHARED-11 日本語のアカウント部品でプロフィールを保つ

カテゴリ: `render`

区分: 正常系

Given:

- 日本語と表示名 Maya Tanaka の連携済み状態を準備する。

When:

- アカウント部品を表示する。

Then:

- 見出しとログアウト操作は日本語になり、表示名は変わらない。

<a id="playwright-shared-12"></a>

### PLAYWRIGHT-SHARED-12 期間部品から数値のプリセットを通知する

カテゴリ: `interaction`

区分: 正常系

Given:

- 30日が選択された期間選択部品がある。

When:

- 7日を選び、次に任意期間を開く。

Then:

- 30日の選択状態が読み取れ、7を通知先へ渡し、任意期間の開始日入力を表示する。

<a id="playwright-shared-13"></a>

### PLAYWRIGHT-SHARED-13 最近のセッション部品で終了状態を区別する

カテゴリ: `render`

区分: 正常系

Given:

- 完了・中止・未完了の3セッションを英語と日本語で独立して準備する。

When:

- 最近のセッションを表示する。

Then:

- 各言語で3状態を区別し、英語では未完了の終了日時をダッシュで示す。日本語では見出しも翻訳する。

<a id="playwright-shared-14"></a>

### PLAYWRIGHT-SHARED-14 セッションの全件表示と対象リストを関連付ける

カテゴリ: `interaction`

区分: 正常系

Given:

- 10セッションのうち3件を表示する。

When:

- 全10件の表示を選ぶ。

Then:

- 10件が表示され、展開済みの操作が対象リストと aria-controls で関連付く。

<a id="playwright-shared-15"></a>

### PLAYWRIGHT-SHARED-15 集計部品のグラフを表示する

カテゴリ: `render`

区分: 正常系

Given:

- 開始2件・完了3件と30日または90日分のグラフ用データを独立して準備する。

When:

- 集計部品を表示する。

Then:

- グラフを表示し、90日では7日単位の集約を示す。

<a id="playwright-shared-16"></a>

### PLAYWRIGHT-SHARED-16 日別表部品を展開して古い日付へ進む

カテゴリ: `interaction`

区分: 正常系

Given:

- 各日開始1件・完了1件の90日分の日別データがあり、表は折りたたまれている。

When:

- 日別表を開き、古い日付へ進む。

Then:

- 最初に30日と見出しの31行を表示し、古い日付へ進むと31〜60日目のページを表示する。

<a id="playwright-shared-20"></a>

### PLAYWRIGHT-SHARED-20 アプリの標準ヘッダーを固定する

カテゴリ: `interaction`

区分: 正常系

Given:

- 実際のアプリ store と、標準設定のヘッダーと8節の本文がある。

When:

- 本文を末尾へスクロールする。

Then:

- ヘッダーは fixed となり、最初の節はヘッダーより下に配置される。本文がスクロールしてもヘッダーの画面上の位置は変わらない。

<a id="playwright-shared-21"></a>

### PLAYWRIGHT-SHARED-21 アプリのヘッダー固定を解除する

カテゴリ: `render`

区分: 正常系

Given:

- 実際のアプリ store と、固定を解除したヘッダーがある。

When:

- 本文を表示する。

Then:

- ヘッダーは static となり、本文はヘッダーより下に配置される。

<a id="playwright-shared-17"></a>

### PLAYWRIGHT-SHARED-17 設定フォームの入力と渡されたビルド情報を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 最大カード数24、自動再生間隔7秒、復習期限有効、操作表示有効、裏面の操作表示無効の設定フォームがある。
- 版1.2.3とコミット0123456789abcdef0123456789abcdef01234567を表示用の値として渡す。

When:

- 詳細設定を開く。言語の入力値を日本語へ変更し、操作表示を切り替え、最大カード数を31にする。

Then:

- 自動保存の案内と Language、Appearance、Study の領域を表示し、Account の領域・UID・認証操作・送信用フォームは含めない。
- 復習期限と7秒の間隔の説明を表示する。詳細設定には渡された版とコミットのリンクを表示し、Main branch は表示しない。
- 部品自身の入力値が変わり、選択した言語名・チェック状態・最大31枚を読み取れる。言語の入力変更だけでは外側の表示言語を変更しない。
- 裏面の操作表示には、回答表示中の左右の学習操作についての説明が関連付く。

<a id="playwright-shared-18"></a>

### PLAYWRIGHT-SHARED-18 設定フォームで最大カード数の境界を説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 最大カード数0の設定フォームを英語・日本語で独立して準備する。

When:

- 最大カード数を0・1・2・0の順に変更する。

Then:

- 0〜100の範囲と0が条件に一致する全カードを含む説明を持つ。
- 0は全件、1と2はその言語の単位を付けた枚数として読み上げ、表示値も一致する。

<a id="playwright-shared-19"></a>

### PLAYWRIGHT-SHARED-19 設定フォームで間隔の境界を独立に説明する

カテゴリ: `interaction`

区分: 正常系

Given:

- 間隔60秒の設定フォームを、英語・日本語と、自動再生・再生操作表示のON/OFFの全組合せで独立して準備する。

When:

- 間隔を0・1・60の順に変更する。

Then:

- 0〜60の範囲を持ち、0では自動送りと再生操作・進捗スライダーを使わない説明を持つ。
- 表示値と読み上げ値は選択した言語の単位で一致する。自動再生と再生操作表示の選択は変えない。
