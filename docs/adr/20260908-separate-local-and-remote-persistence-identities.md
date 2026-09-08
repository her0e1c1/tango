# LocalとRemoteのpersistence identityを分離する

Status: Accepted

## Context

browser-local dataとaccount-synced dataを同じidentityで扱うと、local dataがFirebase UIDへ依存し、保存先やownerを呼び出し側が推測する必要が生じる。また、Firestoreのoffline cacheとLocal only dataは、どちらもbrowserへ残るが意味が異なる。

## Decision

Local only dataとaccount-synced Remote dataを別のpersistence identityとして扱う。Local dataはbrowser storageに保存しFirebase owner UIDを持たない。Remote dataはFirestoreに保存しauthenticated actorに所有される。

Deck自身の保存済みpersistence modeを、Deckとその子Cardの保存先の正とする。presentation codeは個別Cardの保存先やRemote ownerを選択しない。

DeckとCardのpersistence境界では、Remote Deck createはauthenticated actorからownerを導出し、Remote Card createはauthenticated actorと所有Deckからownerを導出する。Remote DeckおよびRemote Cardのeditとdeleteは、Entity ownerとauthenticated actorの不一致をwrite開始前に拒否する。このownership検証を、同じphysical documentを共有する別Entityのwriteへ暗黙に一般化しない。

LocalからRemoteへの移行は、IDを維持する明示的な一方向Operationとする。親Deckとすべての子CardのRemote writeが成功するまでLocal copyを削除せず、失敗後のretryは同じIDへ再実行する。RemoteからLocalへの暗黙または双方向の移行は行わない。

Firestoreのpersistent cacheはRemote dataのoffline copyであり、Local only dataとして扱わない。[PR #941](https://github.com/her0e1c1/tango/pull/941)、[PR #962](https://github.com/her0e1c1/tango/pull/962)、[PR #1089](https://github.com/her0e1c1/tango/pull/1089)、[PR #1195](https://github.com/her0e1c1/tango/pull/1195)、[PR #1317](https://github.com/her0e1c1/tango/pull/1317)を参照する。
