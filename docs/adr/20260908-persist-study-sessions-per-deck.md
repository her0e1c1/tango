# StudySessionをDeckごとにclient persistenceする

Status: Accepted

## Context

StudySessionはactive Study画面だけでなく、Deck Listの再開表示やapplication lifecycleからも参照される。Feature-localなsingletonまたはcomponent stateで所有すると、別のDeckのSessionと共存できず、reloadで失われ、他のconsumerがFeature内部へ依存する。

再開位置はbrowser内のSession状態として扱い、account-syncedなStudyProgressとは保存責務を分ける。この選択ではreload後の再開は可能だが、別browserや別端末へ同じ再開位置を引き継ぐことは保証しない。

## Decision

StudySession Entityを、再開可能なSessionのownerとする。SessionはDeck IDでindexし、各Deckに現在のSessionを最大1つ保持する。他のDeckのSessionは同時に共存できる。

Studyの開始または再開始では新しいSession identityを発行し、対象Card IDのordering snapshot、current position、last studied timeをSession自身が所有する。callerが渡したarrayやその後のCard並び替えにSession orderingを追従させない。

StudySession Storeはschemaでsanitizeしたbrowser-persisted client stateとし、Firestoreへaccount syncしない。consumerにはPublic APIから個別のquery、action、type、およびpure ruleを公開し、Zustand Storeまたはpersist middlewareを公開しない。

Deck削除のworkflowは同じDeck IDのStudySessionをremoveし、Page callerごとのcleanupに委ねない。Remote persistenceの削除が失敗した場合はSessionを維持し、成功後にだけ再開状態を消す。

StudySession Entityは現在位置と利用可能なCardの解決を所有し、Pageはその結果と画面固有のtransient presentation stateを接続する。StudyProgressの永続化とSession advancementの順序は[保存してからSessionを進める決定](./20260908-persist-study-progress-before-session-advancement.md)に従う。[PR #990](https://github.com/her0e1c1/tango/pull/990)、[PR #1067](https://github.com/her0e1c1/tango/pull/1067)、[PR #1113](https://github.com/her0e1c1/tango/pull/1113)、[PR #1132](https://github.com/her0e1c1/tango/pull/1132)、[PR #1435](https://github.com/her0e1c1/tango/pull/1435)を参照する。
