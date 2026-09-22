import type { StudyHistoryPeriod } from "@/entities/study-session";

export function getStudyHistoryPeriod(today: Date, days = 30): StudyHistoryPeriod {
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1).getTime(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime(),
  };
}
