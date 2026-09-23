# Storybook 結合テスト仕様書

## 目的

Storybook の `play` 関数で、画面・機能の UI と実際の子コンポーネント、フォーム、表示状態を組み合わせた振る舞いを確認する。
このディレクトリは公開 UI 契約を記述し、ブラウザ全体の E2E と永続化の結合テストを置き換えない。

## 検証境界

| テスト | 確認する境界 | この仕様では確認しないこと |
| --- | --- | --- |
| Storybook `play` | 実際の UI、DOM、React Hook Form、表示用 hook、子コンポーネント、公開 callback | 本番認証、Firestore の保存・購読・Rules、再読込後の永続化 |
| [E2E](../../e2e/) | 画面遷移から操作完了、保存、再読込、失敗後の復旧までの代表導線 | UI のすべての表示バリエーション |
| [Firestore integration](../firestore/README.md) | Adapter、購読、emulator 上の保存・Rules | UI の表示や操作 |

対象は Pages / Features の利用者向け UI と、ルート・レイアウトの結合である。
Shared の汎用部品を単独で確認する Story は対象外とし、必要な結合は利用側の仕様に記述する。
ルート Story でも実認証・実保存を確認する E2E とは呼ばない。
画面遷移や操作結果の通知を確認する場合は、実際の Page、router、model/action、通知 UI を使い、認証・保存などの外部境界だけを差し替える。

## 実行前提

- 対象テストは [`src/**/*.stories.tsx`](../../../../src) の `play` に置く。`test/integration/storybook` への複製や専用 fixture ファイルは追加しない。
- [`vitest.config.ts`](../../../../vitest.config.ts) の `storybook` project は Vitest addon と Playwright の Chromium browser で実行する。jsdom の unit / integration project とは別である。
- [`preview.ts`](../../../../.storybook/preview.ts) の実際の i18n とアプリ CSS を使用する。通常は英語で、日本語ケースだけ `parameters.locale = "ja"` を設定する。
- 入力値、フォームエラー、空状態、認証状態、callback の spy は Story 側で用意する。ルート Story は既存の [`PageDecorator.tsx`](../../../../.storybook/support/PageDecorator.tsx) に従って初期化する。
- Firebase は既存の [Storybook 設定](../../../../.storybook/main.ts) による差し替えを使う。emulator への接続成功や実保存をこの仕様に含めない。
- Story ごとにフォーム、選択状態、spy 履歴、共有 store、言語、スクロール位置を分離またはリセットし、実行順に依存させない。

## 書式と ID

[E2E テスト規約](../../e2e/AGENTS.md) の明示的な anchor、カテゴリ、Given / When / Then を踏襲する。
E2E の fixture と永続化カテゴリは持ち込まず、準備する値・状態は Given に直接記述する。

- ID は `STORYBOOK-<仕様ファイル名を大文字化>-<NN>` とする。例: `card-form.md` → `STORYBOOK-CARD-FORM-01`。
- ファイル内の記載順に `01` から欠番なく採番し、索引・anchor・見出しを一緒に更新する。README は機能別索引とする。
- カテゴリ `render` は状態に対する表示・属性、`interaction` はクリック・入力・スクロール等の操作結果を意味する。保存の有無を意味しない。
- Given / When / Then はそれぞれ1ブロックとする。独立した振る舞いは別 ID にし、同じ契約の条件違いは Given に列挙してよい。
- 各ケースの `対応 Story:` に、実在する Story ファイルへのリンクと named export を記す。対応付けのためだけに title / export を改名したり、ID を埋め込んだりしない。
- 1つの `play` が複数ケースを確認する場合は、同じ Story を共有してよい。Given は先行操作で準備できるが、各ケースが独立したテストとして実行されることを意味しない。
- 同じ契約の表示バリエーションは、1つの ID に複数 export を対応させ、Given に差分を列挙する。

## 期待結果と実装の対応

公開 UI の表示、読み上げ名・説明、フォーム値、選択状態と公開 callback の通知を記述する。
内部 helper、private state、実装分岐や coverage のための契約を追加しない。
実際に結合を確認する UI・フォーム・hook は mock せず、本番コードにテスト専用の引数・依存注入・export を追加しない。

対応表は既存 `play` と、Vitest の UI テストから抽出した追加契約を含む。コード上の対応付けであり、テスト実行の合格記録ではない。

