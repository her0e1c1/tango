import * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import * as C from "@/constant";
import * as selector from "@/selector";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/components";
import { renameKey } from "@/shared/forms/renameKey";
import { useActions } from "@/shared/hooks/useActions";
import { DeckFormTemplate } from "@/features/deck/components/templates/DeckFormTemplate";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const config = useSelector(selector.config.get());
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
      deckForm={{
        deck,
        fields: {
          name: renameKey(register("name")),
          convertToBr: renameKey(register("convertToBr")),
          url: renameKey(register("url")),
          isPublic: renameKey(register("isPublic")),
          localMode: renameKey(register("localMode")),
          category: {
            ...renameKey(register("category")),
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
