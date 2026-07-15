import * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@src/constant";
import * as selector from "@src/selector";
import * as util from "@src/util";
import { useActions } from "@src/shared/hooks/useActions";
import { CardListTemplate } from "@src/features/card/components/templates/CardListTemplate";
import { DeckStartForm } from "@src/features/deck/components/DeckStartForm";
import { useDeckActions } from "@src/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@src/features/deck/hooks/useDeckFilterState";

export const CardListContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const [showCard, setShowCard] = React.useState<Card>();
  const actions = useActions();
  const deckActions = useDeckActions(deckId);
  const deck = useSelector(selector.deck.getById(deckId));
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const tags = useSelector(selector.card.getAllTags(deckId));
  const config = useSelector(selector.config.get());
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  const closeCard = React.useCallback(() => setShowCard(undefined), []);
  const category = showCard == null ? undefined : util.getCategory(deck.category, showCard.tags);

  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <CardListTemplate
      cards={cards}
      filterSlot={<DeckStartForm {...deckStartForm} />}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      card={{
        onSwipedLeft: actions.cardUpdateBy((card) => ({ score: card.score - 1 })),
        onSwipedRight: actions.cardUpdateBy((card) => ({ score: card.score + 1 })),
        goToEdit: actions.goToCardEdit,
        onDelete: actions.cardRemove,
      }}
      {...(showCard != null && category != null
        ? {
            overlay: {
              backText: {
                text: showCard.backText,
                category,
                code: C.LANGUAGES.includes(category),
              },
              onClose: closeCard,
            },
          }
        : {})}
      onShowCard={setShowCard}
    />
  );
};
