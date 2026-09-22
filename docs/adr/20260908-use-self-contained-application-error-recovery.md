# Application error recoveryをself-containedにする

Status: Accepted

## Context

unexpected render errorがroot treeを壊すと、通常のPageやProviderを使うrecovery UIも表示できない。Data Routerが扱うroute errorとReact tree全体のerrorは発生境界が異なるが、利用者には一貫した回復手段が必要である。

## Decision

単一のReact rootをapplication ProviderとRouterの外側にあるAppErrorBoundaryで包む。React.lazyとSuspenseの単一起動Promiseで初期化要求を処理してから通常のbootstrapを遅延読み込みし、rejectをBoundaryへ渡す。初期化の成功・失敗時は通常bootstrapへ進まず、成功時はページ遷移で終了する。DOM fallbackは持たない。Data Routerのroot routeにも`errorElement`を設定し、route-level errorとroot render errorで同じapplication fallbackを使用する。

fallbackはSharedのpresentational UIとProvider外で使えるi18n instance、復旧文言と明示的な初期化操作に依存する。Auth、Firestore、永続化設定、Routerは読み込まない。locale同期前は英語、同期後は保持している言語を使い、html[lang]を一致させる。認証error stateもcontrolled flowを維持したまま同じAppErrorFallbackを使う。

Boundaryに一か所だけWindowのerrorとunhandledrejectionの監視を置き、ブラウザーが通知した未処理エラーを同じ復旧stateへ渡す。監視はunmountで解除し、resource load errorや処理済みの失敗を昇格させず、元のブラウザー診断を消さない。React自体や復旧画面自体の失敗、通知されない失敗、永久pendingの検知は保証しない。

recovery actionはfull page reloadまたは確認付きキャッシュ初期化とし、壊れたReact subtreeだけをresetして同じpartial runtime stateを継続しない。validation error、persistence failure、authentication failureなど想定内のfailureは通常のcontrolled error flowで扱い、Error Boundaryをapplication control flowとして使用しない。[PR #1330](https://github.com/her0e1c1/tango/pull/1330)、[PR #1374](https://github.com/her0e1c1/tango/pull/1374)を参照する。

初期化は要求を記録してページ遷移し、次のdocumentで通常Auth・購読・キャッシュ送信より先に行う。Firestore persistence、設定、対象scopeのService WorkerとWorkbox cacheを削除してログアウトする。同期済みcloud dataと他アプリの保存領域は維持する。エラー検知だけでは初期化しない。
