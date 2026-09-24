import { useEffect } from "react";
import { useWatch } from "react-hook-form";
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
  const { cards } = useCardsByDeckId(deck.id);
  const liveDeck = useDeck(deck.id);
  const managedTags = getManagedTags(liveDeck, cards);
  const draftTags = useWatch({ control: form.control, name: "tags" });
  const tagChanges = useStore(deckEditPageStore, (state) => state.tagChanges);
  const tags = draftTags ?? managedTags;
  const usageCounts = getTagUsageCounts(cards, tagChanges);
  const editingTag = useStore(deckEditPageStore, (state) => state.editingTag);
  const { addForm, renameForm } = useTagFormState(tags, editingTag);
  const hasTagDraft = addForm.formState.isDirty || renameForm.formState.isDirty;
  const tagDeletion = useStore(deckEditPageStore, (state) => state.tagDeletion);
  const pendingTagSave = useStore(deckEditPageStore, (state) => state.pendingTagSave);
  const guard = useNavigationGuard(isDirty || isSubmitting || pendingTagSave !== undefined || hasTagDraft);
  useResetStoreOnMount(deckEditPageStore);

  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const onSubmit = form.handleSubmit(async (values) => {
    // Validation can finish after the originating form was replaced.
    if (!isMounted()) return;
    const saved = await submitDeckEdit(deck.id, values, hasTagDraft);
    // Tag batches complete from subscribed Deck/Card state below.
    if (!(saved && isMounted())) return;
    await guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
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
    deckEditPageStore.setState({ pendingTagSave: undefined, tagChanges: [] });
    showToast({
      messageKey: "deckForm.toast.updated",
      messageParams: { name: pendingTagSave.name },
      tone: "success",
    });
    void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, () =>
      navigate(deckListPath, { replace: true })
    );
  }, [cards, deckListPath, guard, liveDeck, navigate, pendingTagSave]);

  return {
    form,
    categories: CATEGORY,
    tags,
    usageCounts,
    addTagForm: addForm,
    renameTagForm: renameForm,
    editingTag,
    tagError: (editingTag === undefined ? addForm : renameForm).formState.errors.name?.message,
    deckSaveDisabled: hasTagDraft || deletionPending || pendingTagSave !== undefined,
    tagDisabled: isSubmitting || pendingTagSave !== undefined || deletionPending || deletionTarget !== undefined,
    tagDeletion: guard.isBlocked ? undefined : tagDeletion,
    onAddTag: addForm.handleSubmit((values) => submitTagName(tags, values, addForm.reset, form.setValue)),
    onRenameTag: renameForm.handleSubmit((values) =>
      submitTagName(tags, { ...values, previous: editingTag }, renameForm.reset, form.setValue)
    ),
    onEditTag: (tag: string) => editTagName(tag, renameForm.reset),
    onCancelTagEdit: () => editTagName(undefined, renameForm.reset),
    onRequestTagDeletion: requestTagDeletion,
    onCancelTagDeletion: () => requestTagDeletion(undefined),
    onConfirmTagDeletion: () => {
      saveTag(tags, undefined, form.setValue, tagDeletion);
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
      if (deleted && isMounted()) await guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
    },
  };
}
