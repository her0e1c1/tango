import { authSessionStore, getAuthSession, getAuthUid } from "@/entities/auth";
import { editCard, findCardById, waitForCardContent, type CardContentInput, type CardId } from "@/entities/card";
import { deckStore } from "@/entities/deck";
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
  const { signal } = completion;
  // Initializing may roll back to the same user when sign-out is refused.
  const stopAuth = authSessionStore.subscribe((session) => {
    if (session.status !== "initializing" && (session.status !== "authenticated" || session.uid !== uid))
      completion.abort();
  });
  // Deck removal must end this operation even if no later Card snapshot arrives.
  const stopDeck = deckStore.subscribe(() => {
    if (findCardById(cardId)?.uid !== uid) completion.abort();
  });
  const cancelled = Promise.withResolvers<boolean>();
  const cancel = () => cancelled.resolve(false);
  signal.addEventListener("abort", cancel, { once: true });

  async function save(): Promise<boolean> {
    try {
      await editCard(uid, input);
    } catch {
      await notifyCardResult(uid, cardId, completion, { messageKey: "toast.saveFailure", tone: "error" });
      return false;
    }

    if (signal.aborted || !(await waitForCardContent(uid, cardId, input, signal))) return false;
    return notifyCardResult(uid, cardId, completion, {
      messageKey: "cardForm.toast.updated",
      messageParams: { name: input.frontText },
      tone: "success",
    });
  }

  try {
    return await Promise.race([save(), cancelled.promise]);
  } finally {
    stopAuth();
    stopDeck();
    signal.removeEventListener("abort", cancel);
    if (pendingEdits.get(cardId) === completion) pendingEdits.delete(cardId);
  }
}

async function notifyCardResult(
  uid: string,
  cardId: CardId,
  completion: AbortController,
  toast: Parameters<typeof showToast>[0]
): Promise<boolean> {
  const { signal } = completion;
  // A second auth check may start before the previous decision's continuation resumes.
  while (getAuthUid() !== uid) {
    if (!(await waitForOwner(uid, signal))) return false;
  }
  if (signal.aborted || pendingEdits.get(cardId) !== completion) return false;
  showToast(toast);
  return true;
}

function waitForOwner(uid: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    function check() {
      const session = getAuthSession();
      if (!signal.aborted && session.status === "initializing") return;
      stop();
      signal.removeEventListener("abort", check);
      resolve(!signal.aborted && session.status === "authenticated" && session.uid === uid);
    }
    const stop = authSessionStore.subscribe(check);
    signal.addEventListener("abort", check, { once: true });
    check();
  });
}
