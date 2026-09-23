# Auth Store 単体テスト仕様書

## 目的

認証セッションストア (`authSessionStore`) の初期状態、認証状態の移行、および全置換更新における動作を確認する。

対応ファイル: [`store.ts`](../../../../src/entities/auth/model/store.ts) / [`replaceAuthSession.ts`](../../../../src/entities/auth/model/actions/replaceAuthSession.ts) / [`getAuthSession.ts`](../../../../src/entities/auth/model/queries/getAuthSession.ts) / [`useAuthSession.ts`](../../../../src/entities/auth/model/queries/useAuthSession.ts) / [`replaceAuthSession.spec.ts`](../../../../src/entities/auth/model/actions/replaceAuthSession.spec.ts) / [`useAuthSession.spec.ts`](../../../../src/entities/auth/model/queries/useAuthSession.spec.ts)

関連 E2E: [ACCOUNT-01](../../e2e/account.md#account-01)、[ACCOUNT-03](../../e2e/account.md#account-03)、[ACCOUNT-04](../../e2e/account.md#account-04)

## 共通前提

テスト実行前に `replaceAuthSession({ status: "initializing" })` を呼び出し、`authSessionStore` の状態を初期化状態にリセットする。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-AUTH-01 | initial | [識別子なしの初期状態を保持できる](#unit-store-auth-01) |
| UNIT-STORE-AUTH-02 | state-change | [現在の認証セッションを新しい認証情報で全置換できる](#unit-store-auth-02) |
| UNIT-STORE-AUTH-03 | state-change | [SDK 認証資格情報を伴わない匿名認証状態を保持できる](#unit-store-auth-03) |
| UNIT-STORE-AUTH-04 | state-change | [グローバル entity store の変更をセッション購読に伝播できる](#unit-store-auth-04) |

<a id="unit-store-auth-01"></a>

### UNIT-STORE-AUTH-01 識別子なしの初期状態を保持できる

カテゴリ: `initial`

対応テスト: `[ACCOUNT-03] [ACCOUNT-04] starts without an identity`

Given:

- `authSessionStore` が `status: "initializing"` でリセットされている。

When:

- `getAuthSession()` を取得する。

Then:

- セッションの `status` は `"initializing"` であり、`uid` プロパティが存在しない。

<a id="unit-store-auth-02"></a>

### UNIT-STORE-AUTH-02 現在の認証セッションを新しい認証情報で全置換できる

カテゴリ: `state-change`

対応テスト: `[ACCOUNT-03] [ACCOUNT-04] replaces the current session`

Given:

- 初期状態の `authSessionStore` が存在する。

When:

- `replaceAuthSession({ status: "authenticated", uid: "uid-a", isAnonymous: true, displayName: null })` を実行する。

Then:

- `getAuthSession()` の返す値が指定した認証済みセッションオブジェクト（`status: "authenticated"`, `uid: "uid-a"`, `isAnonymous: true`, `displayName: null`）に完全に置き換わる。

<a id="unit-store-auth-03"></a>

### UNIT-STORE-AUTH-03 SDK 認証資格情報を伴わない匿名認証状態を保持できる

カテゴリ: `state-change`

対応テスト: `[ACCOUNT-03] [ACCOUNT-04] represents anonymous authentication without an SDK credential`

Given:

- `attemptId` Symbol を作成する。

When:

- `replaceAuthSession({ status: "authenticating", attemptId })` を実行する。

Then:

- `getAuthSession()` が `status: "authenticating"` かつ該当する `attemptId` を持つオブジェクトを返す。

<a id="unit-store-auth-04"></a>

### UNIT-STORE-AUTH-04 グローバル entity store の変更をセッション購読に伝播できる

カテゴリ: `state-change`

対応テスト: `[ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04] reads session updates from the global entity store`

Given:

- `useAuthSession` フックをレンダリングする。

When:

- `replaceAuthSession` により `status: "authenticated"` のセッション情報を設定する。

Then:

- フックの参照値 `result.current` が更新後の認証済みセッション状態を返す。
