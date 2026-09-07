import { getAuthSession } from "@/entities/auth";
import { editCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";

import type { SubmitCardFormInput } from "../types";

export async function submit({ cardId, values }: SubmitCardFormInput): Promise<boolean> {
  // Snapshot only editable content, including tags outside the visible categories.
  const input = {
    id: cardId,
    frontText: values.frontText,
    backText: values.backText,
    tags: [...values.tags],
  };

  try {
    const session = getAuthSession();
    // Preserve the sentinel for local edits and remote authentication validation.
    const uid = session.status === "authenticated" ? session.uid : "";
    await editCard(uid, input);
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
