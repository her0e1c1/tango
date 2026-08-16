import * as React from "react";

import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import type { DeckListSections } from "../model/buildDeckListSections";
import { DeckListView } from "./DeckListView";

interface DeckListDeletionTarget {
  deckName: string;
  cardCount: number;
  hasError: boolean;
}

export interface DeckListProps {
  sections: DeckListSections;
  deletionTarget?: DeckListDeletionTarget;
  successMessage?: string;
  onViewDeck: (id: string) => void;
  onContinueDeck: (id: string) => void;
  onStartDeck: (id: string) => void;
  onEditDeck: (id: string) => void;
  onDownload: (id: string) => void;
  onRequestDeletion: (id: string) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => Promise<void>;
}

export const DeckList: React.FC<DeckListProps> = (props) => {
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<string>();

  const closeMenu = () => setOpenMenuDeckId(undefined);
  const toggleMenu = (id: string) => setOpenMenuDeckId((value) => (value === id ? undefined : id));

  return (
    <>
      <Feedback tone="success">{props.successMessage}</Feedback>
      {props.deletionTarget != null ? (
        <DestructiveActionDialog
          title="Delete deck?"
          targetLabel="Deck"
          targetName={props.deletionTarget.deckName}
          confirmLabel="Delete deck"
          {...(props.deletionTarget.hasError
            ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
            : {})}
          description={
            <>
              <p>
                This permanently deletes {props.deletionTarget.cardCount}{" "}
                {props.deletionTarget.cardCount === 1 ? "card" : "cards"} in this deck.
              </p>
              <p>Any in-progress study session for this deck will also end.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          onCancel={props.onCancelDeletion}
          onConfirm={props.onConfirmDeletion}
        />
      ) : null}
      <DeckListView
        sections={props.sections}
        deckCard={{
          openMenuDeckId,
          onToggleMenu: toggleMenu,
          onCloseMenu: closeMenu,
          onClickEdit: props.onEditDeck,
          onClickName: props.onViewDeck,
          onClickContinue: props.onContinueDeck,
          onClickRestart: props.onStartDeck,
          onClickStudy: props.onStartDeck,
          onClickDownload: props.onDownload,
          onClickDelete: props.onRequestDeletion,
        }}
      />
    </>
  );
};
