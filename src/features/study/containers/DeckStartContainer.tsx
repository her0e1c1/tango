import * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as selector from "@src/selector";
import { DeckStartForm } from "@src/features/deck/components/DeckStartForm";
import { useDeckActions } from "@src/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@src/features/deck/hooks/useDeckFilterState";
import { DeckStartTemplate } from "@src/features/study/components/templates/DeckStartTemplate";
import { useStudyActions } from "@src/features/study/hooks/useStudyActions";
import { useActions } from "@src/shared/hooks/useActions";

export const DeckStartContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deckId");

  const deck = useSelector(selector.deck.getById(deckId));
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const config = useSelector(selector.config.get());
  const tags = useSelector(selector.card.getAllTags(deckId));
  const deckActions = useDeckActions(deckId);
  const studyActions = useStudyActions(deckId);
  const actions = useActions();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  useKey("Enter", studyActions.start);

  return (
    <DeckStartTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      config={config}
      cardsLength={cards.length}
      onClickStart={studyActions.start}
      filterSlot={<DeckStartForm {...deckStartForm} />}
    />
  );
};
