# Use TanStack Query for Server State

Status: Superseded

## Context

TanStack Query manages server state, so Redux selectors for Deck and Card data duplicate that responsibility.

## Decision

Use TanStack Query for server state, access the remaining local Redux state directly, and remove `src/selector`. See [PR #278](https://github.com/her0e1c1/tango/pull/278).

This decision is superseded. Firestore subscriptions now feed an application-owned read model in
`src/store/remoteStore.ts`. The latest metadata for each collection remains private, but the Store
replaces it in the same atomic internal snapshot update as normalized Deck and Card data and the
public read and sync status. React consumes the stable public state from that snapshot directly.
Remote mutations write through the Firestore adapter and rely on subscription updates, except for
explicitly optimistic workflows with rollback.
