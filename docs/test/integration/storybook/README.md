# Storybook 結合テスト仕様書

## 目的

Storybook の `play` 関数で、画面・機能の UI と実際の子コンポーネント、フォーム、表示状態を組み合わせた振る舞いを確認する。
このディレクトリは Storybook の公開 UI 契約を記述し、ブラウザ全体の E2E と永続化の結合テストを置き換えない。

## 検証境界

| テスト | 確認する境界 | この仕様では確認しないこと |
| --- | --- | --- |
| Storybook `play` | 実際の UI、DOM、React Hook Form、表示用 hook、子コンポーネント、公開 callback | 本番認証、Firestore の保存・購読・Rules、再読込後の永続化 |
| [E2E](../../e2e/) | 画面遷移から操作完了、保存、再読込、失敗後の復旧までの代表導線 | UI のすべての表示バリエーション |
| [Firestore integration](../firestore/README.md) | Adapter、購読、emulator 上の保存・Rules | UI の表示や操作 |

対象は Pages / Features の利用者向け UI 契約と Integration のルート・レイアウト Story とする。
Shared の汎用部品を単独で確認する Story はこの一覧の対象外とし、必要な部品の結合は利用側の仕様に記述する。
ルート Story であっても実認証・実保存を検証する E2E とは呼ばない。
ルートの移動や操作結果の通知を確認する場合は、実際の Page、router、model/action、通知 UI を組み合わせ、認証・保存などの外部境界だけを差し替える。

## 実行前提

- 対象テストは [`src/**/*.stories.tsx`](../../../../src) の `play` に置く。`test/integration/storybook` への複製や専用 fixture ファイルは追加しない。
- [`vitest.config.ts`](../../../../vitest.config.ts) の `storybook` project は Vitest addon と Playwright の Chromium browser で実行する。jsdom の unit / integration project とは別である。
- [`preview.ts`](../../../../.storybook/preview.ts) の実際の i18n とアプリ CSS を使用する。通常は英語で、日本語ケースだけ `parameters.locale = "ja"` を設定する。
- 必要な入力値、フォームエラー、空状態、認証 props、callback の spy は Story 側で用意する。ルート Story の状態は既存の [`PageDecorator.tsx`](../../../../.storybook/support/PageDecorator.tsx) に従って初期化する。
- Firebase は既存の [Storybook 設定](../../../../.storybook/main.ts) による差し替えを使う。Firestore emulator への接続成功や実保存の保証をこの仕様に含めない。
- Story ごとにフォーム、選択状態、spy の履歴、共有 store、言語、スクロール位置を分離またはリセットし、別 Story や実行順に依存させない。

## 書式と ID

[E2E テスト規約](../../e2e/AGENTS.md) の明示的な anchor、カテゴリ、Given / When / Then を踏襲する。
ただし E2E の fixture と永続化カテゴリは持ち込まず、準備する値・状態は Given に直接記述する。

- ID は `STORYBOOK-<仕様ファイル名を大文字化>-<NN>` とする。例: `card-form.md` → `STORYBOOK-CARD-FORM-01`。
- 各仕様ファイルを記載順に `01` から欠番なく採番し、索引・anchor・見出しを一緒に更新する。README は機能別仕様への索引とする。
- カテゴリ `render` は与えた状態に対する表示・属性の確認、`interaction` はクリック・入力・スクロール等に対する結果の確認を意味する。保存の有無を意味しない。
- 各ケースは Given / When / Then をそれぞれ1ブロックで記述する。独立した振る舞いは別 ID に分ける。
- 対応先は Story ファイルへのリンクと named export 名を記す。まだ存在しないファイルは予定パスをコード表記し、実装時にリンクへ変更する。
- 既存 Story の title / export の改名や ID の埋め込みは、この対応付けのためだけには行わない。
- 既存の1つの `play` が複数ケースを確認している場合は、各ケースに同じ export を記す。Given の状態はその Story の先行操作で準備してよい。これは独立した複数テストとして実行されることを意味しない。
- 同じ契約を複数の表示バリエーションで確認する場合は、1つの ID に複数 export を対応させ、Given に差分を列挙する。

## 期待結果と実装の対応

公開 UI の表示、読み上げ名・説明、フォーム値、選択状態、公開 callback の通知を記述する。
コールバックの spy は境界で受け取る通知の観測に使い、内部 helper、private state、実装分岐や coverage のための契約を追加しない。
実際に結合を確認する UI、フォーム、hook は mock しない。本番コードにテスト専用の引数・依存注入・export を追加しない。

