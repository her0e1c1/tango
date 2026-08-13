import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { createCard, generateCardId } from "@/features/card/create";
import { editCard } from "@/features/card/edit";
import { createDeck } from "@/features/deck/create";
import { downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck/import";
import { useDecks } from "@/features/deck/read";
import { useConfig } from "@/shared/config";
import { AppLayout } from "@/widgets/app-layout";

import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const config = useConfig();
  const navigate = useNavigate();
  const deckRead = useDecks();
  const deckImport = useDeckImport({ createCard, createDeck, deckRead, editCard, generateCardId });
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
