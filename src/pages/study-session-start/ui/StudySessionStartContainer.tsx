import type * as React from "react";

import type { Deck } from "@/entities/deck";
import { DeckFilterForm } from "@/features/deck-filter";
import { AppLayout } from "@/widgets/app-layout";

import { useStudySessionStartPageModel } from "../model/useStudySessionStartPageModel";
import { StudySessionStart } from "./StudySessionStart";

export const StudySessionStartContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
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
