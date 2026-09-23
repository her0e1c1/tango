# Firestore 結合テスト仕様書

アプリケーションと Firestore の境界で保証する保存・取得・購読・権限制御を記述する。
ブラウザ経由の利用者導線は [E2E 仕様書](../../e2e/README.md)、Firestore 境界の契約と ID はこのディレクトリを参照する。

## ドキュメント構成

| 文書 | 責務 | 対応テスト |
| --- | --- | --- |
| この README | 実行方法、共通前提、記述・ID 規約、索引、未検証項目 | Firestore 結合テスト全体 |
| [Deck](./deck.md) | 作成、部分更新、URL の扱い、Deck と配下 Card の原子的な論理削除 | `deck.spec.ts` |
| [Card](./card.md) | 作成、部分更新、本文と FSRS の更新、一括保存、論理削除 | `card.spec.ts` |
| [Card.fsrs](./card-fsrs.md) | 初期購読、検証、UID 分離、削除 | `card-fsrs.spec.ts` |
| [StudyAnswer](./study-answer.md) | 回答・スキップ・再試行と履歴の権限制御 | `study-answer.spec.ts` |
| [StudySession](./study-session.md) | 順序・位置の復元、開始・中断・完了、オフライン queue | `study-session.spec.ts` |
| [Subscriptions](./subscriptions.md) | 初期 snapshot、変更の store 反映、購読解除 | `subscriptions.spec.ts` |
| [Rules / Deck](./rules-deck.md) / [Card](./rules-card.md) / [StudySession](./rules-study-session.md) / [StudyAnswer](./rules-study-answer.md) | entity ごとの認証主体と SDK 操作の許可・拒否 | `rules.spec.ts` |
| [Study History](./study-history.md) | 開始・完了履歴と回答履歴の期間・Deck 条件、cache、権限 | `study-history.spec.ts` |

対応テストはすべて [`test/integration/firestore`](../../../test/integration/firestore) に置く。
上表の11ファイルを対象とし、各仕様書のケースを下記の索引に掲載する。
local→remote 移行や local-only session 非送信のケースは、対象テストにはないため検証済みとして記載しない。

## 実行方法

リポジトリルートで、開発環境を初回設定してから既存タスクを使う。

```bash
mise install
mise run init
mise run test-integration
```

`test-integration` は sample build と Docker Compose の Firestore Emulator 起動後に、Vitest の integration project を実行する。
ホスト・ポートは既存の `VITE_DB_HOST` / `VITE_DB_PORT` 設定を使う。本番 Firebase に接続しない。
Firestore 以外の既存 integration test も同じタスクで実行されるが、この仕様書の対象には含めない。
テストタイトルやコードを変更した場合は `mise run check` も実行する。新しい runner や CI job は追加しない。

## 検証境界と共通前提

### Adapter と Rules の分担

| 対象 | 検証する境界 | データ準備と認証 |
| --- | --- | --- |
| 保存・購読 Adapter | 実際のアプリケーション操作から、Emulator の保存値・SDK cache・購読結果・store まで | 既存の `test/initializeTestFirestore.ts` で project `test` に接続し、UID `uid`・非匿名 provider `google.com` の token を使用する |
| StudyAnswer 保存・認可 | 実際の保存処理と SDK 操作から、回答・Card.fsrs・session の保存結果と Rules まで | project `test-study-answer`、非匿名認証 UID `answer-owner`。各ケース前にデータと store を初期化し、終了時に Rules 環境を cleanup する |
| Security Rules | 実際の `firestore.rules` に対する SDK 操作の許可・拒否 | `rules.spec.ts` が project `test-rule` に Rules を読み込む。事前データだけ Rules 無効化 context で準備し、検証操作は各認証 context で実行する |

Firebase 初期化先やアプリケーションの認証値の差し替えはテスト側で行うが、検証対象の Firestore API・購読・永続化を mock しない。
Adapter の入力 validation と Rules の認可を混同しない。例えば不正な Card 入力が Adapter で拒否されても、Rules がその型を検証する保証にはならない。
物理削除、`deletedAt` による論理削除、store からの非表示、`permission-denied` による読取拒否は別の結果として記述する。

### 事前データ・分離・cleanup

