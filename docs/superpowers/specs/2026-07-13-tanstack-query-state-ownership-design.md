# TanStack Query State Ownership Design

## 背景

Issue #170 は、現在 Redux action/reducer に混在している Firestore server state、realtime 購読、書き込み、study session、UI state を分離する方針を示している。

現在の実装では、`deck.byId` と `card.byId` が Firestore data と `localMode` data の両方を保持し、`redux-persist` で LocalStorage に永続化される。`Deck` には Firestore entity field と `currentIndex`、`cardOrderIds` が同居し、`ConfigState` には永続設定、認証情報、`showBackText`、`autoPlay`、`lastSwipe` が同居している。Firestore snapshot は module-global な購読配列を通じて Redux action へ変換され、書き込みの多くは fire-and-forget である。

PR #173 では study flow と realtime 差分適用が純粋関数として `src/lib/study.ts` と `src/lib/realtimeChange.ts` へ抽出済みである。本設計はそれらを維持し、最新の feature container 境界へ TanStack Query と小さな Zustand store を導入する全体移行計画を定義する。

## 目標

- Firestore-backed deck/card の唯一の client cache を TanStack Query にする。
- study session と一時的な UI state を Zustand に分離する。
- `localMode` deck/card と永続設定の既存挙動を保つ。
- Firestore の初期取得、realtime 更新、mutation の pending/error を明示する。
- optimistic update と rollback を統一する。
- UID 変更時に別ユーザーの data、cache、listener が混ざらないようにする。
- presentation component/template を state library と Firebase から独立させる。
- migration を複数の独立 PR に分割し、各 PR を deploy 可能にする。

## 非目標

- 全 state を TanStack Query に移すこと。
- Firestore data を Zustand に複製すること。
- `localMode` の永続化方式をこの Issue で別 repository や IndexedDB に置き換えること。
- route、UI design、study scoring、filter、CSV format を変更すること。
- Firebase client SDK や認証方式を置き換えること。
- realtime listener を `queryFn` に埋め込むこと。
- 全移行を 1 PR にまとめること。

## 状態の所有権

| State | Owner | Persistence |
| --- | --- | --- |
| Firestore deck/card | TanStack Query | Firestore。Query cache 自体は永続化しない |
| Query loading/error/fetching | TanStack Query | なし |
| Mutation pending/error | TanStack Query | なし |
| Active study session | Zustand | LocalStorage |
| `showBackText`、`autoPlay`、`lastSwipe` | Zustand | なし |
| `localMode` deck/card | Redux | redux-persist / LocalStorage |
| 長期設定 | Redux | redux-persist / LocalStorage |
| Firebase が確認した runtime auth session | React auth context | なし |
| Firestore access | Thin gateway | なし |

Redux は直ちに廃止しない。`deck` と `card` slice は最終的に `localMode` entity だけを保持し、`config` slice は長期設定を保持する。Firestore entity と query を開始するための live UID は Redux action、reducer、persisted state に入れない。

Phase 2〜4 の互換期間だけは、未移行の legacy mutation thunk が entity を解決できるよう remote entity の Redux mirror を維持する。この mirror は表示の source of truth には使わず、Phase 5 で mutation thunk と同時に削除する。最終所有権と移行中の互換状態を区別する。

互換期間に listener を二重登録しない。Phase 2 の remote data bootstrap が作る一組の listener event を Query cache と legacy Redux reducer の両方へ fan-out する。初回 snapshot では Query cache だけでなく Redux mirror の remote 部分も全置換する。置換 action は `localMode: true` の deck と、それらに属する card を保持し、その他の remote entity を新しい snapshot map へ置き換えるため、削除済みまたは以前の UID の entity は残らない。

未移行 thunk が Redux を optimistic 更新した直後には、同じ patch を Query cache へ適用する temporary compatibility bridge を置く。これにより UI は Query を読みながら既存の即時反映を維持できる。card bridge は Phase 3、deck bridge は Phase 4 で正式な mutation hook と入れ替え、Phase 5 まで残さない。

## Study session

現在 `deckId` は route parameter が選択元であり、Redux の独立した session state ではない。`currentIndex` と `cardOrderIds` は `Deck` field として Redux/LocalStorage に保存され、`deck.update()` を通じて Firestore write に混入し得る。

