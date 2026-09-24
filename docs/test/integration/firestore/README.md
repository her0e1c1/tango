# Firestore 結合テスト仕様書

## テストケース索引

### deck

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-DECK-01 | write | 正常系 | [Deck の保存対象だけを新規作成できる](./deck.md#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | 正常系 | [Deck の編集で作成日時と対象外フィールドを維持できる](./deck.md#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | 正常系 | [URL の省略と明示的なクリアを区別できる](./deck.md#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | 正常系 | [Deck と配下 Card をまとめて論理削除できる](./deck.md#firestore-deck-04) |
| FIRESTORE-DECK-05 | batch | 正常系 | [Card がない Deck を論理削除できる](./deck.md#firestore-deck-05) |
| FIRESTORE-DECK-06 | batch | 異常系 | [Deck と配下 Card の削除を原子的に扱う](./deck.md#firestore-deck-06) |

### card-filter

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-FILTER-01 | read | 正常系 | [未設定の Deck は学習条件や他 Deck に依存せず既定値で取得できる](./card-filter.md#firestore-card-filter-01) |
| FIRESTORE-CARD-FILTER-02 | write | 正常系 | [選択タグと AND / OR 条件を保存して復元できる](./card-filter.md#firestore-card-filter-02) |
| FIRESTORE-CARD-FILTER-03 | write | 正常系 | [保存済みフィルターを新しい条件に置き換えられる](./card-filter.md#firestore-card-filter-03) |
| FIRESTORE-CARD-FILTER-04 | write | 正常系 | [解除した状態を保存して復元できる](./card-filter.md#firestore-card-filter-04) |
| FIRESTORE-CARD-FILTER-05 | write | 正常系 | [Deck ごとのフィルターを独立して保存できる](./card-filter.md#firestore-card-filter-05) |
| FIRESTORE-CARD-FILTER-06 | write | 正常系 | [学習用タグ条件の変更で Card フィルターを上書きしない](./card-filter.md#firestore-card-filter-06) |
| FIRESTORE-CARD-FILTER-07 | read | 正常系 | [購読中の変更・解除を対象 Deck に反映できる](./card-filter.md#firestore-card-filter-07) |

### card

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-01 | write | 正常系 | [Card の保存対象だけを新規作成できる](./card.md#firestore-card-01) |
| FIRESTORE-CARD-02 | write | 正常系 | [Card の編集で作成日時と対象外フィールドを維持できる](./card.md#firestore-card-02) |
| FIRESTORE-CARD-03 | write | 正常系 | [Card 作成時に旧個人学習フィールドを除外する](./card.md#firestore-card-03) |
| FIRESTORE-CARD-04 | write | 正常系 | [一括作成の再試行で既存 Card の学習状態を維持する](./card.md#firestore-card-04) |
| FIRESTORE-CARD-05 | batch | 異常系 | [一部の入力失敗を返しつつ有効な Card を保存できる](./card.md#firestore-card-05) |
| FIRESTORE-CARD-06 | write | 異常系 | [保存計画後に物理削除された Card を編集で再作成しない](./card.md#firestore-card-06) |
| FIRESTORE-CARD-07 | write | 正常系 | [Card の削除日時を保存し本文を維持できる](./card.md#firestore-card-07) |
| FIRESTORE-CARD-08 | read | 正常系 | [作成した Card の存在を確認できる](./card.md#firestore-card-08) |

### card-fsrs

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-CARD-FSRS-01 | write | 正常系 | [null と評価済み Card を同じ購読で復元する](./card-fsrs.md#firestore-card-fsrs-01) |
| FIRESTORE-CARD-FSRS-02 | read | 正常系 | [本人の Card だけを復元し停止でクリアする](./card-fsrs.md#firestore-card-fsrs-02) |
| FIRESTORE-CARD-FSRS-03 | read | 異常系 | [不正 FSRS を未評価に読み替えない](./card-fsrs.md#firestore-card-fsrs-03) |
| FIRESTORE-CARD-FSRS-04 | write | 正常系 | [削除 Card の状態を隠し他の Card は維持する](./card-fsrs.md#firestore-card-fsrs-04) |
| FIRESTORE-CARD-FSRS-05 | read | 異常系 | [購読拒否を通知する](./card-fsrs.md#firestore-card-fsrs-05) |
| FIRESTORE-CARD-FSRS-06 | write | 正常系 | [オフライン削除を再接続後も維持する](./card-fsrs.md#firestore-card-fsrs-06) |

### study-session

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-STUDY-SESSION-01 | batch | 正常系 | [途中の学習を保存した順序と位置から再開できる](./study-session.md#firestore-study-session-01) |
| FIRESTORE-STUDY-SESSION-02 | batch | 正常系 | [離脱だけでは終了せず最初からやり直すと旧セッションを中断する](./study-session.md#firestore-study-session-02) |
| FIRESTORE-STUDY-SESSION-03 | write | 正常系 | [最後のカードを完了した操作が重複しても終了記録を変更しない](./study-session.md#firestore-study-session-03) |
| FIRESTORE-STUDY-SESSION-04 | batch | 正常系 | [オフラインで中断した学習を重複なく同期できる](./study-session.md#firestore-study-session-04) |
| FIRESTORE-STUDY-SESSION-05 | batch | 正常系 | [別Deckの未送信書込に妨げられずオフラインでやり直せる](./study-session.md#firestore-study-session-05) |
| FIRESTORE-STUDY-SESSION-06 | read | 異常系 | [不正な保存データが混在しても有効な学習を復元してやり直せる](./study-session.md#firestore-study-session-06) |
| FIRESTORE-STUDY-SESSION-07 | write | 正常系 | [次のカードへ進めた操作が重複してもカードを飛ばさない](./study-session.md#firestore-study-session-07) |
| FIRESTORE-STUDY-SESSION-08 | write | 正常系 | [学習を再開した時刻だけを更新し順序と位置を維持する](./study-session.md#firestore-study-session-08) |
| FIRESTORE-STUDY-SESSION-09 | read | 正常系 | [古い学習の更新時刻に惑わされずDeckごとに最新のセッションを復元する](./study-session.md#firestore-study-session-09) |
| FIRESTORE-STUDY-SESSION-10 | read | 正常系 | [最新の学習が終了済みなら古い未終了セッションも復元しない](./study-session.md#firestore-study-session-10) |
| FIRESTORE-STUDY-SESSION-11 | read | 正常系 | [購読をやり直さず保存された進行位置を反映する](./study-session.md#firestore-study-session-11) |
| FIRESTORE-STUDY-SESSION-12 | read | 正常系 | [保存された終了を反映し別Deckの学習は維持する](./study-session.md#firestore-study-session-12) |
| FIRESTORE-STUDY-SESSION-13 | batch | 正常系 | [オフラインで完了した学習を重複なく同期し再開対象に戻さない](./study-session.md#firestore-study-session-13) |
| FIRESTORE-STUDY-SESSION-14 | write | 正常系 | [学習対象が0枚ならセッションを作成せず既存の学習も中断しない](./study-session.md#firestore-study-session-14) |
| FIRESTORE-STUDY-SESSION-15 | write | 異常系 | [不正なカード順序を同期的に拒否し保存済みの学習を維持する](./study-session.md#firestore-study-session-15) |
| FIRESTORE-STUDY-SESSION-16 | write | 異常系 | [所有者が変わった後の書込を同期的に拒否する](./study-session.md#firestore-study-session-16) |

### study-answer

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-STUDY-ANSWER-01 | batch | 正常系 | [4種類の評価を保存し進捗と位置を1回更新する](./study-answer.md#firestore-study-answer-01) |
| FIRESTORE-STUDY-ANSWER-02 | batch | 異常系 | [保存済みの位置から同じ操作を再実行して回答を増やさない](./study-answer.md#firestore-study-answer-02) |
| FIRESTORE-STUDY-ANSWER-03 | write | 正常系 | [評価では Card の本文と作成日時を維持する](./study-answer.md#firestore-study-answer-03) |
| FIRESTORE-STUDY-ANSWER-04 | batch | 正常系 | [10枚への回答を保存して session を完了する](./study-answer.md#firestore-study-answer-04) |
| FIRESTORE-STUDY-ANSWER-05 | batch | 正常系 | [中断後も回答を保持し別 session で同じ Card に回答できる](./study-answer.md#firestore-study-answer-05) |
| FIRESTORE-STUDY-ANSWER-06 | batch | 正常系 / 異常系 | [途中のスキップは Session だけを前進する](./study-answer.md#firestore-study-answer-06) |
| FIRESTORE-STUDY-ANSWER-07 | batch | 正常系 | [最後のスキップは回答を作らず session を完了する](./study-answer.md#firestore-study-answer-07) |
| FIRESTORE-STUDY-ANSWER-08 | write | 正常系 | [ブラウザのオフライン判定だけで保存を止めない](./study-answer.md#firestore-study-answer-08) |
| FIRESTORE-STUDY-ANSWER-09 | batch | 異常系 | [存在しない session と認証変更で部分保存を残さない](./study-answer.md#firestore-study-answer-09) |
| FIRESTORE-STUDY-ANSWER-10 | batch | 異常系 | [書込拒否後に同じ操作を再試行できる](./study-answer.md#firestore-study-answer-10) |
| FIRESTORE-STUDY-ANSWER-11 | read | 正常系 / 異常系 | [所有者条件を付けて session・Card・Deck ごとの回答を取得する](./study-answer.md#firestore-study-answer-11) |
| FIRESTORE-STUDY-ANSWER-12 | write | 異常系 | [別 UID の回答作成を拒否する](./study-answer.md#firestore-study-answer-12) |
| FIRESTORE-STUDY-ANSWER-13 | write | 正常系 | [回答形式と参照先の検証は Rules では強制しない](./study-answer.md#firestore-study-answer-13) |
| FIRESTORE-STUDY-ANSWER-14 | write | 正常系 | [回答単独の保存では Card.fsrs と Session を更新しない](./study-answer.md#firestore-study-answer-14) |
| FIRESTORE-STUDY-ANSWER-15 | write | 正常系 | [4評価の FSRS を検証して保存する](./study-answer.md#firestore-study-answer-15) |
| FIRESTORE-STUDY-ANSWER-16 | write | 正常系 / 異常系 | [session の所有権とアプリケーションの終了遷移を区別する](./study-answer.md#firestore-study-answer-16) |
| FIRESTORE-STUDY-ANSWER-17 | write | 異常系 | [本人でも保存済み回答を更新・上書き・削除できない](./study-answer.md#firestore-study-answer-17) |
| FIRESTORE-STUDY-ANSWER-18 | read | 異常系 | [存在しない回答 ID の読取を拒否する](./study-answer.md#firestore-study-answer-18) |
| FIRESTORE-STUDY-ANSWER-19 | batch | 異常系 | [公開 Deck でも第三者・匿名・未認証に回答を公開しない](./study-answer.md#firestore-study-answer-19) |
| FIRESTORE-STUDY-ANSWER-20 | batch | 正常系 | [FSRS を復元し本文編集とスキップで維持する](./study-answer.md#firestore-study-answer-20) |

### subscriptions

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-SUBSCRIPTIONS-01 | read | 正常系 | [初回の購読結果から Card 本文を取得できる](./subscriptions.md#firestore-subscriptions-01) |
| FIRESTORE-SUBSCRIPTIONS-02 | batch | 正常系 | [購読中の追加・更新・論理削除を取得結果に反映する](./subscriptions.md#firestore-subscriptions-02) |
| FIRESTORE-SUBSCRIPTIONS-03 | read | 正常系 | [購読停止後の編集完了時にも以前の取得結果を保持する](./subscriptions.md#firestore-subscriptions-03) |

### snapshot

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-SNAPSHOT-01 | read | 正常系 | [空の初期取得結果で以前のデータを置き換える](./snapshot.md#firestore-snapshot-01) |
| FIRESTORE-SNAPSHOT-02 | read | 正常系 | [初期取得で論理削除されていないデータだけを提供する](./snapshot.md#firestore-snapshot-02) |
| FIRESTORE-SNAPSHOT-03 | read | 正常系 | [読取可能な公開データでも別所有者のデータを混在させない](./snapshot.md#firestore-snapshot-03) |
| FIRESTORE-SNAPSHOT-04 | batch | 正常系 | [物理削除されたデータを取得結果から除く](./snapshot.md#firestore-snapshot-04) |
| FIRESTORE-SNAPSHOT-05 | batch | 正常系 | [別クライアントによる追加・更新を購読結果に反映する](./snapshot.md#firestore-snapshot-05) |
| FIRESTORE-SNAPSHOT-06 | read | 異常系 | [不正データを含む取得結果で直前の正常な結果を壊さない](./snapshot.md#firestore-snapshot-06) |
| FIRESTORE-SNAPSHOT-07 | read | 異常系 | [不正データの修正後に同じ購読で正常な結果を取得する](./snapshot.md#firestore-snapshot-07) |
| FIRESTORE-SNAPSHOT-08 | read | 異常系 | [読取拒否を通知し他人の非公開データを提供しない](./snapshot.md#firestore-snapshot-08) |
| FIRESTORE-SNAPSHOT-09 | read | 正常系 | [停止後に到達した更新で取得結果と通知を変更しない](./snapshot.md#firestore-snapshot-09) |
| FIRESTORE-SNAPSHOT-10 | read | 正常系 | [再購読で停止中の変更を含む現在の結果を取得する](./snapshot.md#firestore-snapshot-10) |
| FIRESTORE-SNAPSHOT-11 | read | 異常系 | [不正な初期取得結果を正常な読込完了として扱わない](./snapshot.md#firestore-snapshot-11) |

### rules-deck

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-DECK-01 | read | 正常系 / 異常系 | [削除済みの公開 Deck を第三者が取得できない](./rules-deck.md#firestore-rules-deck-01) |
| FIRESTORE-RULES-DECK-02 | read | 正常系 | [本人による Deck の取得を許可する](./rules-deck.md#firestore-rules-deck-02) |
| FIRESTORE-RULES-DECK-03 | write | 正常系 | [本人による Deck の作成を許可する](./rules-deck.md#firestore-rules-deck-03) |
| FIRESTORE-RULES-DECK-04 | write | 正常系 | [本人による Deck の更新を許可する](./rules-deck.md#firestore-rules-deck-04) |
| FIRESTORE-RULES-DECK-05 | write | 正常系 | [本人による Deck の物理削除を許可する](./rules-deck.md#firestore-rules-deck-05) |
| FIRESTORE-RULES-DECK-06 | read | 異常系 | [他ユーザーによる Deck の非公開データの取得を拒否する](./rules-deck.md#firestore-rules-deck-06) |
| FIRESTORE-RULES-DECK-07 | read | 正常系 | [他ユーザーによる Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-07) |
| FIRESTORE-RULES-DECK-08 | write | 異常系 | [他ユーザーによる Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-08) |
| FIRESTORE-RULES-DECK-09 | write | 異常系 | [他ユーザーによる Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-09) |
| FIRESTORE-RULES-DECK-10 | write | 異常系 | [他ユーザーによる Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-10) |
| FIRESTORE-RULES-DECK-11 | write | 異常系 | [匿名認証による Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-11) |
| FIRESTORE-RULES-DECK-12 | write | 異常系 | [匿名認証による Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-12) |
| FIRESTORE-RULES-DECK-13 | write | 異常系 | [匿名認証による Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-13) |
| FIRESTORE-RULES-DECK-14 | read | 正常系 | [匿名認証による Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-14) |
| FIRESTORE-RULES-DECK-15 | read | 異常系 | [未認証による Deck の非公開データの取得を拒否する](./rules-deck.md#firestore-rules-deck-15) |
| FIRESTORE-RULES-DECK-16 | read | 正常系 | [未認証による Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-16) |
| FIRESTORE-RULES-DECK-17 | write | 異常系 | [未認証による Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-17) |
| FIRESTORE-RULES-DECK-18 | write | 異常系 | [未認証による Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-18) |
| FIRESTORE-RULES-DECK-19 | write | 異常系 | [未認証による Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-19) |
| FIRESTORE-RULES-DECK-20 | write | 異常系 | [本人による所有者 UID の変更・削除を拒否する](./rules-deck.md#firestore-rules-deck-20) |
| FIRESTORE-RULES-DECK-21 | write | 異常系 | [他人の Deck の所有者を自分にする更新・上書きを拒否する](./rules-deck.md#firestore-rules-deck-21) |
| FIRESTORE-RULES-DECK-22 | read | 正常系 | [本人の UID で絞った Deck 一覧取得を許可する](./rules-deck.md#firestore-rules-deck-22) |
| FIRESTORE-RULES-DECK-23 | read | 異常系 | [権限を保証できない Deck 一覧取得を拒否する](./rules-deck.md#firestore-rules-deck-23) |
| FIRESTORE-RULES-DECK-24 | read | 異常系 | [匿名認証による他人の非公開 Deck 取得を拒否する](./rules-deck.md#firestore-rules-deck-24) |

### rules-card

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-CARD-01 | read | 異常系 | [削除済みの公開 Deck 配下または削除済みの Card を第三者が取得できない](./rules-card.md#firestore-rules-card-01) |
| FIRESTORE-RULES-CARD-02 | read | 正常系 | [本人による Card の取得を許可する](./rules-card.md#firestore-rules-card-02) |
| FIRESTORE-RULES-CARD-03 | write | 正常系 | [本人による Card の作成を許可する](./rules-card.md#firestore-rules-card-03) |
| FIRESTORE-RULES-CARD-04 | write | 正常系 | [本人による Card の更新を許可する](./rules-card.md#firestore-rules-card-04) |
| FIRESTORE-RULES-CARD-05 | write | 正常系 | [本人による Card の物理削除を許可する](./rules-card.md#firestore-rules-card-05) |
| FIRESTORE-RULES-CARD-06 | read | 異常系 | [他ユーザーによる Card の非公開データの取得を拒否する](./rules-card.md#firestore-rules-card-06) |
| FIRESTORE-RULES-CARD-07 | read | 正常系 | [他ユーザーによる Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-07) |
| FIRESTORE-RULES-CARD-08 | write | 異常系 | [他ユーザーによる Card の作成を拒否する](./rules-card.md#firestore-rules-card-08) |
| FIRESTORE-RULES-CARD-09 | write | 異常系 | [他ユーザーによる Card の更新を拒否する](./rules-card.md#firestore-rules-card-09) |
| FIRESTORE-RULES-CARD-10 | write | 異常系 | [他ユーザーによる Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-10) |
| FIRESTORE-RULES-CARD-11 | write | 異常系 | [匿名認証による Card の作成を拒否する](./rules-card.md#firestore-rules-card-11) |
| FIRESTORE-RULES-CARD-12 | write | 異常系 | [匿名認証による Card の更新を拒否する](./rules-card.md#firestore-rules-card-12) |
| FIRESTORE-RULES-CARD-13 | write | 異常系 | [匿名認証による Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-13) |
| FIRESTORE-RULES-CARD-14 | read | 正常系 | [匿名認証による Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-14) |
| FIRESTORE-RULES-CARD-15 | read | 異常系 | [未認証による Card の非公開データの取得を拒否する](./rules-card.md#firestore-rules-card-15) |
| FIRESTORE-RULES-CARD-16 | read | 正常系 | [未認証による Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-16) |
| FIRESTORE-RULES-CARD-17 | write | 異常系 | [未認証による Card の作成を拒否する](./rules-card.md#firestore-rules-card-17) |
| FIRESTORE-RULES-CARD-18 | write | 異常系 | [未認証による Card の更新を拒否する](./rules-card.md#firestore-rules-card-18) |
| FIRESTORE-RULES-CARD-19 | write | 異常系 | [未認証による Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-19) |
| FIRESTORE-RULES-CARD-20 | write | 異常系 | [旧個人学習フィールドを Card に書き戻せない](./rules-card.md#firestore-rules-card-20) |
| FIRESTORE-RULES-CARD-21 | write | 正常系 / 異常系 | [本人の FSRS 更新を許可し Card の同一性を維持する](./rules-card.md#firestore-rules-card-21) |
| FIRESTORE-RULES-CARD-22 | write | 正常系 / 異常系 | [公開 Card の FSRS を公開し他人の書込を拒否する](./rules-card.md#firestore-rules-card-22) |
| FIRESTORE-RULES-CARD-23 | write | 正常系 / 異常系 | [FSRS 外形と所有権・削除状態を確認する](./rules-card.md#firestore-rules-card-23) |
| FIRESTORE-RULES-CARD-24 | write | 異常系 | [評価更新で物理削除 Card を再作成しない](./rules-card.md#firestore-rules-card-24) |

### rules-study-session

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-STUDY-SESSION-01 | batch | 正常系 | [本人が private session を作成・取得・更新できる](./rules-study-session.md#firestore-rules-study-session-01) |
| FIRESTORE-RULES-STUDY-SESSION-02 | batch | 異常系 | [公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない](./rules-study-session.md#firestore-rules-study-session-02) |
| FIRESTORE-RULES-STUDY-SESSION-03 | write | 異常系 | [本人でも session の所有者変更と物理削除はできない](./rules-study-session.md#firestore-rules-study-session-03) |

### rules-study-answer

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-RULES-STUDY-ANSWER-01 | batch | 正常系 | [回答作成と Card.fsrs・session 更新を同じ batch で許可する](./rules-study-answer.md#firestore-rules-study-answer-01) |
| FIRESTORE-RULES-STUDY-ANSWER-02 | write | 正常系 | [回答 ID と完了後の回答順序はアプリケーションの責務とする](./rules-study-answer.md#firestore-rules-study-answer-02) |
| FIRESTORE-RULES-STUDY-ANSWER-03 | write | 異常系 | [保存済みの回答履歴は本人でも更新・削除できない](./rules-study-answer.md#firestore-rules-study-answer-03) |
| FIRESTORE-RULES-STUDY-ANSWER-04 | batch | 異常系 | [他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する](./rules-study-answer.md#firestore-rules-study-answer-04) |

### study-history

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-STUDY-HISTORY-01 | batch | 正常系 / 異常系 | [期間と Deck による履歴取得を cache と権限境界を含めて確認できる](./study-history.md#firestore-study-history-01) |
| FIRESTORE-STUDY-HISTORY-02 | read | 正常系 / 異常系 | [回答履歴の期間・順序・上限・cacheを確認する](./study-history.md#firestore-study-history-02) |
| FIRESTORE-STUDY-HISTORY-03 | read | 異常系 | [回答履歴の入力境界を検証する](./study-history.md#firestore-study-history-03) |
| FIRESTORE-STUDY-HISTORY-04 | batch | 正常系 | [回答の追加と同期状態を購読で受け取り解除後は更新しない](./study-history.md#firestore-study-history-04) |
