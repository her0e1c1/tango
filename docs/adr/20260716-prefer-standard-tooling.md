# 標準ツールの設定を優先する

## Status

Accepted

## Context

`scripts/check-tsconfig-coverage.mjs` は、Git で追跡している TypeScript ファイルが `tsconfig.json` または `tsconfig.node.json` に含まれることを独自に検査していた。

この検査には TypeScript の設定解析と Git の追跡状態を組み合わせる独自実装が必要であり、実行環境ごとの差異も保守する必要がある。実際に Docker から Git worktree を検査すると、worktree の Git metadata を参照できずに失敗した。標準ツールとは別の検査経路を維持することは、リポジトリの `Be simple.` という方針に反する。

## Decision

`scripts/check-tsconfig-coverage.mjs` とその専用テストを削除する。TypeScript の検査には各 `tsconfig` に対する `tsc`、format と lint には Biome、build と開発環境には Vite が提供する標準設定とコマンドを使う。

明示的な指示がない限り、TypeScript、Vite、Biome などが提供する標準設定を、独自スクリプトや独自検査より優先する。標準機能で満たせない要件がある場合に限り、追加実装の必要性と保守コストを個別に判断する。

## Consequences

- 独自スクリプトと、その実行環境固有の保守が不要になる。
- lint は `tsconfig.json` と `tsconfig.node.json` に対する `tsc`、および Biome で構成される。
- 新しい TypeScript ファイルを追加するときは、TypeScript の標準的な `include`、`exclude`、project references などで対象範囲を管理する。
- 標準ツールで検出できない問題を追加検査する場合は、この判断との整合性を ADR で説明する。
