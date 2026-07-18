# Silent Study Swipe Saving Design

## Context

The study screen advances to the next card optimistically before the Card mutation completes. While the mutation is pending, `RemoteMutationNotice` currently inserts `Saving…` above the card inside the fullscreen layout. Fast writes therefore mount and unmount a visible status element in quick succession, producing a flash and a layout shift even though the swipe itself has already succeeded locally.

The current presentation disables swipe controls while a mutation is pending, but keyboard callbacks still reach the study action directly. The intended single-mutation guard and the current optimistic rollback behavior are both required.

## Goals

- Keep successful study swipes visually uninterrupted.
- Keep one study Card mutation in flight at a time.
- Preserve the existing rollback, error message, and retry behavior when a write fails.
- Preserve the current pending feedback on screens other than study.

## Non-goals

- Allow consecutive swipes while earlier Card writes are pending.
- Introduce a global loading store.
- Change the Card mutation, optimistic cache, or study session state flow.
- Add delayed saving feedback or timers.

## Decision

Add an optional `showPending` prop to `RemoteMutationNotice`. It defaults to `true`, so existing consumers continue to show `Saving…`. The study screen passes `showPending={false}`.

`RemoteMutationNotice` continues to prioritize an error over pending presentation. A study mutation failure therefore still renders the existing alert and Retry action even when pending feedback is hidden.

This keeps the policy at the screen boundary: shared mutation state remains unchanged, while the study screen chooses a silent success path appropriate for its optimistic interaction.

## Data Flow

1. A swipe validates that no study Card mutation token is active.
2. The study session advances optimistically to the next Card.
3. The Card mutation sets `pending` while the remote write runs.
4. Study swipe buttons and handlers remain disabled, but no saving status element is mounted.
5. On success, the pending guard is removed without another visible transition.
6. On failure, the existing logic restores the prior study session and card face, and `RemoteMutationNotice` renders the error alert with Retry.

## Components

### `RemoteMutationNotice`

- Accept `showPending?: boolean`.
- Continue showing errors regardless of `showPending`.
- Show `Saving…` only when `pending` is true and `showPending` is not false.

### `DeckSwiperContainer`

- Pass `showPending={false}` to `RemoteMutationNotice`.
- Continue using `studyActions.pending` to disable swipe buttons and omit swipe handlers.
- Leave mutation and study state management unchanged.

### `useStudyActions`

- Use the existing mutation token as a synchronous in-flight guard before processing a swipe.
- Ignore touch, overlay, button, or keyboard swipe calls until the current Card mutation settles.
- Keep the existing optimistic advance and conditional rollback logic unchanged.

## Accessibility

Failed saves remain exposed through the existing alert semantics and Retry button. The intentionally silent successful save removes a transient live status announcement. During the pending interval, buttons remain disabled, touch and overlay handlers remain omitted, and the study action guard rejects keyboard swipe calls.

## Testing

- Verify that `RemoteMutationNotice` shows pending feedback by default.
- Verify that `showPending={false}` suppresses `Saving…` while pending.
- Verify that an error and Retry remain visible when `showPending={false}`.
- Verify that the study screen does not render `Saving…` while pending and continues to disable swipe actions.
- Verify that a second swipe is ignored while the first Card mutation is unresolved.
- Run `make check` because implementation changes will affect application code.
