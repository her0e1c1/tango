import { getAuthUid } from "@/entities/auth";
import { editCard, type CardContentInput, type CardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

interface SubmitCardEditInput {
  cardId: CardId;
  values: CardContentInput;
}

export async function submit({ cardId, values }: SubmitCardEditInput): Promise<CardContentInput | undefined> {
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
    return;
  }

  return { frontText: input.frontText, backText: input.backText, tags: input.tags };
}