Zustand には単一の active session を次の形で保持する。

```ts
interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
}
```

- route parameter を deck 選択の source of truth とする。
- session の `deckId` は route と session の不一致を検出する guard としてのみ使う。
- `startStudy(deckId, cardOrderIds)` が session を一括初期化する。
- `setCurrentIndex`、`resetStudy` は session だけを更新する。
- `currentIndex === -1` は既存と同様に終了を表し、その後 session を reset して top へ戻る。
- session は Zustand persist middleware で保存し、reload 後の継続を保つ。
- `showBackText`、`autoPlay`、`lastSwipe` は同じ store の非永続 UI slice に置く。
- `defaultAutoPlay` など長期設定は Redux config に残し、study 開始時に UI slice を初期化する。

移行の最初の PR では、Zustand session が空で study route の legacy `Deck` に `cardOrderIds` と `currentIndex` がある場合だけ session へ取り込む互換処理を置く。Zustand persist state には `legacyMigratedDeckIds` を持ち、deck ごとに取込済みであることを記録する。取込と同じ user operation で Redux の純粋 action を使って legacy field を `currentIndex: null`、`cardOrderIds: []` にし、Firestore thunk は呼ばない。session reset 後も marker は残すため、stale session を再取込しない。その後の操作は Redux deck field を更新しない。

## Firestore entity boundary

Firestore gateway は React、Redux、Zustand、TanStack Query を import しない。責務を次に限定する。

- `fetchDecks(uid)` / `fetchCards(uid)` による一括取得。
- `subscribeDecks(options)` / `subscribeCards(options)` による realtime event 変換。
- deck/card create、update、delete。
- Firestore document と application entity の mapper。
- listener error の callback 通知。

Firestore write には DTO builder を使い、field を明示的に列挙する。`currentIndex`、`cardOrderIds`、`showBackText`、`autoPlay`、`lastSwipe`、`localMode` は DTO に含めない。既存 document に client-only field が残っていても read mapper は無視する。

論理削除された card は initial fetch と snapshot mapper の両方で除外し、cache から removed として扱う。

`localMode` は Firestore document field ではなく application runtime discriminator として維持する。remote deck mapper は常に `localMode: false` を付与し、Redux に残る local deck は `localMode: true` とする。card mutation は `card.deckId` から merged read model の owning deck を解決し、その deck の `localMode` で backend を選ぶ。新規 card も対象 deck を使い、新規 deck は mutation request 作成時の永続設定 `config.localMode` を使う。存在しない owning deck や UID 不一致は write 前の validation error とする。

## Query cache

remote entity cache は normalized map とする。

```ts
type EntityMap<T extends { id: string }> = Record<string, T>;
```

Query key は必ず UID を含める。

```ts
const firestoreKeys = {
  root: ["firestore"] as const,
  user: (uid: string) => [...firestoreKeys.root, uid] as const,
  decks: (uid: string) => [...firestoreKeys.user(uid), "decks"] as const,
  cards: (uid: string) => [...firestoreKeys.user(uid), "cards"] as const,
};
```

query option factory を用意し、container、bootstrap、test で同一 key と queryFn を使う。realtime が freshness を担うため `staleTime: Infinity` とし、window focus refetch は無効にする。initial fetch の明示的な retry は小さく制限し、mutation は重複 write を避けるため自動 retry しない。

`QueryClient` は module scope で一度だけ作成し、`src/main.tsx` の `QueryClientProvider` から供給する。test は case ごとに retries 無効の新しい client を作り、終了時に clear する。

## Initial fetch と realtime

listener は `queryFn` に入れない。認証済み UID を受け取る application bootstrap が initial query と listener lifecycle を接続する。

