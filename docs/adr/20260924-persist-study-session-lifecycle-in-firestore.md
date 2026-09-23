# StudySession の開始・進行・終了を Firestore に保存する

Status: Accepted

[StudySession をブラウザーだけに保存する決定](./20260908-persist-study-sessions-per-deck.md)を置き換える。

## Decision

Session ID ごとのドキュメントに所有者・Deck・Card の順序・現在位置・開始と終了の情報を保存する。再開用の状態は購読から復元し、別のブラウザー保存を正として併用しない。

- Deck ごとに最新の Session を選び、終了済みなら再開候補にしない。古い未終了 Session を代わりに復活させず、他の Deck の Session は維持する。
- 再開始は新しい Session を作り、把握している直前の Session を中断済みにする。遅れて届く進捗更新では終了状態を解除しない。
- [共通の Firestore キャッシュ](./20260924-unify-persistence-through-firestore-cache.md)を使い、匿名利用は端末内、連携済みアカウントは同期済みの位置を別端末でも復元できるようにする。
- 同時に複数端末で開始・進行した場合の競合調停や、未知の古い Session の一括終了は保証しない。

回答時の保存は[Card・回答・Session の一括書き込み](./20260924-store-fsrs-on-card-with-atomic-study-writes.md)に従う。

## Context

ブラウザー内だけの再開位置では、同期した Card と Session の進行が別々になる。学習の開始・終了を保存することで、再開と履歴集計に同じ Session の記録を使える。

関連PR: [#1654](https://github.com/her0e1c1/tango/pull/1654)、[#1667](https://github.com/her0e1c1/tango/pull/1667)、[#1732](https://github.com/her0e1c1/tango/pull/1732)
