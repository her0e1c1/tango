import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardFormState } from "../model/useCardFormState";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ cardId: string }> = ({ cardId }) => {
  const navigate = useNavigate();
  const goBack = () => void navigate(-1);
  const editor = useCardFormState({ cardId, onCancel: goBack, onSaved: goBack });

  if (editor == null) {
    return (
      <RouteNotFound title="Card not found" description="The requested card is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      <CardEditor form={editor.form} saveError={editor.saveError} />
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
