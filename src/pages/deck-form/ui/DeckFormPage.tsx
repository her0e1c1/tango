import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Category, type Deck, useDeck } from "@/entities/deck";
import { useEditDeck } from "@/features/deck/edit";
import { useDeckEditorActions, useDeckFormState } from "@/features/deck-editor";
import { Feedback } from "@/shared/ui/feedback";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckFormView } from "./DeckFormView";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const navigate = useNavigate();
  const mutations = useEditDeck();
  const goToList = () => void navigate("/", { replace: true });
  const deckActions = useDeckEditorActions({ mutations, onCancel: goToList, onSaved: goToList });
  const categoryOptions: { label: Category; value: Category }[] = CATEGORY.map((category) => ({
    label: category,
    value: category,
  }));
  const deckForm = useDeckFormState({
    deck,
    categoryOptions,
    onCancel: deckActions.cancel,
    onSubmit: deckActions.save,
  });

  return (
    <AppLayout showHeader>
      <DeckFormView
        feedbackSlot={
          <Feedback tone="error">{deckActions.error == null ? null : "Unable to save changes. Try again."}</Feedback>
        }
        deckForm={deckForm}
      />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const deck = useDeck(deckId);

  if (deck != null) return <DeckFormContent deck={deck} />;

  return (
    <RouteFeedback
      title="Deck not found"
      description="The requested deck is unavailable or has been removed."
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
      secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
    />
  );
};
