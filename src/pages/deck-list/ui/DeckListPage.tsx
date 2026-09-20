import type * as React from "react";

import { DeckDeletionDialog } from "@/features/deck-deletion";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckListPageModel } from "../model/useDeckListPageModel";
import { DeckList } from "./DeckList";

export const DeckListPage: React.FC = () => {
  const model = useDeckListPageModel();

  return (
    <AppLayout showHeader>
      {model.deletionTarget != null && (
        <DeckDeletionDialog
          target={model.deletionTarget}
          pending={model.deletionPending}
          onCancel={model.cancelDeletion}
          onConfirm={model.confirmDeletion}
        />
      )}
      <DeckList
        sections={model.sections}
        onCreateDeck={model.createDeck}
        onImportDeck={model.importDeck}
        deckCard={{
          onClickEdit: model.editDeck,
          onClickName: model.openDeck,
          onClickView: model.viewDeck,
          onClickContinue: model.continueStudy,
          onClickRestart: model.startStudy,
          onClickStudy: model.startStudy,
          onClickDownload: model.downloadDeck,
          onClickDelete: model.requestDeletion,
        }}
      />
    </AppLayout>
  );
};
