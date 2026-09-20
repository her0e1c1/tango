import { z } from "zod";
import { firestoreTimestampSchema } from "./firestoreDocument";

// Technical document timestamps are distinct from domain event times.
export const firestoreMetadataSchema = z.object({
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema,
});
