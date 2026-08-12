import type * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Category, type Deck, useDecks } from "@/entities/deck";
import { deckFormSchema, type DeckFormValues, useDeckEditorActions } from "@/features/deck-editor";
import { setDarkMode, useConfig } from "@/shared/config";
import { Layout } from "@/shared/ui/layout";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { DeckFormView } from "./DeckFormView";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const config = useConfig();
  const navigate = useNavigate();
  const goToList = () => void navigate("/", { replace: true });
  const deckActions = useDeckEditorActions({ onCancel: goToList, onSaved: goToList });
  const categoryOptions: { label: Category; value: Category }[] = CATEGORY.map((category) => ({
    label: category,
    value: category,
  }));
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
    <Layout
      showHeader
      headerProps={{
        dark: config.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate("/"),
        onClickImport: () => void navigate("/import"),
        onClickSettings: () => void navigate("/settings"),
      }}
    >
      <DeckFormView
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
          onCancel: deckActions.cancel,
          onSubmit: handleSubmit((values) => deckActions.save({ ...deck, ...values, url: values.url ?? "" })),
        }}
      />
    </Layout>
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
