# Fail-closedなaggregate Test gateを使用する

Status: Accepted

## Context

branch protectionが多数のjob名へ直接依存すると、workflowの分割や名称変更でrequired checkが不安定になる。また、failure、cancellation、想定外のskipを成功として扱うと、不完全な検証結果でmergeできる。

## Decision

branch protectionが参照する安定したcheckを`Test`とし、final aggregate jobがcanonicalなBuild、Code quality、Unit coverage、E2E、Integration、Storybook、Sample、およびDependency Reviewの結果を検査する。

aggregate jobは依存jobの成否にかかわらず実行し、failure、cancellation、想定外のskipが1つでもあればfailする。event種別上実行対象でないjobだけ、明示した条件でskipを許可する。

同一Pull Requestの古いrunだけをcancelし、manual runとreusable workflow callerは独立させる。各検証jobは診断と再利用のため独立したまま保つ。[PR #1341](https://github.com/her0e1c1/tango/pull/1341)、[PR #1432](https://github.com/her0e1c1/tango/pull/1432)を参照する。
