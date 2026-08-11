import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import * as C from "@/constant";
import type { Card } from "@/entities/card";
import { useCardFormState, useCardMutations } from "@/features/card";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/shared/config/useConfig";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { CardFormView } from "./CardFormView";

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
    <CardFormView
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
        <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
      }
      cardForm={{ ...cardForm, onCancel: goBack }}
    />
  );
};

export const CardFormPage: React.FC = () => {
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
