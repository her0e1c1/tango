import { z } from "zod";

export function getStudyHistoryRangeSchema(today: string) {
  const date = z.iso
    .date({ error: "studyHistory.invalidDate" })
    .refine(
      (value) => new Date(`${value}T00:00:00`).getTime() >= Date.parse("0001-01-01T00:00:00Z"),
      "studyHistory.invalidDate"
    );
  return z
    .object({ startDate: date, endDate: date })
    .refine((value) => value.startDate <= value.endDate, {
      path: ["endDate"],
      error: "studyHistory.invalidRange",
    })
    .refine((value) => value.endDate <= today, { path: ["endDate"], error: "studyHistory.futureDate" });
}
