# Firestoreの購読をリモート状態の正とする

Status: Accepted

## Context

リモートEntityの状態を、query cache、mutation完了時のStore更新、Firestore listenerなど複数の経路から更新すると、状態の反映順序と同期元が分かれ、同じデータが食い違う可能性がある。

invalid documentを黙って除外すると、不完全なcollectionを正常なread結果としてconsumerへ渡してしまう。このためsnapshot全体を検証し、1件でもinvalidなら正常なdocumentの更新も公開できないという制約を受け入れる。

## Decision

Firestoreの`onSnapshot`から受け取るsnapshotを、リモートEntity状態の正とする。

SharedはFirebaseの汎用初期化を所有する。対象Entityは、自身に関係するFirestore schema、parse、CRUD、query、subscription adapter、およびリモートEntity Storeを所有する。CRUDという理由だけでFeature sliceを作らない。Appは、認証状態に応じてsubscriptionを開始・停止するlifecycleを所有する。

各listener callbackでは、受け取ったsnapshot全体をatomicにparseし、accepted snapshotでRemote collection全体をreplaceする。`documentChanges()`によるincremental mirrorやmutation metadataの別Storeを維持しない。invalid documentを含むsnapshotはpartial publishせず、subscriptionのerror callbackへ渡す。

現行実装ではsubscription errorはconsoleへ記録され、直前のRemote collectionは維持される。利用者向けのerror表示はなく、次のvalid snapshotまたはscope cleanupまで古い値が残りうる。これは現在のerror handlingの制約であり、将来の利用者向けerror表示を禁止する決定ではない。

Firestoreはpublic SDKが提供するpersistent cacheを使用し、private APIによる検査や独自のreadiness runtimeを作らない。application renderingはFirestore初期化の完了を待たない。

リモートmutationはEntityのFirestore API経由で書き込む。リモートEntity Storeをoptimistic updateまたはmutation完了時に直接更新せず、Firestore subscriptionのsnapshotによって更新する。この規則はRemote dataに適用し、Local only Entityのbrowser store更新には適用しない。

個別のRemote Card削除は`deletedAt`を持つtombstoneとして保存し、Card subscriptionがactive collectionから除外する。Deck aggregateの削除は子Card documentを先にphysical deleteしてからDeck documentを削除できる。どちらの削除policyも対象Entityのpersistence APIが所有し、Remote Storeへの反映はlistenerに委ねる。

この一方向のdata flowに例外を設ける場合は、別のarchitecture decisionとして記録する。[PR #616](https://github.com/her0e1c1/tango/pull/616)、[PR #759](https://github.com/her0e1c1/tango/pull/759)、[PR #777](https://github.com/her0e1c1/tango/pull/777)、[PR #833](https://github.com/her0e1c1/tango/pull/833)、[PR #839](https://github.com/her0e1c1/tango/pull/839)、[PR #1200](https://github.com/her0e1c1/tango/pull/1200)を参照する。
