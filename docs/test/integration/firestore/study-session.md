# StudySession Firestore 結合テスト仕様書

## 目的

途中の学習を同じ順序・位置から再開できること、明示的な再開始・中断・完了で再開対象が正しく切り替わることを確認する。
オフラインで受け付けた操作や保存済みデータの変更についても、保存結果と購読後の再開対象が一致することを保証する。
関数の呼び出し順や内部の store 構造ではなく、保存された session と公開 query から取得できる再開対象を観測する。

関連 E2E: [STUDY-SESSION-01](../../e2e/study-session.md#study-session-01)、[STUDY-SESSION-03](../../e2e/study-session.md#study-session-03)、[STUDY-SESSION-05](../../e2e/study-session.md#study-session-05)、[PERSISTENCE-02](../../e2e/persistence.md#persistence-02)

## 共通前提

本人の非匿名認証 UID は `uid` とし、ケースごとに Deck ID とメモリ上の学習状態を分離する。
特記しない限り、学習対象は `first`、`second`、`third` の3枚で、順序は固定、枚数制限はない。位置 `0`・`1`・`2` は、それぞれ1枚目・2枚目・3枚目を表す。
「再開対象」は Deck ごとに公開 query `getStudySession` で取得できる未終了の session を指す。

保存完了の確認では未送信書込の完了を待ち、購読結果は該当 ID・値の反映を待つ。再開対象がないことを再購読で確認するケースでは、初回 snapshot の処理完了後に判定する。
再購読は同じ Firestore SDK インスタンスで購読を解除し、メモリ上の学習状態を破棄して購読し直す操作であり、ブラウザ reload・別タブ・別端末の検証ではない。
SDK から直接行うデータ変更も、同じインスタンスで購読への反映を確認するための操作である。
認可・物理削除の拒否は [Rules / StudySession](./rules-study-session.md)、回答・FSRS との一括保存は [StudyAnswer](./study-answer.md) で扱う。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-SESSION-01 | batch | [途中の学習を保存した順序と位置から再開できる](#firestore-study-session-01) |
| FIRESTORE-STUDY-SESSION-02 | batch | [離脱だけでは終了せず最初からやり直すと旧セッションを中断する](#firestore-study-session-02) |
| FIRESTORE-STUDY-SESSION-03 | write | [最後のカードを完了した操作が重複しても終了記録を変更しない](#firestore-study-session-03) |
| FIRESTORE-STUDY-SESSION-04 | batch | [オフラインで中断した学習を重複なく同期できる](#firestore-study-session-04) |
| FIRESTORE-STUDY-SESSION-05 | batch | [別Deckの未送信書込に妨げられずオフラインでやり直せる](#firestore-study-session-05) |
| FIRESTORE-STUDY-SESSION-06 | read | [不正な保存データが混在しても有効な学習を復元してやり直せる](#firestore-study-session-06) |
| FIRESTORE-STUDY-SESSION-07 | write | [次のカードへ進めた操作が重複してもカードを飛ばさない](#firestore-study-session-07) |
| FIRESTORE-STUDY-SESSION-08 | write | [学習を再開した時刻だけを更新し順序と位置を維持する](#firestore-study-session-08) |
| FIRESTORE-STUDY-SESSION-09 | read | [古い学習の更新時刻に惑わされずDeckごとに最新のセッションを復元する](#firestore-study-session-09) |
| FIRESTORE-STUDY-SESSION-10 | read | [最新の学習が終了済みなら古い未終了セッションも復元しない](#firestore-study-session-10) |
| FIRESTORE-STUDY-SESSION-11 | read | [購読をやり直さず保存された進行位置を反映する](#firestore-study-session-11) |
| FIRESTORE-STUDY-SESSION-12 | read | [保存された終了を反映し別Deckの学習は維持する](#firestore-study-session-12) |
| FIRESTORE-STUDY-SESSION-13 | batch | [オフラインで完了した学習を重複なく同期し再開対象に戻さない](#firestore-study-session-13) |
| FIRESTORE-STUDY-SESSION-14 | write | [学習対象が0枚ならセッションを作成せず既存の学習も中断しない](#firestore-study-session-14) |

<a id="firestore-study-session-01"></a>

### FIRESTORE-STUDY-SESSION-01 途中の学習を保存した順序と位置から再開できる

カテゴリ: `batch`

Given:

- 本人の新しい Deck に3枚の学習対象があり、まだ学習を開始していない。

When:

- 学習を開始して2枚目まで進め、保存完了後に再購読する。

Then:

- 保存先は開始時と同じ session ID で、本人の UID・Deck ID・順序 `first`、`second`、`third`・位置 `1` を保持する。
- 開始日時は開始時の値を保持し、開始日時・作成日時・更新日時は Timestamp で保存される。終了日時・終了理由は `null` で、回答配列は保存しない。
- 再開対象として同じ session ID・順序・位置 `1` を取得でき、最終学習時刻は正数である。
- 購読エラーは通知されない。

<a id="firestore-study-session-02"></a>

### FIRESTORE-STUDY-SESSION-02 離脱だけでは終了せず最初からやり直すと旧セッションを中断する

カテゴリ: `batch`

Given:

- 本人の学習が2枚目まで進んでおり、位置 `1` を保存している。

When:

- 学習の購読を解除する。その後、購読を戻して同じ Deck の学習を最初からやり直す。

Then:

| 観測時点 | 旧セッション | 新セッション |
| --- | --- | --- |
| 購読を解除した直後 | 位置 `1`、終了日時・終了理由は `null` | まだ作成されない |
| 最初からやり直した後 | 位置 `1` を保持し、終了理由 `abandoned` と終了日時を保存する | 旧セッションと異なる ID、指定した3枚の順序、位置 `0`、終了日時・終了理由 `null` で保存する |

<a id="firestore-study-session-03"></a>

### FIRESTORE-STUDY-SESSION-03 最後のカードを完了した操作が重複しても終了記録を変更しない

カテゴリ: `write`

Given:

- 本人の学習が最後のカード、位置 `2` に到達している。

When:

- 最後のカードの完了を保存し、その保存後に同じ完了操作をもう一度処理する。

Then:

- 最初の操作は受け付けられ、重複した操作は受け付けられない。
- 位置 `2`、終了理由 `completed`、Timestamp の終了日時が保存され、再開対象から外れる。
- 開始日時と作成日時は開始時の値を保持する。
- 重複操作後の保存内容は最初の完了保存後と同一で、終了日時・更新日時も書き換わらない。

<a id="firestore-study-session-04"></a>

### FIRESTORE-STUDY-SESSION-04 オフラインで中断した学習を重複なく同期できる

カテゴリ: `batch`

Given:

- 本人の学習を購読しており、ネットワークが無効である。

When:

- 学習を開始して2枚目へ進み、明示的に中断する。
- 購読を解除してメモリ上の学習状態を破棄し、再接続して未送信書込の完了を待つ。

Then:

- 再接続前の cache には位置 `1` と終了理由 `abandoned` が反映される。
- 再接続後も開始時と同じ session ID に位置 `1` と `abandoned` が保存される。
- 対象 Deck の保存済みセッションは、その ID の1件だけである。

<a id="firestore-study-session-05"></a>

### FIRESTORE-STUDY-SESSION-05 別Deckの未送信書込に妨げられずオフラインでやり直せる

カテゴリ: `batch`

Given:

- 本人の2つの Deck にそれぞれ3枚のカードがある。
- 対象 Deck の位置 `1` を同期済みで、購読を解除し、ネットワーク停止とメモリ上の学習状態の破棄を行っている。

When:

- オフラインのまま再購読する。
- 別 Deck の学習を開始し、その書込が未送信のまま対象 Deck の学習を最初からやり直す。その後、再接続して保存完了を待つ。

Then:

- cache から対象 Deck の以前の位置を復元できる。
- 再接続を待たずに別 Deck の開始と対象 Deck のやり直しが受け付けられる。
- 別 Deck はその Deck のカード順序を保持し、対象 Deck は旧セッションと異なる ID・位置 `0` になる。
- 再接続後、対象 Deck の新セッションは未終了、旧セッションは `abandoned` で保存される。

<a id="firestore-study-session-06"></a>

### FIRESTORE-STUDY-SESSION-06 不正な保存データが混在しても有効な学習を復元してやり直せる

カテゴリ: `read`

Given:

- 本人の有効なセッションと、同じ UID だが必要な学習情報を欠き `answers: []` だけを持つ不正な document が保存されている。
- 購読は解除済みで、メモリ上の学習状態は空である。

When:

- 再購読して有効なセッションを復元し、その Deck の学習を最初からやり直す。

Then:

- 有効な session ID を再開対象として取得でき、新しい学習は未終了のセッションとして保存される。
- 不正な document による購読エラーは通知されない。

<a id="firestore-study-session-07"></a>

### FIRESTORE-STUDY-SESSION-07 次のカードへ進めた操作が重複してもカードを飛ばさない

カテゴリ: `write`

Given:

- 本人の3枚の学習が1枚目、位置 `0` にある。

When:

- 次のカードへ進めて保存し、その後、進む前のセッションと位置に対する同じ操作をもう一度処理する。

Then:

- 最初の操作は受け付けられ、2枚目の位置 `1` が保存・購読反映される。
- session ID・カード順序・開始日時を保持し、終了日時・終了理由は `null` のままである。
- 重複した操作は受け付けられず、保存内容は最初の進行保存後と同一である。3枚目へは進まない。

<a id="firestore-study-session-08"></a>

### FIRESTORE-STUDY-SESSION-08 学習を再開した時刻だけを更新し順序と位置を維持する

カテゴリ: `write`

Given:

- 本人の未終了セッションが位置 `1` で保存されている。
- 再開する時刻は、直前に保存した更新日時より後である。

When:

- カードを進めずに再開時刻を記録し、保存完了後に再購読する。

Then:

- 保存値のうち更新日時だけが再開時刻に変わり、session ID・カード順序・位置・開始日時・作成日時・終了状態は変わらない。
- 再購読後も同じ session ID・順序・位置 `1` を取得でき、最終学習時刻は記録した再開時刻である。

<a id="firestore-study-session-09"></a>

### FIRESTORE-STUDY-SESSION-09 古い学習の更新時刻に惑わされずDeckごとに最新のセッションを復元する

カテゴリ: `read`

Given:

- 本人の保存済みセッションが次の状態で存在し、メモリ上の学習状態は空である。時刻は比較用の Unix epoch からのミリ秒とする。

| セッション | Deck | 開始日時・作成日時 | 更新日時 | 位置 | 終了状態 |
| --- | --- | --- | --- | --- | --- |
| 旧セッション | 対象 Deck | `1000` | `3000` | `1` | 未終了 |
| 新セッション | 対象 Deck | `2000` | `2000` | `2` | 未終了 |
| 別 Deck のセッション | 別 Deck | `1000` | `3000` | `1` | 未終了 |

When:

- 本人の学習を購読して保存済みのセッションを復元する。

Then:

- 対象 Deck は新セッションの ID と位置 `2` を再開対象にする。旧セッションの更新日時の方が新しくても選び直さない。
- 別 Deck は別セッションの ID と位置 `1` を独立して復元できる。

<a id="firestore-study-session-10"></a>

### FIRESTORE-STUDY-SESSION-10 最新の学習が終了済みなら古い未終了セッションも復元しない

カテゴリ: `read`

Given:

- 本人の同じ Deck に、新しいセッションが位置 `2`、古い未終了セッションが位置 `0` で保存されている。作成日時は旧セッションの方が古い。
- 新しいセッションを、下表の終了理由で終了済みにしている。

| 終了操作 | 終了理由 |
| --- | --- |
| 最後のカードを完了する | `completed` |
| 明示的に学習を中断する | `abandoned` |

When:

- 終了した新セッションの位置 `2` に対する遅延した進行更新を保存し、その後、再購読する。

Then:

- 新セッションの終了理由と終了日時は維持される。
- 古いセッションは保存上は未終了のままでも、初回 snapshot の処理後に対象 Deck の再開対象は存在しない。
- 終了した新セッションも、古い未終了セッションも再開対象に戻らない。

<a id="firestore-study-session-11"></a>

### FIRESTORE-STUDY-SESSION-11 購読をやり直さず保存された進行位置を反映する

カテゴリ: `read`

Given:

- 本人の学習が位置 `0` で保存され、同じセッションを購読している。

When:

- アプリケーションの進行操作を経由せず、SDK から保存済みセッションの位置を `1` に変更し、更新日時を設定する。

Then:

- 購読を解除・再登録せずに、再開対象の位置が `1` になる。
- session ID とカード順序は変わらず、最終学習時刻は保存した更新日時になる。

<a id="firestore-study-session-12"></a>

### FIRESTORE-STUDY-SESSION-12 保存された終了を反映し別Deckの学習は維持する

カテゴリ: `read`

Given:

- 本人の対象 Deck は位置 `2`、別 Deck は1枚のカードの位置 `0` で未終了セッションを保存し、どちらも購読している。

When:

- アプリケーションの終了操作を経由せず、SDK から対象セッションに終了日時・更新日時と、下表の終了理由を保存する。

| 保存する終了理由 | 対象 Deck の結果 | 別 Deck の結果 |
| --- | --- | --- |
| `completed` | 再開対象から外れる | 同じ ID・位置 `0`・未終了状態を維持する |
| `abandoned` | 再開対象から外れる | 同じ ID・位置 `0`・未終了状態を維持する |

Then:

- 購読をやり直さず、対象 Deck だけが再開対象から外れる。
- 対象セッションは物理削除されず、位置 `2` と指定した終了理由・終了日時を保存したままである。
- 別 Deck のセッションは引き続き再開対象として取得でき、保存状態も未終了のままである。

<a id="firestore-study-session-13"></a>

### FIRESTORE-STUDY-SESSION-13 オフラインで完了した学習を重複なく同期し再開対象に戻さない

カテゴリ: `batch`

Given:

- 本人の学習を購読しており、ネットワークが無効である。

When:

- 学習を開始し、最後のカード、位置 `2` まで進めて完了する。
- 購読を解除してメモリ上の学習状態を破棄し、再接続して未送信書込の完了を待ってから再購読する。

Then:

- 再接続前の cache に位置 `2`、終了理由 `completed`、Timestamp の終了日時が反映される。
- 再接続後も開始時と同じ session ID に位置 `2` と完了状態・終了日時が保存される。
- 対象 Deck の保存済みセッションは、その ID の1件だけである。
- 再購読の初回 snapshot 処理後も、完了したセッションは再開対象にならない。

<a id="firestore-study-session-14"></a>

### FIRESTORE-STUDY-SESSION-14 学習対象が0枚ならセッションを作成せず既存の学習も中断しない

カテゴリ: `write`

Given:

- 本人の対象 Deck が、下表のいずれかの状態である。

| 既存セッション | 保存状態 |
| --- | --- |
| なし（`false`） | 対象 Deck のセッションは0件 |
| あり（`true`） | 未終了のセッション1件が位置 `1` で保存されている |

When:

- 学習対象のカードが0枚の状態で、その Deck の学習開始を要求する。

Then:

- 新しいセッションは作成されない。
- 既存セッションがなければ、保存件数は0件で再開対象も存在しない。
- 既存セッションがあれば、保存内容は操作前と完全に同じである。同じ ID・位置 `1` の再開対象を維持し、中断や更新日時の変更も発生しない。
