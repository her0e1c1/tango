import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import * as C from "@/constant";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";
import { CardFormTemplate } from "@/features/card/components/templates/CardFormTemplate";
import { useCardFormState } from "@/features/card/hooks/useCardFormState";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/features/settings/hooks/useConfig";

const CardFormContent = ({ card }: { card: Card }) => {
  const config = useConfig();
  const actions = useActions();
  const navigate = useNavigate();
  const mutations = useCardMutations();
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((category) => ({ label: category, value: category })), []);
  const cardForm = useCardFormState({
    card,
    categoryOptions,
    onSubmit: async (nextCard) => {
      try {
        await mutations.update(nextCard);
        void navigate(-1);
      } catch {
        // The mutation notice owns error feedback and retry.
      }
    },
  });

  return (
    <CardFormTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      feedbackSlot={
        <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
      }
      cardForm={cardForm}
    />
  );
};

export const CardFormContainer: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useRemoteCollections();
  const card = remote.cardById(cardId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={card != null}
      emptyLabel="Card not found."
      onRetry={remote.retry}
    >
      {card != null ? <CardFormContent card={card} /> : null}
    </RemoteReadBoundary>
  );
};
