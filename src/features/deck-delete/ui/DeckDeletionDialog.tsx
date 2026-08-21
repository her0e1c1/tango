import type * as React from "react";

import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";

export interface DeckDeletionDialogProps {
  target:
    | {
        deckName: string;
        cardCount: number;
        hasError: boolean;
      }
    | undefined;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeckDeletionDialog: React.FC<DeckDeletionDialogProps> = ({ target, onCancel, onConfirm }) => {
  if (target == null) return null;

  return (
    <DestructiveActionDialog
      title="Delete deck?"
      targetLabel="Deck"
      targetName={target.deckName}
      confirmLabel="Delete deck"
      {...(target.hasError ? { errorMessage: "Unable to delete this deck. Check your connection and try again." } : {})}
      description={
        <>
          <p>
            This permanently deletes {target.cardCount} {target.cardCount === 1 ? "card" : "cards"} in this deck.
          </p>
          <p>Any in-progress study session for this deck will also end.</p>
          <p>This action cannot be undone.</p>
        </>
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
};
