# Firestore の書き込みエラーを呼び出し側へ伝える

Status: Accepted

## Context

書き込みの失敗を Entity 内で破棄して即座に成功を返すと、呼び出し側は保存失敗を通知できず、未保存の操作を成功として扱ってしまう。

## Decision

- Entity の Firestore 書き込み API は `async` 関数とし、通常アカウントでは SDK の書き込み Promise を待つ。入力検証と保存の失敗は reject として呼び出し側へ伝え、握りつぶさない。
- Page・Feature の操作は保存結果を待ち、失敗を既存の `showToast` で通知する。Entity は toast や画面遷移を扱わない。購読は解除関数とエラー callback の契約を維持し、購読を管理する側が通知する。
- 学習回答・Card.fsrs・StudySession の進捗は同じ batch で保存し、その commit の結果を操作側で処理する。
- 通常アカウントの保存完了はサーバー応答を基準とする。オフライン中の書き込み Promise は保留され、成功通知・後続処理・保存後の画面遷移は再接続後の成功まで待つ。SDK によるローカル snapshot の反映は保存完了とは区別する。
- 匿名利用では Firestore 通信を停止したまま、callback の有無にかかわらずサーバー応答を待たずに操作を返す。呼び出し側は `onLocalError` callback を渡し、後から検出された失敗を toast で通知する。callback を省略した低レベル API 呼び出しの遅延エラーはブラウザー標準の `reportError` へ渡し、無言で破棄しない。入力検証などの失敗は引き続き Promise の reject で伝える。書き込み API の返却と表示への反映は区別し、表示はローカル snapshot に従う。
- リモート Store は snapshot のみから更新する。SDK のキュー・再送・rollback に委ね、独自のタイムアウトや再送キューを追加しない。
- 保存中の二重操作を防ぎ、ユーザー変更後の古い通知と、画面変更後の古い遷移・表示状態更新を抑止する。画面を離れた後の全体向け通知は既存の操作寿命の契約に従う。操作のロックは保存結果の確定後に解除する。学習の回答・位置変更・中止が失敗した場合は元の位置への rollback を確認してから解除する。匿名書き込みの遅延した失敗は、その操作の識別子が一致する場合だけ待機状態を解除し、後続の操作を解除しない。

[Firestore 購読の方針](./20260830-use-firestore-subscriptions-as-remote-state-source.md)と[Card.fsrs の保存方針](./20260924-keep-fsrs-state-in-card.md)の保存完了・エラー通知に関する契約をこの判断に統一する。
