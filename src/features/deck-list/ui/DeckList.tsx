import * as React from "react";

import { filterCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import { buildDeckListSections } from "../model/buildDeckListSections";
import { downloadDeckCsv } from "../lib/deckCsv";
import { DeckListView } from "./DeckListView";

export interface DeckListProps {
  decks: Deck[];
  cards: Card[];
  sessionsByDeckId: Parameters<typeof buildDeckListSections>[2];
  onViewDeck: (id: DeckId) => void;
  onContinueDeck: (id: DeckId) => void;
  onStartDeck: (id: DeckId) => void;
  onEditDeck: (id: DeckId) => void;
  onDeleteDeck: (deck: Deck) => Promise<void>;
}

interface DeletionTarget {
  deck: Deck;
  cardCount: number;
}

export const DeckList: React.FC<DeckListProps> = (props) => {
  const [deletionTarget, setDeletionTarget] = React.useState<DeletionTarget>();
  const [deletionErrorDeckId, setDeletionErrorDeckId] = React.useState<DeckId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sections = buildDeckListSections(props.decks, props.cards, props.sessionsByDeckId);

  const closeMenu = React.useCallback(() => setOpenMenuDeckId(undefined), []);
  const toggleMenu = React.useCallback(
    (id: DeckId) => setOpenMenuDeckId((value) => (value === id ? undefined : id)),
    []
  );

  const findDeck = (id: DeckId) => props.decks.find((deck) => deck.id === id);
  const cardsForDeck = (id: DeckId) => filterCardsByDeckId(props.cards, id);

  const requestDeletion = (id: DeckId) => {
    const deck = findDeck(id);
    if (deck == null) return;
    setSuccessMessage(undefined);
    setDeletionErrorDeckId(undefined);
    setDeletionTarget({ deck, cardCount: cardsForDeck(id).length });
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null) return;
    const deck = deletionTarget.deck;
    setDeletionErrorDeckId(undefined);
    try {
      await props.onDeleteDeck(deck);
      setDeletionTarget(undefined);
      setSuccessMessage(`Deleted deck “${deck.name}”.`);
    } catch {
      setDeletionErrorDeckId(deck.id);
    }
  };

  return (
    <>
      <Feedback tone="success">{successMessage}</Feedback>
      {deletionTarget != null ? (
        <DestructiveActionDialog
          title="Delete deck?"
          targetLabel="Deck"
          targetName={deletionTarget.deck.name}
          confirmLabel="Delete deck"
          {...(deletionErrorDeckId === deletionTarget.deck.id
            ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
            : {})}
          description={
            <>
              <p>
                This permanently deletes {deletionTarget.cardCount} {deletionTarget.cardCount === 1 ? "card" : "cards"}{" "}
                in this deck.
              </p>
              <p>Any in-progress study session for this deck will also end.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          onCancel={() => setDeletionTarget(undefined)}
          onConfirm={confirmDeletion}
        />
      ) : null}
      <DeckListView
        sections={sections}
        deckCard={{
          openMenuDeckId,
          onToggleMenu: toggleMenu,
          onCloseMenu: closeMenu,
          onClickEdit: props.onEditDeck,
          onClickName: props.onViewDeck,
          onClickContinue: props.onContinueDeck,
          onClickRestart: props.onStartDeck,
          onClickStudy: props.onStartDeck,
          onClickDownload: (id) => {
            const deck = findDeck(id);
            if (deck != null) downloadDeckCsv(deck, cardsForDeck(id));
          },
          onClickDelete: requestDeletion,
        }}
      />
    </>
  );
};
