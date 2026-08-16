import * as React from "react";

import type { DeckId } from "@/entities/deck";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import type { DeckListState } from "../model/useDeckListState";
import { DeckListView } from "./DeckListView";

export interface DeckListProps {
  state: DeckListState;
  onViewDeck: (id: DeckId) => void;
  onContinueDeck: (id: DeckId) => void;
  onStartDeck: (id: DeckId) => void;
  onEditDeck: (id: DeckId) => void;
}

export const DeckList: React.FC<DeckListProps> = (props) => {
  const { state } = props;
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();

  const closeMenu = () => setOpenMenuDeckId(undefined);
  const toggleMenu = (id: DeckId) => setOpenMenuDeckId((value) => (value === id ? undefined : id));

  return (
    <>
      <Feedback tone="success">{state.successMessage}</Feedback>
      {state.deletionTarget != null ? (
        <DestructiveActionDialog
          title="Delete deck?"
          targetLabel="Deck"
          targetName={state.deletionTarget.deckName}
          confirmLabel="Delete deck"
          {...(state.deletionTarget.hasError
            ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
            : {})}
          description={
            <>
              <p>
                This permanently deletes {state.deletionTarget.cardCount}{" "}
                {state.deletionTarget.cardCount === 1 ? "card" : "cards"} in this deck.
              </p>
              <p>Any in-progress study session for this deck will also end.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          onCancel={state.onCancelDeletion}
          onConfirm={state.onConfirmDeletion}
        />
      ) : null}
      <DeckListView
        sections={state.sections}
        deckCard={{
          openMenuDeckId,
          onToggleMenu: toggleMenu,
          onCloseMenu: closeMenu,
          onClickEdit: props.onEditDeck,
          onClickName: props.onViewDeck,
          onClickContinue: props.onContinueDeck,
          onClickRestart: props.onStartDeck,
          onClickStudy: props.onStartDeck,
          onClickDownload: state.onDownload,
          onClickDelete: state.onRequestDeletion,
        }}
      />
    </>
  );
};
