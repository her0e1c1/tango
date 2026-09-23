# StudyProgress を保存してから Session を進める

Status: Accepted

## Decision

Card を移動するスワイプは、次の順で処理する。

1. 現在の StudySession・Card・Preferences から、保存内容と移動先を表すドメインの plan を作る。
2. Card の保存先の識別情報に従って StudyProgress を保存する。失敗したら現在位置を維持する。
3. plan 作成時の Session 識別子と位置が今も一致する場合だけ、Session を進める。

何もしない操作と学習終了の effect では、StudyProgress の更新を生成しない。先に画面を進めてから取り消す処理は行わず、完了表示は保存と最後の Session 移動の両方が成功した後に出す。

## Context

画面を先に進めて保存に失敗すると、表示と保存済みの進捗が食い違い、巻き戻しや競合処理が必要になる。

関連PR: [#1045](https://github.com/her0e1c1/tango/pull/1045)、[#1094](https://github.com/her0e1c1/tango/pull/1094)、[#1264](https://github.com/her0e1c1/tango/pull/1264)、[#1353](https://github.com/her0e1c1/tango/pull/1353)
