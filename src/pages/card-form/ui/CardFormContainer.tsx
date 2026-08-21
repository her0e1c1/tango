import type * as React from "react";

import { useCardFormState } from "@/features/card-edit";
import { useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { CardEditor } from "./CardEditor";

export const CardFormContainer: React.FC<{ cardId: string }> = ({ cardId }) => {
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
      <CardEditor form={editor.form} saveError={editor.saveError} />
    </AppLayout>
  );
};
