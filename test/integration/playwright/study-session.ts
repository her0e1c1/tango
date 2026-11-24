import { io, events } from "./io";

export {
  useStudySession,
  useStudySessions,
  useRemoteStudySessionsLoading,
  canMoveStudySession,
  resolveStudySession,
  selectStudyCards,
  selectStudyCardsWithDeadline,
  clearStudySessions,
  getStudySession,
  subscribeStudySessions,
  waitForStudySession,
  subscribeStudyHistory,
} from "../../../src/entities/study-session";
export type {
  StudySession,
  StudyHistoryRecord,
  StudyHistoryPeriod,
} from "../../../src/entities/study-session";

export const startStudy: typeof io.startStudy = (...args) => {
  events.push({ name: "startStudy", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.startStudy(...args);
};
export const touchStudySession: typeof io.touchStudySession = (...args) => {
  events.push({
    name: "touchStudySession",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.touchStudySession(...args);
};
export const setStudySessionIndex: typeof io.setStudySessionIndex = (...args) => {
  events.push({
    name: "setStudySessionIndex",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.setStudySessionIndex(...args);
};
export const abandonStudySession: typeof io.abandonStudySession = (...args) => {
  events.push({
    name: "abandonStudySession",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.abandonStudySession(...args);
};
export const writeStudySessionPosition: typeof io.writeStudySessionPosition = (...args) => {
  events.push({
    name: "writeStudySessionPosition",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.writeStudySessionPosition(...args);
};
