/**
 * @file Provides card feature rules for Card Form Schema.
 * Keeping these calculations outside React makes their inputs, outputs, and edge cases easier to
 * understand and test.
 */

import * as z from "zod";

/**
 * Creates a validation rule that rejects card text containing only whitespace.
 * The caller supplies the message shown beside the invalid form field.
 */
const requiredCardText = (message: string) => z.string().refine((value) => value.trim().length > 0, { message });

export const cardFormSchema = z.object({
  frontText: requiredCardText("Front text is required."),
  backText: requiredCardText("Back text is required."),
  tags: z.array(z.string()),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
