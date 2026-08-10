# Study History and Dashboard Contract

- Status: Accepted for schema version 1
- Design gate: [#412](https://github.com/her0e1c1/tango/issues/412)
- Parent roadmap: [#411](https://github.com/her0e1c1/tango/issues/411)

This document is the implementation contract for study history and the dashboard. Changes to a
version 1 field, event meaning, metric, query boundary, or completeness rule require a new design
decision before implementation.

## Scope

Version 1 persists mastery decisions, derives bounded dashboard metrics, and renders the result at
the top of `/`. It does not add a dashboard route, scheduling, history editing, goals, achievements,
leaderboards, or a backfill from existing Card state.

`StudyAttempt` is the source of truth for historical metrics. Card `score`, `numberOfSeen`, and
`lastSeenAt` remain the current Card state and must not be used to reconstruct history.

## Event contract

Only actions with a mastery outcome create an attempt.

| Swipe action | Outcome | Attempt | Card study write |
| --- | --- | --- | --- |
| `GoToNextCardMastered` | `mastered` | Yes | Yes |
| `GoToNextCardNotMastered` | `notMastered` | Yes | Yes |
| `GoToNextCardToggleMastered` | `notMastered` | Yes | Yes |
| `GoToNextCard` | None | No | Yes |
| `GoToPrevCard` | None | No | Yes |
| `GoBack` | None | No | No |
| `DoNothing` | None | No | No |

`GoToNextCardToggleMastered` maps to `notMastered` because the current
`calculateCardScore()` implementation applies the same score transition as
`GoToNextCardNotMastered`. Renaming or changing that action requires changing the outcome contract
and its tests together.

`GoToNextCard` and `GoToPrevCard` preserve the existing Card-state behavior: they increment
`numberOfSeen`, set `lastSeenAt`, and leave `score` unchanged. They do not create historical
evidence. `GoBack` and `DoNothing` write neither a Card nor an attempt.

## Domain types

The Firebase-independent types belong in `src/domain/studyHistory.ts`.

```ts
export type StudyOutcome = "mastered" | "notMastered";

export interface StudyAttempt {
  id: string;
  uid: string;
  sessionId: string;
  deckId: DeckId;
  cardId: CardId;
  outcome: StudyOutcome;
  answeredAt: number;
  localDate: string;
  timeZone: string;
  schemaVersion: 1;
}

export interface StudyAttemptRange {
  fromInclusive: number;
  toExclusive: number;
  limit: number;
}

export type StudyDashboardPeriod = "7d" | "30d";
export type StudyHistorySyncStatus = "cached" | "pending" | "synced";

export type StudyMetric<T> =
  | { status: "available"; value: T }
  | {
      status: "unavailable";
      reason: "no-attempts" | "invalid-time-zone";
    }
  | {
      status: "truncated";
      reason: "query-limit" | "window-limit";
      minimum?: number;
    };

export interface StudyDaySummary {
  localDate: string;
  attemptCount: number;
  masteredCount: number;
}

export interface StudyDeckSummary {
  deckId: DeckId;
  attemptCount: number;
  masteredCount: number;
  lastAnsweredAt: number;
}

export interface StudySessionSummary {
  sessionId: string;
  deckId: DeckId;
  firstAnsweredAt: number;
  lastAnsweredAt: number;
  attemptCount: number;
  masteredCount: number;
  masteryRate: number;
}

export interface StudyDashboardMetricsV1 {
  version: 1;
  period: StudyDashboardPeriod;
  timeZone: string;
  fromInclusive: number;
  toExclusive: number;
  todayAttemptCount: StudyMetric<number>;
  todayMasteryRate: StudyMetric<number>;
  periodAttemptCount: StudyMetric<number>;
  periodMasteryRate: StudyMetric<number>;
  streakDays: StudyMetric<number>;
  dailyTrend: StudyMetric<StudyDaySummary[]>;
  recentDecks: StudyMetric<StudyDeckSummary[]>;
  recentSessions: StudyMetric<StudySessionSummary[]>;
}

export type StudyDashboardReadState =
  | { status: "idle" }
  | {
      status: "loading";
      previous?: StudyDashboardMetricsV1;
    }
  | {
      status: "ready";
      metrics: StudyDashboardMetricsV1;
      syncStatus: StudyHistorySyncStatus;
    }
  | {
      status: "empty";
      metrics: StudyDashboardMetricsV1;
      syncStatus: "synced";
    }
  | {
      status: "error";
      error: Error;
      previous?: StudyDashboardMetricsV1;
    };
```

Rates use a number from `0` through `1`. Presentation rounds `rate * 100` to the nearest whole
percent; it does not round inside the domain aggregator.

The active browser session gains stable identity in the study-store schema used by phase 2:

```ts
export interface StudySession {
  sessionId: string;
  startedAt: number;
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
  lastStudiedAt: number;
}

export interface StudyAnswerCommandV1 {
  version: 1;
  attempt: StudyAttempt;
  cardPatch: CardEdit;
  previousSession: StudySession;
  nextCurrentIndex: number | null;
}

export interface PersistedStudyStateV4 {
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
  inFlightAnswersByDeckId: Partial<Record<DeckId, StudyAnswerCommandV1>>;
}
```

`sessionId` and attempt `id` are opaque UUIDs generated once at the start of their respective user
operations. A resumed session keeps its ID. Explicit restart creates a new ID. Persisted sessions
from the schema without `sessionId` and `startedAt` are discarded during migration because a stable
historical identity cannot be reconstructed safely.

Each Deck has at most one persisted in-flight answer. The command contains the exact Firestore
payload and the previous session needed for post-reload reconciliation. `nextCurrentIndex` is
`null` when the optimistic transition completes the session. Transient swipe feedback is reset on
reload and is not part of rollback state.

Version 1 does not persist a separate session document. `sessionId` groups attempts, while
`firstAnsweredAt` and `lastAnsweredAt` are derived from the grouped attempts. The browser-only
`startedAt` is not presented as a durable server timestamp.

## Firestore document

The flat collection path is `studyAttempt/{attemptId}`. The domain `id` comes only from the document
ID and is not duplicated in the payload.

```ts
import type { Timestamp } from "firebase/firestore";

export interface StudyAttemptDocumentV1 {
  uid: string;
  sessionId: string;
  deckId: string;
  cardId: string;
  outcome: "mastered" | "notMastered";
  answeredAt: Timestamp;
  localDate: string;
  timeZone: string;
  schemaVersion: 1;
}
```

`answeredAt` is converted between an epoch-millisecond domain number and a Firestore `Timestamp` at
the DTO boundary. `localDate` is exactly `YYYY-MM-DD`. `timeZone` is an IANA time-zone identifier,
for example `Asia/Tokyo`.

All fields are captured by the client command. The command takes the confirmed auth UID rather than
reading a UID from browser persistence. The DTO validates non-empty IDs, the outcome, schema
version, a safe integer timestamp, the local-date format, a valid IANA time zone, and that
`localDate` is the date of `answeredAt` in `timeZone`.

### Security Rules contract

Rules for `studyAttempt/{attemptId}` enforce the following:

- only an authenticated owner can read a document;
- create requires exactly the version 1 field set and `uid == request.auth.uid`;
- the referenced Card exists after the atomic batch, belongs to the UID, and has the same `deckId`;
- `schemaVersion == 1` and `outcome` is one of the two defined values;
- IDs and time-zone values are non-empty strings, and `localDate` has the stored date shape;
- `answeredAt` is a timestamp from 2000-01-01 through ten minutes after `request.time`;
- update is allowed only when every field is identical to the existing document;
- delete is denied to clients; and
- list queries require an authenticated owner and a limit no greater than 6,001.

The exact no-op update permits a lost-acknowledgement retry at the same document path while
preventing history edits. The same ID with different content is rejected. Rules do not require the
Card or Deck to continue existing on reads, so later deletion cannot make owned history unreadable.

IANA validity and the relationship between `answeredAt`, `localDate`, and `timeZone` cannot be fully
proved by Rules. The DTO checks them on write and read. A malformed owned document fails the read
with its document ID instead of being silently corrected.

## Time contract

### Source of truth

`answeredAt` is the source of truth for ordering and all period metrics. `localDate` and `timeZone`
preserve the user's answer-time context for audit and tests; they are not queried or mixed across
zones to build a dashboard.

The production command captures these values once:

```ts
export interface StudyTimeProvider {
  now: () => number;
  timeZone: () => string;
}
```

Tests inject a fixed provider. Production uses `Date.now()` and
`Intl.DateTimeFormat().resolvedOptions().timeZone`. If the platform does not return a valid IANA
zone, production records `UTC`; injected invalid zones produce an `invalid-time-zone` result.

### Dashboard zone and zone changes

Dashboard day membership is recalculated from `answeredAt` in the device's current IANA time zone.
Changing the OS time zone may move an attempt to another displayed day, which keeps all metrics on
one coherent day boundary. The stored answer-time `localDate` remains unchanged.

A session may span a time-zone change. It remains one session because grouping uses `sessionId`, not
date or time zone.

### Local-day ranges

For a current local date `2026-08-09`, ranges are:

| Metric | Local dates included | Bounds |
| --- | --- | --- |
| Today | `2026-08-09` | start of Aug 9 through start of Aug 10 |
| 7 days | `2026-08-03` through `2026-08-09` | start of Aug 3 through start of Aug 10 |
| 30 days | `2026-07-11` through `2026-08-09` | start of Jul 11 through start of Aug 10 |

Every lower bound is inclusive and every upper bound is exclusive. Bounds are local midnights
converted to UTC instants using the selected IANA zone. Implementations must move between calendar
dates, not add or subtract 24 hours. A DST-start day may contain 23 hours and a DST-end day may
contain 25 hours; each still contributes exactly one trend bucket.

### Offline and clock policy

`answeredAt` is the client time captured when the user answers, not a later server timestamp. An
offline answer therefore remains on the day when the operation occurred. The stable payload is
queued unchanged and is not regenerated on reconnect or retry.

Times before 2000-01-01 or more than ten minutes ahead of server request time are rejected. This
limits extreme clock corruption while permitting ordinary skew and arbitrarily delayed offline
synchronization. A rejected clock produces a definitive write error and keeps the retry payload
visible; changing the system clock does not mutate that payload.

## Atomicity, idempotency, and offline behavior

A qualifying answer creates its Card patch and attempt from the same action, captured time, and
stable operation ID. One Firestore batched write performs both document operations. Either both are
accepted or neither is accepted.

Transactions are not used for this command because Firestore client transactions fail offline.
Batched writes are atomic and execute from the offline queue. Each qualifying answer consumes two
document writes: one Card update and one attempt create or exact replay.

The UI distinguishes these moments:

1. The command and rollback snapshot are created once.
2. The in-flight command is persisted before the session changes or the batch is enqueued.
3. The active study session advances optimistically once.
4. Firestore exposes the batch through local snapshots with pending writes.
5. The backend acknowledges it, or reports a definitive rejection.
6. Acknowledgement clears the command; only a definitive rejection restores `previousSession`.

A timeout is not a definitive failure. Retry and post-reload recovery reissue the persisted command
as the same idempotent batch; they do not create a new command. On reload, each in-flight command is
reconciled before another action for its Deck is accepted. A successful exact replay keeps the
optimistic session and clears the command. A definitive rejection restores `previousSession` and
clears the command. This deliberately persisted, per-Deck in-flight command is the recovery record;
version 1 does not add an unbounded or independently dispatched outbox.

Every replay uses the same attempt ID, Card patch, timestamps, session transition, and rollback
snapshot. It does not recalculate score, increment `numberOfSeen` again, or advance the session a
second time. Persisting the command before enqueue also covers a reload between those two steps:
recovery submits the exact batch that had not yet reached Firestore.

The existing per-Card mutation lock prevents a second local study action while one for that Card is
pending. Firestore offline conflict resolution is last-write-wins for the same Card document; the
append-only attempts remain the historical source of truth if different devices concurrently study
the same Card.

## Query and index contract

The Dashboard starts with a one-shot query only while `/` is mounted. It is separate from the Deck
and Card listeners in `remoteStore`. A cached or pending result temporarily enables the bounded
listener described below so the same mounted read can reach `synced` after reconnect.

The query always fetches the 30 local days ending today. Both 7-day and 30-day views are derived
from that one result, so period switching performs no additional read and streak does not change
because of the selected trend period.

```ts
query(
  collection(db, "studyAttempt"),
  where("uid", "==", uid),
  where("answeredAt", ">=", Timestamp.fromMillis(fromInclusive)),
  where("answeredAt", "<", Timestamp.fromMillis(toExclusive)),
  orderBy("answeredAt", "desc"),
  limit(6_001)
);
```

The service keeps at most the newest 6,000 documents. A 6,001st document is only the truncation
sentinel and is not aggregated. Adapter calls reject an empty UID, non-finite or reversed bounds,
and a limit outside `1..6_001` before calling Firestore.

The composite index is:

```text
collection: studyAttempt
query scope: COLLECTION
fields: uid ASC, answeredAt DESC, __name__ DESC
```

No session index or persistent listener is added in version 1. Recent Decks and sessions come from
the same bounded result. Queries are ordered by `answeredAt DESC, __name__ DESC`, which gives
deterministic ordering when timestamps match. The document-name ordering is the index's implicit
final ordering; the query does not add `documentId()` as a second explicit range field.

The read boundary increments a generation for mount, UID change, retry, and unmount. A result is
published only when its UID and generation are still current. Runtime query data is cleared on UID
change and logout and is not copied to Zustand or local storage.

If the one-shot result has `fromCache == true` or `hasPendingWrites == true`, the read boundary
starts `onSnapshot()` for the same query and limit with `includeMetadataChanges: true`. It replaces
the metrics and sync status on data or metadata snapshots, then unsubscribes immediately after the
first snapshot with `fromCache == false` and `hasPendingWrites == false`. It also unsubscribes on
error, retry, UID change, and unmount. Only one reconciliation listener exists for the current UID
and generation. This bounded listener is required because metadata on a completed one-shot snapshot
cannot change after Firestore acknowledges a queued write.

Snapshot metadata maps as follows:

| Firestore metadata | Dashboard sync status |
| --- | --- |
| Any result document has pending writes | `pending` |
| Snapshot is from cache and has no pending writes | `cached` |
| Server-backed snapshot with no pending writes | `synced` |

Cached metrics may be stale and are labeled as such. A cached empty result is not presented as a
confirmed no-history state; it remains `ready` with cached, unavailable values until a server-backed
read confirms the empty result.

## Metric contract

All calculations are pure, deterministic, and non-mutating. Unless stated otherwise, they use
attempts whose `answeredAt` lies in the selected local-date range.

### Counts and rates

- `attemptCount` is the number of qualifying attempts.
- `masteredCount` is the number whose outcome is `mastered`.
- `masteryRate` is `masteredCount / attemptCount`.
- A complete zero count is `available` with value `0`.
- A rate with a zero denominator is `unavailable` with reason `no-attempts`, never numeric `0`.

Example: four attempts with outcomes mastered, not mastered, mastered, mastered produce an attempt
count of `4`, mastered count of `3`, and mastery rate of `0.75`.

`todayAttemptCount` and `todayMasteryRate` use only today's local bucket.
`periodAttemptCount` and `periodMasteryRate` use the selected 7- or 30-day buckets.

### Daily trend

The trend has exactly 7 or 30 entries from oldest to newest. Missing local dates are filled with
zero attempts and zero mastered attempts.

Example for a 7-day view ending Aug 9:

```text
Aug 3  0 attempts
Aug 4  2 attempts, 1 mastered
Aug 5  0 attempts
Aug 6  1 attempt, 1 mastered
Aug 7  0 attempts
Aug 8  0 attempts
Aug 9  3 attempts, 2 mastered
```

### Streak

A local day qualifies when it contains at least one attempt. If today qualifies, the anchor is
today. Otherwise yesterday is the anchor, allowing an in-progress current day without immediately
breaking the streak. Count backward from the anchor until the first non-qualifying date.

Examples:

| Qualifying days relative to today | Result |
| --- | --- |
| Today, yesterday, two days ago | 3 |
| Yesterday, two days ago; none today | 2 |
| Today and two days ago; none yesterday | 1 |
| None today or yesterday | 0 |

The bounded dataset can prove at most 30 consecutive days. If every day from the anchor back to the
query boundary qualifies, the result is `truncated` with reason `window-limit`. The minimum is `30`
when today is the anchor and `29` when yesterday is the anchor; the UI renders “30+ days” or
“29+ days” rather than an exact value.

### Recent Decks

Group by `deckId`, then calculate attempt count, mastered count, and latest answer time within the
30-day dataset. Sort by `lastAnsweredAt` descending and `deckId` ascending as the tie-break. Return
at most five.

Deck names are joined from current Deck state by the container. A missing or deleted Deck is shown
as `Deleted deck`, remains in metrics, and has no navigation action. Card text and names are never
joined or displayed.

### Recent sessions

Group by `sessionId`. A summary uses the attempt's `deckId`, the earliest answer as
`firstAnsweredAt`, and the latest answer as `lastAnsweredAt`. It includes attempt count, mastered
count, and an always-defined mastery rate because an attempt-backed session cannot be empty.

Sort by `lastAnsweredAt` descending and `sessionId` ascending as the tie-break. Return at most five.
The displayed representative timestamp is `lastAnsweredAt`. A session with only navigation has no
attempts and therefore does not exist in history.

If malformed data uses one session ID with more than one Deck ID, mapping fails rather than silently
merging unrelated Decks.

### Completeness and UI states

| State | Meaning |
| --- | --- |
| `loading` | No completed result is available for the current UID and generation. |
| `empty` | A complete server-backed result contains no attempts. |
| `available: 0` | The exact numeric value is zero. |
| `unavailable` | The value is undefined, such as a rate with no attempts or an invalid time zone. |
| `truncated` | The query or 30-day window cannot prove a complete value. |
| `error` | Authentication, query, permission, mapping, or computation failed. |
| `cached` | Values came from the local Firestore cache and may be stale. |
| `pending` | Values include local writes that have not been acknowledged. |
| `synced` | Values are server-backed and have no pending writes. |

When the query reaches 6,001 documents, every aggregate is marked `truncated` with reason
`query-limit`. The retained documents are not presented as complete counts, rates, trends, Decks,
or sessions. Count metrics may expose minimum `6_000` only as “6,000+”; rate metrics do not expose a
partial percentage.

## Query and write cost

The following counts are operation counts, not currency estimates. Firestore bills each operation
inside a batch separately, each returned query document as a read, at least one read for an empty
query, and dependent reads used by Security Rules. Pricing and product behavior remain governed by
the Firebase documentation.

Each mastery answer uses:

- two document writes: one Card and one `studyAttempt`;
- up to two dependent document reads during Rules evaluation: the referenced Card and Deck.

`GoToNextCard` and `GoToPrevCard` use one Card write and no attempt. `GoBack` and `DoNothing` use no
document writes.

The initial dashboard query reads the latest 30 days and stops at the sentinel:

| Attempts per day | Documents in 7 days | Documents in 30 days | Maximum dashboard document reads | Completeness |
| ---: | ---: | ---: | ---: | --- |
| 50 | 350 | 1,500 | 1,500 | Complete |
| 200 | 1,400 | 6,000 | 6,000 | Complete at exactly the data limit |
| 1,000 | 7,000 | 30,000 | 6,001 | Truncated |

A normal server-backed load uses only the initial reads above. When the initial result is cached or
pending, reconciliation can read up to the same limit again when its temporary listener obtains a
server snapshot. The listener is removed at `synced`, so it does not remain attached for later
changes. Reconnect behavior and this recovery read must be included in operational cost checks.

An empty query has Firestore's minimum one-read charge. The query uses one range field
(`answeredAt`), so the Standard edition does not add index-entry read charges under the current
pricing rules. Rules-dependent reads, reconnect behavior, and pricing must be rechecked before a
cost-sensitive launch.

Introduce rebuildable `StudyDailyStats` before raising the document cap when either condition is
met:

- more than 1% of active dashboard loads are truncated in a rolling 30-day observation; or
- the p95 complete dashboard load exceeds 3,000 attempt reads.

Daily stats would be derived from attempts with idempotent per-attempt updates. Attempts remain the
source of truth, and a rebuild job must be specified before production rollout of the aggregate.

## Deletion, retention, and migration

Deck and Card documents are live entities and may be soft-deleted or removed after an answer. An
attempt is not cascaded. Metrics continue to include it, and the Deck join uses `Deleted deck` when
the live Deck is unavailable. Version 1 stores no name snapshot to avoid stale personal content and
duplicate updates.

Clients cannot edit or delete attempts. Account-level data erasure requires a privileged,
owner-scoped operation and is a separate feature; version 1 does not introduce a manual history UI
or automatic retention period.

There is no backfill from Card `score`, `numberOfSeen`, `lastSeenAt`, browser sessions, or deleted
data. Dashboard history begins when version 1 writes are deployed. An empty result after deployment
is an empty state, not inferred historical zero.

Future schema versions keep the version 1 mapper, add a new versioned mapper, and document whether
queries can mix versions. Unknown versions fail with a document-specific error. A daily aggregate
or new required field must be rebuildable from attempts or use an explicit migration plan.

## Phase boundaries

The implementation phases follow the child Issues of #411.

| Phase | Issue | Owns | Must not own |
| --- | --- | --- | --- |
| 1 | [#413](https://github.com/her0e1c1/tango/issues/413) | Domain types, DTO, attempt adapter, Rules, index | Study UI integration, metrics |
| 2 | [#414](https://github.com/her0e1c1/tango/issues/414) | Stable session identity, pure outcome mapping, atomic command, retry/offline flow | Dashboard reads or UI |
| 3 | [#415](https://github.com/her0e1c1/tango/issues/415) | Time boundaries, bounded read service, pure metrics, read lifecycle | Presentation and page composition |
| 4 | [#416](https://github.com/her0e1c1/tango/issues/416) | Summary and trend presentation, `/` composition, Storybook states | Recent-session detail list |
| 5 | [#417](https://github.com/her0e1c1/tango/issues/417) | Recent-session presentation and Deck join | Attempt detail or history editing |
| 6 | [#418](https://github.com/her0e1c1/tango/issues/418) | End-to-end coverage, operations, final cost and failure verification | New product metrics |

`dueCount` remains owned by [#329](https://github.com/her0e1c1/tango/issues/329) and is not displayed
until the scheduling writer and `nextSeeingAt` contract are implemented.

## Verification examples

At minimum, later phases preserve these examples:

- all seven swipe actions map exactly as the event table specifies;
- a fixed clock and zone produce an exact DTO and local date;
- same attempt ID plus same payload is accepted, while different payload is rejected;
- Card and attempt either both succeed or both fail;
- offline reconnect produces one attempt and one Card transition;
- reload with an in-flight answer replays its exact batch, then acknowledges or rolls back once;
- today, year boundary, leap day, DST start, and DST end produce calendar-day ranges;
- zero, empty, unavailable, truncated, cached, pending, synced, and error remain distinct;
- cached and pending dashboard reads reach synced without remount and release their listener;
- query results are UID-scoped, descending, bounded, and stale UID results are ignored;
- deleted Decks retain metrics and use the fallback without a broken link; and
- 7-day and 30-day trends contain exactly 7 and 30 ordered buckets.

The Firestore behavior relied on here is documented by Firebase in
[transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions),
[offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline),
[snapshot metadata](https://firebase.google.com/docs/firestore/query-data/listen), and
[billing](https://firebase.google.com/docs/firestore/pricing).
