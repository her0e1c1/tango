import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { useCardsByDeckId } from "@/entities/card";
import { CATEGORY, useDeck, type Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

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
  const liveDeck = useDeck(deck.id);
  const managedTags = getManagedTags(liveDeck, cards);
  const draftTags = useStore(deckEditPageStore, (state) => state.draftTags);
  const tagChanges = useStore(deckEditPageStore, (state) => state.tagChanges);
  const tags = draftTags ?? managedTags;
  const usageCounts = getTagUsageCounts(cards, tagChanges);
  const hasTagDraft = addForm.formState.isDirty || renameForm.formState.isDirty;
  const tagError = useStore(deckEditPageStore, (state) => state.tagError);
  const editingTag = useStore(deckEditPageStore, (state) => state.editingTag);
  const tagDeletion = useStore(deckEditPageStore, (state) => state.tagDeletion);
  const pendingTagSave = useStore(deckEditPageStore, (state) => state.pendingTagSave);
  const guard = useNavigationGuard(
    isDirty ||
      isSubmitting ||
      pendingTagSave !== undefined ||
      draftTags !== undefined ||
      addForm.formState.isDirty ||
      renameForm.formState.isDirty
  );
  useResetStoreOnMount(deckEditPageStore);

  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const onCompleted = () => guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  const onSubmit = form.handleSubmit(async (values) => {
    // Validation can finish after the originating form was replaced.
    if (!isMounted()) return;
    const saved = await submitDeckEdit(deck.id, values, hasTagDraft);
    // Tag batches complete from subscribed Deck/Card state below.
    if (!(saved && isMounted())) return;
    await onCompleted();
  });
  useEffect(() => {
    if (pendingTagSave === undefined || liveDeck === undefined) return;
    const deckTags = liveDeck.tags ?? [];
    if (
      deckTags.length !== pendingTagSave.tags.length ||
      deckTags.some((tag, index) => tag !== pendingTagSave.tags[index])
    )
      return;
    for (const expected of pendingTagSave.cards) {
      const card = cards.find(({ id }) => id === expected.id);
      if (
        card === undefined ||
        card.tags.length !== expected.tags.length ||
        card.tags.some((tag, index) => tag !== expected.tags[index])
      )
        return;
    }
    deckEditPageStore.setState({ pendingTagSave: undefined, draftTags: undefined, tagChanges: [] });
    showToast({
      messageKey: "deckForm.toast.updated",
      messageParams: { name: pendingTagSave.name },
      tone: "success",
    });
    void onCompleted();
  }, [cards, liveDeck, onCompleted, pendingTagSave]);

  return {
    form,
    categories: CATEGORY,
    tags,
    usageCounts,
    addTagForm: addForm,
    renameTagForm: renameForm,
    editingTag,
    tagError,
    deckSaveDisabled: hasTagDraft || deletionPending || pendingTagSave !== undefined,
    tagDisabled: isSubmitting || pendingTagSave !== undefined || deletionPending || deletionTarget !== undefined,
    tagDeletion: guard.isBlocked ? undefined : tagDeletion,
    onAddTag: addForm.handleSubmit((values) => submitTagName(tags, values, addForm.reset)),
    onRenameTag: renameForm.handleSubmit((values) => submitTagName(tags, values, renameForm.reset, editingTag)),
    onEditTag: (tag: string) => editTagName(tag, renameForm.reset),
    onCancelTagEdit: () => editTagName(undefined, renameForm.reset),
    onRequestTagDeletion: requestTagDeletion,
    onCancelTagDeletion: () => requestTagDeletion(undefined),
    onConfirmTagDeletion: () => {
      saveTag(tags, undefined, tagDeletion);
    },
    isSubmitting: isSubmitting || pendingTagSave !== undefined,
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
