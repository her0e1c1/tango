# アプリ全体と Feature 固有の Store を分ける

Status: Superseded

後継: [Page-first FSD の責務境界](./20260830-adopt-page-first-fsd-boundaries.md)

## Decision

- アプリ全体で使う Store は `src/store`、共有 hook は `src/hooks` に置く。
- study Store など Feature 固有の Store は、singleton でもその Feature 内に置く。

## Context

全体で使う設定を設定 Feature に置くと、App や他の Feature がその内部実装に依存してしまう。

関連PR: [#312](https://github.com/her0e1c1/tango/pull/312)
