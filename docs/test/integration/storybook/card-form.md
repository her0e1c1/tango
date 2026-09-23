# Card Form Storybook 結合テスト仕様書

## 目的

Card 入力、拡大編集、タグ選択、入力エラー、未保存の解答プレビューと送信中・失敗後の操作を確認する。

## 検証境界

CardFields / CardCreator / CardEditor、実際の React Hook Form、プレビュー hook と BackText。送信結果を扱うケースは実際の submit action と ToastViewport も組み合わせ、保存 I/O だけを Story 側で差し替える。フォームの入力エラーへの応答は対象とするが、schema の全 validation rule、Firestore の保存結果、再読込後の復元は対象外。

関連 E2E: [card-management](../../e2e/card-management.md) / [settings](../../e2e/settings.md)。

書式・実行前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース | 対応 Story |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-01 | interaction | [面を切り替えても編集中の表面テキストを保持する](#storybook-card-form-01) | CardFields :: `Interaction` |
| STORYBOOK-CARD-FORM-02 | interaction | [タグ編集で未選択のタグを選択できる](#storybook-card-form-02) | CardFields :: `Interaction` |
| STORYBOOK-CARD-FORM-03 | render | [日本語の入力エラーを入力欄の説明に関連付ける](#storybook-card-form-03) | CardFields :: `JapaneseValidation` |
| STORYBOOK-CARD-FORM-04 | interaction | [編集中の解答プレビュー領域を開く](#storybook-card-form-04) | CardFields :: `Preview` / `MobilePreview` / `DarkCodePreview` |
| STORYBOOK-CARD-FORM-05 | interaction | [入力後の作成操作を submit callback に通知する](#storybook-card-form-05) | CardCreator :: `Interaction` |
| STORYBOOK-CARD-FORM-06 | interaction | [拡大編集を閉じても両面の下書きを保持する](#storybook-card-form-06) | CardFields :: `ExpandedDrafts`（未実装） |
| STORYBOOK-CARD-FORM-07 | interaction | [独自タグの選択と要約を保持して送信する](#storybook-card-form-07) | CardFields :: `SelectedTagSubmission`（未実装） |
| STORYBOOK-CARD-FORM-08 | interaction | [キーボードで面とタブのフォーカスを切り替える](#storybook-card-form-08) | CardFields :: `KeyboardTabs`（未実装） |
| STORYBOOK-CARD-FORM-09 | interaction | [非表示の裏面エラーを開いてフォーカスする](#storybook-card-form-09) | CardFields :: `InvalidBack`（未実装） |
| STORYBOOK-CARD-FORM-10 | interaction | [未知のエラーを安全な翻訳文で表示する](#storybook-card-form-10) | CardFields :: `UnknownErrorLocale`（未実装） |
| STORYBOOK-CARD-FORM-11 | interaction | [言語変更後も下書きとタグを保って修正できる](#storybook-card-form-11) | CardFields :: `ValidationLocaleChange`（未実装） |
| STORYBOOK-CARD-FORM-12 | interaction | [不完全な下書きを送信せずプレビューする](#storybook-card-form-12) | CardFields :: `IncompletePreview`（未実装） |
| STORYBOOK-CARD-FORM-13 | interaction | [拡大編集の変更を数式プレビューへ即時反映する](#storybook-card-form-13) | CardFields :: `LiveExpandedPreview`（未実装） |
| STORYBOOK-CARD-FORM-14 | interaction | [カテゴリ・タグ・テーマに応じてコードを表示する](#storybook-card-form-14) | CardFields :: `PreviewRenderingContext`（未実装） |
| STORYBOOK-CARD-FORM-15 | interaction | [タグ変更を開いたプレビューへ反映する](#storybook-card-form-15) | CardFields :: `PreviewTagChange`（未実装） |
| STORYBOOK-CARD-FORM-16 | interaction | [言語を変えてもプレビューを開いたままにする](#storybook-card-form-16) | CardFields :: `PreviewLocaleChange`（未実装） |
| STORYBOOK-CARD-FORM-17 | interaction | [作成結果の成功通知を表示する](#storybook-card-form-17) | CardCreator :: `CreationSuccess`（未実装） |
| STORYBOOK-CARD-FORM-18 | interaction | [作成失敗後に両面の入力を保って再試行する](#storybook-card-form-18) | CardCreator :: `CreationRetry`（未実装） |
| STORYBOOK-CARD-FORM-19 | interaction | [作成処理中の連続送信を抑止する](#storybook-card-form-19) | CardCreator :: `PendingSubmission`（未実装） |
| STORYBOOK-CARD-FORM-20 | interaction | [編集の保存中は入力と離脱操作を無効にする](#storybook-card-form-20) | CardEditor :: `PendingSubmission`（未実装） |
| STORYBOOK-CARD-FORM-21 | interaction | [表示元の Card 更新で編集中の値を上書きしない](#storybook-card-form-21) | CardEditor :: `ExternalCardRefresh`（未実装） |
| STORYBOOK-CARD-FORM-22 | interaction | [両面が不正なら表面から修正できる](#storybook-card-form-22) | CardEditor :: `InvalidBothSides`（未実装） |
| STORYBOOK-CARD-FORM-23 | interaction | [編集の保存失敗後に下書きを再送信する](#storybook-card-form-23) | CardEditor :: `SaveRetry`（未実装） |

対応ファイルは [CardFields.stories.tsx](../../../../src/features/card-form/ui/CardFields.stories.tsx)、[CardCreator.stories.tsx](../../../../src/pages/card-create/ui/CardCreator.stories.tsx)。CardEditor の対応予定ファイルは `src/pages/card-edit/ui/CardEditor.stories.tsx`。06 以降の named export は追加予定であり、既存の表示専用 Story の検証済み項目には数えない。

<a id="storybook-card-form-01"></a>

### STORYBOOK-CARD-FORM-01 面を切り替えても編集中の表面テキストを保持する

カテゴリ: `interaction`

対応 Story: CardFields :: `Interaction`

Given:

- 既存 Card の入力フォームを表示する。

When:

- Front text を Updated prompt に置き換える。
- Back タブへ切り替えてから Front タブへ戻る。

Then:

- Front text の値が Updated prompt のまま保持される。

<a id="storybook-card-form-02"></a>

### STORYBOOK-CARD-FORM-02 タグ編集で未選択のタグを選択できる

カテゴリ: `interaction`

対応 Story: CardFields :: `Interaction`

Given:

- Card の入力フォームで raw タグは未選択である。

When:

- Edit tags を開き、raw のチェックボックスを押す。

Then:

- 押す前は raw が未選択で、押した後は選択済みになる。

<a id="storybook-card-form-03"></a>

### STORYBOOK-CARD-FORM-03 日本語の入力エラーを入力欄の説明に関連付ける

カテゴリ: `render`

対応 Story: CardFields :: `JapaneseValidation`

Given:

- 日本語 locale で、表面・裏面の入力エラーをあらかじめ渡す。

When:

- フォームを描画する。

Then:

- 表面の必須エラーが表示され、表面の入力欄の accessible description が「表面のテキストは必須です。」になる。
- document の lang が ja になる。

<a id="storybook-card-form-04"></a>

### STORYBOOK-CARD-FORM-04 編集中の解答プレビュー領域を開く

カテゴリ: `interaction`

対応 Story: CardFields :: `Preview` / `MobilePreview` / `DarkCodePreview`

Given:

- Preview / MobilePreview では解答 **Draft answer** と数式 $x^2$、math タグを持つ Card を用意する。
- MobilePreview は iPhone X 表示、DarkCodePreview は dark 表示で、解答 const answer = 42; と typescript タグを用意する。

When:

- Back タブで Preview answer を押す。

Then:

- Answer preview の領域が表示される。表示内容のレンダリング結果や保存の有無までは、この play のアサーション対象ではない。

<a id="storybook-card-form-05"></a>

### STORYBOOK-CARD-FORM-05 入力後の作成操作を submit callback に通知する

カテゴリ: `interaction`

対応 Story: CardCreator :: `Interaction`

Given:

- 空の Card 作成フォームを用意し、submit callback を spy にする。

When:

- Front text に Hello、Back text に Hola を入力し、Create card を押す。

Then:

- submit callback が一度通知される。送信値の一致と保存完了は、この play ではアサートしない。

<a id="storybook-card-form-06"></a>

### STORYBOOK-CARD-FORM-06 拡大編集を閉じても両面の下書きを保持する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `ExpandedDrafts`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `keeps both drafts across tabs and expanded editing, then submits the selected tags`。

Given:

- 表面 Front、裏面 Back のフォームを表示する。

When:

- 表面を Updated front に変え、裏面を拡大して Updated back に変え、Escape で拡大編集を閉じる。

Then:

- Expand Back にフォーカスが戻り、通常の裏面入力に Updated back が残る。
- Front タブへ戻っても Updated front が残る。

<a id="storybook-card-form-07"></a>

### STORYBOOK-CARD-FORM-07 独自タグの選択と要約を保持して送信する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `SelectedTagSubmission`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `keeps both drafts across tabs and expanded editing, then submits the selected tags`。

Given:

- 両面を入力済みで、language と独自タグ custom が選択されている。

When:

- タグ編集で custom を解除して再選択し、math を追加する。Done で閉じて再度開き、Escape で閉じて Save を押す。

Then:

- custom の解除・再選択と math の選択が反映され、再度開いても math は選択済みである。
- 閉じると Edit tags にフォーカスが戻り、要約の追加件数は +1、読み上げ説明は language, custom, math になる。
- submit callback に両面の入力と `["language", "custom", "math"]` が渡される。

<a id="storybook-card-form-08"></a>

### STORYBOOK-CARD-FORM-08 キーボードで面とタブのフォーカスを切り替える

カテゴリ: `interaction`

対応予定 Story: CardFields :: `KeyboardTabs`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `switches sides with arrow and endpoint keys while keeping tab focus`。

Given:

- Front タブにフォーカスしている。

When:

- ArrowRight、Home、End、ArrowLeft の順に押す。

Then:

- Back、Front、Back、Front の順にタブへフォーカスが移る。
- Back へ移った時点で選択状態と裏面の入力値を表示する。

<a id="storybook-card-form-09"></a>

### STORYBOOK-CARD-FORM-09 非表示の裏面エラーを開いてフォーカスする

カテゴリ: `interaction`

対応予定 Story: CardFields :: `InvalidBack`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `reveals and focuses an invalid Back while preserving the valid Front`。

Given:

- 有効な表面と空の裏面があり、Front タブを表示している。

When:

- Save を押し、表示された裏面を拡大する。

Then:

- Back が選択され、裏面入力にフォーカスし、送信されない。
- 通常・拡大入力とも必須エラーが入力の説明に関連付けられ、拡大編集では invalid 状態と alert が見える。
- 表面の有効な入力は失われない。

<a id="storybook-card-form-10"></a>

### STORYBOOK-CARD-FORM-10 未知のエラーを安全な翻訳文で表示する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `UnknownErrorLocale`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `translates unknown validation errors in place, including the expanded editor`。

Given:

- 表面 Front に未知のサーバーエラーを渡し、拡大編集を開いている。

When:

- 表示言語を英語から日本語に変更する。

Then:

- 通常・拡大入力の説明と alert が The value is invalid. から「入力内容が正しくありません。」に変わる。
- 内部エラー文は表示されず、入力値 Front と開いた編集画面は保たれる。

<a id="storybook-card-form-11"></a>

### STORYBOOK-CARD-FORM-11 言語変更後も下書きとタグを保って修正できる

カテゴリ: `interaction`

対応予定 Story: CardFields :: `ValidationLocaleChange`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `updates an existing error without losing the other draft or custom tags`。

Given:

- 裏面は「未保存の回答」、タグは language と custom、表面は空で必須エラーが出ている。

When:

- 日本語へ変更し、表面を拡大してエラーを確認した後、「修正した問題」を入力して Save を押す。

Then:

- エラーの説明は日本語になり、修正前の言語変更だけでは送信されない。
- 裏面と独自タグを失わず、修正済みの両面とタグが submit callback に渡される。

<a id="storybook-card-form-12"></a>

### STORYBOOK-CARD-FORM-12 不完全な下書きを送信せずプレビューする

カテゴリ: `interaction`

対応予定 Story: CardFields :: `IncompletePreview`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `previews an incomplete draft without submitting, validating, or replacing the input`。

Given:

- 表面は空、裏面は改行を含む First / Second、表示形式は raw である。

When:

- 裏面の Preview answer を押し、Enter でプレビューを閉じる。

Then:

- 下書きをそのままプレビューでき、閉じるとプレビューボタンにフォーカスが残る。
- 入力値は変わらず、submit callback や新しい入力エラーを発生させない。

<a id="storybook-card-form-13"></a>

### STORYBOOK-CARD-FORM-13 拡大編集の変更を数式プレビューへ即時反映する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `LiveExpandedPreview`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `renders live math drafts and preserves validation, dirty state, and expanded input identity`。

Given:

- math の Deck で表面のエラーがあり、裏面の拡大編集を開いている。

When:

- 太字、数式、表を含む Markdown を入力してプレビューし、太字の内容を Changed に変更してから閉じる。

Then:

- 太字・数式・表が描画され、編集中の Changed が開いたプレビューに反映される。
- 拡大編集を閉じても変更済みの裏面が残り、表面の既存エラーは維持される。

<a id="storybook-card-form-14"></a>

### STORYBOOK-CARD-FORM-14 カテゴリ・タグ・テーマに応じてコードを表示する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `PreviewRenderingContext`（未実装、下記の入力を個別に準備する）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `uses $language and dark=$dark from current rendering context`。

Given:

- 解答は `const answer = 42;` とする。
- Deck python・タグなし・light、Deck math・タグ custom/typescript/python・dark、Deck math・タグ md・light の3条件を用意する。

When:

- プレビューを開き、light / dark を切り替える。

Then:

- それぞれ python、typescript、md としてコードを表示し、数式としては表示しない。
- 開いたコードのテーマが切り替わる。

<a id="storybook-card-form-15"></a>

### STORYBOOK-CARD-FORM-15 タグ変更を開いたプレビューへ反映する

カテゴリ: `interaction`

対応予定 Story: CardFields :: `PreviewTagChange`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `updates an open preview when tags change and falls back to the Deck category`。

Given:

- math の Deck、裏面 `**Draft**`、python タグでプレビューを開いている。

When:

- python を解除し、その後 raw を選択する。

Then:

- python コードから Deck の math 表示へ戻り、Draft が太字になる。
- raw 選択後は太字ではなく、`**Draft**` がそのまま表示される。

<a id="storybook-card-form-16"></a>

### STORYBOOK-CARD-FORM-16 言語を変えてもプレビューを開いたままにする

カテゴリ: `interaction`

対応予定 Story: CardFields :: `PreviewLocaleChange`（未実装）。元テスト: [CardFields.spec.tsx](../../../../src/features/card-form/ui/CardFields.spec.tsx) :: `updates an open preview when tags change and falls back to the Deck category`。

Given:

- 英語で解答プレビューを開いている。

When:

- 日本語へ変更する。

Then:

- 領域名が「解答プレビュー」、ボタン名が「プレビューを閉じる」になり、展開状態を保つ。

<a id="storybook-card-form-17"></a>

### STORYBOOK-CARD-FORM-17 作成結果の成功通知を表示する

カテゴリ: `interaction`

対応予定 Story: CardCreator :: `CreationSuccess`（未実装）。元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) :: `saves the entered Card and shows its success notification`。

Given:

- Front value / Back value を入力し、外部保存境界は成功を返す。

When:

- Create card を押す。

Then:

- 入力内容を作成要求へ渡し、Created card “Front value”. が表示される。生成 ID や実保存は検証しない。

<a id="storybook-card-form-18"></a>

### STORYBOOK-CARD-FORM-18 作成失敗後に両面の入力を保って再試行する

カテゴリ: `interaction`

対応予定 Story: CardCreator :: `CreationRetry`（未実装）。元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) :: `keeps both inputs after rejection and retries with a new Card identity`。

Given:

- Front value / Back value を入力し、外部保存境界は最初に失敗、次に成功を返す。

When:

- 作成して失敗表示を確認し、Create card でもう一度送信する。

Then:

- 失敗時に再試行を案内し、表裏を切り替えても両面の入力が残る。
- 再試行成功時は成功通知に変わる。再試行時の ID 採番方式はこの UI 契約に含めない。

<a id="storybook-card-form-19"></a>

### STORYBOOK-CARD-FORM-19 作成処理中の連続送信を抑止する

カテゴリ: `interaction`

対応予定 Story: CardCreator :: `PendingSubmission`（未実装）。元テスト: [CardCreator.spec.tsx](../../../../src/pages/card-create/ui/CardCreator.spec.tsx) :: `saves one Card for immediately repeated clicks` / `disables repeated clicks while asynchronous validation is pending` / `disables repeated clicks until the pending save finishes`。

Given:

- 有効な両面を入力する。送信直後、非同期 validation 待ち、外部保存待ちの3条件を別々に準備する。

When:

- 作成ボタンを連続して押し、保留していた処理を完了させる。

Then:

- 待機中は Creating… が無効になり、同じ操作による作成要求を重複させない。
- 処理完了後は Create card が再び有効になる。

<a id="storybook-card-form-20"></a>

### STORYBOOK-CARD-FORM-20 編集の保存中は入力と離脱操作を無効にする

カテゴリ: `interaction`

対応予定 Story: CardEditor :: `PendingSubmission`（未実装）。元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) :: `disables every edit and exit control while saving`。

Given:

- 外部保存境界の応答を保留した編集フォームを表示する。

When:

- Save changes を押し、その後保存の応答を完了させる。

Then:

- 保存中は Saving…、表面入力、Cancel、Back to cards が無効になる。
- 完了後は Save changes が再び有効になる。

<a id="storybook-card-form-21"></a>

### STORYBOOK-CARD-FORM-21 表示元の Card 更新で編集中の値を上書きしない

カテゴリ: `interaction`

対応予定 Story: CardEditor :: `ExternalCardRefresh`（未実装）。元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) :: `keeps the opening snapshot when the Card Entity refreshes`。

Given:

- 表面 Front text、裏面 Back text で編集を開始し、表面を Unsaved front に変更している。

When:

- Story から表示元 Card に別の表面・裏面を供給する。

Then:

- 表面の下書き Unsaved front と、編集開始時の裏面 Back text が保たれる。実際の購読通信は確認しない。

<a id="storybook-card-form-22"></a>

### STORYBOOK-CARD-FORM-22 両面が不正なら表面から修正できる

カテゴリ: `interaction`

対応予定 Story: CardEditor :: `InvalidBothSides`（未実装）。元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) :: `keeps stored values unchanged when validation rejects the form` の UI 部分。

Given:

- 編集フォームの両面を空にしている。

When:

- Save changes を押し、その後 Back タブを開く。

Then:

- 最初に表面の必須エラーを表示して表面へフォーカスする。
- Back タブでも裏面の必須エラーを確認できる。保存済みデータの不変性は別のテスト境界で扱う。

<a id="storybook-card-form-23"></a>

### STORYBOOK-CARD-FORM-23 編集の保存失敗後に下書きを再送信する

カテゴリ: `interaction`

対応予定 Story: CardEditor :: `SaveRetry`（未実装）。元テスト: [CardEditor.spec.tsx](../../../../src/pages/card-edit/ui/CardEditor.spec.tsx) :: `keeps the draft and saves it after an explicit retry` の UI 部分。

Given:

- 表面を Retry front に変更し、外部保存境界は最初に失敗、次に成功を返す。

When:

- Save changes を押し、失敗後に同じボタンで再試行する。

Then:

- Unable to save changes. Try again. を表示し、Retry front を保持する。
- 再試行の成功時に保存完了 callback を通知する。再マウント後の永続化確認は対象外である。

## 自動アサーションに含めない項目

`Back`、`Expanded`、`TagSelection`、`ExpandedPreview` とそれらの表示バリエーションは主に表示準備の play である。追加予定ケースの記載だけでは、これらの Story に期待結果のアサーションが実装されたことにはならない。
