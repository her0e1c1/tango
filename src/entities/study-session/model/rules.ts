import type { SwipeAction } from "@/entities/preferences/@x/study-session";
import { type CardProgressFields, recordCardStudyProgress } from "@/entities/study-progress/@x/study-session";

import type {
  ResolvedStudySession,
  StudySession,
  StudySessionCard,
  StudySessionMovement,
  StudySessionSwipePlan,
  StudySessionSwipeEffect,
} from "./types";

const getCurrentStudySessionCardId = (session: StudySession): StudySession["cardOrderIds"][number] | undefined =>
  session.cardOrderIds[session.currentIndex];

export const resolveStudySession = <Card extends StudySessionCard>(
  session: StudySession | undefined,
  cards: readonly Card[]
): ResolvedStudySession<Card> => {
  if (session == null) return { status: "invalid" };

  const cardId = getCurrentStudySessionCardId(session);
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  if (card != null) return { status: "studying", session, card };
  // An empty collection can still be an in-flight read; a populated collection proves the persisted card is absent.
  return { status: cardId != null && cards.length === 0 ? "preparing" : "invalid" };
};

const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return swipeAction === "GoToPrevCard" ? "previous" : "next";
};

export const planStudySessionSwipe = (
  session: StudySession | undefined,
  cards: readonly CardProgressFields[],
  swipeAction: SwipeAction,
  studiedAt: number
): StudySessionSwipePlan => {
  if (session == null) return { effect: "none" };

  const effect = resolveStudySessionSwipeEffect(swipeAction);
  if (effect === "none" || effect === "exit") return { effect };

  const resolvedSession = resolveStudySession(session, cards);
  if (resolvedSession.status !== "studying") return { effect: "none" };

  return {
    effect,
    session,
    progress: recordCardStudyProgress(resolvedSession.card, swipeAction, studiedAt),
  };
};

export const isStudySessionPositionUnchanged = (previous: StudySession, current: StudySession | undefined): boolean =>
  // Persistence timestamps may change during a write, but a position change means another interaction owns the card.
  current?.currentIndex === previous.currentIndex &&
  getCurrentStudySessionCardId(current) === getCurrentStudySessionCardId(previous);

export const calculateStudySessionIndex = (
  session: StudySession,
  movement: StudySessionMovement
): number | undefined => {
  const nextIndex = session.currentIndex + (movement === "previous" ? -1 : 1);
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};
