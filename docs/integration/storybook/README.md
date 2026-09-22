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

## 実行前提

- 対象テストは [`src/**/*.stories.tsx`](../../../src) の `play` に置く。`test/integration/storybook` への複製や専用 fixture ファイルは追加しない。
- [`vitest.config.ts`](../../../vitest.config.ts) の `storybook` project は Vitest addon と Playwright の Chromium browser で実行する。jsdom の unit / integration project とは別である。
- [`preview.ts`](../../../.storybook/preview.ts) の実際の i18n とアプリ CSS を使用する。通常は英語で、日本語ケースだけ `parameters.locale = "ja"` を設定する。
- 必要な入力値、フォームエラー、空状態、認証 props、callback の spy は Story 側で用意する。ルート Story の状態は既存の [`PageDecorator.tsx`](../../../.storybook/support/PageDecorator.tsx) に従って初期化する。
- Firebase は既存の [Storybook 設定](../../../.storybook/main.ts) による差し替えを使う。Firestore emulator への接続成功や実保存の保証をこの仕様に含めない。
- Story ごとにフォーム、選択状態、spy の履歴、共有 store、言語、スクロール位置を分離またはリセットし、別 Story や実行順に依存させない。

## 書式と ID

[E2E テスト規約](../../e2e/AGENTS.md) の明示的な anchor、カテゴリ、Given / When / Then を踏襲する。
ただし E2E の fixture と永続化カテゴリは持ち込まず、準備する値・状態は Given に直接記述する。

- ID は `STORYBOOK-<仕様ファイル名を大文字化>-<NN>` とする。例: `card-form.md` → `STORYBOOK-CARD-FORM-01`。
- 各仕様ファイルを記載順に `01` から欠番なく採番し、索引・anchor・見出しを一緒に更新する。README は機能別仕様への索引とする。
- カテゴリ `render` は与えた状態に対する表示・属性の確認、`interaction` はクリック・入力・スクロール等に対する結果の確認を意味する。保存の有無を意味しない。
- 各ケースは Given / When / Then をそれぞれ1ブロックで記述する。独立した振る舞いは別 ID に分ける。
- 対応先は Story ファイルへのリンクと named export 名を必ず記す。既存 Story の title / export の改名や ID の埋め込みは、この対応付けのためだけには行わない。
- 既存の1つの `play` が複数ケースを確認している場合は、各ケースに同じ export を記す。Given の状態はその Story の先行操作で準備してよい。これは独立した複数テストとして実行されることを意味しない。
- 同じ契約を複数の表示バリエーションで確認する場合は、1つの ID に複数 export を対応させ、Given に差分を列挙する。

## 期待結果と実装の対応

公開 UI の表示、読み上げ名・説明、フォーム値、選択状態、公開 callback の通知を記述する。
コールバックの spy は境界で受け取る通知の観測に使い、内部 helper、private state、実装分岐や coverage のための契約を追加しない。
実際に結合を確認する UI、フォーム、hook は mock しない。本番コードにテスト専用の引数・依存注入・export を追加しない。

この仕様の対応表は、既存 `play` のアサーションとコード上で対応付けたものであり、テスト実行の合格記録ではない。
以下は自動アサーションによる検証済み項目として数えない。

- `play` のない表示専用 Story。render / accessibility のチェックが走ることと、機能固有の Then をアサートしていることは別である。
- ダイアログやタブを開くだけの表示準備用 `play`。要素をクリックできても、最終表示や保持値が検証されるとは限らない。
- Spy が呼ばれただけの Story における、実保存・遷移・ダウンロード内容・再読込後の状態。

未アサートの期待を追加するときは、仕様に「未実装」または「要アサーション追加」と明示し、対応する `play` を別途実装する。
今回の文書化に合わせて本番挙動を変更しない。

## 機能別仕様の索引

| 仕様書 | 対象 | ケース数 |
| --- | --- | --- |
| [Application Layout](./app-layout.md) | 共通 Header と画面コンテンツを組み合わせ、スクロール中の Header と本文の位置関係を確認する。 | 2 |
| [Deck List](./deck-list.md) | Deck 一覧のメニュー、閲覧要求、空状態、復習件数と日本語表示を確認する。 | 8 |
| [Deck Form and Deletion](./deck-form.md) | Deck フォームの入力保持、エラー表示と削除確認の通知を確認する。 | 4 |
| [Card List](./card-list.md) | Card 一覧の操作通知、空状態の区別、タグ解除、overlay の終了と並び順の変更要求を確認する。 | 9 |
| [Card Form](./card-form.md) | Card 入力、タブ間の値の保持、タグ選択、日本語エラー、解答プレビューと作成要求を確認する。 | 5 |
| [Deck Filter](./deck-filter.md) | タグ選択の解除と、多数のタグを開示する UI の結合を確認する。 | 2 |
| [Deck Import](./import.md) | CSV 選択からプレビューまでの画面結合と、日本語の診断表示を確認する。 | 3 |
| [Study Controls](./study-controls.md) | 学習用の再生切替とスキップの操作通知を確認する。 | 2 |
| [Study History](./study-history.md) | 期間指定、日別表、最近のセッション、集計グラフの表示と開閉を確認する。 | 9 |
| [Settings](./settings.md) | 設定フォームと設定行の値の変更、日本語 locale の表示を確認する。 | 3 |
| [Account](./account.md) | 認証状態に応じた表示、ログイン・ログアウトの要求と処理中のボタン状態を確認する。 | 5 |

## 変更時の確認

`play` の追加・変更・回帰テストの追加と同じ変更で、対応する仕様・索引・Story の参照を更新する。
本番の保存・認証契約に関わる変更は、該当する E2E / Firestore 仕様も更新する。

```sh
npm run lint:test-specs
npm run lint:markdown
npm run test:storybook
```

ブラウザ上で個別に確認するときは `npm run storybook` を実行し、対応する title / export の Story を開く。
`npm run build:storybook` の成功だけで `play` の成功とはしない。
`lint:test-specs` は各ケースの「対応 Story」にあるファイル・named export・継承を含む `play` の存在を静的に確認する。複数ケースでの同じ Story の共有と、一つのケースへの複数 Story の対応を許可する。
記載した各対応先が解決でき、テスト対象として有効な `play` を持つ必要がある。動的な factory など静的に解決できない対応先は網羅済みとして数えない。
アサーションが Given / When / Then の意味を満たすことや、実行時の条件分岐・成功はこの lint では保証しない。
