import type { StudyHistoryPeriod } from "@/entities/study-session";

export function getStudyHistoryPeriod(today: Date): StudyHistoryPeriod {
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29).getTime(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime(),
  };
}
