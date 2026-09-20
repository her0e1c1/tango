import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { BackText } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { DifficultyIndicator } from "@/entities/study-progress";
import { DeckFilterForm } from "@/features/deck-filter";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardListPageModel } from "../model/useCardListPageModel";
import { CardList } from "./CardList";
import { BulkDifficultyDialog } from "./bulk-difficulty";

const AvailableCardListPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const model = useCardListPageModel(deck);

  useKey("t", model.goToDeckList, undefined, [model.goToDeckList]);
  useKey("s", model.goToSettings, undefined, [model.goToSettings]);

  return (
    <AppLayout showHeader={model.answer == null}>
      {model.bulk != null ? (
        <BulkDifficultyDialog
          cardCount={model.bulk.cardIds.length}
          difficulty={model.bulk.difficulty}
          selectionDisabled={model.bulk.attempted}
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
      <div className="contents" inert={model.dialogOpen}>
        <CardList
          cards={model.cards}
          sortOrder={model.sortOrder}
          onSortOrderChange={model.changeSortOrder}
          sortDisabled={model.mutationPending}
          filterDisabled={model.mutationPending}
          onChangeDifficulty={model.requestBulk}
          disabled={model.busy}
          renderDifficulty={(difficulty) => <DifficultyIndicator className="shrink-0" difficulty={difficulty} />}
          onAddCard={model.goToCardCreate}
          filter={model.filterSummary}
          filterSlot={
            <DeckFilterForm
              {...model.deckFilter}
              clearDifficultyRange={model.clearDifficultyRange}
              setDifficultyMax={model.setDifficultyMax}
              setDifficultyMin={model.setDifficultyMin}
              setSelectedTags={model.setSelectedTags}
              setTagAndFilter={model.setTagAndFilter}
              disabled={model.mutationPending}
              tags={model.tags}
            />
          }
          onRemoveTag={model.removeTag}
          card={{
            disabled: model.busy,
            onSwipedLeft: model.swipeLeft,
            onSwipedRight: model.swipeRight,
            goToEdit: model.goToCardEdit,
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
