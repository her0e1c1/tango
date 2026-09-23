# Application error recoveryをself-containedにする

Status: Accepted

## Context

unexpected render errorがroot treeを壊すと、通常のPageやProviderを使うrecovery UIも表示できない。Data Routerが扱うroute errorとReact tree全体のerrorは発生境界が異なるが、利用者には一貫した回復手段が必要である。

## Decision

単一のReact rootをapplication ProviderとRouterの外側にあるAppErrorBoundaryで包む。main.tsxで通常のAppとRouterを直接構成し、起動前のリセット要求や専用bootstrapは持たない。Service Workerは`injectRegister: "script"`で通常登録する。DOM fallbackは持たない。Data Routerのroot routeにも`errorElement`を設定し、route-level errorとroot render errorで同じapplication fallbackを使用する。

fallbackはSharedのpresentational UIとProvider外で使えるi18n instance、復旧文言と明示的なキャッシュ削除操作に依存する。Auth、Firestore、永続化設定、Routerは読み込まない。locale同期前は英語、同期後は保持している言語を使い、html[lang]を一致させる。認証error stateもcontrolled flowを維持したまま同じAppErrorFallbackを使う。

Boundaryに一か所だけWindowのerrorとunhandledrejectionの監視を置き、ブラウザーが通知した未処理エラーを同じ復旧stateへ渡す。監視はunmountで解除し、resource load errorや処理済みの失敗を昇格させず、元のブラウザー診断を消さない。React自体や復旧画面自体の失敗、通知されない失敗、永久pendingの検知は保証しない。

recovery actionはfull page reloadまたはアプリのキャッシュ削除後のfull page reloadとし、壊れたReact subtreeだけをresetして同じpartial runtime stateを継続しない。validation error、persistence failure、authentication failureなど想定内のfailureは通常のcontrolled error flowで扱い、Error Boundaryをapplication control flowとして使用しない。[PR #1330](https://github.com/her0e1c1/tango/pull/1330)、[PR #1374](https://github.com/her0e1c1/tango/pull/1374)を参照する。

キャッシュ削除はError Boundaryの操作から直接行う。Tangoと一致するscopeのService Workerをunregisterし、そのscopeを名前の末尾に持つWorkbox cacheだけを削除して現在のURLを再読み込みする。Firestore persistence、未同期書き込み、認証状態、設定、他アプリの保存領域は維持する。削除失敗時は通知して復旧画面に留まり、自動再試行しない。エラー検知だけではキャッシュを削除しない。entry moduleの読み込みやReact root成立前の初期化失敗は保証の対象外とする。
