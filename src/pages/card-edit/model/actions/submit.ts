import { getAuthUid } from "@/entities/auth";
import { editCard, waitForCardContent, type CardContentInput, type CardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

const pendingEdits = new Map<CardId, AbortController>();

interface SubmitCardEditInput {
  cardId: CardId;
  values: CardContentInput;
}

export async function submit({ cardId, values }: SubmitCardEditInput): Promise<boolean> {
  // Snapshot only editable content, including custom tags.
  const input = {
    id: cardId,
    frontText: values.frontText,
    backText: values.backText,
    tags: [...values.tags],
  };

  const uid = getAuthUid();
  // Re-entering this Card starts a newer operation; its predecessor must never announce a stale result.
  pendingEdits.get(cardId)?.abort();
  const completion = new AbortController();
  pendingEdits.set(cardId, completion);
  try {
    try {
      await editCard(uid, input);
    } catch {
      if (!completion.signal.aborted && getAuthUid() === uid)
        showToast({ messageKey: "toast.saveFailure", tone: "error" });
      return false;
    }

    if (getAuthUid() !== uid || completion.signal.aborted) return false;
    if (
      !(await waitForCardContent(uid, cardId, input, completion.signal)) ||
      pendingEdits.get(cardId) !== completion ||
      getAuthUid() !== uid
    )
      return false;
    showToast({
      messageKey: "cardForm.toast.updated",
      messageParams: { name: input.frontText },
      tone: "success",
    });
    return true;
  } finally {
    if (pendingEdits.get(cardId) === completion) pendingEdits.delete(cardId);
  }
}
