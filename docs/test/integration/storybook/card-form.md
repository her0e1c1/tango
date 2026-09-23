# Card Form Storybook 結合テスト仕様書

## 目的

両面の下書き、拡大編集、タグ、入力エラー、未保存の解答プレビューと送信中・失敗後の操作を確認する。

## 検証境界

CardFields / CardCreator / CardEditor、実際の React Hook Form、プレビュー hook と BackText を組み合わせる。送信結果のケースは実際の submit action と ToastViewport を使い、保存 I/O のみ差し替える。schema の全 validation rule、Firestore の実保存、再読込後の復元は対象外。

書式・実行前提は [README](./README.md)、関連 E2E は [card-management](../../e2e/card-management.md) を参照する。

06〜23 は Vitest から追加した契約で、対応 Story は追加先を示す。該当ケースの準備とアサーションは未実装である。CardEditor は実際の編集画面を含むルート Story に紐付ける。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-01 | interaction | [タブ間で表面の入力を保持する](#storybook-card-form-01) | CardFields :: `Interaction` |
| STORYBOOK-CARD-FORM-02 | interaction | [タグを選択する](#storybook-card-form-02) | CardFields :: `Interaction` |
| STORYBOOK-CARD-FORM-03 | render | [日本語エラーを入力に関連付ける](#storybook-card-form-03) | CardFields :: `JapaneseValidation` |
| STORYBOOK-CARD-FORM-04 | interaction | [解答プレビューを開く](#storybook-card-form-04) | CardFields :: `Preview` / `MobilePreview` / `DarkCodePreview` |
| STORYBOOK-CARD-FORM-05 | interaction | [作成操作を通知する](#storybook-card-form-05) | CardCreator :: `Interaction` |
| STORYBOOK-CARD-FORM-06 | interaction | [拡大編集後も両面の下書きを保つ](#storybook-card-form-06) | CardFields :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-07 | interaction | [独自タグの選択と要約を保って送信する](#storybook-card-form-07) | CardFields :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-08 | interaction | [キーボードで面を切り替える](#storybook-card-form-08) | CardFields :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-09 | interaction | [裏面エラーを開いてフォーカスする](#storybook-card-form-09) | CardFields :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-10 | interaction | [未知のエラーを安全な翻訳文で表示する](#storybook-card-form-10) | CardFields :: `JapaneseValidation`（未実装） |
| STORYBOOK-CARD-FORM-11 | interaction | [言語変更後も下書きとタグを保つ](#storybook-card-form-11) | CardFields :: `JapaneseValidation`（未実装） |
| STORYBOOK-CARD-FORM-12 | interaction | [不完全な下書きを送信せずプレビューする](#storybook-card-form-12) | CardFields :: `Preview`（未実装） |
| STORYBOOK-CARD-FORM-13 | interaction | [拡大編集の変更を数式プレビューに反映する](#storybook-card-form-13) | CardFields :: `Preview`（未実装） |
| STORYBOOK-CARD-FORM-14 | interaction | [表示条件に応じてコードを表示する](#storybook-card-form-14) | CardFields :: `DarkCodePreview`（未実装） |
| STORYBOOK-CARD-FORM-15 | interaction | [タグ変更をプレビューに反映する](#storybook-card-form-15) | CardFields :: `Preview`（未実装） |
| STORYBOOK-CARD-FORM-16 | interaction | [言語変更後もプレビューを開いておく](#storybook-card-form-16) | CardFields :: `Preview`（未実装） |
| STORYBOOK-CARD-FORM-17 | interaction | [作成成功を通知する](#storybook-card-form-17) | CardCreator :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-18 | interaction | [作成失敗後に入力を保って再試行する](#storybook-card-form-18) | CardCreator :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-19 | interaction | [作成中の連続送信を抑止する](#storybook-card-form-19) | CardCreator :: `Interaction`（未実装） |
| STORYBOOK-CARD-FORM-20 | interaction | [保存中は編集と離脱を無効にする](#storybook-card-form-20) | App :: `CardForm`（未実装） |
| STORYBOOK-CARD-FORM-21 | interaction | [外部更新で編集値を上書きしない](#storybook-card-form-21) | App :: `CardForm`（未実装） |
| STORYBOOK-CARD-FORM-22 | interaction | [両面が不正なら表面から修正する](#storybook-card-form-22) | App :: `CardForm`（未実装） |
| STORYBOOK-CARD-FORM-23 | interaction | [編集の保存失敗後に再送信する](#storybook-card-form-23) | App :: `CardForm`（未実装） |

<a id="storybook-card-form-01"></a>

### STORYBOOK-CARD-FORM-01 タブ間で表面の入力を保持する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`

Given:

- 既存 Card のフォームを表示する。

When:

- 表面を Updated prompt に変え、Back、Front の順にタブを切り替える。

Then:

- 表面の値は Updated prompt のままである。

<a id="storybook-card-form-02"></a>

### STORYBOOK-CARD-FORM-02 タグを選択する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`

Given:

- raw タグが未選択である。

When:

- Edit tags から raw を押す。

Then:

- raw の checkbox が未選択から選択済みに変わる。

<a id="storybook-card-form-03"></a>

### STORYBOOK-CARD-FORM-03 日本語エラーを入力に関連付ける

カテゴリ: `render`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `JapaneseValidation`

Given:

- 日本語 locale で両面の入力エラーを渡す。

When:

- フォームを描画する。

Then:

- 表面の必須エラーを表示し、入力の説明は「表面のテキストは必須です。」、document の lang は ja になる。

<a id="storybook-card-form-04"></a>

### STORYBOOK-CARD-FORM-04 解答プレビューを開く

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Preview` / `MobilePreview` / `DarkCodePreview`

Given:

- 太字と数式の解答を通常幅・iPhone X で用意し、別条件では dark 表示の TypeScript コードを用意する。

When:

- Back タブの Preview answer を押す。

Then:

- Answer preview 領域を表示する。内容の描画結果や保存の有無は既存 play の確認対象ではない。

<a id="storybook-card-form-05"></a>

### STORYBOOK-CARD-FORM-05 作成操作を通知する

カテゴリ: `interaction`

対応 Story: [CardCreator.stories.tsx](../../../../src/pages/card-create/ui/CardCreator.stories.tsx) :: `Interaction`

Given:

- 空の作成フォームに submit callback を渡す。

When:

- 表面 Hello、裏面 Hola を入力し、Create card を押す。

Then:

- submit callback が一度通知される。送信値の一致と保存完了は既存 play ではアサートしない。

<a id="storybook-card-form-06"></a>

### STORYBOOK-CARD-FORM-06 拡大編集後も両面の下書きを保つ

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の両面の下書きと拡大編集。

Given:

- 表面 Front、裏面 Back のフォームを表示する。

When:

- 表面を Updated front に変更し、裏面を拡大して Updated back に変更し、Escape で閉じる。

Then:

- Expand Back にフォーカスが戻り、通常入力にも Updated back が残る。Front に戻っても Updated front を保持する。

<a id="storybook-card-form-07"></a>

### STORYBOOK-CARD-FORM-07 独自タグの選択と要約を保って送信する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の選択タグの送信。

Given:

- 両面を入力し、language と独自タグ custom を選択している。

When:

- custom を解除・再選択し、math を追加する。Done で閉じて再度開き、Escape で閉じて Save を押す。

Then:

- 再度開いても math を選択済みとして表示し、閉じると Edit tags に戻る。
- 要約は +1、読み上げ説明は language, custom, math となり、両面とこの3タグを submit callback に渡す。

<a id="storybook-card-form-08"></a>

### STORYBOOK-CARD-FORM-08 キーボードで面を切り替える

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の矢印・端点キー。

Given:

- Front タブにフォーカスしている。

When:

- ArrowRight、Home、End、ArrowLeft を押す。

Then:

- Back、Front、Back、Front の順に選択とフォーカスが移り、該当する入力面を表示する。

<a id="storybook-card-form-09"></a>

### STORYBOOK-CARD-FORM-09 裏面エラーを開いてフォーカスする

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の非表示の裏面エラー。

Given:

- 有効な表面と空の裏面があり、Front を表示している。

When:

- Save を押し、表示された裏面を拡大する。

Then:

- Back が選択されて裏面へフォーカスし、送信されない。
- 通常・拡大入力の説明に必須エラーが関連付き、拡大入力は invalid と alert を示す。表面の値を失わない。

<a id="storybook-card-form-10"></a>

### STORYBOOK-CARD-FORM-10 未知のエラーを安全な翻訳文で表示する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `JapaneseValidation`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の未知の validation エラー。

Given:

- 表面 Front に未知のエラーがあり、英語で拡大編集を開いている。

When:

- 日本語へ変更する。

Then:

- 通常・拡大入力の説明と alert が一般的な日本語のエラーへ変わり、内部エラー文は表示しない。値と開いた編集画面を保持する。

<a id="storybook-card-form-11"></a>

### STORYBOOK-CARD-FORM-11 言語変更後も下書きとタグを保つ

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `JapaneseValidation`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の既存エラーの言語変更。

Given:

- 表面に必須エラーがあり、裏面は「未保存の回答」、タグは language / custom である。

When:

- 日本語へ変更し、表面を拡大して説明を確認し、「修正した問題」を入力して保存する。

Then:

- エラーは日本語へ変わるが、言語変更だけでは送信しない。修正後は裏面とタグを失わず、修正済みの値を submit callback に渡す。

<a id="storybook-card-form-12"></a>

### STORYBOOK-CARD-FORM-12 不完全な下書きを送信せずプレビューする

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Preview`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の不完全な下書きプレビュー。

Given:

- 表面は空、裏面は改行を含む First / Second で、raw 表示を用いる。

When:

- 裏面のプレビューを開き、Enter で閉じる。

Then:

- 下書きを表示でき、閉じるとプレビューボタンにフォーカスを保つ。入力を変えず、送信や新しい入力エラーを発生させない。

<a id="storybook-card-form-13"></a>

### STORYBOOK-CARD-FORM-13 拡大編集の変更を数式プレビューに反映する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Preview`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の live math draft。

Given:

- math の Deck で表面にエラーがあり、裏面の拡大編集を開いている。

When:

- 太字・数式・表を入力してプレビューし、太字の内容を Changed に変えて拡大編集を閉じる。

Then:

- 太字・数式・表が描画され、Changed が開いたプレビューへ即時反映される。通常入力に変更済みの裏面を保ち、表面の既存エラーも保つ。

<a id="storybook-card-form-14"></a>

### STORYBOOK-CARD-FORM-14 表示条件に応じてコードを表示する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `DarkCodePreview`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の言語・テーマ別プレビュー。

Given:

- 解答は `const answer = 42;`。Deck python・タグなし・light、Deck math・タグ custom/typescript/python・dark、Deck math・タグ md・light を個別に用意する。

When:

- プレビューを開き、light / dark を切り替える。

Then:

- それぞれ python、typescript、md として表示し、数式にはしない。開いたコードのテーマも切り替わる。

<a id="storybook-card-form-15"></a>

### STORYBOOK-CARD-FORM-15 タグ変更をプレビューに反映する

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Preview`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) のタグ変更と Deck category への fallback。

Given:

- math の Deck、裏面 `**Draft**`、python タグでプレビューしている。

When:

- python を解除し、その後 raw を選択する。

Then:

- python コードから Deck の表示へ戻って Draft が太字になり、raw 選択後は `**Draft**` をそのまま表示する。

<a id="storybook-card-form-16"></a>

### STORYBOOK-CARD-FORM-16 言語変更後もプレビューを開いておく

カテゴリ: `interaction`

対応 Story: [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx) :: `Preview`（追加先、未実装）

元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) の開いたプレビューの言語変更。

Given:

- 英語で解答プレビューを開いている。

When:

- 日本語へ変更する。

Then:

- 領域名は「解答プレビュー」、ボタン名は「プレビューを閉じる」になり、展開状態を保つ。

<a id="storybook-card-form-17"></a>

### STORYBOOK-CARD-FORM-17 作成成功を通知する

カテゴリ: `interaction`

対応 Story: [CardCreator.stories.tsx](../../../../src/pages/card-create/ui/CardCreator.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) の作成成功通知。

Given:

- Front value / Back value を入力し、外部保存境界は成功を返す。

When:

- Create card を押す。

Then:

- 入力内容を作成要求へ渡し、Created card “Front value”. を表示する。生成 ID や実保存は確認しない。

<a id="storybook-card-form-18"></a>

### STORYBOOK-CARD-FORM-18 作成失敗後に入力を保って再試行する

カテゴリ: `interaction`

対応 Story: [CardCreator.stories.tsx](../../../../src/pages/card-create/ui/CardCreator.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) の失敗後の入力保持と再試行。

Given:

- 有効な両面を入力し、外部保存境界は失敗、成功の順に返す。

When:

- 作成して失敗表示を確認し、もう一度作成する。

Then:

- 失敗時に再試行を案内し、タブを切り替えても両面を保持する。再試行成功時は成功通知に変わる。ID 採番方式は UI 契約に含めない。

<a id="storybook-card-form-19"></a>

### STORYBOOK-CARD-FORM-19 作成中の連続送信を抑止する

カテゴリ: `interaction`

対応 Story: [CardCreator.stories.tsx](../../../../src/pages/card-create/ui/CardCreator.stories.tsx) :: `Interaction`（追加先、未実装）

元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) の即時連打・非同期 validation・保存待機。

Given:

- 有効な両面を入力し、送信直後、非同期 validation 待ち、保存待ちを個別に準備する。

When:

- 作成ボタンを連続して押し、保留していた処理を完了する。

Then:

- 待機中は Creating… が無効で、同じ操作から要求を重複させない。完了後は Create card が再び有効になる。

<a id="storybook-card-form-20"></a>

### STORYBOOK-CARD-FORM-20 保存中は編集と離脱を無効にする

カテゴリ: `interaction`

対応 Story: [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `CardForm`（追加先、未実装）

元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) の保存中の全操作抑止。

Given:

- 実際の編集フォームを使い、外部保存の応答を保留する。

When:

- Save changes を押し、保存応答を完了する。

Then:

- 待機中は Saving…、表面入力、Cancel、Back to cards が無効で、完了後は Save changes が有効になる。

<a id="storybook-card-form-21"></a>

### STORYBOOK-CARD-FORM-21 外部更新で編集値を上書きしない

カテゴリ: `interaction`

対応 Story: [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `CardForm`（追加先、未実装）

元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) の編集開始時の snapshot 保持。

Given:

- 表面 Front text、裏面 Back text で編集を開始し、表面を Unsaved front に変更している。

When:

- 表示元 Card に別の表面・裏面を供給する。

Then:

- 編集中の Unsaved front と開始時の Back text を保持する。実際の購読通信は確認しない。

<a id="storybook-card-form-22"></a>

### STORYBOOK-CARD-FORM-22 両面が不正なら表面から修正する

カテゴリ: `interaction`

対応 Story: [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `CardForm`（追加先、未実装）

元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) の validation 拒否時の UI 部分。

Given:

- 編集フォームの両面を空にしている。

When:

- Save changes を押し、その後 Back タブを開く。

Then:

- 最初に表面の必須エラーを表示して表面へフォーカスする。Back でも裏面の必須エラーを確認できる。保存済みデータの不変性は別境界で扱う。

<a id="storybook-card-form-23"></a>

### STORYBOOK-CARD-FORM-23 編集の保存失敗後に再送信する

カテゴリ: `interaction`

対応 Story: [App.stories.tsx](../../../../src/app/App.stories.tsx) :: `CardForm`（追加先、未実装）

元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) の明示的な再試行。

Given:

- 表面を Retry front に変更し、外部保存境界は失敗、成功の順に返す。

When:

- 保存し、失敗後にもう一度 Save changes を押す。

Then:

- Unable to save changes. Try again. と下書きを保持する。再試行成功時に保存完了 callback を通知する。再マウント後の永続化は対象外である。
