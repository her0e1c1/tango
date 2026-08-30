# Firestoreの購読をリモート状態の正とする

Status: Accepted

## Context

リモートEntityの状態を、query cache、mutation完了時のStore更新、Firestore listenerなど複数の経路から更新すると、状態の反映順序と同期元が分かれ、同じデータが食い違う可能性がある。

## Decision

Firestoreの`onSnapshot`から受け取るsnapshotを、リモートEntity状態の正とする。

SharedはFirebaseの汎用初期化を所有する。対象Entityは、自身に関係するFirestore schema、parse、CRUD、query、subscription adapter、およびリモートEntity Storeを所有する。Appは、認証状態に応じてsubscriptionを開始・停止するlifecycleを所有する。

リモートmutationはEntityのFirestore API経由で書き込む。リモートEntity Storeをoptimistic updateまたはmutation完了時に直接更新せず、Firestore subscriptionのsnapshotによって更新する。

この一方向のdata flowに例外を設ける場合は、別のarchitecture decisionとして記録する。[PR #1200](https://github.com/her0e1c1/tango/pull/1200)を参照する。
