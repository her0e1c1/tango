# 標準ツールを優先する

Status: Accepted

## Context

独自スクリプトの保守は手間がかかり、`Be simple.` に反する。

## Decision

明示的な指示がない限り、TypeScript、Vite、Biome などの標準設定を優先する。`scripts/check-tsconfig-coverage.mjs` と専用テストを削除し、`tsc` と Biome の標準コマンドを使う。
