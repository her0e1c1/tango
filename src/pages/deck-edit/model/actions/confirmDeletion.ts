import { confirmDeckDeletion } from "@/features/deck-deletion";

import { deckEditPageStore as store } from "../store";

export async function confirmDeletion(): Promise<boolean> {
  if (store.getState().tagMutation !== undefined || store.getState().submission !== undefined) return false;
  const { deletionTarget, deletionId } = store.getState();
  const mutationId = Symbol("deck-deletion");
  let deleted = false;

  await confirmDeckDeletion({
    target: deletionTarget,
    pending: deletionId !== undefined,
    setTarget: (target) => store.setState({ deletionTarget: target }),
    setPending: (pending) => store.setState({ deletionId: pending ? mutationId : undefined }),
    // Resetting the Page store detaches work from an earlier visit.
    isMounted: () => store.getState().deletionId === mutationId,
    onDeleted: () => {
      deleted = true;
    },
  });
  return deleted;
}