| 記載 | 意味 |
| --- | --- |
| 既存 Story の対応のみ | 契約に対応するアサーションが既存 play にある。今回の実行成功を意味しない。 |
| 追加先、未実装 | 対象 UI を含む既存 Story を追加先として示している。そのケースの状態準備・操作・アサーションはまだ実装していない。 |
| 要追加 | 既存 play が一部だけを確認する、または別の期待結果だけを確認している。ケース内に不足するアサーションを明示する。 |

表示専用 Story、タブ等を開くだけの準備用 play、要素がクリックできることだけを、ケース全体の Then の検証済みとして数えない。
callback の spy が通知されただけでは、実保存・遷移・ダウンロード内容・再読込後の状態を保証しない。

### Vitest から追加したケース

各ケースの「元テスト」に照合元ファイルと該当する振る舞いを記す。同一ファイルを繰り返し参照する Card Player は、冒頭に元ファイルのリンクをまとめる。
内部実装や永続化の確認をそのまま移さず、Storybook の境界で観測できる UI の振る舞いを抽出する。
一つの元テストを複数の契約に分ける場合と、同じ契約の条件違いをまとめる場合がある。
この一覧は、全 Vitest UI テストの網羅や移行完了を示すものではない。

未実装ケースの `対応 Story` は、現在の描画条件やアサーションがそのケースを満たすという意味ではない。
実装時に追加先の Story を拡張するか、適切なバリエーションへ分けて対応表を更新する。ケースと Story を1対1にする必要はない。
仕様を書いただけで既存 Vitest テストを削除しない。代替の play を実装・実行して UI 契約を失っていないことを確認し、UI 以外の契約は適切なテスト境界に残す。

## 機能別仕様の索引

ケース数には未実装・要追加も含む。実装済みテスト数や合格数ではない。

| 仕様書 | 対象 | ケース数 |
| --- | --- | --- |
| [Application Layout](./app-layout.md) | 共通 Header とコンテンツ、スクロール中の位置関係 | 2 |
| [Deck List](./deck-list.md) | 一覧・空状態、件数、メニュー、フォーカスと処理中の行 | 26 |
| [Deck Form and Deletion](./deck-form.md) | 入力保持、エラー表示と削除確認 | 4 |
| [Card List](./card-list.md) | 空状態、タグ解除、並べ替え後の操作対象、メニュー | 22 |
| [Card Form](./card-form.md) | 両面の下書き、拡大編集、タグ、プレビュー、送信と再試行 | 23 |
| [Deck Filter](./deck-filter.md) | タグ選択、一致条件、開示とフォーカス | 15 |
| [Deck Import](./import.md) | CSV 選択、プレビュー、確定、診断と失敗表示 | 12 |
| [Study Controls](./study-controls.md) | 再生、スキップ、方向操作とヘルプ | 10 |
| [Card Player](./card-player.md) | 読書・学習操作の区別、ツールバー、裏面と詳細表示 | 23 |
| [Study History](./study-history.md) | 期間指定、日別表、セッション、集計グラフ | 9 |
| [Settings](./settings.md) | 入力、境界値、説明、言語変更とショートカット | 11 |
| [Account](./account.md) | 認証表示、待機・再試行、画面をまたぐ通知 | 14 |
| 合計 | 未実装・要追加の契約を含む | 171 |

## 変更時の確認

play の追加・変更・回帰テスト追加と同じ変更で、対応する仕様・索引・Story 参照を更新する。
保存・認証の実際の契約に関わる変更は、E2E / Firestore 仕様も更新する。
文書化だけの変更で、本番挙動や既存テストの実行対象を変更しない。

```sh
npm run lint:test-specs
npm run lint:markdown
npm run test:storybook
```

個別確認では `npm run storybook` を実行して該当 Story を開く。
`npm run build:storybook` の成功だけで play の成功とはしない。
`lint:test-specs` は仕様 ID が実装側のテスト名または Storybook step label の先頭にあることを正規表現で確認する。`検証状況: 未実装` のケースは対象外とする。
play の有無・継承・tags・実行条件、Given / When / Then の網羅性やアサーション内容・実行結果は、この参照チェックでは確認しない。レビューと Storybook の実行で別途確認する。
