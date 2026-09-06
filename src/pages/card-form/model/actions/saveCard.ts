import { getAuthSession } from "@/entities/auth";
import { editCard, type Card } from "@/entities/card";

type SaveCardInput = Pick<Card, "id" | "frontText" | "backText" | "tags">;

export async function saveCard(input: SaveCardInput): Promise<void> {
  const session = getAuthSession();
  // Match useAuthUid's sentinel so remote validation rejects unauthenticated writes while local edits remain available.
  const uid = session.status === "authenticated" ? session.uid : "";
  await editCard(uid, input);
}
