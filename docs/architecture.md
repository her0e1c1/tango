# Tango アーキテクチャ図

```mermaid
flowchart TD
    U[利用者 / Browser] --> V[Vite + React SPA]
    V --> R[Router<br/>src/App.tsx]
    R --> P[Pages<br/>src/page]
    P --> C[UI Components<br/>Template / Organism / Molecule / Atom]

    P --> H[Page Hooks<br/>src/page/hooks.ts]
    H --> A[Redux Actions / Thunks<br/>src/action]
    A --> S[Redux Store<br/>src/store]
    S --> X[Selectors<br/>src/selector]
    X --> P

    S <--> L[redux-persist<br/>LocalStorage]
    S --> I[Sample Deck Data<br/>sample/build/output.json]

    A --> AU[Firebase Auth]
    A --> F[Firestore Gateway<br/>src/action/firestore]
    F --> DB[(Firebase Firestore<br/>deck / card collections)]
    AU --> F

    AU -. auth state change .-> A
    DB -. snapshot subscription .-> F
    F -. deck/card events .-> A
```

## 構成メモ

- `src/main.tsx` で Redux `Provider` と `PersistGate` を初期化します。
- `src/App.tsx` でルーティングし、各 `Page` が画面単位の振る舞いをまとめます。
- `src/page/hooks.ts` から Action を呼び、状態更新や画面遷移を行います。
- `src/store` と `src/selector` が画面状態の保持と参照を担当します。
- `src/action/firestore` が Firestore との入出力を担当し、`src/action/event.ts` が認証と購読開始を管理します。
- 初期状態には `sample/build/output.json` のサンプルカードが取り込まれます。
