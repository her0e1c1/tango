import { applyCardChanges, cardStore } from "../../../src/entities/card/model/store";
import { applyStudySessionResult } from "@/test/utils/entityFixtures";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import type { StudyAnswerInput } from "../../../src/entities/study-answer/model/types";

export const savedAnswers: StudyAnswerInput[] = [];
export const saveRequests: string[] = [];

export const editCard: typeof import("../../../src/entities/card").editCard = (_uid, input) => {
  saveRequests.push("card");
  const card = cardStore.getState().cardsById[input.id];
  if (card === undefined) return Promise.reject(new Error("The pilot response requires an existing Card"));
  applyCardChanges([{ ...card, ...omitUndefined(input) }]);
  return Promise.resolve();
};

export const writeStudyAnswer: typeof import("../../../src/entities/study-answer").writeStudyAnswer = (input) => {
  saveRequests.push("answer");
  savedAnswers.push(structuredClone(input));
  return Promise.resolve();
};

export const touchStudySession: typeof import("../../../src/entities/study-session").touchStudySession = () => {
  saveRequests.push("touch");
  return Promise.resolve();
};

export const writeStudySessionPosition: typeof import("../../../src/entities/study-session").writeStudySessionPosition =
  (session, currentIndex) => {
    saveRequests.push("position");
    // This pilot supplies only a successful, non-final position response and its incoming store state.
    if (currentIndex >= session.cardOrderIds.length)
      return Promise.reject(new Error("The pilot does not supply a completion response"));
    const result = { session: { ...session, currentIndex }, endReason: null };
    applyStudySessionResult(result.session, result.endReason);
    return Promise.resolve(result);
  };
