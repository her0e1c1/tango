# 標準ツールの利用を優先する

Status: Accepted

## Context

独自のスクリプト、ラッパー、非公開実装依存の検証処理を維持管理することはコストが高く、`Be simple.` に反する。標準ツールは、独自コードが重複して実装しようとする契約の多くを既に自ら所有している。

## Decision

明示的に別の方針が示されない限り、TypeScript、Vite、Firebase、React Router、Biome などの公式 API、標準コマンド、通常のビルド統合の利用を優先する。

標準 API の名前を変更しただけの薄いラッパー、ツール自身によって生成される成果物に対する独自の検証処理、非公開の実装詳細に依存するチェックを維持管理しない。標準ツールで必要なプロジェクト契約を表現できない場合のみ独自のツールを追加し、そのギャップをドキュメント化する。

専用の TypeScript カバレッジスクリプトの代わりに標準の `tsc` および Biome コマンドを使用する。Workbox 出力の検査の代わりに通常の Vite PWA ビルドを、非公開ランタイム検査の代わりに Firebase の公開永続化 API を、パススルーなナビゲーションファサードの代わりに React Router フックを使用する。[PR #452](https://github.com/her0e1c1/tango/pull/452)、[PR #777](https://github.com/her0e1c1/tango/pull/777)、[PR #1213](https://github.com/her0e1c1/tango/pull/1213)を参照する。
