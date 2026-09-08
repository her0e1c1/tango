# StudySessionをDeckごとにclient persistenceする

Status: Accepted

## Context

StudySessionはactive Study画面だけでなく、Deck Listの再開表示やapplication lifecycleからも参照される。Feature-localなsingletonまたはcomponent stateで所有すると、別のDeckのSessionと共存できず、reloadで失われ、他のconsumerがFeature内部へ依存する。

## Decision

`entities/study-session`を、再開可能なStudySessionのownerとする。SessionはDeck IDでindexし、各Deckに現在のSessionを最大1つ保持する。他のDeckのSessionは同時に共存できる。

Studyの開始または再開始では新しいSession identityを発行し、対象Card IDのordering snapshot、current position、last studied timeをSession自身が所有する。callerが渡したarrayやその後のCard並び替えにSession orderingを追従させない。

StudySession Storeはschemaでsanitizeしたbrowser-persisted client stateとし、Firestoreへaccount syncしない。consumerにはPublic APIから個別のquery、action、type、およびpure ruleを公開し、Zustand Storeまたはpersist middlewareを公開しない。

Deck削除は`deleteDeck`の一部として同じDeck IDのStudySessionをremoveし、Page callerごとのcleanupに委ねない。Remote persistenceの削除が失敗した場合はSessionを維持し、成功後にだけ再開状態を消す。

StudySession Entityのpure ruleは現在位置をavailable Cardsへ解決し、`preparing`、`invalid`、`studying`を返す。Page queryはその結果をDeckやPreferencesとcomposeし、Page workflowはautoplay、answer visibility、help、completionなどのtransient presentation stateを所有する。StudyProgressの永続化とSession advancementの順序は別のDecisionに従う。[PR #990](https://github.com/her0e1c1/tango/pull/990)、[PR #1067](https://github.com/her0e1c1/tango/pull/1067)、[PR #1113](https://github.com/her0e1c1/tango/pull/1113)、[PR #1132](https://github.com/her0e1c1/tango/pull/1132)、[PR #1435](https://github.com/her0e1c1/tango/pull/1435)を参照する。
