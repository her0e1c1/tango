import { firestoreTimestampDateSchema } from "@/shared/api";
import { studyScheduleFieldsSchema } from "../model/schema";

export const studyScheduleDocumentSchema = studyScheduleFieldsSchema.extend({
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
});
