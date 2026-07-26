/**
 * @file Provides card feature rules for Card Form Schema.
 * Keeping these calculations outside React makes their inputs, outputs, and edge cases easier to
 * understand and test.
 */

import * as z from "zod";

import { requiredCardText } from "@/domain/cardInput";

export const cardFormSchema = z.object({
  frontText: requiredCardText("Front text is required."),
  backText: requiredCardText("Back text is required."),
  tags: z.array(z.string()),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
