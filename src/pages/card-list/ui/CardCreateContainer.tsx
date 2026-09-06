import type * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck } from "@/entities/deck";
import { cancelCardCreation, submitCardCreation, useCardCreateFormState } from "@/features/card-form";

import { CardCreateDialog } from "./CardCreateDialog";

export const CardCreateContainer: React.FC<{ deck: Deck; onClose: () => void }> = ({ deck, onClose }) => {
  const uid = useAuthUid();
  const state = useCardCreateFormState();
  return (
    <CardCreateDialog
      categories={CATEGORY}
      deckName={deck.name}
      form={state.form}
      onCancel={() => cancelCardCreation(state.pending, state.saveErrorToastId, onClose)}
      onSubmit={(event) =>
        submitCardCreation(event, {
          uid,
          form: state.form,
          saveErrorToastId: state.saveErrorToastId,
          isMounted: state.isMounted,
          cardId: state.cardId,
          deckId: deck.id,
          pending: state.pending,
          onCreated: onClose,
        })
      }
    />
  );
};
