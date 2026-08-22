import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardFormState } from "../model/useCardFormState";
import { CardEditor } from "./CardEditor";

export const CardFormContainer: React.FC<{ cardId: string }> = ({ cardId }) => {
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
