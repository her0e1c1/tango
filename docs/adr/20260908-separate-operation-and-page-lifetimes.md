# OperationとPageのlifetimeを分離する

Status: Accepted

## Context

非同期Operationは開始元Pageのunmount後も完了しうる。pendingや完了通知をPageのlocal stateに閉じると、Page再訪時の重複実行、結果通知の消失、過去のvisitによるnavigationが起こる。

## Decision

Pageをまたいで同一アプリ実行中に継続すべきpending、attempt identity、retry identityは、永続化しないOperation storeで管理する。

Operationは重複実行の抑止、永続化、lock解放、App-wideな結果通知までを所有する。Pageはnavigation、focus、Page内状態など画面固有の副作用を所有し、開始時と同じPage visitが有効な場合だけ実行する。

このpending guardは同一client内の誤操作を抑止するためのものであり、データ整合性やcross-tab、cross-deviceの排他制御には使用しない。[PR #1396](https://github.com/her0e1c1/tango/pull/1396)、[PR #1444](https://github.com/her0e1c1/tango/pull/1444)、[PR #1459](https://github.com/her0e1c1/tango/pull/1459)、[PR #1465](https://github.com/her0e1c1/tango/pull/1465)を参照する。
