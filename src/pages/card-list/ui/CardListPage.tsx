import { useAuth } from "@/entities/auth";
import type * as React from "react";
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
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardListPageModel } from "../model/useCardListPageModel";
import { CardList } from "./CardList";
import { BulkDifficultyDialog } from "./bulk-difficulty";

const AvailableCardListPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uid } = useAuth();
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
  const model = useCardListPageModel({
    ...deck,
    difficultyMax: deckFilter.difficultyMax,
    difficultyMin: deckFilter.difficultyMin,
    selectedTags: deckFilter.selectedTags,
    tagAndFilter: deckFilter.tagAndFilter,
  });
  // The explicit domain endpoints select every Card, so the collapsed summary must not present
  // them as an active filter even though new and cleared Decks persist those values.
  const difficultyMax = deckFilter.difficultyMax === deckFilter.difficultyUpperBound ? null : deckFilter.difficultyMax;
  const difficultyMin = deckFilter.difficultyMin === deckFilter.difficultyLowerBound ? null : deckFilter.difficultyMin;
  const busy = model.mutationPending || deckFilter.saving;
  const dialogOpen = model.bulkCardIds != null || model.deletionTarget != null;

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

  return (
    <AppLayout showHeader={model.answer == null}>
      {model.bulkCardIds != null ? (
        <BulkDifficultyDialog
          cardCount={model.bulkCardIds.length}
          difficulty={model.bulkDifficulty}
          selectionDisabled={model.bulkAttempted}
          difficultyLowerBound={model.bulkDifficultyMinimum}
          difficultyUpperBound={model.bulkDifficultyMaximum}
          onDifficultyChange={model.changeBulkDifficulty}
          pending={model.mutationPending}
          onCancel={model.cancelBulk}
          onConfirm={model.confirmBulk}
        />
      ) : model.deletionTarget != null ? (
        <DestructiveActionDialog
          title={t("cardList.deletion.title")}
          targetLabel={t("cardList.deletion.targetLabel")}
          targetName={model.deletionTarget.frontText}
          description={
            <>
              <p>{t("cardList.deletion.description")}</p>
              <p>{t("cardList.deletion.irreversible")}</p>
            </>
          }
          confirmLabel={t("cardList.deletion.confirm")}
          pending={model.mutationPending}
          onCancel={model.cancelDeletion}
          onConfirm={model.confirmDeletion}
        />
      ) : null}
      <div className="contents" inert={dialogOpen}>
        <CardList
          cards={model.cards}
          onChangeDifficulty={model.requestBulk}
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
              disabled={model.mutationPending}
              tags={model.tags}
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
            onSwipedLeft: model.swipeLeft,
            onSwipedRight: model.swipeRight,
            goToEdit: (id) => void navigate(routes.cardForm.to(id)),
            onDelete: model.requestDeletion,
          }}
          {...(model.answer != null
            ? {
                overlay: {
                  content: <BackText {...model.answer} />,
                  onClose: model.closeAnswer,
                },
              }
            : {})}
          onShowCard={model.showAnswer}
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
