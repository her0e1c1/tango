import { io, events } from "./io";

export { studyRatingSchema } from "../../../src/entities/study-answer";
export type {
  StudyRating,
  StudyAnswerRecord,
  StudyAnswerHistory,
} from "../../../src/entities/study-answer";

export const writeStudyAnswer: typeof io.writeStudyAnswer = (...args) => {
  events.push({ name: "writeStudyAnswer", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.writeStudyAnswer(...args);
};
export const subscribeStudyAnswerHistory: typeof io.subscribeStudyAnswerHistory = (...args) => {
  events.push({
    name: "subscribeStudyAnswerHistory",
    args: structuredClone(args.filter((value) => typeof value !== "function")),
  });
  return io.subscribeStudyAnswerHistory(...args);
};
