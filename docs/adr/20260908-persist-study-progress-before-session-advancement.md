# StudyProgressを保存してからSessionを進める

Status: Accepted

## Context

表示中のCardを先に進めてからStudyProgressの保存に失敗すると、visible sessionとdurable progressが食い違い、rollback用のsnapshot、token、競合処理が必要になる。

## Decision

Card移動を伴うswipeでは、現在のStudySession、Card、Preferencesからdomain planを先に導出し、そのplanが持つStudyProgressを保存してからStudySessionを進める。no-opとStudy終了のeffectはStudyProgress updateを生成しない。

StudyProgressの保存先は対象Cardのpersistence identityに従う。保存に失敗した場合は現在位置を維持し、optimisticなSession移動とrollbackを行わない。

保存成功後のSession移動は、plan作成時のSession identityとpositionが現在も一致する場合だけ適用する。完了状態はStudyProgress保存と最終Session移動の両方が成功した後だけ表示する。[PR #1045](https://github.com/her0e1c1/tango/pull/1045)、[PR #1094](https://github.com/her0e1c1/tango/pull/1094)、[PR #1264](https://github.com/her0e1c1/tango/pull/1264)、[PR #1353](https://github.com/her0e1c1/tango/pull/1353)を参照する。
