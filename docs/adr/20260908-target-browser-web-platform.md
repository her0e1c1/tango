# Browser Web Platformを対象とする

Status: Accepted

## Context

Webとnative clientの両方を同じfrontendで維持すると、runtime、navigation、storage、UI component、およびrelease経路にplatform分岐が必要になり、保守対象が増える。

## Decision

Tangoのclientはbrowser上で動作するWeb applicationだけを対象とする。ExpoおよびReact Nativeとの互換性は維持しない。

mobile利用はresponsive Web UIとPWAの範囲で対応する。native applicationを再導入する場合は、共有範囲とrelease責務を別のarchitecture decisionとして記録する。[PR #76](https://github.com/her0e1c1/tango/pull/76)を参照する。
