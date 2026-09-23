# FSRS を Card に保持し、回答・Session と一括保存する

Status: Accepted

[StudyProgress を保存してから Session を進める決定](./20260908-persist-study-progress-before-session-advancement.md)を置き換える。

## Decision

所有者の学習状態は `Card.fsrs` に保持し、`again / hard / good / easy` の解釈は FSRS に統一する。独自の相対 difficulty と、別の CardStudyState Entity は使わない。

- 評価時は Card の FSRS・変更時刻、新しい変更不可の StudyAnswer、Session の進行・完了を同じ batch に入れる。Page が処理を組み立て、各 Entity の API が自身の書き込みを担う。
- Skip は Session だけを進め、回答と FSRS 更新を作らない。操作完了は[ローカル snapshot への反映](./20260924-unify-persistence-through-firestore-cache.md)で判断し、サーバー確認待ちの二段階更新は行わない。
- 内容編集と更新インポートは既存の FSRS を保ち、新規・複製 Card は未評価から始める。不正な状態を未評価として黙って復旧せず、旧学習状態の自動移行も行わない。
- 公開 Card を読める利用者は、その FSRS も読める。この構成は、共有 Card に対する利用者別の非公開学習状態を提供しない。
- 原子性はアプリが一つの batch に含めた書き込みに対する保証とする。単一タブで順番に操作する範囲を対象とし、複数端末の競合調停や、独自クライアントの進行・重複防止まで Rules で保証しない。

## Context

PR #1712 では学習状態を CardStudyState に分離したが、PR #1726 で Card へ戻した。現在の所有者・利用範囲では、専用の購読・結合・削除処理を持つより部分更新の方が単純になる。回答・学習状態・進行の部分保存も避ける。

関連PR: [#1666](https://github.com/her0e1c1/tango/pull/1666)、[#1692](https://github.com/her0e1c1/tango/pull/1692)、[#1712](https://github.com/her0e1c1/tango/pull/1712)、[#1726](https://github.com/her0e1c1/tango/pull/1726)
