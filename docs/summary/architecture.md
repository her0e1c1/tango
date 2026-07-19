# Architecture

## System View

```mermaid
flowchart TD
    User[利用者 / Browser] --> SPA[Vite + React SPA]
    SPA --> Router[React Router / src/App.tsx]
    Router --> Pages[src/page]
    Pages --> Containers[src/features/*/containers]
    Containers --> Templates[src/features/*/components/templates]
    Containers --> FeatureUI[src/features/*/components]
    Templates --> FeatureUI
    Templates --> CommonUI[src/components]
    FeatureUI --> CommonUI

    Containers --> Actions[src/action]
    Containers --> Zustand[Zustand config/study stores]
    Zustand <--> Persist[LocalStorage]

    Actions --> FirebaseAuth[Firebase Auth]
    Actions --> FirestoreGateway[src/adapters/firestore]
    FirestoreGateway <--> Firestore[(Firestore deck/card)]
    FirebaseAuth --> FirestoreGateway

    SamplePy[sample/generate.py] --> SampleJson[sample/build/output.json]
    SampleJson --> Import[Import screen explicit sample command]
    Import --> FirestoreGateway

    FirestoreRules[firestore.rules] --> Firestore
```

## Runtime Boundaries

- Browser 内で動く React SPA が中心です。server-side application code は見当たりません。
- Firebase Auth は匿名ログインと Google ログインを扱います。
- Firestore には `deck` と `card` の collection があり、`src/adapters/firestore/event.ts` が uid 条件で snapshot を購読します。
- Firestore SDK、document DTO、mapper、collection 名、Timestamp 変換、runtime 初期化は `src/adapters/firestore` に閉じます。Firebase 非依存の read contract は `src/query/remoteReadContract.ts` が所有します。
- deck/card は Firestore に保存し、Firestore SDK の persistent local cache で offline 利用に対応します。TanStack Query は application cache を担います。
- runtime identity は Auth Context、長期設定と学習セッションは Zustand で保持します。

## State And Data Flow

```mermaid
sequenceDiagram
    participant Browser
    participant App as AuthBootstrap
    participant Auth as Firebase Auth
    participant Query as Query Cache
    participant FS as Firestore

    Browser->>App: load SPA
    App->>Auth: signInAnonymously when signed out
    Auth-->>App: onAuthStateChanged(user)
    App->>FS: subscribe deck/card where uid
    FS-->>App: initial snapshot and changes
    App->>Query: replace or update remote deck/card cache
    Query-->>Browser: query hooks update page props
```

## Build And Deployment View

```mermaid
flowchart LR
    Source[Repository] --> SampleBuild[make -C sample build]
    Source --> ViteBuild[vite build]
    Source --> StorybookBuild[storybook build]
    SampleBuild --> Build[build artifacts]
    ViteBuild --> Build
    Build --> FirebaseHosting[Firebase Hosting public=build]
    FirestoreRules[firestore.rules] --> FirebaseDeploy[firebase deploy firestore:rules]
    FirebaseDeploy --> FirebaseHosting
```

## Notable Design Choices

- UI は `App -> Page -> Container -> Template -> Component` の順に依存します。`src/page` は対応する feature container を 1 つ render するだけの route entry です。
- router、form、keyboard、timer、変更可能な UI state は `src/features/*/containers` と feature hook / Zustand store が所有します。`components/templates` と `components` は props-driven な表示層です。
- `src/components` は feature に依存せず、feature の presentation は同じ feature または共通 component だけを参照します。依存境界は `src/lib/componentArchitecture.spec.ts` が検証します。
- UI stories/specs は対象 component、template、container と同じ `components` または feature 配下に置き、`src/**/*.stories.tsx` と `src/**/*.spec.{ts,tsx}` から discovery されます。
- domain 操作は `src/action` と feature mutation hook に集約されています。
- Deck/Card mutation は TanStack Query cache を optimistic に更新し、Firestore 書き込みを待機して失敗時に rollback します。
- mutation service と remote read controller は既存の関数注入境界を使います。Repository interface や DI container は追加せず、concrete Firestore adapter は application composition module だけで配線します。
- sample deck は Python サブプロジェクトで生成した JSON を、Import 画面から通常の Firestore mutation で追加します。
