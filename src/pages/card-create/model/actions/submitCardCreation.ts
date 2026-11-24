import { getAuthUid } from "@/entities/auth";
import { type CardContentInput, waitForCards } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { submit } from "./submit";

export async function submitCardCreation(
  deckId: string,
  values: CardContentInput,
  signal: AbortSignal
): Promise<boolean> {
  const uid = getAuthUid();
  const isCurrent = () => !signal.aborted && getAuthUid() === uid;
  const submitted = await submit({ deckId, values });
  if (submitted === undefined || !isCurrent()) return false;
  if (!(await waitForCards(uid, [submitted.id], signal))) return false;
  if (!isCurrent()) return false;
  showToast({ messageKey: "cardForm.toast.created", messageParams: { name: submitted.name }, tone: "success" });
  return true;
}
