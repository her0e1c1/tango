# 学習状態を Card.fsrs に統合する

Status: Accepted

## Decision

所有者の FSRS 学習状態を `Card.fsrs` に保存し、独立した学習状態 Entity・ドキュメント・購読・結合処理を持たない。

- 評価時は Card の `fsrs` と `updatedAt` だけを部分更新する。Card の内容編集・更新インポートでは学習状態を保ち、新規・複製 Card は未評価から始める。
- 評価による Card の学習状態・StudyAnswer・StudySession の進捗は、同じ書き込みバッチにまとめる。スキップでは評価と回答記録を作らず、Session の進捗だけを更新する。
- 操作完了は既存の SDK ローカル反映契約に従い、サーバー保存完了とは区別する。
- Card と学習状態は同じ読み取り権限を持つ。公開 Card の閲覧者は FSRS も読めることを受け入れ、書き込み権限は所有者に限定する。

[StudyProgress を保存してから Session を進める方針](./20260908-persist-study-progress-before-session-advancement.md)は、この一括保存に置き換える。[Entity と保存ドキュメントの境界](./20260908-separate-domain-entities-from-persistence-documents.md)の一般原則は維持し、Card と学習状態を別 Entity にする個別の判断だけを変更する。

## Context

Card と学習状態は所有者・読み取り権限が同じで、独立した購読や結合を維持する必要がない。部分更新で内容編集との責務を分けられるため、保存と読み取りを Card に集約した。旧データの移行・互換処理は導入時の対象外とし、既存 Card にも現行スキーマを要求する。

関連PR: [#1726](https://github.com/her0e1c1/tango/pull/1726)
