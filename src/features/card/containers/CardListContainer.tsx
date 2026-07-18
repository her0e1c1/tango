import * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@/constant";
import * as util from "@/util";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";
import { CardListTemplate } from "@/features/card/components/templates/CardListTemplate";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/features/settings/hooks/useConfig";

const CardListContent = (props: { deck: Deck; cards: Card[]; tags: string[]; config: ConfigState }) => {
  const { deck, cards, tags, config } = props;
  const deckId = deck.id;
  const [showCard, setShowCard] = React.useState<Card>();
  const actions = useActions();
  const mutations = useCardMutations();
  const deckActions = useDeckActions(deckId);
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  const closeCard = React.useCallback(() => setShowCard(undefined), []);
  const category = showCard == null ? undefined : util.getCategory(deck.category, showCard.tags);

  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <CardListTemplate
      cards={cards}
      filter={{
        scoreMax: deckStartForm.scoreMax,
        scoreMin: deckStartForm.scoreMin,
        selectedTags: deckStartForm.tagFilterProps.selectedTags ?? [],
      }}
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
        onSwipedLeft: (id) => void mutations.updateBy(id, (card) => ({ score: card.score - 1 })).catch(() => undefined),
        onSwipedRight: (id) =>
          void mutations.updateBy(id, (card) => ({ score: card.score + 1 })).catch(() => undefined),
        goToEdit: actions.goToCardEdit,
        onDelete: (id) => {
          if (window.confirm("Are you sure?")) void mutations.remove(id).catch(() => undefined);
        },
      }}
      feedbackSlot={
        <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
      }
      isCardPending={mutations.isPending}
      {...(showCard != null && category != null
        ? {
            overlay: {
              backText: {
                text: showCard.backText,
                category,
                code: C.LANGUAGES.includes(category),
                dark: config.darkMode,
              },
              onClose: closeCard,
            },
          }
        : {})}
      onShowCard={setShowCard}
    />
  );
};

export const CardListContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const config = useConfig();
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const cards = remote.filteredCardsByDeckId(deckId, config);
  const tags = remote.tagsByDeckId(deckId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={deck != null}
      emptyLabel="Deck not found."
      onRetry={remote.retry}
    >
      {deck != null ? <CardListContent deck={deck} cards={cards} tags={tags} config={config} /> : null}
    </RemoteReadBoundary>
  );
};
