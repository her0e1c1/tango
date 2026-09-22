import type { Dispatch, SetStateAction } from "react";

export function retryStudyHistory(
  setToday: Dispatch<SetStateAction<Date>>,
  setRetryVersion: Dispatch<SetStateAction<number>>
) {
  setToday(new Date());
  setRetryVersion((version) => version + 1);
}
