import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useDecks } from "@/entities/deck";
import { createCard, generateCardId } from "@/features/card/create";
import { editCard } from "@/features/card/edit";
import { useCards } from "@/features/card/read";
import { createDeck } from "@/features/deck/create";
import { downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck/import";
import { useConfig } from "@/shared/config";
import { AppLayout } from "@/widgets/app-layout";

import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const config = useConfig();
  const navigate = useNavigate();
  const cardRead = useCards();
  const decks = useDecks();
  const synchronized = cardRead.status === "ready" && cardRead.syncStatus === "synced";
  const deckImport = useDeckImport({
    cards: cardRead.cards,
    createCard,
    createDeck,
    decks,
    editCard,
    generateCardId,
    synchronized,
  });
  useKey("t", () => void navigate("/"));
  useKey("s", () => void navigate("/settings"));

  return (
    <AppLayout showHeader>
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
        onDownloadSample={downloadSampleCsv}
        validating={deckImport.validating}
        pending={deckImport.pending}
        {...(deckImport.preview !== undefined ? { preview: deckImport.preview } : {})}
        {...(deckImport.data !== undefined ? { result: deckImport.data } : {})}
        {...(deckImport.partialResult !== undefined ? { partialResult: deckImport.partialResult } : {})}
        error={deckImport.error}
        dark={config.appearance.darkMode}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
