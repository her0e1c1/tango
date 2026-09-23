# Study Session Store 単体テスト仕様書

## 目的

学習セッションストア (`studySessionStore`) の初期状態、複数デック間の独立セッション保持、個別セッションの削除、クリア、およびリモート所有者スコープ変更（`setStudySessionOwner`）と一括更新処理を確認する。

対応ファイル: [`store.ts`](../../../../src/entities/study-session/model/store.ts) / [`clearStudySessions.ts`](../../../../src/entities/study-session/model/actions/clearStudySessions.ts) / [`removeStudySession.ts`](../../../../src/entities/study-session/model/actions/removeStudySession.ts) / [`setStudySessionOwner.ts`](../../../../src/entities/study-session/model/actions/setStudySessionOwner.ts) / [`replaceRemoteStudySessions.ts`](../../../../src/entities/study-session/model/actions/replaceRemoteStudySessions.ts) / [`finishStudySessionLoading.ts`](../../../../src/entities/study-session/model/actions/finishStudySessionLoading.ts) / [`store.spec.ts`](../../../../src/entities/study-session/model/store.spec.ts)

関連 E2E: [STUDY-SESSION-01](../../e2e/study-session.md#study-session-01)、[STUDY-ACTIONS-04](../../e2e/study-actions.md#study-actions-04)

## 共通前提

テスト実行前に `studySessionStore.setState({ sessionsByDeckId: {}, remoteLoading: false })` を実行し、ストア状態を初期化する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-STUDY-01 | state-change | [複数デックの独立した学習セッションを保持できる](#unit-store-study-01) |
| UNIT-STORE-STUDY-02 | state-change | [指定したデックのセッションのみを削除できる](#unit-store-study-02) |
| UNIT-STORE-STUDY-03 | state-change | [レガシーバックアップを削除せずに画面表示セッションをクリアできる](#unit-store-study-03) |
| UNIT-STORE-STUDY-04 | scope-reset | [所有者 UID 変更時に異所有者のセッションを削除しローディング状態を更新できる](#unit-store-study-04) |
| UNIT-STORE-STUDY-05 | state-change | [リモート学習セッションを一括置換しローディングを完了できる](#unit-store-study-05) |
| UNIT-STORE-STUDY-06 | state-change | [リモート学習セッションのローディング完了を設定できる](#unit-store-study-06) |

<a id="unit-store-study-01"></a>

### UNIT-STORE-STUDY-01 複数デックの独立した学習セッションを保持できる

カテゴリ: `state-change`

対応テスト: `[STUDY-SESSION-01] [STUDY-ACTIONS-04] keeps independent study sessions for multiple decks`

Given:

- 2つの異なるデック ID（`deck-1`, `deck-2`）を用意する。

When:

- それぞれのデックに対して `startStudy` で学習を開始する。

Then:

- `sessionsByDeckId` に両方のデックのセッションが独立して保存され、カード順や現在インデックスが正しく管理される。

<a id="unit-store-study-02"></a>

### UNIT-STORE-STUDY-02 指定したデックのセッションのみを削除できる

カテゴリ: `state-change`

対応テスト: `[STUDY-SESSION-01] [STUDY-ACTIONS-04] removes only the requested session`

Given:

- `deck-1` と `deck-2` のセッションが `studySessionStore` に存在する。

When:

- `removeStudySession("deck-1")` を実行する。

Then:

- `deck-1` のセッションのみが削除され、`deck-2` のセッションはそのまま維持される。

<a id="unit-store-study-03"></a>

### UNIT-STORE-STUDY-03 レガシーバックアップを削除せずに画面表示セッションをクリアできる

カテゴリ: `state-change`

対応テスト: `[STUDY-SESSION-01] [STUDY-ACTIONS-04] clears the visible session without deleting the legacy backup`

Given:

- `localStorage` にレガシーバックアップ用キー `tango-study` の値が存在する。
- 画面上の学習セッションが存在する。

When:

- `clearStudySessions()` を呼び出す。

Then:

- ストア上の画面表示セッションは消去（`getStudySession` で `undefined`）されるが、`localStorage` のバックアップ値は保持される。

<a id="unit-store-study-04"></a>

### UNIT-STORE-STUDY-04 所有者 UID 変更時に異所有者のセッションを削除しローディング状態を更新できる

カテゴリ: `scope-reset`

対応テスト: 仕様（アクション `setStudySessionOwner.ts`）定義

Given:

- `uid: "user-a"` 所有のセッションがストアに存在する。

When:

- `setStudySessionOwner("user-b")` を呼び出す。

Then:

- 所有者が一致しない `"user-a"` のセッションが削除され、`remoteLoading` が `true` に設定される。

<a id="unit-store-study-05"></a>

### UNIT-STORE-STUDY-05 リモート学習セッションを一括置換しローディングを完了できる

カテゴリ: `state-change`

対応テスト: 仕様（アクション `replaceRemoteStudySessions.ts`）定義

Given:

- `remoteLoading: true` の状態である。
- 取得した StudySession オブジェクト配列を用意する。

When:

- `replaceRemoteStudySessions(sessions)` を実行する。

Then:

- `sessionsByDeckId` が渡されたセッションで一括置換され、`remoteLoading` フラグが `false` に更新される。

<a id="unit-store-study-06"></a>

### UNIT-STORE-STUDY-06 リモート学習セッションのローディング完了を設定できる

カテゴリ: `state-change`

対応テスト: 仕様（アクション `finishStudySessionLoading.ts`）定義

Given:

- `remoteLoading: true` の状態である。

When:

- `finishStudySessionLoading()` を実行する。

Then:

- `studySessionStore.getState().remoteLoading` が `false` になる。
