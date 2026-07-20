import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import * as C from "@/constant";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary, RouteFeedback } from "@/components";
import { useActions } from "@/hooks/useActions";
import { CardFormTemplate } from "@/features/card/components/templates/CardFormTemplate";
import { useCardFormState } from "@/features/card/hooks/useCardFormState";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/hooks/useConfig";

const CardFormContent = ({ card }: { card: Card }) => {
  const config = useConfig();
  const actions = useActions();
  const navigate = useNavigate();
  const mutations = useCardMutations();
  const categoryOptions = C.CATEGORY.map((category) => ({ label: category, value: category }));
  const goBack = () => void navigate(-1);
  const cardForm = useCardFormState({
    card,
    categoryOptions,
    onSubmit: async (nextCard) => {
      try {
        await mutations.update(nextCard);
        goBack();
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
      cardForm={{ ...cardForm, onCancel: goBack }}
    />
  );
};

export const CardFormContainer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useRemoteCollections();
  const card = remote.cardById(cardId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={card != null}
      emptyContent={
        <RouteFeedback
          title="Card not found"
          description="The requested card is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={remote.retry}
    >
      {card != null ? <CardFormContent card={card} /> : null}
    </RemoteReadBoundary>
  );
};