- 共通の認証状態は各仕様書に、ケース固有の保存値と親子関係は Given に記載する。別の fixture ファイルや fixture 規約は作らない。既存のテスト用 factory はそのまま利用する。
- Adapter テストは UUID の Deck / Card / session ID などでデータを分離する。Study History は固有の短い期間と Deck ID で query 結果を分離する。Rules / StudyAnswer テストは各ケース前に専用 project のデータを消去する。
- store を使うケースは対象 store を初期化する。購読テストは返された解除関数を呼び、StudySession / Subscriptions / Study History は終了時に Firebase app を破棄する。
- オフラインのケースは SDK のネットワークを無効化し、終了時に有効へ戻す。StudySession は cleanup で pending writes も待つ。タイマーによる自動中断や複数タブ・複数端末を前提にしない。

### 非同期結果の確認

Adapter の Promise 完了は local 反映であり、remote への送信完了とは限らない。
送信後の保存値を確認する箇所では `waitForPendingWrites` を併用する。`getDoc` 自体を server 専用読取とは扱わない。
購読結果は `vi.waitFor` で対象 ID・値への反映を待つ。Study History のオンライン取得は `fromCache: false` の snapshot を待つ。
オフラインの検証には cache の読取と再接続後の確認を区別して記載する。

同じ SDK インスタンス内の store 初期化・再購読は、ブラウザ reload や新規クライアントの検証ではない。
ブラウザ上の永続 cache と利用者導線は E2E、純粋な計算ロジックは unit test の責務とし、ここへ複製しない。

## 記述・ID 規約

E2E と同じく「目的」「テストケース一覧表」「ID の明示的なアンカーと見出し」「カテゴリ」「Given / When / Then」で記述する。
各仕様書から対応テストファイルにリンクし、各ケースには識別可能なテストタイトルを記載する。長い入力の組み合わせだけ表で補足する。
カテゴリは `read`（取得・購読）、`write`（単一の保存・認可）、`batch`（複数操作の契約）を使う。

ID は `FIRESTORE-<仕様書ファイル名の大文字表記>-<連番>` とする。例えば `FIRESTORE-STUDY-SESSION-01` を使う。
各ファイルで `01` から文書順に欠番なく採番し、README は採番しない。
テスト追加・並び替え時は、索引・アンカー・テストタイトルを一緒に更新する。
各 `it` / `it.each` のタイトルに対応 ID を付け、parameterized test の各行は同じ契約 ID を共有してよい。
その場合は認証主体・入力・期待結果の全組み合わせを仕様書から読み取れるようにする。

新規・変更・回帰テストは対応する仕様書も更新する。E2E ID は関連仕様へのリンクであり、Firestore 固有の契約に必須とはしない。
E2E の索引・Playwright との一対一対応規約や、Firestore 以外の unit/integration 規約は変更しない。
未検証事項は下記のように区別し、必要な追加テスト・不具合修正は別 Issue で扱う。本番インターフェイスをテストのためだけに変更しない。

## 未検証・要確認

