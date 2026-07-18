import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import * as C from "@/constant";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/components";
import { useActions } from "@/hooks/useActions";
import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { deckFormSchema, type DeckFormValues } from "@/features/deck/lib/deckFormSchema";
import { useConfig } from "@/hooks/useConfig";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const config = useConfig();
  const actions = useActions();
  const deckActions = useDeckActions(deck.id);
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((category) => ({ label: category, value: category })), []);
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
          name: formState.errors.name?.message,
          url: formState.errors.url?.message,
        },
        isSubmitting: formState.isSubmitting,
        onCancel: deckActions.goToList,
        onSubmit: handleSubmit((values) => deckActions.updateAndGoToList({ ...deck, ...values })),
      }}
    />
  );
};

export const DeckFormContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={deck != null}
      emptyLabel="Deck not found."
      onRetry={remote.retry}
    >
      {deck != null ? <DeckFormContent deck={deck} /> : null}
    </RemoteReadBoundary>
  );
};
