import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Category, type Deck } from "@/entities/deck";
import { useEditDeck } from "@/features/deck/edit";
import { useDecks } from "@/features/deck/read";
import { useDeckEditorActions, useDeckFormState } from "@/features/deck-editor";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
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
          <RemoteMutationNotice pending={deckActions.pending} error={deckActions.error} onRetry={deckActions.retry} />
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
  const remote = useDecks();
  const deck = remote.decksById[deckId];

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={deck != null}
      emptyContent={
        <RouteFeedback
          title="Deck not found"
          description="The requested deck is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={remote.retry}
    >
      {deck != null ? <DeckFormContent deck={deck} /> : null}
    </RemoteReadBoundary>
  );
};
