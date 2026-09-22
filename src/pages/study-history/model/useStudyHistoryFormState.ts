import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { getStudyHistoryRangeSchema } from "./schema";

export function useStudyHistoryFormState(fields: { startDate: string; endDate: string }, maxDate: string) {
  return useForm({ values: fields, resolver: zodResolver(getStudyHistoryRangeSchema(maxDate)) });
}
