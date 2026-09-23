# Card の閲覧フィルターを学習条件から分離する

Status: Accepted

## Decision

Card List と Deck View は、Deck ごとに保存する閲覧専用のフィルターを共有する。学習開始時の条件とは別に保持し、相互に変更しない。

- 選択タグと AND / OR 条件を Deck に保存し、再読み込み後も復元する。他の Deck の条件は引き継がない。
- 未設定・解除後はタグ未選択の OR を既定値とし、学習条件にかかわらず全 Card を閲覧できる。復習期限・枚数制限・シャッフルも閲覧候補を減らさない。
- Card List のソートは画面内の一時状態にする。永続フィルターや学習順序と結び付けず、Deck View にも持ち込まない。

## Context

閲覧に学習用の選定条件を使うと、確認・編集したい Card が復習期限などで隠れる。Deck 単位で閲覧条件を保存することで、学習設定を変えずに一覧とビューを往復できる。

関連PR: [#1754](https://github.com/her0e1c1/tango/pull/1754)、[#1766](https://github.com/her0e1c1/tango/pull/1766)
