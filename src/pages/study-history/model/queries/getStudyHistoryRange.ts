import { getStudyHistoryRangeSchema } from "../schema";
import { getStudyHistoryDate } from "./getStudyHistoryDate";
import { getStudyHistoryPeriod } from "./getStudyHistoryPeriod";

export function getStudyHistoryRange(params: URLSearchParams, today: Date) {
  const maxDate = getStudyHistoryDate(today);
  if (!params.has("start") && !params.has("end")) {
    const days = params.get("days") ?? "30";
    const preset = ["7", "30", "90"].includes(days) ? (Number(days) as 7 | 30 | 90) : ("custom" as const);
    const period = getStudyHistoryPeriod(today, typeof preset === "number" ? preset : 30);
    const fields = {
      startDate: getStudyHistoryDate(new Date(period.start)),
      endDate: maxDate,
    };
    return { preset, fields, maxDate, period: preset === "custom" ? null : period };
  }

  const fields = { startDate: params.get("start") ?? "", endDate: params.get("end") ?? "" };
  const valid = getStudyHistoryRangeSchema(maxDate).safeParse(fields).success;
  if (!valid) return { preset: "custom" as const, fields, maxDate, period: null };
  const start = new Date(`${fields.startDate}T00:00:00`);
  const end = new Date(`${fields.endDate}T00:00:00`);
  // The inclusive end date becomes the next local midnight, including daylight-saving changes.
  end.setDate(end.getDate() + 1);
  return { preset: "custom" as const, fields, maxDate, period: { start: start.getTime(), end: end.getTime() } };
}
