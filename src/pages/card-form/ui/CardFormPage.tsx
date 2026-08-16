import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardEditForm, useCardFormState } from "@/features/card-edit";
import { useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteEntityBoundary } from "@/widgets/route-entity-boundary";

const CardFormContent = ({ cardId }: { cardId: string }) => {
  const navigation = useNavigation();
  const goBack = () => void navigation.back();
  const editor = useCardFormState({ cardId, onCancel: goBack, onSaved: goBack });

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

  return (
    <RouteEntityBoundary entity="Card" id={cardId}>
      {/* Form state belongs to one route Card and must reset when the id changes. */}
      <CardFormContent key={cardId} cardId={cardId} />
    </RouteEntityBoundary>
  );
};
