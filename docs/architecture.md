# Tango アーキテクチャ図

```mermaid
flowchart TD
    U[利用者 / Browser] --> V[Vite + React SPA]
    V --> R[Router<br/>src/App.tsx]
    R --> P[Pages<br/>src/page]
    P --> C[Feature Containers<br/>src/features/*/containers]
    C --> T[Feature Templates<br/>src/features/*/components/templates]
    C --> FC[Feature Components<br/>src/features/*/components]
    T --> FC
    T --> SC[Common Components<br/>src/components]
    FC --> SC

    C --> H[Container Hooks<br/>src/hooks / src/features/*/hooks]
    C --> A[Domain Actions<br/>src/action]
    H --> A
    C --> Z[Zustand Stores<br/>Config / Study]
    H --> Z
    Z <--> L[LocalStorage<br/>tango-config / tango-study]
    A --> I[Sample Deck Data<br/>sample/build/output.json]
    C --> AC[Auth Context]
    AC --> AU[Firebase Auth]
    H --> Q[TanStack Query Cache<br/>Remote Deck / Card]
    Q --> F[Firestore Gateway<br/>src/adapters/firestore]
    F --> DB[(Firebase Firestore<br/>deck / card collections)]
    AU -. auth state change .-> AC
    DB -. UID-scoped snapshot .-> F
    F -. replace / delta .-> Q
```

## UI の依存方向と state 所有

UI の依存方向は `App -> Page -> Container -> Template -> Component` です。`src/page` の各 route entry は対応する feature の container を 1 つ render します。

- `containers` は route と store のデータを取得し、画面の rendering を調整します。
- feature hook は再利用する feature 固有の form/UI state と、TanStack Query・router・Zustand などの接続や副作用をカプセル化します。
- `components/templates` は画面単位の stateless な合成を、`components` は props-driven な表示を担当します。domain/UI state を所有しない表示統合として、`Code` の DOM highlighting や `useSwipeable` などの render-only hook は利用できます。
- `src/components` は feature に依存しない stateless な共通表示です。feature 間の調整は container が行います。
- feature 固有の container-support hook は `src/features/<feature>/hooks`、feature 間で共有する container hook は `src/hooks` に置き、Page・Template・Component からは呼びません。

## Common component の責務別 group

`src/components` は component の大きさではなく責務で分類し、Atomic Design の atom/molecule taxonomy は使いません。

- `layout`: `FullScreen`、`Header`、`Layout`、`List`、`Main`、`Outer`
- `forms`: `Button`、`Form`、`FormItem`、`Input`、`Select`、`Slider`、`Switch`、`Tag`、`Textarea`、`Upload`
- `content`: `Card`、`Code`、`Description`、`Logo`、`Math`、`Score`、`Section`、`Style`、`TagList`、`Title`
- `feedback`: `Feedback`、`Overlay`

公開 API は root barrel の `@/components` です。stories と component 固有の style は対象 component と同じ group に置き、各 group は feature 非依存かつ stateless に保ちます。

## Feature map

`src/features` は `deck`、`card`、`study`、`import`、`settings` に分かれます。stories と specs は対象の component、template、container と同じ feature に置きます。Storybook は `src/**/*.stories.tsx`、Vitest は `src/**/*.spec.{ts,tsx}` を discovery します。

## 構成メモ

- `src/main.tsx` で TanStack Query と Auth Context を初期化します。
- `src/App.tsx` は route と application bootstrap を担当します。
- TanStack Query が Firestore 由来の Deck / Card の唯一の application cache です。Firestore SDK の persistent local cache が offline data を保持します。UID変更・logout時は listener停止、query cancellation、UID cache削除を同期順序で行います。
- 長期設定と学習セッションはそれぞれ Zustand store で管理し、設定は `tango-config`、学習状態は `tango-study` に永続化します。
- Firebase Auth の runtime identity は Auth Context だけから参照し、LocalStorage の application state には保存しません。
- `src/adapters/firestore` が Firestore SDK、DTO、mapper、collection 名、runtime 初期化、Firestore との入出力を所有します。Firebase 非依存の snapshot・change・subscription contract は `src/query/remoteReadContract.ts` が所有します。
- Query controller と mutation service は関数注入による差し替え境界を維持します。concrete adapter は `remoteReadSession` と feature hook などの composition module だけが参照し、Deck/Card の CRUD Repository interface は設けません。
- `src/auth/AuthBootstrap.tsx` が認証に連動した購読 lifecycle を担当します。
- `sample/build/output.json` のサンプルカードは、サーバー同期後に Deck が0件なら自動で Firestore に追加します。Import 画面からの明示操作でも追加できます。
