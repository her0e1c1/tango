# Auth Store 単体テスト仕様書

## 目的

認証結果を利用する側が、現在の状態と本人情報だけを取得でき、前の利用者や認証試行の情報を引き継がないことを確認する。Firebase Auth の実行、試行の競合制御、サインアウト時の他 Entity の消去は対象外とする。

関連テスト: [`replaceAuthSession.spec.ts`](../../../../src/entities/auth/model/actions/replaceAuthSession.spec.ts)

関連 E2E: [ACCOUNT-03](../../e2e/account.md#account-03)、[ACCOUNT-04](../../e2e/account.md#account-04)

対応状況は既存テストとの静的な照合結果であり、テストの実行結果ではない。共通の検証境界と対応状況の意味は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| UNIT-STORE-AUTH-01 | initial | [本人確認が終わるまでは利用者を確定しない](#unit-store-auth-01) |
| UNIT-STORE-AUTH-02 | state-change | [認証完了後は今回の利用者情報だけを提供する](#unit-store-auth-02) |
| UNIT-STORE-AUTH-03 | state-change | [認証未完了の状態へ変わったら古い本人情報を提供しない](#unit-store-auth-03) |

<a id="unit-store-auth-01"></a>

### UNIT-STORE-AUTH-01 本人確認が終わるまでは利用者を確定しない

カテゴリ: `initial`

対応テスト: `starts without an identity`（要補完：既存テストは事前に初期状態を書き込んでおり、起動直後を検証していない）。

Given:

認証結果をまだ受け取っていない新しい実行環境である。期待する状態を事前に書き込まない。

When:

現在の認証状態を取得する。

Then:

状態は初期確認中であり、認証済みとして扱われない。利用者 ID、表示名、匿名利用者かどうかの情報はまだ提供されない。

<a id="unit-store-auth-02"></a>

### UNIT-STORE-AUTH-02 認証完了後は今回の利用者情報だけを提供する

カテゴリ: `state-change`

対応テスト: `replaces the current session`（要補完：既存テストは初期状態から匿名利用者への変更のみ）。

Given:

次のいずれかの状態である。各行を独立して検証する。

| 変更前 | 今回完了した認証結果 |
| --- | --- |
| 表示名を持つ利用者 A が認証済み | 利用者 B、表示名なし、匿名利用者 |
| 匿名認証を試行中 | 利用者 A、表示名 Alice、連携済み利用者 |
| 認証に失敗している | 利用者 A、表示名 Alice、連携済み利用者 |

When:

今回完了した認証結果を認証モデルへ反映する。

Then:

現在の状態は認証済みとなり、利用者 ID、表示名、匿名利用者かどうかは今回の結果に一致する。以前の利用者情報、試行識別子、失敗情報は残らない。

<a id="unit-store-auth-03"></a>

### UNIT-STORE-AUTH-03 認証未完了の状態へ変わったら古い本人情報を提供しない

カテゴリ: `state-change`

対応テスト: `represents anonymous authentication without an SDK credential`（要補完：既存テストは初期状態から試行中への変更のみ）。

Given:

次の変更前の状態である。各行を独立して検証する。

| 変更前 | 反映する状態 | 残してよい付随情報 |
| --- | --- | --- |
| 利用者 A が認証済み | 未認証 | なし |
| 利用者 A が認証済み | 初期確認中 | なし |
| 利用者 A が認証済み | 認証試行中 | 今回の試行識別子 |
| 試行 A の認証試行中 | 試行 B の認証試行中 | 試行 B の識別子のみ |
| 認証試行中 | 認証失敗 | 今回の失敗情報のみ |

When:

表の状態変更を認証モデルへ反映する。

Then:

指定した認証状態と表に示した付随情報だけを取得できる。以前の利用者 ID、表示名、匿名利用者かどうかの情報は提供されず、古い試行識別子も残らない。認証試行中は、匿名利用者の認証完了とは区別される。
