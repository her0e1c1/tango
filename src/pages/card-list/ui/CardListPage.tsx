import { useCardListQuery } from "../model/queries/useCardListQuery";
import { requestBulkDifficulty } from "../model/actions/requestBulkDifficulty";
import { cancelBulkDifficulty } from "../model/actions/cancelBulkDifficulty";
import { confirmBulkDifficulty } from "../model/actions/confirmBulkDifficulty";
import { confirmCardDeletion } from "../model/actions/confirmCardDeletion";
import { changeBulkDifficulty } from "../model/actions/changeBulkDifficulty";
import { changeCardDifficulty } from "../model/actions/changeCardDifficulty";
import { requestCardDeletion } from "../model/actions/requestCardDeletion";
import { showCardAnswer } from "../model/actions/showCardAnswer";
import { useAuthUid } from "@/entities/auth";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { BackText } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { DifficultyIndicator } from "@/entities/study-progress";
import {
  DeckFilterForm,
  useDeckFilterDraft,
  getDeckFilterState,
  clearDeckFilterRange,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";
import { routes } from "@/shared/router";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardListState } from "../model/useCardListState";
import { CardList } from "./CardList";
import { BulkDifficultyDialog } from "./bulk-difficulty";

const AvailableCardListPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uid = useAuthUid();
  const filterDraft = useDeckFilterDraft(uid, deck);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = {
    uid,
    deckId: deck.id,
    draft: filterDraft.state.draft,
    setState: filterDraft.setState,
  };
  const deckFilter = getDeckFilterState(filterDraft.state);
  // Use the latest selection immediately, including autosaves still pending from another Page.
  const state = useCardListState();
  const [bulkAttempted, setBulkAttempted] = React.useState(false);
  const query = useCardListQuery(
    {
      ...deck,
      difficultyMax: deckFilter.difficultyMax,
      difficultyMin: deckFilter.difficultyMin,
      selectedTags: deckFilter.selectedTags,
      tagAndFilter: deckFilter.tagAndFilter,
    },
    state.shownCard
  );
  // The explicit domain endpoints select every Card, so the collapsed summary must not present
  // them as an active filter even though new and cleared Decks persist those values.
  const difficultyMax = deckFilter.difficultyMax === deckFilter.difficultyUpperBound ? null : deckFilter.difficultyMax;
  const difficultyMin = deckFilter.difficultyMin === deckFilter.difficultyLowerBound ? null : deckFilter.difficultyMin;
  const busy = state.mutationPending || deckFilter.saving;
  const dialogOpen = state.bulkDifficultyRequest != null || state.deletionTarget != null;
  const bulkErrorToastId = React.useRef<ToastId | undefined>(undefined);

  useKey(
    "t",
    () => {
      if (!dialogOpen) void navigate(routes.deckList.to());
    },
    undefined,
    [dialogOpen, navigate]
  );
  useKey(
    "s",
    () => {
      if (!dialogOpen) void navigate(routes.settings.to());
    },
    undefined,
    [dialogOpen, navigate]
  );

  const dismissBulkErrorToast = () => {
    if (bulkErrorToastId.current === undefined) return;
    dismissToast(bulkErrorToastId.current);
    bulkErrorToastId.current = undefined;
  };

  React.useEffect(
    () => () => {
      if (bulkErrorToastId.current !== undefined) dismissToast(bulkErrorToastId.current);
    },
    []
  );

  const requestBulk = () => {
    dismissBulkErrorToast();
    setBulkAttempted(false);
    state.setBulkDifficulty(null);
    requestBulkDifficulty(query.cards, query.bulkDifficultyMinimum, state.mutation, state.setBulkDifficultyRequest);
  };

  const cancelBulk = () => {
    dismissBulkErrorToast();
    cancelBulkDifficulty(state.mutation, state.setBulkDifficultyRequest);
  };

  const confirmBulk = async () => {
    if (state.bulkDifficulty == null || state.bulkDifficultyRequest == null) return;
    dismissBulkErrorToast();
    // Freeze the chosen value as well as the targets before the first persistence attempt.
    const request = { ...state.bulkDifficultyRequest, difficulty: state.bulkDifficulty };
    state.setBulkDifficultyRequest(request);
    setBulkAttempted(true);
    const result = await confirmBulkDifficulty({
      uid,
      request,
      mutation: state.mutation,
      setRequest: state.setBulkDifficultyRequest,
      setDifficulty: state.setBulkDifficulty,
    });
    if (result === undefined) return;
    if (result.outcome === "success") {
      showToast({
        messageKey: "cardList.bulkDifficulty.success",
        messageParams: {
          count: result.cardCount,
          difficulty: result.difficulty,
        },
        tone: "success",
      });
      return;
    }

    bulkErrorToastId.current = showToast({
      messageKey: "cardList.bulkDifficulty.partialFailure",
      messageParams: {
        count: result.failureCount,
        successCount: result.successCount,
        totalCount: result.totalCount,
      },
      tone: "error",
    });
  };

  return (
    <AppLayout showHeader={query.answer == null}>
      {state.bulkDifficultyRequest != null ? (
        <BulkDifficultyDialog
          cardCount={state.bulkDifficultyRequest.cardIds.length}
          difficulty={state.bulkDifficulty}
          selectionDisabled={bulkAttempted}
          difficultyLowerBound={query.bulkDifficultyMinimum}
          difficultyUpperBound={query.bulkDifficultyMaximum}
          onDifficultyChange={(difficulty) => changeBulkDifficulty(difficulty, state.setBulkDifficulty)}
          pending={state.mutationPending}
          onCancel={cancelBulk}
          onConfirm={confirmBulk}
        />
      ) : state.deletionTarget != null ? (
        <DestructiveActionDialog
          title={t("cardList.deletion.title")}
          targetLabel={t("cardList.deletion.targetLabel")}
          targetName={state.deletionTarget.frontText}
          description={
            <>
              <p>{t("cardList.deletion.description")}</p>
              <p>{t("cardList.deletion.irreversible")}</p>
            </>
          }
          confirmLabel={t("cardList.deletion.confirm")}
          pending={state.mutationPending}
          onCancel={() => state.setDeletionTarget(undefined)}
          onConfirm={() => confirmCardDeletion(uid, state.deletionTarget, state.mutation, state.setDeletionTarget)}
        />
      ) : null}
      <div className="contents" inert={dialogOpen}>
        <CardList
          cards={query.cards}
          onChangeDifficulty={requestBulk}
          disabled={busy}
          renderDifficulty={(difficulty) => <DifficultyIndicator className="shrink-0" difficulty={difficulty} />}
          onAddCard={() => void navigate(routes.cardCreate.to(deck.id))}
          filter={{
            difficultyMax,
            difficultyMin,
            selectedTags: deckFilter.selectedTags,
          }}
          filterSlot={
            <DeckFilterForm
              {...deckFilter}
              clearDifficultyRange={() => clearDeckFilterRange(filterUpdate)}
              setDifficultyMax={(value) => updateDeckFilterDraft({ difficultyMax: value }, filterUpdate)}
              setDifficultyMin={(value) => updateDeckFilterDraft({ difficultyMin: value }, filterUpdate)}
              setSelectedTags={(selectedTags) => updateDeckFilterDraft({ selectedTags }, filterUpdate)}
              setTagAndFilter={(tagAndFilter) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate)}
              disabled={state.mutationPending}
              tags={query.tags}
            />
          }
          onRemoveTag={(tag) =>
            updateDeckFilterDraft(
              { selectedTags: deckFilter.selectedTags.filter((selectedTag) => selectedTag !== tag) },
              filterUpdate
            )
          }
          card={{
            disabled: busy,
            onSwipedLeft: (id) =>
              void changeCardDifficulty({
                uid,
                cards: query.cards,
                id,
                rating: "not-mastered",
                mutation: state.mutation,
              }),
            onSwipedRight: (id) =>
              void changeCardDifficulty({ uid, cards: query.cards, id, rating: "mastered", mutation: state.mutation }),
            goToEdit: (id) => void navigate(routes.cardForm.to(id)),
            onDelete: (id) =>
              requestCardDeletion(query.cards, id, state.mutation.errorToastId, state.setDeletionTarget),
          }}
          {...(query.answer != null
            ? {
                overlay: {
                  content: <BackText {...query.answer} />,
                  onClose: () => state.setShownCard(undefined),
                },
              }
            : {})}
          onShowCard={(id) => showCardAnswer(query.cards, id, state.setShownCard)}
        />
      </div>
    </AppLayout>
  );
};

export const CardListPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  const deck = useDeck(deckId);
  if (deck == null) {
    return (
      <RouteNotFound title={t("cardList.deckNotFound.title")} description={t("cardList.deckNotFound.description")} />
    );
  }

  // Filter, dialog, and shown-card state belong to one Deck and must not survive a route change.
  return <AvailableCardListPage key={deckId} deck={deck} />;
};
