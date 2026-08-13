# Keep Concurrency Control in Firebase

Status: Accepted

## Context

Client-side locks and mutation queues add state and complexity, and cannot guarantee consistency across tabs, devices, or clients.

## Decision

Do not implement client-side mutexes, locks, serial mutation queues, or similar mechanisms to guarantee consistency of Firebase-backed data.

When atomicity or concurrency control is required, use Firebase-provided mechanisms such as Firestore transactions, batched writes, or Cloud Functions as appropriate.

UI-level prevention of accidental duplicate actions, such as disabling a pending submit button, is allowed but must not be relied on for data consistency.
