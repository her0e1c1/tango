import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardEditForm, useCardFormState } from "@/features/card-edit";
import { useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

const CardFormContent = ({ cardId }: { cardId: string }) => {
  const navigation = useNavigation();
  const goBack = () => void navigation.back();
  const editor = useCardFormState({ cardId, onCancel: goBack, onSaved: goBack });

  if (editor == null) {
    return (
      <RouteNotFound title="Card not found" description="The requested card is unavailable or has been removed." />
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
