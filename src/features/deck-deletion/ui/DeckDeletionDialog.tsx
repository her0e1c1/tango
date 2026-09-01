import type * as React from "react";
import { useTranslation } from "react-i18next";

import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";

interface DeckDeletionDialogProps {
  target: {
    deckName: string;
    cardCount: number;
  };
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeckDeletionDialog: React.FC<DeckDeletionDialogProps> = ({ target, pending, onCancel, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <DestructiveActionDialog
      title={t("deckDeletion.title")}
      targetLabel={t("deckDeletion.targetLabel")}
      targetName={target.deckName}
      confirmLabel={t("deckDeletion.confirm")}
      description={
        <>
          <p>{t("deckDeletion.cardCount", { count: target.cardCount })}</p>
          <p>{t("deckDeletion.activeStudy")}</p>
          <p>{t("deckDeletion.irreversible")}</p>
        </>
      }
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
};
