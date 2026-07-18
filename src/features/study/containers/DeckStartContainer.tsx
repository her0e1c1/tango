import * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/components";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useActions } from "@/shared/hooks/useActions";
import { useConfig } from "@/features/settings/hooks/useConfig";

const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

export const DeckStartContent = (props: { deck: Deck; cards: Card[]; config: ConfigState; tags: string[] }) => {
  const { deck, cards, config, tags } = props;
  const deckId = deck.id;
  const deckActions = useDeckActions(deckId);
  const studyActions = useStudyActions(deckId);
  const actions = useActions();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  const startFromEnter = React.useCallback(
    (event: KeyboardEvent) => {
      if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
      studyActions.start();
    },
    [cards.length, studyActions]
  );
  useKey("Enter", startFromEnter);

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
      deckName={deck.name}
      maxNumberOfCardsToLearn={config.maxNumberOfCardsToLearn}
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
