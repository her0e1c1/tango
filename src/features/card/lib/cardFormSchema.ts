import * as z from "zod";

const requiredCardText = (message: string) => z.string().refine((value) => value.trim().length > 0, { message });

export const cardFormSchema = z.object({
  frontText: requiredCardText("Front text is required."),
  backText: requiredCardText("Back text is required."),
  tags: z.array(z.string()),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
