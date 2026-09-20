import { getAuthUid } from "@/entities/auth";
import { editCard, type CardContentInput, type CardId } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

import { cardEditPageStore as store } from "../store";

interface SubmitCardEditInput {
  cardId: CardId;
  values: CardContentInput;
}

export async function submit({ cardId, values }: SubmitCardEditInput): Promise<boolean> {
  const pending = store.getState().submission;
  if (pending !== undefined) {
    // Keep RHF pending, but let only the original caller navigate.
    await pending;
    return false;
  }

  // Snapshot only editable content, including tags outside the visible categories.
  const input = {
    id: cardId,
    frontText: values.frontText,
    backText: values.backText,
    tags: [...values.tags],
  };

  const submission = editCard(getAuthUid(), input)
    .then(() => {
      showToast({
        messageKey: "cardForm.toast.updated",
        messageParams: { name: input.frontText },
        tone: "success",
      });
      return true;
    })
    .catch(() => {
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
      return false;
    });
  store.setState({ submission });

  try {
    const saved = await submission;
    return saved && store.getState().submission === submission;
  } finally {
    // A save from an earlier editor must not release the current editor's save.
    if (store.getState().submission === submission) store.setState({ submission: undefined });
  }
}
