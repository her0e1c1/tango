# 静的解析の責務をツールごとに分担する

Status: Accepted

## Context

format、一般的なlint、型情報を使う規則、React Compilerの方針、FSD境界、型検査、未使用コード検出を、1つのツールだけで同じ品質で扱うことはできない。一方、同じ検査を複数のツールで重複させると、設定と保守の負担が増える。

## Decision

検査の種類ごとに主担当を1つ定める。

- Biomeはformatと一般的な構文・styleの検査を担当する。
- ESLintは型情報を使うTypeScript規則、React HooksとReact Compilerの方針、テスト固有の規則、およびプロジェクト固有のUI境界を担当する。
- SteigerはFSDのarchitecture constraintを担当する。
- TypeScriptはcompileと型検査を担当する。
- Knipは未使用のfile、export、dependencyの検出を担当する。

React Compilerをapplication sourceの標準compile contractとし、Viteの設定をVitestとStorybookでも共有する。production、unit test、Storybookでcompile条件を揃える。

通常のmemoizationを目的とした`useMemo`と`useCallback`は追加せず、Compilerへ委ねる。これらのhookはlintで禁止する。外部APIとのsemantic identityなどCompilerでは表せない要件が生じた場合は、例外を追加する前にこのDecisionとlint policyを更新する。

React HooksおよびCompiler diagnosticsをerrorとして扱う。Compilerに適合しないcodeは修正または責務を分離し、diagnosticを広く無効化しない。

[PR #320](https://github.com/her0e1c1/tango/pull/320)、[PR #356](https://github.com/her0e1c1/tango/pull/356)、[PR #424](https://github.com/her0e1c1/tango/pull/424)、[PR #1200](https://github.com/her0e1c1/tango/pull/1200)、[PR #1240](https://github.com/her0e1c1/tango/pull/1240)を参照する。
