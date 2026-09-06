import type * as z from "zod";

import { cardContentSchema } from "@/entities/card";

export const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;
