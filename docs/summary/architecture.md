# Architecture

## System View

```mermaid
flowchart TD
    User[利用者 / Browser] --> SPA[Vite + React SPA]
    SPA --> Router[React Router / src/App.tsx]
    Router --> Pages[src/page]
    Pages --> Hooks[src/page/hooks.ts]
    Pages --> Templates[src/component/Template]
    Templates --> UI[src/component/Organism / Molecule / Atom]

    Hooks --> Actions[src/action thunk]
    Actions --> Store[Redux store / src/store]
    Store --> Selectors[src/selector]
    Selectors --> Pages
    Store <--> Persist[redux-persist / LocalStorage]

    Actions --> FirebaseAuth[Firebase Auth]
    Actions --> FirestoreGateway[src/action/firestore]
    FirestoreGateway <--> Firestore[(Firestore deck/card)]
    FirebaseAuth --> FirestoreGateway

    SamplePy[sample/generate.py] --> SampleJson[sample/build/output.json]
    SampleJson --> Reducer[src/store/reducer.ts initial sample deck]

    FirestoreRules[firestore.rules] --> Firestore
```

## Runtime Boundaries

- Browser 内で動く React SPA が中心です。server-side application code は見当たりません。
- Redux state は `deck`、`card`、`config` に分かれ、`redux-persist` で LocalStorage に保存されます。
- Firebase Auth は匿名ログインと Google ログインを扱います。
- Firestore には `deck` と `card` の collection があり、`src/action/firestore/event.ts` が `updatedAt` を使って snapshot を購読します。
- `localMode` が true の deck/card は Firestore に保存せず、Redux state のみで扱います。

## State And Data Flow

```mermaid
sequenceDiagram
    participant Browser
    participant App as App/useEffect
    participant Event as action.event
    participant Auth as Firebase Auth
    participant Store as Redux Store
    participant FS as Firestore

    Browser->>App: load SPA
    App->>Event: init()
    Event->>Auth: signInAnonymously when config.isAnonymous
    Auth-->>Event: onAuthStateChanged(user)
    Event->>Store: configUpdate(uid, isAnonymous, displayName)
    Event->>FS: subscribe deck/card where uid and updatedAt
    FS-->>Event: snapshot changes
    Event->>Store: deck/card bulk insert/update/delete
    Store-->>Browser: selectors update page props
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

- `src/page` は route container として薄く、UI は Template/Organism 以下に分かれています。
- domain 操作は `src/action` の thunk に集約されています。
- reducer は action type 文字列と `equal()` helper で分岐します。
- Firestore 書き込みの一部は UI 遷移遅延を避けるため `void firestore.xxx(...)` の fire-and-forget になっています。
- sample deck は Python サブプロジェクトで生成した JSON を build input として取り込みます。
