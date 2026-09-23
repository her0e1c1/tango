# Store 単体テスト仕様書

## 目的

`src/entities/*/model/store.ts` で定義されている各 Entity の Zustand Store および関連するモデルアクション・クエリに対する単体テストケースの仕様を定義する。

> [!NOTE]
> 本仕様書はユーザーの明示的な要求に基づき作成されています。

## 検証境界

Store の初期状態、アクション（`model/actions/`）による状態変更・置換、永続化（`zustand/middleware/persist`）の挙動、認証スコープの切り替え時のリセット処理を検証する。外部サービス（Firestore / Firebase Auth）との実際の通信や UI コンポーネントのレンダリングは対象外とする。

## テストケース ID 規則

`UNIT-STORE-<ENTITY>-<NN>`

- `<ENTITY>`: 対象の Entity 名（大文字ハイフン表記: `AUTH`, `CARD`, `DECK`, `PREF`, `STUDY`）
- `<NN>`: 2桁の連番（`01` から開始、欠番なし）

## 仕様書一覧

| 対象 Entity | Store 名 | 対応ファイル | 仕様書 |
| --- | --- | --- | --- |
| `auth` | `authSessionStore` | [`src/entities/auth/model/store.ts`](../../../../src/entities/auth/model/store.ts) | [auth.md](./auth.md) |
| `card` | `cardStore` | [`src/entities/card/model/store.ts`](../../../../src/entities/card/model/store.ts) | [card.md](./card.md) |
| `deck` | `deckStore` | [`src/entities/deck/model/store.ts`](../../../../src/entities/deck/model/store.ts) | [deck.md](./deck.md) |
| `preference` | `preferencesStore` | [`src/entities/preference/model/store.ts`](../../../../src/entities/preference/model/store.ts) | [preference.md](./preference.md) |
| `study-session` | `studySessionStore` | [`src/entities/study-session/model/store.ts`](../../../../src/entities/study-session/model/store.ts) | [study-session.md](./study-session.md) |

## テストの実行

単体テストは `vitest` を使用して co-locate された `*.spec.ts` ファイル内で実行する。

```bash
# 全ての Store 関連単体テストを実行
npx vitest src/entities/**/*.spec.{ts,tsx}
```
