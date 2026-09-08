# React Compilerにmemoizationを委ねる

Status: Accepted

## Context

render performanceのための手動`useMemo`と`useCallback`はdependency listとreference identityの契約を増やし、React Compilerによる最適化と責務が重複する。また、production、unit test、Storybookでcompile条件が異なると、環境ごとにcomponent behaviorがずれる。

## Decision

React Compilerをapplication sourceの標準compile contractとし、Viteの設定をVitestとStorybookでも共有する。

render performanceだけを目的とした手動`useMemo`と`useCallback`は追加せず、memoizationをCompilerへ委ねる。これらのhookはlintで禁止する。外部APIとのsemantic identityなどCompilerでは表せない要件が生じた場合は、例外を追加する前にこのDecisionとlint policyを更新する。

React HooksおよびCompiler diagnosticsをerrorとして扱う。Compilerに適合しないcodeは修正または責務を分離し、diagnosticを広く無効化しない。[PR #320](https://github.com/her0e1c1/tango/pull/320)、[PR #356](https://github.com/her0e1c1/tango/pull/356)を参照する。
