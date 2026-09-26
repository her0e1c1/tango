import { generateId } from "@/shared/lib/generateId";
import { getAuthUid } from "@/entities/auth";
import { createCard, type CardContentInput } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

interface SubmitCardCreateInput {
  deckId: string;
  values: CardContentInput;
}

export async function submit({
  deckId,
  values,
}: SubmitCardCreateInput): Promise<{ id: string; name: string } | undefined> {
  // Each attempt has a new identity; retries intentionally do not reuse an uncertain previous write.
  const cardId = generateId();

  const uid = getAuthUid();
  try {
    await createCard(uid, { ...values, id: cardId, uniqueKey: cardId, deckId });
  } catch {
    if (getAuthUid() === uid) showToast({ messageKey: "cardForm.toast.createFailure", tone: "error" });
    return;
  }

  if (getAuthUid() !== uid) return;
  return { id: cardId, name: values.frontText };
}
