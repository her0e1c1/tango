import { getStudyHistoryRangeSchema } from "../schema";
import { getStudyHistoryDate } from "./getStudyHistoryDate";
import { getStudyHistoryPeriod } from "./getStudyHistoryPeriod";

export function getStudyHistoryRange(params: URLSearchParams, today: Date) {
  const days = params.get("days") ?? "30";
  const custom = params.has("start") || params.has("end");
  const preset = !custom && ["7", "30", "90"].includes(days) ? (Number(days) as 7 | 30 | 90) : ("custom" as const);
  const defaultPeriod = getStudyHistoryPeriod(today, typeof preset === "number" ? preset : 30);
  const fields = {
    startDate: custom ? (params.get("start") ?? "") : getStudyHistoryDate(new Date(defaultPeriod.start)),
    endDate: custom ? (params.get("end") ?? "") : getStudyHistoryDate(new Date(defaultPeriod.end - 1)),
  };
  const maxDate = getStudyHistoryDate(today);
  const valid = getStudyHistoryRangeSchema(maxDate).safeParse(fields).success && (custom || preset !== "custom");
  const start = new Date(`${fields.startDate}T00:00:00`);
  const end = new Date(`${fields.endDate}T00:00:00`);
  // The inclusive end date becomes the next local midnight, including daylight-saving changes.
  end.setDate(end.getDate() + 1);
  return { preset, fields, maxDate, period: valid ? { start: start.getTime(), end: end.getTime() } : null };
}
