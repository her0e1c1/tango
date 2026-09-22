import { z } from "zod";

// Length-prefixing the UID prevents delimiter collisions; Firestore IDs cannot contain slashes.
export function cardStudyStateId(uid: string, cardId: string): string {
  const part = z
    .string()
    .min(1)
    .refine((value) => !value.includes("/"));
  return `${String(part.parse(uid).length)}:${uid}${part.parse(cardId)}`;
}
