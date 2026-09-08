# StudySessionをDeckごとにclient persistenceする

Status: Accepted

## Context

StudySessionはactive Study画面だけでなく、Deck Listの再開表示やapplication lifecycleからも参照される。Feature-localなsingletonまたはcomponent stateで所有すると、別のDeckのSessionと共存できず、reloadで失われ、他のconsumerがFeature内部へ依存する。

## Decision

`entities/study-session`を、再開可能なStudySessionのownerとする。SessionはDeck IDでindexし、各Deckに現在のSessionを最大1つ保持する。他のDeckのSessionは同時に共存できる。

Studyの開始または再開始では新しいSession identityを発行し、対象Card IDのordering snapshot、current position、last studied timeをSession自身が所有する。callerが渡したarrayやその後のCard並び替えにSession orderingを追従させない。

StudySession Storeはschemaでsanitizeしたbrowser-persisted client stateとし、Firestoreへaccount syncしない。consumerには個別のqueryとactionだけを公開し、Zustand Storeまたはpersist middlewareを公開しない。

Page workflowはSessionと現在のCardをcomposeし、preparingやinvalidなどのapplication状態とautoplay、answer visibilityなどのtransient UIを所有する。StudyProgressの永続化とSession advancementの順序は別のDecisionに従う。[PR #990](https://github.com/her0e1c1/tango/pull/990)、[PR #1067](https://github.com/her0e1c1/tango/pull/1067)、[PR #1132](https://github.com/her0e1c1/tango/pull/1132)、[PR #1156](https://github.com/her0e1c1/tango/pull/1156)を参照する。
