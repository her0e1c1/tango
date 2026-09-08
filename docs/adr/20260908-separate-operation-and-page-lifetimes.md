# OperationとPageのlifetimeを分離する

Status: Accepted

## Context

非同期Operationは開始元Pageのunmount後も完了しうる。pendingや完了通知をPage visitの状態に閉じると、Page再訪時の重複実行、結果通知の消失、過去のvisitによるnavigationが起こる。一方、Page内だけで使う表示状態までOperationと同じlifetimeで保持すると、過去のvisitの状態が残る。

## Decision

form valuesとRHFのsubmission stateはRHFが所有する。表示の開閉、autoplayなど現在のPage visitに閉じるpresentation stateは、React stateまたはPage-ownedな非永続Storeで管理し、visitの切替時にresetする。

Pageをまたいで同一application runtime中に継続すべきpending、attempt identity、retry identityだけを、presentation stateのreset対象から分離した非永続Operation stateで管理する。同じPage Storeに置く場合も、visit cleanupで進行中Operationのlockを解放しない。

Operationは重複実行の抑止、永続化、lock解放、App-wideな結果通知までを所有する。Operation feedbackは非対話Toastで通知し、実行可能なretry callbackをToastへ保持しない。失敗後の再試行は、保持した入力またはretry identityを使ってprimary actionから明示的に開始する。

Pageはnavigation、focus、Page内状態など画面固有の副作用を所有し、開始時と同じPage visitが有効な場合だけ実行する。

Operationのpending guardは同一client runtime内の誤操作を抑止するためのものであり、データ整合性やcross-tab、cross-deviceの排他制御には使用しない。[PR #910](https://github.com/her0e1c1/tango/pull/910)、[PR #924](https://github.com/her0e1c1/tango/pull/924)、[PR #1396](https://github.com/her0e1c1/tango/pull/1396)、[PR #1416](https://github.com/her0e1c1/tango/pull/1416)、[PR #1444](https://github.com/her0e1c1/tango/pull/1444)、[PR #1459](https://github.com/her0e1c1/tango/pull/1459)、[PR #1465](https://github.com/her0e1c1/tango/pull/1465)を参照する。
