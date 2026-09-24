import { z } from "zod";

export function getTagNameSchema(tags: string[], previous?: string) {
  return z.object({
    name: z
      .string()
      .refine((name) => name.trim().length > 0, "required")
      .refine((name) => name === previous || !tags.includes(name), "duplicate"),
  });
}