対応表には既存 `play` のアサーションと、既存 Vitest の UI テストから抽出した追加予定の契約を含む。
コード上の対応付けであり、テスト実行の合格記録ではない。

| 記載 | 意味 |
| --- | --- |
| 既存 Story の対応のみ | その契約を確認するアサーションが既存 `play` にある。今回の実行成功を意味しない。 |
| 未実装 | 対応する Story / `play` の実装を追加する必要がある。 |
| 要追加・要アサーション追加 | 既存 `play` は契約の一部だけを確認している。ケース内で既存の確認と不足分を区別する。 |

以下は自動アサーションによる検証済み項目として数えない。

- `play` のない表示専用 Story。render / accessibility のチェックが走ることと、機能固有の Then をアサートしていることは別である。
- ダイアログやタブを開くだけの表示準備用 `play`。要素をクリックできても、最終表示や保持値が検証されるとは限らない。
- Spy が呼ばれただけの Story における、実保存・遷移・ダウンロード内容・再読込後の状態。

### Vitest から抽出したケース

各ケースの「元テスト」に照合元の `.spec.tsx` と識別可能なテスト名を記す。
元テストの内部実装・永続化の確認をそのまま移さず、Storybook の境界で観測できる UI の振る舞いを記録する。
一つの元テストを複数の UI 契約に分ける場合と、同じ契約の入力違いをまとめる場合がある。
この対応は既存 Vitest テスト全体の移行完了や、全 UI テストの網羅を示すものではない。

「対応予定 Story」の export 名は実装時の候補であり、ケースと Story を1対1にする制約ではない。
既存 `play` へのアサーション追加や共有 `play` で契約を確認できる場合は、実際の対応先へ仕様を更新する。
仕様への追記だけで既存 Vitest テストを削除しない。代替の `play` とアサーションを実装・実行し、元テストの UI 契約を失っていないことを確認してから移行する。
UI 以外の契約は、その契約を検証する適切なテストに残す。

## 機能別仕様の索引

ケース数には未実装・要追加の契約も含む。実装済みテスト数や合格数ではない。

| 仕様書 | 対象 | ケース数 |
| --- | --- | --- |
| [Application Layout](./app-layout.md) | 共通 Header と画面コンテンツ、スクロール中の位置関係 | 2 |
| [Deck List](./deck-list.md) | 一覧・空状態・復習件数、操作要求、メニューとフォーカス、処理中の行 | 26 |
| [Deck Form and Deletion](./deck-form.md) | Deck フォームの入力保持、エラー表示、削除確認の通知 | 4 |
| [Card List](./card-list.md) | 一覧・空状態、タグ解除とフォーカス、行の並べ替え、操作要求と無効化 | 22 |
| [Card Form](./card-form.md) | 両面の下書き、拡大編集、タグ、エラー、解答プレビュー、保存中と再試行 | 23 |
| [Deck Filter](./deck-filter.md) | タグの選択・解除、一致条件、段階的な開示、キーボード操作 | 15 |
| [Deck Import](./import.md) | CSV 選択、プレビュー、明示的な確定、診断、言語変更、処理中と失敗表示 | 12 |
| [Study Controls](./study-controls.md) | 再生・スキップ・方向操作、キーボード、ヘルプと通知のフォーカス | 10 |
| [Card Player](./card-player.md) | 閲覧と学習のジェスチャー、ツールバー、裏面の操作・スクロール、詳細表示 | 23 |
| [Study History](./study-history.md) | 期間指定、日別表、最近のセッション、集計グラフの表示と開閉 | 9 |
| [Settings](./settings.md) | 入力、値の境界と説明、言語変更、アクセシブルな関連付け、ショートカット | 11 |
| [Account](./account.md) | 認証状態の表示、操作要求、待機・再試行、画面をまたぐ通知と待機状態 | 14 |
| 合計 | 未実装・要追加の契約を含む | 171 |

## 変更時の確認

`play` の追加・変更・回帰テストの追加と同じ変更で、対応する仕様・索引・Story の参照を更新する。
本番の保存・認証契約に関わる変更は、該当する E2E / Firestore 仕様も更新する。
文書化だけの変更で、本番挙動や既存テストの実行対象を変更しない。

```sh
npm run lint:markdown
npm run test:storybook
```

ブラウザ上で個別に確認するときは `npm run storybook` を実行し、対応する title / export の Story を開く。
`npm run build:storybook` の成功だけで `play` の成功とはしない。
仕様の追加を理由に、新しい contract checker、fixture、CI の仕組みを追加する必要はない。
