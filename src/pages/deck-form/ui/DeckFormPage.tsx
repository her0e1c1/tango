import type * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import * as C from "@/constant";
import type { Deck } from "@/entities/deck";
import { deckFormSchema, type DeckFormValues, useDeckActions } from "@/features/deck";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/hooks/useConfig";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { DeckFormView } from "./DeckFormView";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const config = useConfig();
  const actions = useActions();
  const deckActions = useDeckActions(deck.id);
  const categoryOptions = C.CATEGORY.map((category) => ({ label: category, value: category }));
  const { formState, handleSubmit, register } = useForm<DeckFormValues>({
    defaultValues: {
      name: deck.name,
      category: deck.category,
      url: deck.url,
      convertToBr: deck.convertToBr,
    },
    resolver: zodResolver(deckFormSchema),
  });

  return (
    <DeckFormView
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
      feedbackSlot={
        <RemoteMutationNotice pending={deckActions.pending} error={deckActions.error} onRetry={deckActions.retry} />
      }
      deckForm={{
        deck,
        fields: {
          name: register("name"),
          convertToBr: register("convertToBr"),
          url: register("url"),
          category: {
            ...register("category"),
            options: categoryOptions,
          },
        },
        errors: {
          ...(formState.errors.name?.message !== undefined ? { name: formState.errors.name.message } : {}),
          ...(formState.errors.url?.message !== undefined ? { url: formState.errors.url.message } : {}),
        },
        isSubmitting: formState.isSubmitting,
        onCancel: deckActions.goToList,
        onSubmit: handleSubmit((values) =>
          deckActions.updateAndGoToList({ ...deck, ...values, url: values.url ?? "" })
        ),
      }}
    />
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);

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
