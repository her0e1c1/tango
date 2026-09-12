# Application error recoveryをself-containedにする

Status: Accepted

## Context

unexpected render errorがroot treeを壊すと、通常のPageやProviderを使うrecovery UIも表示できない。Data Routerが扱うroute errorとReact tree全体のerrorは発生境界が異なるが、利用者には一貫した回復手段が必要である。

## Decision

React rootをapplication ProviderとRouterの外側にあるError Boundaryで包む。Data Routerのroot routeにも`errorElement`を設定し、route-level errorとroot render errorで同じapplication fallbackを使用する。

fallbackはSharedのpresentational UIとbrowser reloadだけに依存し、Auth、Firestore、i18n、current route stateなど、失敗原因になり得るapplication Providerへ依存しない。そのためroot fallbackはself-containedなdefault-language copyを使用できる。

recovery actionはfull page reloadとし、壊れたReact subtreeだけをresetして同じpartial runtime stateを継続しない。validation error、persistence failure、authentication failureなど想定内のfailureは通常のcontrolled error flowで扱い、Error Boundaryをapplication control flowとして使用しない。[PR #1330](https://github.com/her0e1c1/tango/pull/1330)、[PR #1374](https://github.com/her0e1c1/tango/pull/1374)を参照する。
