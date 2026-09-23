# Storybook Integration Specification Instructions

## 検証境界と書式

- Storybook の `play` が確認する公開 UI 契約を記述する。利用者の一連の導線は `docs/test/e2e`、保存・購読・Rules は `docs/test/integration/firestore` で扱う。
- 文書構成、日本語の Given / When / Then、ID だけでの対応付けは [共通規約](../../AGENTS.md) に従う。仕様書と README に Story ファイル・named export・元テスト名・実装対応表を記載しない。
- ID は `STORYBOOK-<大文字の仕様ファイル名>-<NN>` とし、各ファイルで `01` から文書順に欠番なく採番する。索引・anchor・見出しをそろえ、README にはケース一覧だけを置く。
- カテゴリは表示・属性を確認する `render` と、操作結果を確認する `interaction` とする。区分は [共通規約](../../AGENTS.md#正常系異常系の区分) に従い、カテゴリと分ける。
- Given には表示データ・選択状態・フォームエラーなどを直接記述する。E2E fixture や専用 fixture ファイルを追加しない。Given / When / Then は各1ブロックとし、独立した振る舞いは別ケースにする。
- 一つの `play` で複数ケースを確認してよい。先行操作で Given の状態を準備できるが、各ケースが独立したテストとして実行されることを意味しない。表示バリエーションは Story 名ではなく、入力と期待結果で区別する。
- 対象は Pages / Features の利用者向け UI と、ルート・レイアウトの結合である。Shared の汎用部品単独ではなく、実際の利用側 UI と子コンポーネント・フォームを組み合わせて確認する。
- フォーム値、表示・読み上げ名、操作可否、フォーカス、公開 callback の通知を観測する。内部 helper、private state、分岐・呼出回数・coverage だけを根拠にケースを増やさない。
- 実際の遷移や通知 UI を確認するケースでは Page・router・model/action・通知 UI を組み合わせ、認証・保存など契約外の境界だけを置き換える。検証対象の UI・フォームを mock せず、テスト専用の本番インターフェースを追加しない。
- 公開 callback の通知は保存成功・実遷移・ダウンロード内容の証拠ではない。それぞれを保証する場合は、その結果を観測できる境界の仕様を使う。
- 未実装または期待結果の一部が未検証のケースは、共通規約に従い見出しに `[TODO]` を付ける。状態行・索引への重複表示・古い検証状況表は作らない。ID が存在すること、描画のみ・準備操作のみの Story、skip を、検証済みと数えない。

## Storybook の初期化と fixture

- [`preview.ts`](../../../../.storybook/preview.ts) の実際の i18n とアプリ CSS を使用する。通常は英語で、日本語ケースだけ `parameters.locale = "ja"` を設定する。`beforeEach` で言語変更を await してから表示する。Canvas は共有 instance と document の言語を合わせ、複数言語を同時表示する Docs は言語別 instance と各 Story の `lang` を使う。
- 入力値、フォームエラー、空状態、認証状態、callback の spy は Story 側で用意する。ルート Story は既存の [`appStory.tsx`](../../../../.storybook/support/appStory.tsx) の `prepareAppStory` を `beforeEach` から呼び出し、表示前に reset / seed する。Story で実行する CSV 読み取りが進行中なら、その完了を待ってから、Page の共有 store も初期値に戻す。待機用の購読は完了または Story の中断時に解除する。実認証・Firebase 保存はこの Story の契約外であり、他 Page の処理完了を横断的に監視しない。導入版では globals / args 更新でも `beforeEach` が呼ばれるため、実行単位の `abortSignal` で準備済みかを判定する。cleanup は準備済み判定だけを解除し、play 終了後の画面は消さない。loader や通常の再描画では初期化しない。
- ルート専用 fixture は [`App.stories.tsx`](../../../../src/app/App.stories.tsx) に置き、各 Story の `parameters.page` にパスと状態を明示する。Session の ID・開始日時・最終学習日時も固定値を指定する。現在のルート fixture は未学習カード（`fsrs: null`）を使用し、期限判定に依存しない。日時を表示する UI Story は固定日時、記憶状態の Story は明示的な判定時刻を使用する。期限依存の fixture を追加する場合は判定用の時計も Story の lifecycle 内で合わせる。
- フォーム、選択状態、spy 履歴、共有 store、言語、スクロール位置を実行単位で分離し、実行順に依存させない。スクロールのケースは実際にスクロールできる高さで実行し、終了時に位置を戻す。モバイルの既存表示例は iPhone X の viewport を使う。Strict Mode などの描画条件は Story 側で設定し、ケースに内部の実行回数を書かない。

## 実行と変更時の確認

- 実装は `src/**/*.stories.tsx` の `play` に置き、`test/integration/storybook` へ複製しない。既存の `vitest.config.ts` の `storybook` project と Chromium browser を使い、jsdom のテストとは区別する。
- Firebase は既存の `.storybook/main.ts` による差し替えを使う。接続成功・実認証・実保存を、ルート Story であることだけを理由に保証しない。
- `npm run lint:test-specs` と `npm run lint:markdown` で参照と文書形式を確認する。参照チェックは文字列の先頭の ID を照合するだけであり、play の実行・継承・実行条件・Given / When / Then の網羅性を判定しない。
- `npm run test:storybook` で動作を検証する。個別表示は `npm run storybook` を使う。`npm run build:storybook` の成功だけを play の成功と扱わない。
- play の追加・変更・回帰テスト追加と同じ変更で、仕様と索引を更新する。仕様作成だけで既存 Vitest テストを削除せず、代替 play の実装・実行で同じ UI 契約を確認する。UI 以外の契約は適切な層に残す。
