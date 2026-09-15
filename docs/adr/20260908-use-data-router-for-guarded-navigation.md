# Data Routerでguarded navigationを管理する

Status: Accepted

## Context

未保存Formの離脱をPageごとのclick handlerだけで防ぐと、Back、Forward、直接navigation、browser unloadを一貫して扱えない。成功後だけguardを回避する処理をglobal flagで行うと、無関係なnavigationまで許可する可能性がある。

## Decision

AppはReact RouterのData Routerとroute treeを所有する。Sharedはroute pattern、destination builder、および再利用可能なnavigation guard primitiveを所有する。PageはReact Routerのhookを直接使用し、薄いnavigation aliasを作らない。

dirtyまたは保存中のFormはapplication navigationとbrowser unloadをguardする。成功後のprogrammatic navigationを許可する場合は、destinationとhistory actionを一致させたone-shot intentだけを回避し、globalにguardを無効化しない。

route pathのmatchingとdestination生成は同じShared contractを使用する。[PR #1213](https://github.com/her0e1c1/tango/pull/1213)、[PR #1374](https://github.com/her0e1c1/tango/pull/1374)を参照する。
