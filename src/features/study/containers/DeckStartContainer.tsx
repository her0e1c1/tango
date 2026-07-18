import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/components";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/hooks/useConfig";

const DeckStartContent = (props: { deck: Deck; cards: Card[]; config: ConfigState; tags: string[] }) => {
  const { deck, cards, config, tags } = props;
  const deckId = deck.id;
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

export const DeckStartContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deckId");
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
      {deck != null ? <DeckStartContent deck={deck} cards={cards} config={config} tags={tags} /> : null}
    </RemoteReadBoundary>
  );
};
