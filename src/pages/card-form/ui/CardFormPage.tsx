import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardEditForm, useCardFormState } from "@/features/card-edit";
import { routes, useNavigation } from "@/features/navigate";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardFormContent = ({ cardId }: { cardId: string }) => {
  const navigation = useNavigation();
  const goBack = () => void navigation.back();
  const editor = useCardFormState({ cardId, onCancel: goBack, onSaved: goBack });

  if (!editor.available) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
        secondaryAction={{ label: "Go back", onClick: goBack }}
      />
    );
  }

  return (
    <AppLayout showHeader>
      <CardEditForm form={editor.form} saveError={editor.saveError} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContent key={cardId} cardId={cardId} />;
};
