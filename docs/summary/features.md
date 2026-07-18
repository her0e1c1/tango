# Feature Inventory

## Deck 一覧と学習導線

- Root path `/` の `DeckListPage` で deck 一覧を表示します。
- 各 deck card から Study、Restart、download、edit、delete を実行できます。
- Restart は `deck.currentIndex` がある場合だけ有効です。
- Header から dark mode 切替、CSV import、settings へ移動できます。

Key files: `src/page/DeckList.tsx`, `src/features/deck/containers/DeckListContainer.tsx`, `src/features/deck/components/templates/DeckListTemplate.tsx`

## CSV Import / Export

- `/import` で CSV file を upload し、`Papa.parse` で card に変換します。
- CSV row は `frontText`, `backText`, `tags`, `uniqueKey` として扱われます。
- 同じ deck name がない場合は deck を作成し、`uniqueKey` が既存 card と一致するものは update、新規は create します。
- deck download は card rows を `Papa.unparse` し、`file-saver` で CSV 保存します。
- sample CSV download も提供されています。

Key files: `src/page/DeckImportPage.tsx`, `src/features/import/containers/DeckImportContainer.tsx`, `src/features/import/components/templates/DeckImportTemplate.tsx`, `src/action/deck.ts`, `src/action/card.ts`, `src/constant.ts`

## Card 一覧と filter

- `/deck/:id` で deck 内 card を表示します。
- card list には score、学習回数、tags、front text が表示されます。
- details 内の filter で tags、AND/OR、score min/max を調整できます。
- `useRemoteCollections` は `filterCardsForDeck` を使い、selected tags、score range、`useCardInterval` と `nextSeeingAt` に基づいてカードを絞り込み、`numberOfSeen` 昇順に並べます。

Key files: `src/page/CardList.tsx`, `src/features/card/containers/CardListContainer.tsx`, `src/features/card/components/templates/CardListTemplate.tsx`, `src/features/deck/components/DeckStartForm.tsx`, `src/query/useRemoteCollections.ts`, `src/lib/study.ts`

## Card 編集と表示

- `/card/:id/edit` で front text、back text、tags を編集できます。
- `/card/:id` と card list overlay は back text を表示します。
- category は deck category を基本に、card tags の language mapping がある場合は tag 側を優先します。

Key files: `src/page/CardFormPage.tsx`, `src/page/CardViewPage.tsx`, `src/features/card/containers/CardFormContainer.tsx`, `src/features/card/containers/CardViewContainer.tsx`, `src/features/card/components`, `src/util.ts`

## Deck 編集

- `/deck/:id/edit` で deck name、convertToBr、url、category を編集できます。
- Public は form 上では disabled です。
- url がある deck は deck card に reload icon が表示され、reimport action を呼べます。ただし `DeckListPage` では `onClickReimport` がコメントアウトされています。

Key files: `src/page/DeckFormPage.tsx`, `src/features/deck/containers/DeckFormContainer.tsx`, `src/features/deck/components/DeckForm.tsx`, `src/action/deck.ts`

## 学習セッション

- `/deck/:id/start` で filter 条件を調整し、対象 card 数を確認して学習開始します。
- `deck.start()` は filter 後の cards から `cardOrderIds` を作り、shuffle と max number を適用します。
- `/deck/:id/study` では front/back text を切り替え、上下左右 swipe または keyboard arrow で操作します。
- swipe mapping は config の `cardSwipeUp/Down/Left/Right` に従い、score、学習回数、last seen、current index を更新します。
- controller は card interval 秒で自動送りできます。

Key files: `src/page/DeckStartPage.tsx`, `src/page/DeckSwiperPage.tsx`, `src/features/study/containers`, `src/features/study/components`, `src/action/deck.ts`

## Auth と Firestore Sync

- 初期化時、匿名状態なら Firebase anonymous sign-in を実行します。
- Google login は anonymous user を Google credential に link し、失敗時は credential sign-in を試します。
- auth state change 後、Auth Context の uid を使って deck/card snapshot を購読し、Query cache を更新します。
- deck/card は Firestore に create/update/delete され、Firestore SDK の persistent local cache で offline 利用できます。
- 長期設定は Zustand store の `tango-config` に保存します。

Key files: `src/action/event.ts`, `src/firebase.ts`, `src/action/firestore/*`

## Settings

- `/settings` では login/logout、layout、card behavior、auto play、metadata を編集または表示できます。
- form は `react-hook-form` の `watch()` で変更ごとに Zustand config store を更新します。
- version は `__APP_VERSION__` から表示されます。

Key files: `src/page/ConfigPage.tsx`, `src/features/settings/containers/ConfigContainer.tsx`, `src/features/settings/components/ConfigForm.tsx`, `src/store/configStore.ts`

## Sample Deck

- `sample/generate.py` が Python test files から card data を生成します。
- サーバー同期後に Deck が0件なら `sample/build/output.json` を通常の Firestore mutation で自動追加します。Import 画面の Add sample deck 操作でも追加できます。
- 同じ UID では決定的な sample deck ID を使うため、再実行しても duplicate deck を作りません。

Key files: `sample/generate.py`, `src/features/import/hooks/useDeckImport.ts`, `src/features/import/containers/DeckImportContainer.tsx`
