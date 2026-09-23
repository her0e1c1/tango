# Storybook Integration Specification Instructions

- Document public UI contracts verified by Storybook `play` functions. Keep end-to-end user flows in `docs/test/e2e` and persistence, subscriptions, and Rules in `docs/test/integration/firestore`.
- Follow the Japanese case format and ID-only correspondence rules in `../../AGENTS.md`. Do not add Story file or named-export mappings.
- Use `STORYBOOK-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs, starting at `01` in document order without gaps. Update indexes, anchors, and headings together; README files index specifications rather than define cases.
- Use `render` for visible states and attributes, and `interaction` for results of user operations. These categories do not imply persistence.
- 正常系・異常系の区分は [共通規約](../../AGENTS.md#正常系異常系の区分) に従い、カテゴリとは別に明示する。
- Describe setup inline without E2E fixtures or dedicated fixture files. Keep each Given / When / Then to one block and split independent behaviors into separate IDs.
- A shared play may verify several cases. Describe the prerequisite state in Given without naming the Story export; prior operations may establish that state, but this does not imply independent test execution.
- A case may cover multiple display variants. Describe each variant's inputs and expected results instead of listing export names.
- Distinguish verified assertions from rendering-only stories, setup-only plays, skipped tests, and missing assertions. A callback notification does not prove persistence, navigation, or downloaded contents.
- Keep unimplemented or unverified expectations explicit. An ID match from `lint:test-specs` is not evidence that a play ran or verified its Then clauses.

## Storybook の初期化と fixture

- [`preview.ts`](../../../../.storybook/preview.ts) の実際の i18n とアプリ CSS を使用する。通常は英語で、日本語ケースだけ `parameters.locale = "ja"` を設定する。`beforeEach` で言語変更を await してから表示する。Canvas は共有 instance と document の言語を合わせ、複数言語を同時表示する Docs は言語別 instance と各 Story の `lang` を使う。
- 入力値、フォームエラー、空状態、認証状態、callback の spy は Story 側で用意する。ルート Story は既存の [`appStory.tsx`](../../../../.storybook/support/appStory.tsx) の `prepareAppStory` を `beforeEach` から呼び出し、表示前に reset / seed する。Story で実行する CSV 読み取りが進行中なら、その完了を待ってから、Page の共有 store も初期値に戻す。待機用の購読は完了または Story の中断時に解除する。実認証・Firebase 保存はこの Story の契約外であり、他 Page の処理完了を横断的に監視しない。導入版では globals / args 更新でも `beforeEach` が呼ばれるため、実行単位の `abortSignal` で準備済みかを判定する。cleanup は準備済み判定だけを解除し、play 終了後の画面は消さない。loader や通常の再描画では初期化しない。
- ルート専用 fixture は [`App.stories.tsx`](../../../../src/app/App.stories.tsx) に置き、各 Story の `parameters.page` にパスと状態を明示する。Session の ID・開始日時・最終学習日時も固定値を指定する。現在のルート fixture は未学習カード（`fsrs: null`）を使用し、期限判定に依存しない。日時を表示する UI Story は固定日時、記憶状態の Story は明示的な判定時刻を使用する。期限依存の fixture を追加する場合は判定用の時計も Story の lifecycle 内で合わせる。
