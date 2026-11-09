import { getAuthUid } from "@/entities/auth";
import { editCard, waitForCardContent, type CardContentInput, type CardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

interface SubmitCardEditInput {
  cardId: CardId;
  values: CardContentInput;
}

export async function submit({ cardId, values }: SubmitCardEditInput): Promise<CardContentInput | undefined> {
  // Snapshot only editable content, including custom tags.
  const input = {
    id: cardId,
    frontText: values.frontText,
    backText: values.backText,
    tags: [...values.tags],
  };

  const uid = getAuthUid();
  try {
    await editCard(uid, input);
  } catch {
    if (getAuthUid() === uid) showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return;
  }

  if (getAuthUid() !== uid) return;
  if (!(await waitForCardContent(uid, cardId, input)) || getAuthUid() !== uid) return;
  showToast({
    messageKey: "cardForm.toast.updated",
    messageParams: { name: input.frontText },
    tone: "success",
  });
  return { frontText: input.frontText, backText: input.backText, tags: input.tags };
}
