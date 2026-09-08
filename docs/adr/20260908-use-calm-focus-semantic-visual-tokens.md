# Calm Focusのsemantic visual tokenを使用する

Status: Accepted

## Context

色、typography、spacing、radius、elevation、focus、motionをcomponentごとのliteralで管理すると、light/dark theme、responsive layout、accessibility ruleが画面間でずれる。外部content stylesheetが独自themeを選ぶ場合も、applicationのvisual source of truthと競合する。

## Decision

Calm Focusをapplication-wideなvisual systemとし、共通の色、typography、spacing、radius、elevation、focus、motionをsemantic CSS custom propertyで定義する。Tailwind themeはそのtokenを参照し、componentは意味に基づくutilityを使用する。

Dark themeはcomponentごとに別paletteを組み立てず、semantic tokenのoverrideとして表現する。Markdownなどthird-party contentのtheme variableもCalm Focus tokenへmapする。

focus-visible、reduced motion、safe area、dynamic viewport、およびtouch targetの共通baselineはapplication styleとShared UIが所有する。個別interactionと状態遷移はCSSへ移さずcomponent codeが所有する。[PR #256](https://github.com/her0e1c1/tango/pull/256)、[PR #291](https://github.com/her0e1c1/tango/pull/291)、[PR #1231](https://github.com/her0e1c1/tango/pull/1231)を参照する。
