# StudySessionをDeckごとにclient persistenceする

Status: Accepted

## Context

StudySessionはactive Study画面だけでなく、Deck Listの再開表示やapplication lifecycleからも参照される。Feature-localなsingletonまたはcomponent stateで所有すると、別のDeckのSessionと共存できず、reloadで失われ、他のconsumerがFeature内部へ依存する。

## Decision

`entities/study-session`を、再開可能なStudySessionのownerとする。SessionはDeck IDでindexし、各Deckに現在のSessionを最大1つ保持する。他のDeckのSessionは同時に共存できる。

Studyの開始または再開始では新しいSession identityを発行し、対象Card IDのordering snapshot、current position、last studied timeをSession自身が所有する。callerが渡したarrayやその後のCard並び替えにSession orderingを追従させない。

StudySession Storeはschemaでsanitizeしたbrowser-persisted client stateとし、Firestoreへaccount syncしない。consumerにはPublic APIから個別のquery、action、type、およびpure ruleを公開し、Zustand Storeまたはpersist middlewareを公開しない。

StudySession Entityは現在位置のCard解決と`preparing`、`invalid`、`studying`のdomain resolutionを所有する。Page queryはその結果をDeckやPreferencesとcomposeし、Page workflowはautoplay、answer visibility、help、completionなどのtransient presentation stateを所有する。StudyProgressの永続化とSession advancementの順序は別のDecisionに従う。[PR #990](https://github.com/her0e1c1/tango/pull/990)、[PR #1067](https://github.com/her0e1c1/tango/pull/1067)、[PR #1132](https://github.com/her0e1c1/tango/pull/1132)、[PR #1435](https://github.com/her0e1c1/tango/pull/1435)を参照する。
