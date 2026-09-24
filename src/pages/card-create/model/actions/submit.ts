import { generateId } from "@/shared/lib/generateId";
import { getAuthUid } from "@/entities/auth";
import { createCard, type CardContentInput } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

interface SubmitCardCreateInput {
  deckId: string;
  values: CardContentInput;
}

export async function submit({ deckId, values }: SubmitCardCreateInput): Promise<{ id: string; name: string } | undefined> {
  // Each attempt has a new identity; retries intentionally do not reuse an uncertain previous write.
  const cardId = generateId();

  try {
    await createCard(getAuthUid(), { ...values, id: cardId, uniqueKey: cardId, deckId });
  } catch {
    showToast({ messageKey: "cardForm.toast.createFailure", tone: "error" });
    return;
  }

  return { id: cardId, name: values.frontText };
}
