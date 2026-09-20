import { getAuthUid } from "@/entities/auth";
import { editCard, type CardContentInput, type CardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

interface SubmitCardEditInput {
  cardId: CardId;
  values: CardContentInput;
}

export async function submit({ cardId, values }: SubmitCardEditInput): Promise<boolean> {
  // Snapshot only editable content, including tags outside the visible categories.
  const input = {
    id: cardId,
    frontText: values.frontText,
    backText: values.backText,
    tags: [...values.tags],
  };

  try {
    await editCard(getAuthUid(), input);
  } catch {
    showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return false;
  }

  // Shared toast lifetime also covers persistence that finishes after the editor unmounts.
  showToast({
    messageKey: "cardForm.toast.updated",
    messageParams: { name: input.frontText },
    tone: "success",
  });
  return true;
}
