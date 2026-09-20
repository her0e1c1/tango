import type * as React from "react";
import { useTranslation } from "react-i18next";
import type { Deck } from "@/entities/deck";
import { DeckFilterForm } from "@/features/deck-filter";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";
import { useStudySessionStartPageModel } from "../model/useStudySessionStartPageModel";
import { useStudySessionStartRouteModel } from "../model/useStudySessionStartRouteModel";
import { StudySessionStart } from "./StudySessionStart";

const AvailableStudySessionStartPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const model = useStudySessionStartPageModel(deck);
  return (
    <AppLayout showHeader>
      {model.syncError ? (
        <RouteFeedback title={t("studySession.unavailable")} description={t("studySession.syncFailure")} tone="error" />
      ) : (
        <StudySessionStart
          deckName={model.state.deckName}
          maxNumberOfCardsToLearn={model.state.maxNumberOfCardsToLearn}
          cardsLength={model.state.cardsLength}
          disabled={model.disabled}
          onClickStart={model.start}
          filterSlot={
            <DeckFilterForm
              {...model.filter}
              clearDifficultyRange={model.clearDifficultyRange}
              setDifficultyMax={model.setDifficultyMax}
              setDifficultyMin={model.setDifficultyMin}
              setSelectedTags={model.setSelectedTags}
              setTagAndFilter={model.setTagAndFilter}
              tags={model.state.tags}
            />
          }
        />
      )}
    </AppLayout>
  );
};

export const StudySessionStartPage: React.FC = () => {
  const { t } = useTranslation();
  const { deckId, deck } = useStudySessionStartRouteModel();
  if (deck === undefined) {
    return (
      <RouteNotFound
        title={t("studyStart.deckNotFound.title")}
        description={t("studyStart.deckNotFound.description")}
      />
    );
  }
  return <AvailableStudySessionStartPage key={deckId} deck={deck} />;
};