ここに挙げた内容を、既存テストで保証済みの Then として扱わない。追加検証は [#1677](https://github.com/her0e1c1/tango/issues/1677) で扱う。

| 対象 | 現在の検証範囲と不足 |
| --- | --- |
| [FIRESTORE-CARD-05](./card.md#firestore-card-05) | エラーと有効な Card の保存を確認する。不正な Card の保存先不在は直接確認していない |
| Deck / Card の Rules | 親が他人所有の Card 更新による回答 batch の拒否は [FIRESTORE-STUDY-ANSWER-10](./study-answer.md#firestore-study-answer-10) で確認する。親不在の作成／更新、他人所有の親への新規作成は直接検証していない。Deck の所有者 UID の変更・削除と乗っ取り拒否は [FIRESTORE-RULES-DECK-20](./rules-deck.md#firestore-rules-deck-20) と [FIRESTORE-RULES-DECK-21](./rules-deck.md#firestore-rules-deck-21) で扱う。Card の所有者変更拒否は [FIRESTORE-RULES-CARD-21](./rules-card.md#firestore-rules-card-21) で確認する。Rules 固有の仕様は [rules-deck](./rules-deck.md) と [rules-card](./rules-card.md) に分離する |

購読解除後の確認は [Subscriptions](./subscriptions.md#firestore-subscriptions-03) に示す観測時点に限定する。
[StudySession](./study-session.md#firestore-study-session-01) の再購読を別端末・ブラウザ reload の保証に拡張しない。
これらの文書は期待契約と既存 assertion の対応を示すものであり、個々の実行結果はテスト実行ログで確認する。

## テストケース索引

### deck

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-DECK-01 | write | [Deck の保存対象だけを新規作成できる](./deck.md#firestore-deck-01) |
| FIRESTORE-DECK-02 | write | [Deck の編集で作成日時と対象外フィールドを維持できる](./deck.md#firestore-deck-02) |
| FIRESTORE-DECK-03 | write | [URL の省略と明示的なクリアを区別できる](./deck.md#firestore-deck-03) |
| FIRESTORE-DECK-04 | batch | [Deck と配下 Card をまとめて論理削除できる](./deck.md#firestore-deck-04) |
| FIRESTORE-DECK-05 | batch | [Card がない Deck を論理削除できる](./deck.md#firestore-deck-05) |
| FIRESTORE-DECK-06 | batch | [Deck と配下 Card の削除を原子的に扱う](./deck.md#firestore-deck-06) |

### card

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-CARD-01 | write | [Card の保存対象だけを新規作成できる](./card.md#firestore-card-01) |
| FIRESTORE-CARD-02 | write | [Card の編集で作成日時と対象外フィールドを維持できる](./card.md#firestore-card-02) |
| FIRESTORE-CARD-03 | write | [Card 作成時に旧個人学習フィールドを除外する](./card.md#firestore-card-03) |
| FIRESTORE-CARD-04 | write | [一括作成の再試行で既存 Card の学習状態を維持する](./card.md#firestore-card-04) |
| FIRESTORE-CARD-05 | batch | [一部の入力失敗を返しつつ有効な Card を保存できる](./card.md#firestore-card-05) |
| FIRESTORE-CARD-06 | write | [保存計画後に物理削除された Card を編集で再作成しない](./card.md#firestore-card-06) |
| FIRESTORE-CARD-07 | write | [Card の削除日時を保存し本文を維持できる](./card.md#firestore-card-07) |
| FIRESTORE-CARD-08 | read | [作成した Card の存在を確認できる](./card.md#firestore-card-08) |

### card-fsrs

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-CARD-FSRS-01 | write | [null と評価済み Card を同じ購読で復元する](./card-fsrs.md#firestore-card-fsrs-01) |
| FIRESTORE-CARD-FSRS-02 | read | [本人の Card だけを復元し停止でクリアする](./card-fsrs.md#firestore-card-fsrs-02) |
| FIRESTORE-CARD-FSRS-03 | read | [不正 FSRS を未評価に読み替えない](./card-fsrs.md#firestore-card-fsrs-03) |
| FIRESTORE-CARD-FSRS-04 | write | [削除 Card の状態を隠し他の Card は維持する](./card-fsrs.md#firestore-card-fsrs-04) |
| FIRESTORE-CARD-FSRS-05 | read | [購読拒否を通知する](./card-fsrs.md#firestore-card-fsrs-05) |
| FIRESTORE-CARD-FSRS-06 | write | [オフライン削除を再接続後も維持する](./card-fsrs.md#firestore-card-fsrs-06) |

### study-session

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-SESSION-01 | batch | [途中の学習を保存した順序と位置から再開できる](./study-session.md#firestore-study-session-01) |
| FIRESTORE-STUDY-SESSION-02 | batch | [離脱だけでは終了せず最初からやり直すと旧セッションを中断する](./study-session.md#firestore-study-session-02) |
| FIRESTORE-STUDY-SESSION-03 | write | [最後のカードを完了した操作が重複しても終了記録を変更しない](./study-session.md#firestore-study-session-03) |
| FIRESTORE-STUDY-SESSION-04 | batch | [オフラインで中断した学習を重複なく同期できる](./study-session.md#firestore-study-session-04) |
| FIRESTORE-STUDY-SESSION-05 | batch | [別Deckの未送信書込に妨げられずオフラインでやり直せる](./study-session.md#firestore-study-session-05) |
| FIRESTORE-STUDY-SESSION-06 | read | [不正な保存データが混在しても有効な学習を復元してやり直せる](./study-session.md#firestore-study-session-06) |
| FIRESTORE-STUDY-SESSION-07 | write | [次のカードへ進めた操作が重複してもカードを飛ばさない](./study-session.md#firestore-study-session-07) |
| FIRESTORE-STUDY-SESSION-08 | write | [学習を再開した時刻だけを更新し順序と位置を維持する](./study-session.md#firestore-study-session-08) |
| FIRESTORE-STUDY-SESSION-09 | read | [古い学習の更新時刻に惑わされずDeckごとに最新のセッションを復元する](./study-session.md#firestore-study-session-09) |
| FIRESTORE-STUDY-SESSION-10 | read | [最新の学習が終了済みなら古い未終了セッションも復元しない](./study-session.md#firestore-study-session-10) |
| FIRESTORE-STUDY-SESSION-11 | read | [購読をやり直さず保存された進行位置を反映する](./study-session.md#firestore-study-session-11) |
| FIRESTORE-STUDY-SESSION-12 | read | [保存された終了を反映し別Deckの学習は維持する](./study-session.md#firestore-study-session-12) |
| FIRESTORE-STUDY-SESSION-13 | batch | [オフラインで完了した学習を重複なく同期し再開対象に戻さない](./study-session.md#firestore-study-session-13) |
| FIRESTORE-STUDY-SESSION-14 | write | [学習対象が0枚ならセッションを作成せず既存の学習も中断しない](./study-session.md#firestore-study-session-14) |

### study-answer

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-ANSWER-01 | batch | [4種類の評価を保存し進捗と位置を1回更新する](./study-answer.md#firestore-study-answer-01) |
| FIRESTORE-STUDY-ANSWER-02 | batch | [保存済みの位置から同じ操作を再実行して回答を増やさない](./study-answer.md#firestore-study-answer-02) |
| FIRESTORE-STUDY-ANSWER-03 | write | [評価では Card の本文と作成日時を維持する](./study-answer.md#firestore-study-answer-03) |
| FIRESTORE-STUDY-ANSWER-04 | batch | [10枚への回答を保存して session を完了する](./study-answer.md#firestore-study-answer-04) |
| FIRESTORE-STUDY-ANSWER-05 | batch | [中断後も回答を保持し別 session で同じ Card に回答できる](./study-answer.md#firestore-study-answer-05) |
| FIRESTORE-STUDY-ANSWER-06 | batch | [途中のスキップは Session だけを前進する](./study-answer.md#firestore-study-answer-06) |
| FIRESTORE-STUDY-ANSWER-07 | batch | [最後のスキップは回答を作らず session を完了する](./study-answer.md#firestore-study-answer-07) |
| FIRESTORE-STUDY-ANSWER-08 | write | [ブラウザのオフライン判定だけで保存を止めない](./study-answer.md#firestore-study-answer-08) |
| FIRESTORE-STUDY-ANSWER-09 | batch | [存在しない session と認証変更で部分保存を残さない](./study-answer.md#firestore-study-answer-09) |
| FIRESTORE-STUDY-ANSWER-10 | batch | [書込拒否後に同じ操作を再試行できる](./study-answer.md#firestore-study-answer-10) |
| FIRESTORE-STUDY-ANSWER-11 | read | [所有者条件を付けて session・Card・Deck ごとの回答を取得する](./study-answer.md#firestore-study-answer-11) |
| FIRESTORE-STUDY-ANSWER-12 | write | [別 UID の回答作成を拒否する](./study-answer.md#firestore-study-answer-12) |
| FIRESTORE-STUDY-ANSWER-13 | write | [回答形式と参照先の検証は Rules では強制しない](./study-answer.md#firestore-study-answer-13) |
| FIRESTORE-STUDY-ANSWER-14 | write | [回答単独の保存では Card.fsrs と Session を更新しない](./study-answer.md#firestore-study-answer-14) |
| FIRESTORE-STUDY-ANSWER-15 | write | [4評価の FSRS を検証して保存する](./study-answer.md#firestore-study-answer-15) |
| FIRESTORE-STUDY-ANSWER-16 | write | [session の所有権とアプリケーションの終了遷移を区別する](./study-answer.md#firestore-study-answer-16) |
| FIRESTORE-STUDY-ANSWER-17 | write | [本人でも保存済み回答を更新・上書き・削除できない](./study-answer.md#firestore-study-answer-17) |
| FIRESTORE-STUDY-ANSWER-18 | read | [存在しない回答 ID の読取を拒否する](./study-answer.md#firestore-study-answer-18) |
| FIRESTORE-STUDY-ANSWER-19 | batch | [公開 Deck でも第三者・匿名・未認証に回答を公開しない](./study-answer.md#firestore-study-answer-19) |
| FIRESTORE-STUDY-ANSWER-20 | batch | [FSRS を復元し本文編集とスキップで維持する](./study-answer.md#firestore-study-answer-20) |

### subscriptions

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-SUBSCRIPTIONS-01 | read | [初期 snapshot から Card 本文を取得できる](./subscriptions.md#firestore-subscriptions-01) |
| FIRESTORE-SUBSCRIPTIONS-02 | batch | [購読中の追加・更新・論理削除を store に反映できる](./subscriptions.md#firestore-subscriptions-02) |
| FIRESTORE-SUBSCRIPTIONS-03 | read | [購読解除後の編集で store の値を更新しない](./subscriptions.md#firestore-subscriptions-03) |

### rules-deck

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-DECK-01 | read | [削除済みの公開 Deck を第三者が取得できない](./rules-deck.md#firestore-rules-deck-01) |
| FIRESTORE-RULES-DECK-02 | read | [本人による Deck の取得を許可する](./rules-deck.md#firestore-rules-deck-02) |
| FIRESTORE-RULES-DECK-03 | write | [本人による Deck の作成を許可する](./rules-deck.md#firestore-rules-deck-03) |
| FIRESTORE-RULES-DECK-04 | write | [本人による Deck の更新を許可する](./rules-deck.md#firestore-rules-deck-04) |
| FIRESTORE-RULES-DECK-05 | write | [本人による Deck の物理削除を許可する](./rules-deck.md#firestore-rules-deck-05) |
| FIRESTORE-RULES-DECK-06 | read | [他ユーザーによる Deck の非公開データの取得を拒否する](./rules-deck.md#firestore-rules-deck-06) |
| FIRESTORE-RULES-DECK-07 | read | [他ユーザーによる Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-07) |
| FIRESTORE-RULES-DECK-08 | write | [他ユーザーによる Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-08) |
| FIRESTORE-RULES-DECK-09 | write | [他ユーザーによる Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-09) |
| FIRESTORE-RULES-DECK-10 | write | [他ユーザーによる Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-10) |
| FIRESTORE-RULES-DECK-11 | write | [匿名認証による Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-11) |
| FIRESTORE-RULES-DECK-12 | write | [匿名認証による Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-12) |
| FIRESTORE-RULES-DECK-13 | write | [匿名認証による Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-13) |
| FIRESTORE-RULES-DECK-14 | read | [匿名認証による Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-14) |
| FIRESTORE-RULES-DECK-15 | read | [未認証による Deck の非公開データの取得を拒否する](./rules-deck.md#firestore-rules-deck-15) |
| FIRESTORE-RULES-DECK-16 | read | [未認証による Deck の公開データの取得を許可する](./rules-deck.md#firestore-rules-deck-16) |
| FIRESTORE-RULES-DECK-17 | write | [未認証による Deck の作成を拒否する](./rules-deck.md#firestore-rules-deck-17) |
| FIRESTORE-RULES-DECK-18 | write | [未認証による Deck の更新を拒否する](./rules-deck.md#firestore-rules-deck-18) |
| FIRESTORE-RULES-DECK-19 | write | [未認証による Deck の物理削除を拒否する](./rules-deck.md#firestore-rules-deck-19) |
| FIRESTORE-RULES-DECK-20 | write | [本人による所有者 UID の変更・削除を拒否する](./rules-deck.md#firestore-rules-deck-20) |
| FIRESTORE-RULES-DECK-21 | write | [他人の Deck の所有者を自分にする更新・上書きを拒否する](./rules-deck.md#firestore-rules-deck-21) |
| FIRESTORE-RULES-DECK-22 | read | [本人の UID で絞った Deck 一覧取得を許可する](./rules-deck.md#firestore-rules-deck-22) |
| FIRESTORE-RULES-DECK-23 | read | [権限を保証できない Deck 一覧取得を拒否する](./rules-deck.md#firestore-rules-deck-23) |
| FIRESTORE-RULES-DECK-24 | read | [匿名認証による他人の非公開 Deck 取得を拒否する](./rules-deck.md#firestore-rules-deck-24) |

### rules-card

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-CARD-01 | read | [削除済みの公開 Deck 配下または削除済みの Card を第三者が取得できない](./rules-card.md#firestore-rules-card-01) |
| FIRESTORE-RULES-CARD-02 | read | [本人による Card の取得を許可する](./rules-card.md#firestore-rules-card-02) |
| FIRESTORE-RULES-CARD-03 | write | [本人による Card の作成を許可する](./rules-card.md#firestore-rules-card-03) |
| FIRESTORE-RULES-CARD-04 | write | [本人による Card の更新を許可する](./rules-card.md#firestore-rules-card-04) |
| FIRESTORE-RULES-CARD-05 | write | [本人による Card の物理削除を許可する](./rules-card.md#firestore-rules-card-05) |
| FIRESTORE-RULES-CARD-06 | read | [他ユーザーによる Card の非公開データの取得を拒否する](./rules-card.md#firestore-rules-card-06) |
| FIRESTORE-RULES-CARD-07 | read | [他ユーザーによる Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-07) |
| FIRESTORE-RULES-CARD-08 | write | [他ユーザーによる Card の作成を拒否する](./rules-card.md#firestore-rules-card-08) |
| FIRESTORE-RULES-CARD-09 | write | [他ユーザーによる Card の更新を拒否する](./rules-card.md#firestore-rules-card-09) |
| FIRESTORE-RULES-CARD-10 | write | [他ユーザーによる Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-10) |
| FIRESTORE-RULES-CARD-11 | write | [匿名認証による Card の作成を拒否する](./rules-card.md#firestore-rules-card-11) |
| FIRESTORE-RULES-CARD-12 | write | [匿名認証による Card の更新を拒否する](./rules-card.md#firestore-rules-card-12) |
| FIRESTORE-RULES-CARD-13 | write | [匿名認証による Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-13) |
| FIRESTORE-RULES-CARD-14 | read | [匿名認証による Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-14) |
| FIRESTORE-RULES-CARD-15 | read | [未認証による Card の非公開データの取得を拒否する](./rules-card.md#firestore-rules-card-15) |
| FIRESTORE-RULES-CARD-16 | read | [未認証による Card の公開データの取得を許可する](./rules-card.md#firestore-rules-card-16) |
| FIRESTORE-RULES-CARD-17 | write | [未認証による Card の作成を拒否する](./rules-card.md#firestore-rules-card-17) |
| FIRESTORE-RULES-CARD-18 | write | [未認証による Card の更新を拒否する](./rules-card.md#firestore-rules-card-18) |
| FIRESTORE-RULES-CARD-19 | write | [未認証による Card の物理削除を拒否する](./rules-card.md#firestore-rules-card-19) |
| FIRESTORE-RULES-CARD-20 | write | [旧個人学習フィールドを Card に書き戻せない](./rules-card.md#firestore-rules-card-20) |
| FIRESTORE-RULES-CARD-21 | write | [本人の FSRS 更新を許可し Card の同一性を維持する](./rules-card.md#firestore-rules-card-21) |
| FIRESTORE-RULES-CARD-22 | write | [公開 Card の FSRS を公開し他人の書込を拒否する](./rules-card.md#firestore-rules-card-22) |
| FIRESTORE-RULES-CARD-23 | write | [FSRS 外形と所有権・削除状態を確認する](./rules-card.md#firestore-rules-card-23) |
| FIRESTORE-RULES-CARD-24 | write | [評価更新で物理削除 Card を再作成しない](./rules-card.md#firestore-rules-card-24) |

### rules-study-session

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-STUDY-SESSION-01 | batch | [本人が private session を作成・取得・更新できる](./rules-study-session.md#firestore-rules-study-session-01) |
| FIRESTORE-RULES-STUDY-SESSION-02 | batch | [公開 Deck でも他ユーザー・匿名・未認証から session にアクセスできない](./rules-study-session.md#firestore-rules-study-session-02) |
| FIRESTORE-RULES-STUDY-SESSION-03 | write | [本人でも session の所有者変更と物理削除はできない](./rules-study-session.md#firestore-rules-study-session-03) |

### rules-study-answer

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-STUDY-ANSWER-01 | batch | [回答作成と Card.fsrs・session 更新を同じ batch で許可する](./rules-study-answer.md#firestore-rules-study-answer-01) |
| FIRESTORE-RULES-STUDY-ANSWER-02 | write | [回答 ID と完了後の回答順序はアプリケーションの責務とする](./rules-study-answer.md#firestore-rules-study-answer-02) |
| FIRESTORE-RULES-STUDY-ANSWER-03 | write | [保存済みの回答履歴は本人でも更新・削除できない](./rules-study-answer.md#firestore-rules-study-answer-03) |
| FIRESTORE-RULES-STUDY-ANSWER-04 | batch | [他ユーザーと同一 UID の匿名認証による回答の読取・batch を拒否する](./rules-study-answer.md#firestore-rules-study-answer-04) |

### study-history

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-HISTORY-01 | batch | [期間と Deck による履歴取得を cache と権限境界を含めて確認できる](./study-history.md#firestore-study-history-01) |
| FIRESTORE-STUDY-HISTORY-02 | read | [回答履歴の期間・順序・上限・cacheを確認する](./study-history.md#firestore-study-history-02) |
| FIRESTORE-STUDY-HISTORY-03 | read | [回答履歴の入力境界を検証する](./study-history.md#firestore-study-history-03) |
