# LocalとRemoteのpersistence identityを分離する

Status: Accepted

## Context

browser-local dataとaccount-synced dataを同じidentityで扱うと、local dataがFirebase UIDへ依存し、保存先やownerを呼び出し側が推測する必要が生じる。また、Firestoreのoffline cacheとLocal only dataは、どちらもbrowserへ残るが意味が異なる。

## Decision

Local only dataとaccount-synced Remote dataを別のpersistence identityとして扱う。Local dataはbrowser storageに保存しFirebase owner UIDを持たない。Remote dataはFirestoreに保存しauthenticated actorに所有される。

保存先は操作対象Entity自身のpersistence identityから決定する。Remote createのpublic commandにはowner UIDを入力させず、persistence境界でauthenticated actorから導出する。Remote editとdeleteは、Entity ownerとauthenticated actorの不一致をwrite開始前に拒否する。

LocalからRemoteへの移行は明示的なmigration operationとし、暗黙の同期として扱わない。Firestoreのpersistent cacheはRemote dataのoffline copyであり、Local only dataにはしない。[PR #941](https://github.com/her0e1c1/tango/pull/941)、[PR #962](https://github.com/her0e1c1/tango/pull/962)、[PR #1195](https://github.com/her0e1c1/tango/pull/1195)、[PR #1317](https://github.com/her0e1c1/tango/pull/1317)を参照する。
