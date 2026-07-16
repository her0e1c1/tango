# Use TanStack Query for Server State

Status: Accepted

## Context

TanStack Query manages server state, so Redux selectors for Deck and Card data duplicate that responsibility.

## Decision

Use TanStack Query for server state, access the remaining local Redux state directly, and remove `src/selector`. See [PR #278](https://github.com/her0e1c1/tango/pull/278).
