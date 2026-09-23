# Firestore Integration Specification Instructions

## Scope and case format

- Document persistence, subscription, and security-rule contracts here. Keep browser-facing user flows in `docs/test/e2e`; related E2E links are optional.
- Follow the shared format and ID-only correspondence rules in `../../AGENTS.md`. Do not add implementation file or test-title mappings.
- Use `FIRESTORE-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs, starting at `01` in document order without gaps. Update indexes, anchors, and headings together; README files do not define case IDs.
- Use the categories `read` (reads and subscriptions), `write` (a single save or authorization), and `batch` (multiple operations). Describe case-specific setup inline; do not add fixture files.
- 正常系・異常系の区分は [共通規約](../../AGENTS.md#正常系異常系の区分) に従い、カテゴリとは別に明示する。
- Parameterized inputs may share a case ID when all authentication actors, inputs, and expected results are documented.
- Distinguish Adapter validation from Rules authorization. Keep unverified expectations explicit instead of treating proposed or skipped tests as verified behavior.
- Keep common execution, authentication, isolation, asynchronous verification, and cleanup prerequisites in this file instead of duplicating them in specifications or README.
- Link specifications to the common prerequisites below. Keep domain-specific data and terminology in the specification, and case-specific states, actors, operations, and expected results in Given / When / Then.

## 共通前提

### 検証境界と認証

- 実行環境や各仕様書で別記がない限り、通常の保存・購読では本人の非匿名認証 UID を `uid` とし、本人が所有する有効な Deck を使う。新規作成、削除済み・不正なデータ、別 UID・匿名・未認証、オフラインなどを扱う場合は、各仕様書の Given / When に記載した条件を優先する。
- アプリケーションの公開された保存・購読操作と実際の Firestore Emulator を通して確認し、検証する Firestore API・永続化・`onSnapshot` や snapshot の内容は mock しない。Firebase 初期化先やアプリケーションの認証値の差し替えはテスト側で行う。
- Adapter の入力 validation と Rules の認可を混同しない。Adapter の不正入力拒否は Rules の型検証の保証ではない。Rules だけを確認する操作は SDK から直接実行する。
- 物理削除、`deletedAt` による論理削除、store からの非表示、`permission-denied` による読取拒否は別の結果として記述する。
- ブラウザ上の永続 cache と利用者導線は E2E、純粋な計算ロジックは unit test の責務とし、ここへ複製しない。

### 実行環境

| 対象 | 接続・準備 |
| --- | --- |
| 保存・購読 Adapter | 既存の `test/initializeTestFirestore.ts` で project `test` に接続し、UID `uid`・非匿名 provider `google.com` の token を使用する |
| StudyAnswer 保存・認可 | project `test-study-answer` に実際の `firestore.rules` を読み込み、非匿名認証 UID `answer-owner` を使う。各ケース前に専用 project、Card / Deck store と認証状態を初期化し、本人 UID の Card.fsrs を購読する |
| Security Rules | project `test-rule` に実際の `firestore.rules` を読み込み、下記の Security Rules 共通前提に従う |
| Snapshot 追加仕様 | ケース専用の UID と document ID を使い、通常は認証 UID と購読 UID を一致させる。事前の store 値、他人・不正な document はテスト側で準備する。Rules 無効化は必要な事前データの準備だけとし、購読と検証操作には実際の Rules を適用する |

### 事前データ・分離・cleanup

- ケース固有の保存値と親子関係は Given に記載する。事前データはテスト内で作成し、別の fixture ファイルや fixture 規約は作らない。既存のテスト用 factory はそのまま利用する。
- Adapter テストは UUID の Deck / Card / session ID などでデータを分離する。Study History は固有の短い期間と Deck ID で query 結果を分離する。Rules / StudyAnswer は各ケース前に専用 project のデータを消去し、それ以外のテストのデータを削除しない。
- store を使うケースは対象 store を初期化してから Given の状態を準備する。古い値の置換・保持を検証するために Given で用意した値は、その検証前に消さない。
- Card の作成・更新には、ケースの条件に従った親 Deck を用意する。親 Deck を購読で準備する場合は、Card の作成前に Deck store への反映を待つ。
- 購読テストは失敗時も解除関数を呼ぶ。StudySession / Subscriptions / Study History と、別クライアントを作成するケースは終了時に Firebase app を破棄する。Rules / StudyAnswer は Rules 環境を cleanup する。
- オフラインのケースは SDK のネットワークを無効化し、終了時に有効へ戻す。StudySession は cleanup で pending writes も待つ。タイマーによる自動中断や、明記のない複数タブ・複数端末を前提にしない。

### 保存・購読・復元の確認

- Adapter の Promise 完了は local 反映であり、remote への送信完了とは限らない。サーバーへの保存を確認する場合は `waitForPendingWrites` などで送信完了を待ち、サーバー上の保存値を確認する。ローカル反映だけでサーバーへの保存成功とせず、`getDoc` 自体を server 専用読取とも扱わない。StudyAnswer は書込エラー通知も確認する。
- 購読結果は `vi.waitFor` などで対象 ID・値への反映を待つ。Firestore への書込完了だけを購読反映完了とみなさず、書込側の保存と受信側の反映は別々に確認する。空の結果や再開対象の不在は、初回 snapshot の処理完了後に判定する。
- To verify non-delivery after stopping a subscription, keep an independent observation listener on the receiving Firestore instance without updating application state. After another client writes the change, wait until this listener receives the server-synchronized value, then inspect the stopped subscription's result and notifications. Do not substitute the write Promise or a fixed sleep for this arrival boundary. Clean up the observation listener even on failure; this finite observation does not prove an indefinite absence of notifications.
- メモリ上の値に頼らず保存値からの復元を確認する場合は、購読を解除して対象の状態（Card フィルターや学習状態など）を破棄し、購読し直す。サーバーからの復元では、サーバーと同期した結果を待つ。Study History のオンライン取得は `fromCache: false` の snapshot を待つ。
- オフラインの検証では cache の読取と再接続後のサーバー確認を区別する。オフライン中の復元や操作に、サーバーとの同期完了を要求しない。
- 同じ SDK インスタンス内の store 初期化・再購読は、ブラウザ reload・別タブ・別端末・新規クライアントの検証ではない。同じインスタンスからの SDK 更新も、独立したクライアントからの更新とは扱わない。別クライアントを検証するケースは、その条件を Given / When に明記する。

## 実行方法

テスト実装はリポジトリルートの `test/integration/firestore` に置く。リポジトリルートで開発環境を初回設定し、既存タスクを使う。

```bash
mise install
mise run init
mise run test-integration
```

`test-integration` は sample build と Docker Compose の Firestore Emulator 起動後に、Vitest の integration project を実行する。
ホスト・ポートは既存の `VITE_DB_HOST` / `VITE_DB_PORT` 設定を使い、本番 Firebase に接続しない。
Firestore 以外の既存 integration test も同じタスクで実行されるが、この仕様書の対象には含めない。
Rules と index は既存のデプロイ経路を使う。Emulator は本番の複合 index の有無を強制しないため、履歴取得などのテスト成功だけで本番 index の利用可能性を保証しない。
テストタイトルやコードを変更した場合は `mise run check` も実行する。新しい runner や CI job は追加しない。

## Security Rules common prerequisites

- Load the repository's actual `firestore.rules` into the `test-rule` project.
- Prepare Given prerequisite documents in a Rules-disabled context. Execute When directly through the Firebase SDK from a Rules-enabled context.
- Use `google.com` for non-anonymous authentication, `anonymous` for anonymous authentication, and no authentication information for unauthenticated contexts.
- Do not pass Security Rules verification through application schema validation.
- Follow the [共通前提](#共通前提) and [実行方法](#実行方法) above for execution, isolation, and cleanup details.
