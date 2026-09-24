import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { useCardsByDeckId } from "@/entities/card";
import { CATEGORY, useDeck, type Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import { editTagName } from "./actions/editTagName";
import { requestTagDeletion } from "./actions/requestTagDeletion";
import { saveTag } from "./actions/saveTag";
import { submitTagName } from "./actions/submitTagName";
import { getManagedTags } from "./queries/getManagedTags";
import { getTagUsageCounts } from "./queries/getTagUsageCounts";
import { useTagFormState } from "./useTagFormState";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckEdit } from "./actions/submitDeckEdit";
import { deckEditPageStore } from "./store";
import { useDeckEditFormState } from "./useDeckEditFormState";
import { useOpeningDeck } from "./useOpeningDeck";

export function useDeckEditRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const openingDeck = useOpeningDeck(deckId);
  return { deckId, openingDeck };
}

export function useDeckEditPageModel(deck: Deck) {
  const navigate = useNavigate();
  const { form } = useDeckEditFormState(deck);
  const { isDirty, isSubmitting } = form.formState;
  const isMounted = useMountedGuard();
  const deletionTarget = useStore(deckEditPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckEditPageStore, (state) => state.deletionId !== undefined);
  const { addForm, renameForm } = useTagFormState();
  const { cards } = useCardsByDeckId(deck.id);
  const tags = getManagedTags(useDeck(deck.id), cards);
  const usageCounts = getTagUsageCounts(cards);
  const hasTagDraft = addForm.formState.isDirty || renameForm.formState.isDirty;
  const tagPending = useStore(deckEditPageStore, (state) => state.tagMutation !== undefined);
  const tagError = useStore(deckEditPageStore, (state) => state.tagError);
  const editingTag = useStore(deckEditPageStore, (state) => state.editingTag);
  const tagDeletion = useStore(deckEditPageStore, (state) => state.tagDeletion);
  const guard = useNavigationGuard(
    isDirty || isSubmitting || addForm.formState.isDirty || renameForm.formState.isDirty,
    { pending: tagPending }
  );
  useResetStoreOnMount(deckEditPageStore);

  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const onCompleted = () => guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  const onSubmit = form.handleSubmit(async (values) => {
    // Validation can finish after the originating form was replaced.
    if (!isMounted()) return;
    const saved = await submitDeckEdit(deck.id, values, hasTagDraft);
    // The Page may unmount between the action resolving and this continuation.
    if (!(saved && isMounted())) return;
    await onCompleted();
  });

  return {
    form,
    categories: CATEGORY,
    tags,
    usageCounts,
    addTagForm: addForm,
    renameTagForm: renameForm,
    editingTag,
    tagError,
    tagPending,
    deckSaveDisabled: hasTagDraft || tagPending || deletionPending,
    tagDisabled: isSubmitting || deletionPending || deletionTarget !== undefined || tagPending,
    tagDeletion: guard.isBlocked ? undefined : tagDeletion,
    onAddTag: addForm.handleSubmit((values) => submitTagName(deck.id, values, addForm.reset)),
    onRenameTag: renameForm.handleSubmit((values) => submitTagName(deck.id, values, renameForm.reset, editingTag)),
    onEditTag: (tag: string) => editTagName(tag, renameForm.reset),
    onCancelTagEdit: () => editTagName(undefined, renameForm.reset),
    onRequestTagDeletion: requestTagDeletion,
    onCancelTagDeletion: () => requestTagDeletion(undefined),
    onConfirmTagDeletion: async () => {
      await saveTag(deck.id, undefined, tagDeletion);
    },
    isSubmitting,
    navigationGuard: guard.element,
    deletionTarget: guard.isBlocked ? undefined : getDeckDeletionTarget(deletionTarget),
    deletionPending,
    onCancel: () => void goToList(),
    onSubmit,
    requestDeletion: () => requestDeletion(deck.id),
    cancelDeletion,
    confirmDeletion: async () => {
      if (!isMounted()) return;
      const deleted = await confirmDeletion();
      if (deleted && isMounted()) await onCompleted();
    },
  };
}
