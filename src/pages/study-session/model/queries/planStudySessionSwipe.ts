import type { SwipeAction } from "@/entities/preference";
import type { StudyRating } from "@/entities/study-answer";
import { resolveStudySession, type StudySession } from "@/entities/study-session";

type StudySessionSwipeEffect = "none" | "exit" | "next";
type StudySessionSwipePlan =
  | { effect: "none" }
  | { effect: "exit" }
  | { effect: "next"; rating: StudyRating | undefined };

// Collapses control actions into the movement, exit, or no-op effects understood by a study session.
const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return "next";
};

const ratings: Partial<Record<SwipeAction, StudyRating>> = {
  RateAgain: "again",
  RateHard: "hard",
  RateGood: "good",
  RateEasy: "easy",
};

// Resolves the action and rating only when the current session and Card still exist.
export const planStudySessionSwipe = (
  session: StudySession | undefined,
  cards: readonly { id: string }[],
  swipeAction: SwipeAction
): StudySessionSwipePlan => {
  if (session == null) return { effect: "none" };

  const effect = resolveStudySessionSwipeEffect(swipeAction);
  if (effect === "none" || effect === "exit") return { effect };

  const resolvedSession = resolveStudySession(session, cards);
  if (resolvedSession.status !== "studying") return { effect: "none" };

  return {
    effect,
    rating: ratings[swipeAction],
  };
};
