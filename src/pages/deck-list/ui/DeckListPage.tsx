import * as React from "react";
import { useKey } from "react-use";

import { useAddSampleDeck } from "@/features/deck-import";
import { DeckListView, useDeckListState } from "@/features/deck-list";
import { routes, useNavigation } from "@/features/navigate";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const deckList = useDeckListState();
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<string>();

  const closeMenu = () => setOpenMenuDeckId(undefined);
  const toggleMenu = (id: string) => setOpenMenuDeckId((value) => (value === id ? undefined : id));
  const continueStudy = (id: string) => {
    deckList.onContinueStudy(id);
    void navigation.to(routes.deckStudy.to(id));
  };

  useAddSampleDeck();
  useKey("s", () => void navigation.to(routes.settings.to()));
  useKey("i", () => void navigation.to(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <Feedback tone="success">{deckList.successMessage}</Feedback>
      {deckList.deletionTarget != null ? (
        <DestructiveActionDialog
          title="Delete deck?"
          targetLabel="Deck"
          targetName={deckList.deletionTarget.deckName}
          confirmLabel="Delete deck"
          {...(deckList.deletionTarget.hasError
            ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
            : {})}
          description={
            <>
              <p>
                This permanently deletes {deckList.deletionTarget.cardCount}{" "}
                {deckList.deletionTarget.cardCount === 1 ? "card" : "cards"} in this deck.
              </p>
              <p>Any in-progress study session for this deck will also end.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          onCancel={deckList.onCancelDeletion}
          onConfirm={deckList.onConfirmDeletion}
        />
      ) : null}
      <DeckListView
        sections={deckList.sections}
        deckCard={{
          openMenuDeckId,
          onToggleMenu: toggleMenu,
          onCloseMenu: closeMenu,
          onClickEdit: (id) => void navigation.to(routes.deckForm.to(id)),
          onClickName: (id) => void navigation.to(routes.cardList.to(id)),
          onClickContinue: continueStudy,
          onClickRestart: (id) => void navigation.to(routes.deckStudyStart.to(id)),
          onClickStudy: (id) => void navigation.to(routes.deckStudyStart.to(id)),
          onClickDownload: deckList.onDownload,
          onClickDelete: deckList.onRequestDeletion,
        }}
      />
    </AppLayout>
  );
};
