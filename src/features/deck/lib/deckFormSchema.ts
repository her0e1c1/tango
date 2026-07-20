/**
 * @file Provides deck feature rules for Deck Form Schema.
 * Keeping these calculations outside React makes their inputs, outputs, and edge cases easier to
 * understand and test.
 */

import * as z from "zod";

export const deckFormSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required."),
  category: z.string(),
  url: z.union([z.literal(""), z.url("Enter a valid URL.")]).optional(),
  convertToBr: z.boolean(),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
