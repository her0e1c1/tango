# 認証の単体テスト仕様

## 目的

認証状態の参照・置換と、Google 連携・サインアウトの呼び出し境界を確認する。認証済みの利用者だけを公開し、連携や状態変更で誤った UID を返さないことを契約とする。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-AUTH-01](#unit-auth-01) | `read` | 初期化中は利用者を持たない |
| [UNIT-AUTH-02](#unit-auth-02) | `write` | 認証状態の置換を参照側へ反映する |
| [UNIT-AUTH-03](#unit-auth-03) | `write` | 匿名認証の処理中を表現できる |
| [UNIT-AUTH-04](#unit-auth-04) | `write` | Google 連携後も同じ UID を公開する |
| [UNIT-AUTH-05](#unit-auth-05) | `write` | サインアウトを挟んで以前の利用者情報を残さない |
| [UNIT-AUTH-06](#unit-auth-06) | `read` | 認証が確定していない状態で UID を公開しない |
| [UNIT-AUTH-07](#unit-auth-07) | `write` | Google 連携に成功すると利用者を返す |
| [UNIT-AUTH-08](#unit-auth-08) | `write` | 既存の認証情報を利用して連携エラーから復帰する |
| [UNIT-AUTH-09](#unit-auth-09) | `write` | 匿名利用者がいない場合は連携を開始しない |
| [UNIT-AUTH-10](#unit-auth-10) | `write` | 復帰できない連携エラーをそのまま返す |
| [UNIT-AUTH-11](#unit-auth-11) | `write` | 認証情報による復帰の失敗を返す |
| [UNIT-AUTH-12](#unit-auth-12) | `write` | 現在の認証に対してサインアウトを要求する |

## ケース詳細

<a id="unit-auth-01"></a>

### UNIT-AUTH-01: 初期化中は利用者を持たない

カテゴリ: `read`

対応テスト: [model/actions/replaceAuthSession.spec.ts][session] — `starts without an identity`

**Given**: 認証状態を初期化中にしている。

**When**: 現在の認証セッションを取得する。

**Then**: 状態は `initializing` であり、UID を持たない。

<a id="unit-auth-02"></a>

### UNIT-AUTH-02: 認証状態の置換を参照側へ反映する

カテゴリ: `write`

対応テスト: [model/actions/replaceAuthSession.spec.ts][session] — `replaces the current session` / [model/queries/useAuthSession.spec.ts][hook] — `reads session updates from the global entity store`

**Given**: 認証状態は初期化中で、セッション参照 hook が有効になっている。

**When**: UID `uid-a`、表示名なしの匿名認証済みセッションに置き換える。

**Then**: getter と hook は、指定した UID・匿名状態・表示名を持つ認証済みセッションを返す。

<a id="unit-auth-03"></a>

### UNIT-AUTH-03: 匿名認証の処理中を表現できる

カテゴリ: `write`

対応テスト: [model/actions/replaceAuthSession.spec.ts][session] — `represents anonymous authentication without an SDK credential`

**Given**: 匿名認証の試行を識別する値があり、まだ認証済み利用者はいない。

**When**: その試行を認証処理中として設定する。

**Then**: セッションから `authenticating` と同じ試行識別子を取得できる。SDK の認証結果を用意する必要はない。

<a id="unit-auth-04"></a>

### UNIT-AUTH-04: Google 連携後も同じ UID を公開する

カテゴリ: `write`

対応テスト: [model/queries/getAuthUid.spec.ts][uid] — `returns the linked account UID` / [model/queries/getAuthUid.spec.ts][uid] — `preserves the same persistence identity when an anonymous account is linked` / [model/queries/useAuth.spec.ts][auth] — `keeps the anonymous identity when linking a Google account`

**Given**: UID `uid-a` の匿名セッションがあり、連携後の表示名を `Test User` とする。

**When**: 同じ UID の通常アカウントのセッションに置き換え、認証情報を参照する。

**Then**: 連携前後の UID は同一で、連携後は匿名ではなく指定した表示名を返す。通常アカウントの UID も getter から取得できる。

<a id="unit-auth-05"></a>

### UNIT-AUTH-05: サインアウトを挟んで以前の利用者情報を残さない

カテゴリ: `write`

対応テスト: [model/queries/useAuth.spec.ts][auth] — `clears the linked identity during sign-out and exposes the new anonymous session`

**Given**: 通常アカウントで認証済みの状態から、未認証または新しい匿名セッションへ切り替える。

**When**: 切り替え後の認証情報を hook から取得する。

**Then**: 未認証時は空 UID・表示名なし・匿名扱いとなり、新しい匿名セッションでは新 UID と表示名なしを返す。以前の表示名と UID は返さない。

<a id="unit-auth-06"></a>

### UNIT-AUTH-06: 認証が確定していない状態で UID を公開しない

カテゴリ: `read`

対応テスト: [model/queries/getAuthUid.spec.ts][uid] — `returns an empty string when the session is $status` / [model/queries/useAuth.spec.ts][auth] — `does not expose an identity while authentication is $status`

**Given**: 状態が `initializing`、`unauthenticated`、試行識別子付きの `authenticating`、認証エラー付きの `error` のいずれかである。

**When**: UID getter と認証情報 hook を参照する。

**Then**: getter は空文字を返し、hook は空 UID・表示名なし・匿名扱いを返す。

<a id="unit-auth-07"></a>

### UNIT-AUTH-07: Google 連携に成功すると利用者を返す

カテゴリ: `write`

対応テスト: [api/signInWithGoogle.spec.ts][sign-in] — `returns the linked user`

**Given**: 現在の Firebase 利用者は匿名であり、連携処理は利用者 `uid-a` を返すようにモックされている。

**When**: Google サインインを要求する。

**Then**: 連携処理が返した利用者を呼び出し元へ返す。

<a id="unit-auth-08"></a>

### UNIT-AUTH-08: 既存の認証情報を利用して連携エラーから復帰する

カテゴリ: `write`

対応テスト: [api/signInWithGoogle.spec.ts][sign-in] — `recovers a credential from a Firebase linking error`

**Given**: 匿名利用者の連携が `auth/credential-already-in-use` で失敗し、エラーから Google の認証情報を取り出せる。認証情報によるサインインは利用者を返す。

**When**: Google サインインを要求する。

**Then**: 取り出した認証情報でサインインを要求し、その処理で得られた利用者を返す。

<a id="unit-auth-09"></a>

### UNIT-AUTH-09: 匿名利用者がいない場合は連携を開始しない

カテゴリ: `write`

対応テスト: [api/signInWithGoogle.spec.ts][sign-in] — `rejects login without an anonymous user` / [api/signInWithGoogle.spec.ts][sign-in] — `rejects login for a non-anonymous user`

**Given**: Firebase の現在の利用者が存在しない、または匿名ではない。

**When**: Google サインインを要求する。

**Then**: 匿名利用者が必要であることを示すエラーで失敗し、連携を要求しない。

<a id="unit-auth-10"></a>

### UNIT-AUTH-10: 復帰できない連携エラーをそのまま返す

カテゴリ: `write`

対応テスト: [api/signInWithGoogle.spec.ts][sign-in] — `preserves non-Firebase linking errors` / [api/signInWithGoogle.spec.ts][sign-in] — `preserves Firebase linking errors without a credential`

**Given**: 連携処理が通常の `Error` で失敗する、または Firebase エラーから認証情報を取り出せない。

**When**: Google サインインを要求する。

**Then**: 連携処理の元のエラーで失敗する。成功や別のエラーに置き換えない。

<a id="unit-auth-11"></a>

### UNIT-AUTH-11: 認証情報による復帰の失敗を返す

カテゴリ: `write`

対応テスト: [api/signInWithGoogle.spec.ts][sign-in] — `propagates credential recovery failures`

**Given**: 連携エラーから認証情報を取得できるが、その認証情報でのサインインは失敗する。

**When**: Google サインインを要求する。

**Then**: 復帰処理のエラーを呼び出し元へ返す。

<a id="unit-auth-12"></a>

### UNIT-AUTH-12: 現在の認証に対してサインアウトを要求する

カテゴリ: `write`

対応テスト: [api/signOutCurrentUser.spec.ts][sign-out] — `ACCOUNT-03 signs out through Firebase Auth`

**Given**: アプリが利用する Firebase Auth があり、SDK のサインアウトをモックしている。

**When**: 現在の利用者のサインアウトを要求する。

**Then**: その Firebase Auth を対象として SDK にサインアウトを要求する。

## 検証範囲の注意

Firebase Auth はモックする。実際の Google popup、アカウント連携、データ移行、サインアウト後の再認証は対象外。サインアウトのケースは SDK への要求のみを確認し、実際に認証が解除されたことまでは保証しない。

[session]: ../../src/entities/auth/model/actions/replaceAuthSession.spec.ts
[uid]: ../../src/entities/auth/model/queries/getAuthUid.spec.ts
[auth]: ../../src/entities/auth/model/queries/useAuth.spec.ts
[hook]: ../../src/entities/auth/model/queries/useAuthSession.spec.ts
[sign-in]: ../../src/entities/auth/api/signInWithGoogle.spec.ts
[sign-out]: ../../src/entities/auth/api/signOutCurrentUser.spec.ts
