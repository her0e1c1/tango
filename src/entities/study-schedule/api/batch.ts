import { deleteField, doc, type WriteBatch } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/shared/firebase";
import { studyScheduleSchema, type StudySchedule } from "../model/schema";

export function writeStudySchedule(batch: WriteBatch, cardId: string, schedule: StudySchedule, updatedAt: number) {
  const reference = doc(db, "card", z.string().min(1).parse(cardId));
  // The first rated review replaces legacy timing in the same atomic answer batch.
  batch.update(reference, {
    schedule: studyScheduleSchema.parse(schedule),
    nextSeeingAt: deleteField(),
    interval: deleteField(),
    updatedAt,
  });
  return reference;
}
