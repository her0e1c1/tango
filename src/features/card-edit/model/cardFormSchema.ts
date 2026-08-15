import type * as z from "zod";

import { cardContentSchema } from "@/entities/card";

export const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });

export type CardFormValues = z.infer<typeof cardFormSchema>;
