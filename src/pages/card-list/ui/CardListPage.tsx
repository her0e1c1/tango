import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { BackText } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { DifficultyIndicator } from "@/entities/study-progress";
import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
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
  const deckFilter = useDeckFilterState(deck);
  // The list previews the local filter draft; persistence remains an explicit user action.
  const state = useCardListState({
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
  const busy = state.mutationPending || deckFilter.saving;
  const dialogOpen = state.bulkDifficultyTarget != null || state.deletionTarget != null;
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

  const requestBulkDifficulty = () => {
    dismissBulkErrorToast();
    state.onRequestBulkDifficulty();
  };

  const cancelBulkDifficulty = () => {
    dismissBulkErrorToast();
    state.onCancelBulkDifficulty();
  };

  const confirmBulkDifficulty = async () => {
    dismissBulkErrorToast();
    const result = await state.onConfirmBulkDifficulty();
    if (result === undefined) return;
    if (result.outcome === "success") {
      showToast({
        message: t("cardList.bulkDifficulty.success", {
          count: result.cardCount,
          difficulty: result.difficulty,
        }),
        tone: "success",
      });
      return;
    }

    bulkErrorToastId.current = showToast({
      message: t("cardList.bulkDifficulty.partialFailure", {
        count: result.failureCount,
        successCount: result.successCount,
        totalCount: result.totalCount,
      }),
      tone: "error",
    });
  };

  return (
    <AppLayout showHeader={state.answer == null}>
      {state.bulkDifficultyTarget != null ? (
        <BulkDifficultyDialog
          cardCount={state.bulkDifficultyTarget.cardCount}
          difficulty={state.bulkDifficultyTarget.difficulty}
          pending={state.bulkDifficultyPending}
          onCancel={cancelBulkDifficulty}
          onConfirm={confirmBulkDifficulty}
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
          pending={state.deletionPending}
          onCancel={state.onCancelDeletion}
          onConfirm={state.onConfirmDeletion}
        />
      ) : null}
      <CardList
        cards={state.cards}
        bulkDifficulty={{
          difficultyLowerBound: state.bulkDifficultyMinimum,
          difficultyUpperBound: state.bulkDifficultyMaximum,
          selectedDifficulty: state.bulkDifficulty,
          onDifficultyChange: state.onChangeBulkDifficulty,
          onRequest: requestBulkDifficulty,
        }}
        disabled={busy}
        renderDifficulty={(difficulty) => <DifficultyIndicator className="shrink-0" difficulty={difficulty} />}
        onAddCard={() => void navigate(routes.cardCreate.to(deck.id))}
        filter={{
          difficultyMax,
          difficultyMin,
          selectedTags: deckFilter.selectedTags,
        }}
        filterSlot={<DeckFilterForm {...deckFilter} disabled={state.mutationPending} tags={state.tags} />}
        onRemoveTag={(tag) =>
          deckFilter.setSelectedTags(deckFilter.selectedTags.filter((selectedTag) => selectedTag !== tag))
        }
        card={{
          disabled: busy,
          onSwipedLeft: state.onSwipedLeft,
          onSwipedRight: state.onSwipedRight,
          goToEdit: (id) => void navigate(routes.cardForm.to(id)),
          onDelete: state.onRequestDeletion,
        }}
        {...(state.answer != null
          ? {
              overlay: {
                content: <BackText {...state.answer} />,
                onClose: state.onCloseCard,
              },
            }
          : {})}
        onShowCard={state.onShowCard}
      />
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
