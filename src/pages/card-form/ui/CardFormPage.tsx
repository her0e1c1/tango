import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardForm } from "../model/useCardForm";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ cardId: string }> = ({ cardId }) => {
  const navigate = useNavigate();
  const goBack = () => void navigate(-1);
  const editor = useCardForm({ cardId, onSaved: goBack });

  if (editor == null) {
    return (
      <RouteNotFound title="Card not found" description="The requested card is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      <CardEditor
        cardInfo={editor.cardInfo}
        categories={editor.categories}
        form={editor.form}
        onCancel={goBack}
        onSubmit={editor.onSubmit}
        saveError={editor.saveError}
      />
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