1. Firebase Auth の最初の `onAuthStateChanged` callback が完了するまでは remote query を無効にする。
2. auth state が変わるたびに単調増加する subscription generation を更新し、callback が返した live UID と generation を initial operation に capture する。
3. live UID が決まったら deck/card を `getDocs` で一括取得する。
4. 各 initial query が成功し、capture した UID/generation がまだ current である場合だけ対応する listener を 1 組開始する。stale generation の完了結果から listener は開始しない。
5. listener の最初の snapshot は `isInitial` event として識別する。
6. 最初の snapshot は `applyRealtimeChange({}, event)` で完全な map を作り、query cache 全体と Redux compatibility mirror の remote 部分を置換する。Redux 置換は local deck/card を保持する。
7. 2 回目以降は、UID/generation が current であることを確認してから `applyRealtimeChange(previous, event)` で差分更新し、同じ event を Redux mirror に適用する。
8. listener error 時は listener を解除して query を 1 回 refetch する。refetch 成功時は新しい subscription generation で自動再接続し、失敗時は共通 sync error と手動 retry action を表示する。手動 retry も refetch 成功後に listener を再作成する。
9. UID 変更または logout 時は、先に generation を更新して late callback を無効化し、以前の listener を同期的に解除する。次に旧 UID query を cancel してから cache を削除し、Redux mirror の remote 部分も local entity を保持して clear する。

最初の snapshot を全置換することで、initial fetch と listener 登録の間に document が削除された場合でも stale entity が Query cache または Redux compatibility mirror に残らない。query cancellation と generation guard を併用することで、UID 変更後に遅れて解決した old fetch/event が cache を再作成しない。

`lastUpdatedAt` cursor は Query cache が非永続であるため使用しない。毎回 full initial fetch と初回 snapshot で正しい全体像を作り、その後の差分だけを適用する。移行完了時に Redux config から `lastUpdatedAt` を削除する。

## Auth と application bootstrap

現在 `App` の 1 effect に auth initialization、Firestore subscription、dark mode 反映が結合されている。これを次に分ける。

- auth bootstrap: Firebase Auth listener を開始し、`initializing | authenticated | signedOut | error` と live user/UID を非永続 React context で公開し、cleanup で解除する。
- remote data bootstrap: auth context が `authenticated` になった場合だけ live UID に対する initial query と listener を管理する。
- theme effect: `darkMode` だけを DOM class に反映する。

persisted Redux に残っている旧 `config.uid` は display hint としても query key に使わない。Phase 5 の persist migration で `uid`、`isAnonymous`、`displayName` を永続対象から外し、runtime auth context から必要な画面へ渡す。

Phase 2〜4 の legacy thunk compatibility のため、Firebase callback が確認した live auth snapshot は従来の Redux config にも同期する。ただし remote bootstrap は context の `authenticated` state と live UID だけを参照し、persisted UID では query、listener、write を開始しない。この互換同期は Phase 5 で削除する。

logout は remote listener と UID-scoped Query cache を破棄した後、既存 local/config reset policy を実行する。anonymous user と Google user の切替でも同じ cleanup を通る。

## Read model と container hooks

Query cache には remote entity だけを保持する。Redux selector は local entity だけを返すようにし、feature container hook が表示用 read model を合成する。

```ts
const decksById = { ...remoteDecksById, ...localDecksById };
const cardsById = { ...remoteCardsById, ...localCardsById };
```

ID collision 時は local entity を優先し、development/test では collision を検出する。通常の ID generation では collision は起きない。

hook は `useDecks`、`useDeck`、`useCards`、`useCard`、`useFilteredCards`、`useCurrentStudyCard` などの feature-facing API を提供する。既存 selector 内の純粋変換は `src/lib` または pure selector helper として再利用する。

非同期 read は値を throw する既存 selector semantics を使わず、`pending`、`error`、`notFound`、`success` を container で明示的に分岐する。Page、template、component は Query を直接 import しない。

## Mutation

deck/card mutation は feature container hook に集約し、Firestore entity boundary で定義した discriminator で backend を選ぶ。

### Local mutation

- Redux action を同期的に適用する。
- redux-persist による既存の永続化を保つ。
- Query cache は変更しない。
- hook API は remote mutation と同じ pending/error/result shape を返す。

### Remote mutation

