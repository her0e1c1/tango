/**
 * @file Connects application state and operations to the card feature's Card Form Container view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

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

/**
 * Connects the Card Form Content view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
const CardFormContent = ({ card }: { card: Card }) => {
  const config = useConfig();
  const actions = useActions();
  const navigate = useNavigate();
  const mutations = useCardMutations();
  const categoryOptions = C.CATEGORY.map((category) => ({ label: category, value: category }));
  /**
   * Navigates back to the route the user visited before the current form.
   * The container uses this after saving or cancelling instead of knowing the previous URL.
   */
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

/**
 * Connects the Card Form Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
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
