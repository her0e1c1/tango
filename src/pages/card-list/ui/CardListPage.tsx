import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { BackText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { DeckFilterForm } from "@/features/deck-filter";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardListPageModel, useCardListRouteModel } from "../model/useCardListPageModel";
import { CardList } from "./CardList";

const CardListContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const model = useCardListPageModel(deck);

  return (
    <AppLayout showHeader={model.answer == null}>
      {model.deletionTarget != null ? (
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
          empty={model.empty}
          sortOrder={model.sortOrder}
          onSortOrderChange={model.changeSortOrder}
          sortDisabled={model.mutationPending}
          filterDisabled={model.mutationPending}
          disabled={model.busy}
          onAddCard={model.goToCardCreate}
          filter={model.filterSummary}
          filterSlot={
            <>
              <DeckFilterForm
                {...model.deckFilter}
                setSelectedTags={model.setSelectedTags}
                setTagAndFilter={model.setTagAndFilter}
                disabled={model.mutationPending}
                tags={model.tags}
              />
              {model.emptyReason !== "filter-zero" && (
                <Button variant="secondary" onClick={model.clearFilters} disabled={model.mutationPending}>
                  {t("cardList.empty.clearFilters")}
                </Button>
              )}
            </>
          }
          onRemoveTag={model.removeTag}
          card={{
            disabled: model.busy,
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
  const { deckId, deck } = useCardListRouteModel(params.id);
  if (deck == null) {
    return (
      <RouteNotFound title={t("cardList.deckNotFound.title")} description={t("cardList.deckNotFound.description")} />
    );
  }

  // Filter, dialog, and shown-card state belong to one Deck and must not survive a route change.
  return <CardListContainer key={deckId} deck={deck} />;
};
