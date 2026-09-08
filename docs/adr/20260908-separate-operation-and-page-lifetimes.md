# OperationとPageのlifetimeを分離する

Status: Accepted

## Context

非同期Operationは開始元Pageのunmount後も完了しうる。pendingや完了通知をPageのlocal stateに閉じると、Page再訪時の重複実行、結果通知の消失、過去のvisitによるnavigationが起こる。一方、Page内だけで使う表示状態までStoreへ移すと、lifetimeが不必要に長くなる。

## Decision

form values、RHFのsubmission state、表示の開閉、autoplayなど、現在のPageまたはcomponentに閉じる状態はReactまたはRHFで所有する。

Pageをまたいで同一application runtime中に継続すべきpending、attempt identity、retry identityだけを、永続化しないOperation Storeで管理する。

Operationは重複実行の抑止、永続化、lock解放、App-wideな結果通知までを所有する。Operation feedbackは非対話Toastで通知し、実行可能なretry callbackをToastへ保持しない。失敗後の再試行は、保持した入力またはretry identityを使ってprimary actionから明示的に開始する。

Pageはnavigation、focus、Page内状態など画面固有の副作用を所有し、開始時と同じPage visitが有効な場合だけ実行する。

Operationのpending guardは同一client runtime内の誤操作を抑止するためのものであり、データ整合性やcross-tab、cross-deviceの排他制御には使用しない。[PR #910](https://github.com/her0e1c1/tango/pull/910)、[PR #924](https://github.com/her0e1c1/tango/pull/924)、[PR #1396](https://github.com/her0e1c1/tango/pull/1396)、[PR #1416](https://github.com/her0e1c1/tango/pull/1416)、[PR #1444](https://github.com/her0e1c1/tango/pull/1444)、[PR #1459](https://github.com/her0e1c1/tango/pull/1459)、[PR #1465](https://github.com/her0e1c1/tango/pull/1465)を参照する。