- `mutationFn` は Firestore gateway を必ず await する。
- `onMutate` で対象 UID の Query cache を snapshot して optimistic update する。
- `onError` で snapshot を rollback し、操作箇所に error を返す。
- `onSuccess` 後の最終状態は realtime snapshot を authoritative とする。
- listener が未接続または error 中の場合は query invalidation/refetch を fallback とする。
- automatic mutation retry は無効にする。
- 同じ entity に対する remote mutation は UID・entity type・entity ID を scope として直列化し、後続 operation が先行 rollback snapshot を上書きしないようにする。

create は client-generated ID を optimistic entity に使う。delete は対象 entity を先に cache から除去し、失敗時に復元する。deck delete は関連 card map も同じ optimistic transaction で除去・復元する。

bulk import は operation-level mutation として pending/error を 1 つにまとめる。Firestore に transaction guarantee がない既存 API では partial success の可能性を明示し、失敗時は full refetch で server state と再同期する。local import は Redux の既存一括処理を使う。

## Swipe orchestration

`resolveSwipeAction`、`buildStudyPatch`、`calculateNextIndex` を維持する。swipe は次の順で処理する。

1. route と active session の `deckId` 一致を検証する。
2. current card、previous index、Query/Redux cache snapshot を取得する。
3. pure helper で card patch と next index を計算する。
4. card を optimistic update し、Zustand index を即時更新する。
5. remote write を await する。
6. failure 時は card cache と index を両方 previous value に戻し、同じ card から再試行可能にする。

`DoNothing` は何も更新しない。`GoBack` と終了 navigation は Zustand session だけを更新し、Firestore deck を更新しない。

study container は current card の mutation が pending の間、keyboard、button、auto play からの追加 swipe を受け付けない。これにより index rollback が別 swipe の進行を巻き戻すことを防ぐ。

## Error handling

- initial query error: route/container の read error UI と retry。
- not found: loading/error と区別し、既存 navigation policy に従う。
- mutation error: form、button、swipe など操作箇所の feedback。optimistic state は rollback 済みとする。
- realtime error: application-level の非破壊 notification と reconnect action。
- auth error: auth bootstrap の既存 login/logout feedback policy を維持し、remote query を開始しない。

error を Redux global state に複製しない。Firebase gateway は error を callback/Promise rejection として返すだけで、UI、navigation、cache を操作しない。

## Persisted state migration

`redux-persist` version を更新し、root migration で次を行う。

- `localMode === true` の deck だけを `deck.byId` に残す。
- 残した local deck ID に属する card だけを `card.byId` に残す。
- remote entity、`lastUpdatedAt`、persisted auth snapshot を削除する。
- local deck/card content と長期設定を保持する。

study session の legacy import は client state 分離 PR で先に行い、active route に対応する session を Zustand persist へ移す。`legacyMigratedDeckIds` marker と Redux field clear を同時に行うため再取込は起きない。新形式へ移行後は `Deck` type と Firestore DTO から `currentIndex` と `cardOrderIds` を除く。

## Migration phases

### Phase 0: Pure domain seams — completed by PR #173

- study calculation helper を Redux から抽出。
- realtime map update helper を抽出。
- pure behavior tests を追加。

### Phase 1: Client state separation

- Zustand と versioned persist store を導入。
- study session、`showBackText`、`autoPlay`、`lastSwipe` を移行。
- route を deck selection source of truth として維持。
- legacy active session を一度だけ移行。
- session field の Firestore write を停止。
- existing local-mode E2E fixture を新しい session storage に対応。

### Phase 2: Query reads and realtime

- TanStack Query provider、client、query key/options、test wrapper を追加。
- UID-scoped initial deck/card fetch を追加。
- thin realtime wrapper に initial marker と error callback を追加。
- auth/theme/remote sync lifecycle を分離。
- 一組の realtime event を Query cache と legacy Redux mirror へ fan-out し、旧 `action.event.subscribe` による重複 listener を停止。
- feature read hooks と local/remote merge を追加。
- 全 deck/card/study container の read を Query-aware hook へ切り替える。
- 表示の source of truth を Query に切り替えるが、Phase 3〜4 の legacy mutation thunk が entity を解決するため Redux realtime compatibility mirror と persisted remote entity は維持する。
- 未移行 thunk の optimistic Redux patch を同じ UID の Query cache に反映する temporary compatibility bridge を追加。

### Phase 3: Card mutations

