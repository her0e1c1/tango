import * as React from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import * as C from "@/constant";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";
import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useConfig } from "@/features/settings/hooks/useConfig";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const config = useConfig();
  const actions = useActions();
  const deckActions = useDeckActions(deck.id);
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((category) => ({ label: category, value: category })), []);
  const { formState, handleSubmit, register } = useForm<Deck>({ defaultValues: deck });

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
          isPublic: register("isPublic"),
          category: {
            ...register("category"),
            options: categoryOptions,
          },
        },
        isSubmitting: formState.isSubmitting,
        onSubmit: handleSubmit((data) => deckActions.updateAndBack(data)),
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
