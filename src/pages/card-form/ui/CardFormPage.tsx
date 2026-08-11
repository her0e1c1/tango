import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useCardFormState, useCardMutations } from "@/features/card";
import { setDarkMode, useConfig } from "@/shared/config";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { Layout } from "@/shared/ui/layout";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { CardFormView } from "./CardFormView";

const CardFormContent = ({ card }: { card: Card }) => {
  const config = useConfig();
  const navigate = useNavigate();
  const mutations = useCardMutations();
  const categoryOptions = CATEGORY.map((category) => ({ label: category, value: category }));
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
      <CardFormView
        feedbackSlot={
          <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
        }
        cardForm={{ ...cardForm, onCancel: goBack }}
      />
    </Layout>
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
