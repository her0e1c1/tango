# Card の閲覧フィルターを学習条件から分離する

Status: Accepted

## Decision

Card List と Deck View は、Deck ごとの閲覧フィルターを共有する。学習用のタグ・復習期限・件数・シャッフルとは独立させ、FSRS だけを例外扱いしない。

- 選択タグと AND / OR 条件を、Deck の学習条件とは別に自動保存する。他の Deck の条件は混ぜない。
- 未設定時とクリア後はタグ未選択・OR 条件とし、対象 Deck の全 Card を表示する。クリアも保存し、再読込後に同じ条件へ戻す。
- 並び順は閲覧フィルターに含めず、Card List 内だけの一時的な表示操作にする。Deck View と学習順序は変えない。

## Context

閲覧に学習条件を流用すると、復習対象でない Card や件数制限から外れた Card を確認できない。閲覧対象と学習対象を別々に決め、閲覧フィルターだけを二つの閲覧画面で共有する。

関連PR: [#1754](https://github.com/her0e1c1/tango/pull/1754)、[#1766](https://github.com/her0e1c1/tango/pull/1766)
