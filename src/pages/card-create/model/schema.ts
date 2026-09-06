import { cardContentSchema } from "@/entities/card";

export const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
