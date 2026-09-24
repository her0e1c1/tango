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

import { getTagChanges } from "./queries/getTagChanges";
import { completeDeckEdit } from "./actions/completeDeckEdit";
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
  const { cards } = useCardsByDeckId(deck.id);
  const liveDeck = useDeck(deck.id);
  const managedTags = getManagedTags(liveDeck, cards);
  const { form, pendingSave, setPendingSave } = useDeckEditFormState(deck, managedTags);
  const { isDirty, isSubmitting } = form.formState;
  const isMounted = useMountedGuard();
  const deletionTarget = useStore(deckEditPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckEditPageStore, (state) => state.deletionId !== undefined);
  const tagValues = useWatch({ control: form.control, name: "tags" }) ?? [];
  const originalTags = form.formState.defaultValues?.tags ?? [];
  const tags = tagValues.filter((tag): tag is string => tag !== null);
  const usageCounts = getTagUsageCounts(cards, getTagChanges(originalTags, tagValues));
  const { addForm, renameForm, editingTag, setEditingTag, tagDeletion, setTagDeletion } = useTagFormState(tags);
  const hasTagDraft = addForm.formState.isDirty || renameForm.formState.isDirty;
  const busy = isSubmitting || pendingSave !== undefined || deletionPending || deletionTarget !== undefined;
  const guard = useNavigationGuard(isDirty || isSubmitting || pendingSave !== undefined || hasTagDraft);
  useResetStoreOnMount(deckEditPageStore);

  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const onSubmit = form.handleSubmit(async (values) => {
    // Validation can finish after the originating form was replaced.
    if (!isMounted() || hasTagDraft || pendingSave !== undefined) return;
    const saved = await submitDeckEdit(deck.id, values, originalTags);
    // Tag batches complete from subscribed Deck/Card state below.
    if (!isMounted()) return;
    if (typeof saved !== "boolean") {
      setPendingSave(saved);
      return;
    }
    if (!saved) return;
    await guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  });
  useEffect(() => {
    if (!completeDeckEdit(pendingSave)) return;
    setPendingSave(undefined);
    void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, () =>
      navigate(deckListPath, { replace: true })
    );
  }, [cards, deckListPath, guard, liveDeck, navigate, pendingSave, setPendingSave]);

  return {
    form,
    categories: CATEGORY,
    tags,
    usageCounts,
    addTagForm: addForm,
    renameTagForm: renameForm,
    editingTag,
    tagError: (editingTag === undefined ? addForm : renameForm).formState.errors.name?.message,
    deckSaveDisabled: hasTagDraft || deletionPending || pendingSave !== undefined,
    tagDisabled: busy,
    tagDeletion: guard.isBlocked ? undefined : tagDeletion,
    onAddTag: addForm.handleSubmit(({ name }) => {
      if (busy || !isMounted()) return;
      const current = form.getValues().tags ?? [];
      if (current.includes(name)) {
        addForm.setError("name", { type: "validate", message: "duplicate" });
        return;
      }
      form.setValue("tags", [...current, name], { shouldDirty: true });
      addForm.reset();
    }),
    onRenameTag: renameForm.handleSubmit(({ name }) => {
      if (busy || !isMounted() || editingTag === undefined) return;
      const current = form.getValues().tags ?? [];
      const index = current.indexOf(editingTag);
      if (index < 0) return;
      if (name !== editingTag && current.includes(name)) {
        renameForm.setError("name", { type: "validate", message: "duplicate" });
        return;
      }
      form.setValue(`tags.${String(index)}` as `tags.${number}`, name, { shouldDirty: true });
      renameForm.reset({ name: "" });
      setEditingTag(undefined);
    }),
    onEditTag: (tag: string) => {
      renameForm.reset({ name: tag });
      addForm.clearErrors();
      setEditingTag(tag);
    },
    onCancelTagEdit: () => {
      renameForm.reset({ name: "" });
      setEditingTag(undefined);
    },
    onRequestTagDeletion: (tag: string) => {
      addForm.clearErrors();
      setTagDeletion(tag);
    },
    onCancelTagDeletion: () => setTagDeletion(undefined),
    onConfirmTagDeletion: () => {
      if (busy || tagDeletion === undefined) return;
      const index = (form.getValues().tags ?? []).indexOf(tagDeletion);
      if (index < 0) return;
      form.setValue(`tags.${String(index)}` as `tags.${number}`, null, { shouldDirty: true });
      setTagDeletion(undefined);
    },
    isSubmitting: isSubmitting || pendingSave !== undefined,
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
