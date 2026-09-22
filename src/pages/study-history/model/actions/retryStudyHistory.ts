import type { Dispatch, SetStateAction } from "react";

export function retryStudyHistory(setToday: Dispatch<SetStateAction<Date>>) {
  setToday(new Date());
}
