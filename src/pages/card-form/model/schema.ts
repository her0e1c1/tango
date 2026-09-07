import { cardContentSchema } from "@/entities/card";

export const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
