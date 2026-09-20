import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { Deck } from "@/entities/deck";
import { DeckFilterForm } from "@/features/deck-filter";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";
import { useStudySessionStartPageModel, useStudySessionStartRouteModel } from "../model/useStudySessionStartPageModel";
import { StudySessionStart } from "./StudySessionStart";

const AvailableStudySessionStartPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const model = useStudySessionStartPageModel(deck);
  return (
    <AppLayout showHeader>
      <StudySessionStart
        deckName={model.deckName}
        maxNumberOfCardsToLearn={model.maxNumberOfCardsToLearn}
        cardsLength={model.cardsLength}
        disabled={model.filter.saving}
        onClickStart={model.start}
        filterSlot={
          <DeckFilterForm
            {...model.filter}
            clearDifficultyRange={model.clearDifficultyRange}
            setDifficultyMax={model.setDifficultyMax}
            setDifficultyMin={model.setDifficultyMin}
            setSelectedTags={model.setSelectedTags}
            setTagAndFilter={model.setTagAndFilter}
            tags={model.tags}
          />
        }
      />
    </AppLayout>
  );
};

export const StudySessionStartPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  if (id === undefined) throw new Error("invalid deck id");
  const { deckId, deck } = useStudySessionStartRouteModel(id);
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