- card create/update/delete/bulk mutation を追加。
- Card form/list/view と study swipe を移行。
- pending/error/rollback UI を追加。
- CSV import の card operation を mutation orchestration へ接続。
- card 用 temporary compatibility bridge を削除し、deck 用 bridge は Phase 4 まで維持。

### Phase 4: Deck mutations and workflows

- deck create/update/delete mutation を追加。
- Deck form/list/filter を移行。
- deck delete と child card cache update を一体化。
- download、import、reimport を merged read model と mutation API へ移行。
- deck 用 temporary compatibility bridge を削除。

### Phase 5: Redux cleanup and documentation

- 全 remote mutation が Query-aware hook へ移行済みであることを gate とする。
- remote mirror 専用 action/type/reducer/selector/event code を削除。
- `lastUpdatedAt` と module-global Firestore subscription を削除。
- persisted remote entity と auth snapshot の migration を実行。
- Redux deck/card slice の local-only invariant を test で固定。
- architecture、module map、testing docs を更新。
- Issue #170 本文を phase、status、acceptance criteria 付きの全体計画へ更新。

各 phase は独立 PR とし、前 phase の main merge を次 phase の base にする。1 phase 内でも TDD の red-green-refactor を小さな commit 単位で行う。

## Testing

### Unit

- Zustand start/index/reset、route guard、persist migration。
- query key factory と UID isolation。
- remote/local map merge と collision policy。
- initial snapshot full replacement と subsequent diff update。
- optimistic updater と rollback。
- Firestore DTO が client-only field を除外すること。
- existing `study.spec.ts` と `realtimeChange.spec.ts`。

### Hook/container integration

- case ごとに fresh QueryClient を使う test provider。
- pending、error、notFound、success render。
- auth UID 変更時の unsubscribe、cache removal、new fetch。
- old UID の initial fetch を意図的に遅延させ、UID 変更後に解決しても cache/listener/Redux mirror が復活しないこと。
- initial snapshot が Redux mirror の remote entity を全置換し、local deck/card だけを保持すること。
- local mutation が Redux のみ、remote mutation が Query/Firestore のみを更新すること。
- swipe failure が card と index の両方を rollback すること。

### Firestore emulator

- UID-scoped initial deck/card fetch。
- first snapshot、added、modified、removed、logical delete。
- listener cleanup と error callback。
- create/update/delete write と returned/realtime state。
- 現在 skip されている realtime gateway tests を新 API に合わせて有効化する。

### E2E

- existing local-mode deck/card/swipe scenarios を維持する。
- remote initial load と realtime update の scenario を追加する。
- mutation pending/error は deterministic な integration test を主とし、E2E は主要 success path を確認する。
- logout/login または UID switch で以前の entity が表示されないことを確認する。

各 non-documentation phase の完了前に、ユーザー指定どおり `make ci` を実行する。

## Documentation and Issue update

source migration と同時に次を更新する。

- `docs/architecture.md`
- `docs/summary/architecture.md`
- `docs/summary/module-map.md`
- `docs/summary/testing.md`
- state ownership、query keys、realtime lifecycle を参照するその他の文書

Issue #170 はこの design の要約へ更新し、Phase 0 を完了済み、Phase 1〜5 を pending checklist として記載する。Issue 本文には PR 単位、state owner、migration risk、acceptance criteria を含める。

## 完了条件

- Firestore deck/card が Redux と redux-persist state に存在しない。
- TanStack Query cache が UID-scoped remote entity の唯一の client cache である。
- `localMode` deck/card が既存どおり reload 後も利用できる。
- active study session が Zustand にあり、route deck と不一致の session を使用しない。
- client-only field が Firestore write DTO に含まれない。
- listener が `queryFn` 内に存在せず、UID ごとに一組だけ登録・解除される。
- first snapshot で full cache reconciliation が行われる。
- mutation が pending/error を公開し、remote failure で optimistic state を rollback する。
- swipe failure で card と current index が一貫して rollback する。
- UID 変更時に以前の listener/cache/data が残らない。
- presentation component/template が Query、Zustand、Firebase に依存しない。
- existing local-mode behavior と study scoring/filter behavior が維持される。
- 各 phase の tests と `make ci` が成功する。
