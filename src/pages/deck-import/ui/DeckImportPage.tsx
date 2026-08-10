import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { CSV_SAMPLE_TEXT, downloadCsvSample, useDeckImport } from "@/features/import";
import { useCardMutations } from "@/features/card";
import { useDeckMutations } from "@/features/deck";
import { useRemoteCollections } from "@/features/remote-collections";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { useAuth } from "@/shared/auth";

import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const navigate = useNavigate();
  const auth = useAuth();
  const remote = useRemoteCollections();
  const deckMutations = useDeckMutations();
  const cardMutations = useCardMutations({ cardById: remote.cardById });
  const deckImport = useDeckImport({
    uid: auth.status === "authenticated" ? auth.uid : "",
    status: remote.status,
    syncStatus: remote.syncStatus,
    decks: remote.decks,
    cardsByDeckId: remote.cardsByDeckId,
    createDeck: deckMutations.create,
    bulkUpsert: cardMutations.bulkUpsert,
  });
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <DeckImportView
      onChange={(file) => {
        void deckImport.selectFile(file).catch(() => undefined);
      }}
      onAddSample={() => {
        void deckImport.addSample().catch(() => undefined);
      }}
      onImport={() => {
        void deckImport
          .importPreview()
          .then(() => navigate("/"))
          .catch(() => undefined);
      }}
      onRetry={deckImport.retry}
      onBack={() => navigate(-1)}
      onDownloadSample={downloadCsvSample}
      validating={deckImport.validating}
      pending={deckImport.pending}
      {...(deckImport.preview !== undefined ? { preview: deckImport.preview } : {})}
      {...(deckImport.data !== undefined ? { result: deckImport.data } : {})}
      {...(deckImport.partialResult !== undefined ? { partialResult: deckImport.partialResult } : {})}
      error={deckImport.error}
      dark={config.darkMode}
      sampleText={CSV_SAMPLE_TEXT}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
    />
  );
};
