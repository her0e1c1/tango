import type * as React from "react";

import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";

interface DeckDeletionDialogProps {
  target: {
    deckName: string;
    cardCount: number;
  };
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeckDeletionDialog: React.FC<DeckDeletionDialogProps> = ({ target, pending, onCancel, onConfirm }) => (
  <DestructiveActionDialog
    title="Delete deck?"
    targetLabel="Deck"
    targetName={target.deckName}
    confirmLabel="Delete deck"
    description={
      <>
        <p>
          This permanently deletes {target.cardCount} {target.cardCount === 1 ? "card" : "cards"} in this deck.
        </p>
        <p>Any in-progress study session for this deck will also end.</p>
        <p>This action cannot be undone.</p>
      </>
    }
    pending={pending}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);
