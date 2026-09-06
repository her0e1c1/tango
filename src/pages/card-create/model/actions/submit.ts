import { createCard, generateCardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

import type { SubmitCardCreateInput } from "../types";

export async function submit({ uid, deckId, values }: SubmitCardCreateInput): Promise<boolean> {
  // Each attempt has a new identity; retries intentionally do not reuse an uncertain previous write.
  const cardId = generateCardId();

  try {
    await createCard(uid, { ...values, id: cardId, uniqueKey: cardId, deckId });
  } catch {
    showToast({ messageKey: "cardForm.toast.createFailure", tone: "error" });
    return false;
  }

  showToast({ messageKey: "cardForm.toast.created", messageParams: { name: values.frontText }, tone: "success" });
  return true;
}
