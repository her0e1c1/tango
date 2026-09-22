import type { Dispatch, SetStateAction } from "react";

export function retryStudyHistory(
  setToday: Dispatch<SetStateAction<Date>>,
  setRetryVersion: Dispatch<SetStateAction<number>>,
  setAnswerRetryVersion: Dispatch<SetStateAction<number>>
) {
  setToday(new Date());
  setAnswerRetryVersion((version) => version + 1);
  setRetryVersion((version) => version + 1);
}
