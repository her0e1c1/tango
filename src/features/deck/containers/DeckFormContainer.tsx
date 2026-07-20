/**
 * @file Connects application state and operations to the deck feature's Deck Form Container view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import type * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import * as C from "@/constant";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary, RouteFeedback } from "@/components";
import { useActions } from "@/hooks/useActions";
import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { deckFormSchema, type DeckFormValues } from "@/features/deck/lib/deckFormSchema";
import { useConfig } from "@/hooks/useConfig";

/**
 * Connects the Deck Form Content view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
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
    <DeckFormTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
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

/**
 * Connects the Deck Form Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const DeckFormContainer: React.FC = () => {
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
