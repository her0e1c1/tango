# 静的解析の責務をツールごとに分担する

Status: Accepted

## Decision

同じ検査を重複させず、種類ごとに担当ツールを決める。

- Biome: 整形、一般的な構文・スタイルの検査。
- ESLint: 型情報を使う TypeScript 規則、React Hooks・Compiler、テスト固有の規則、プロジェクト固有の UI 境界。
- Steiger: FSD の構造と依存関係。
- TypeScript: コンパイルと型検査。
- Knip: 未使用のファイル・export・依存関係。

アプリのコンパイルには React Compiler を使い、Vite の設定を Vitest・Storybook と共有する。本番・単体テスト・Storybook のコンパイル条件をそろえる。

`useMemo` と `useCallback` は lint で禁止し、通常のメモ化は Compiler に任せる。外部 API に渡す参照の同一性など、Compiler で満たせない要件には、この ADR と lint 方針を更新してから例外を設ける。

Hooks・Compiler の診断はエラーとして扱う。広く無効化せず、コードの修正か責務の分離で解消する。

## Context

すべての検査を一つのツールでは扱えない。一方、複数ツールで同じ検査をすると設定と保守が重複する。

関連PR: [#320](https://github.com/her0e1c1/tango/pull/320)、[#356](https://github.com/her0e1c1/tango/pull/356)、[#424](https://github.com/her0e1c1/tango/pull/424)、[#1200](https://github.com/her0e1c1/tango/pull/1200)、[#1240](https://github.com/her0e1c1/tango/pull/1240)
