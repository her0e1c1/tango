# Keep Concurrency Control in Firebase

Status: Accepted

## Context

Client-side locks and mutation queues add state and complexity, and cannot guarantee consistency across tabs, devices, or clients.

## Decision

Do not implement client-side mutexes, locks, serial mutation queues, or similar mechanisms to guarantee consistency of Firebase-backed data.

When atomicity or concurrency control is required, use Firebase-provided mechanisms such as Firestore transactions, batched writes, or Cloud Functions as appropriate.

Client-local sequencing is allowed when it preserves one interactive workflow rather than claiming remote consistency. A workflow may retain an operation lock across Page visits or serialize successive writes so their user-intended order and latest complete draft survive navigation. Such state cannot provide cross-tab or cross-device exclusion and must not replace Firebase authorization, transactions, or other server-enforced invariants.

UI controls may also disable accidental duplicate actions while work is pending. See [PR #1433](https://github.com/her0e1c1/tango/pull/1433), [PR #1444](https://github.com/her0e1c1/tango/pull/1444), [PR #1459](https://github.com/her0e1c1/tango/pull/1459), and [PR #1465](https://github.com/her0e1c1/tango/pull/1465).
