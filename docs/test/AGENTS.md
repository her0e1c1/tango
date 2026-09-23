# Test Documentation Instructions

## Directory contract

- `docs/test/**/*.md` は `README.md` と `AGENTS.md` を除き、すべてテスト仕様書とする。
- `README.md` および `AGENTS.md` はテスト仕様書として扱わない。
- この配下の `AGENTS.md` はテスト文書にだけ適用し、アプリケーションコードやテスト実装のルールにはしない。

## README.md の記述規約

- `README.md` には各仕様書に定義されたテストケースの一覧テーブル（索引）を記述する。
- テスト実行方法、検証境界、記述規約などの運用指示および技術仕様は、各ディレクトリの `AGENTS.md` を正とする。

## テスト仕様書の共通規約

- 観測可能な振る舞いを日本語で記述し、目的、明示的な ID の anchor と見出し、カテゴリ、Given / When / Then を持たせる。ID・カテゴリ・fixture などの詳細は各階層の `AGENTS.md` に従う。
- 仕様とテスト実装の対応には Test ID を使う。仕様書や索引に `対応テスト`、`対応ファイル`、`対応 Story`、予定テスト名、実装対応列、テストファイルへのリンク、コピーしたテスト名、Story export 一覧を記述しない。
- ケースの契約に実装場所を含めない。共通の実行方法として runner 設定やテストディレクトリを説明することは許可するが、ケース単位の実装対応表にはしない。
- Given には必要な状態を記述し、Given / When / Then はそれぞれ1ブロックを原則とする。独立した振る舞いは別ケースに分け、parameterized input や表示 variant は実装名ではなく状態と期待結果として記述する。
- 対応欄を削除するときに ID、anchor、カテゴリ、前提、期待結果、関連仕様リンクを変更しない。対応欄の削除だけを理由にケースを改番しない。
- 共通の文書ルールはこのファイル、階層固有の文書ルールは子の `AGENTS.md` に置き、repository root の `AGENTS.md` へ重複して記述しない。
- Firestore / Storybook 契約以外の runtime behavior 仕様は `e2e` に置く。明示的な依頼なしに別の unit / integration 仕様書や ID system を追加しない。
- ID が存在するだけではテスト済み・検証済みとはみなさない。未実装、skip、TODO は明示し、合格した検証として扱わない。
