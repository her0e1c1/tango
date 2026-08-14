import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useDecks } from "@/entities/deck";
import type { DeckCreateInput } from "@/entities/deck";
import { useCards } from "@/entities/card";
import type { CardCreateInput, CardEdit } from "@/entities/card";
import { usePreferences } from "@/entities/preferences";
import { useCardReadState } from "@/features/card/read";
import { downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck/import";
import { AppLayout } from "@/widgets/app-layout";

import { DeckImportView } from "./DeckImportView";

interface DeckImportPageProps {
  createCard?: (uid: string, card: CardCreateInput) => Promise<void>;
  createDeck?: (uid: string, deck: DeckCreateInput) => Promise<void>;
  editCard?: (uid: string, card: CardEdit) => Promise<void>;
  generateCardId?: () => string;
  generateDeckId?: () => string;
}

const unavailableMutation = async (): Promise<never> => {
  throw new Error("Remote mutations are unavailable");
};
const unavailableId = (): never => {
  throw new Error("Remote id generation is unavailable");
};

export const DeckImportPage: React.FC<DeckImportPageProps> = ({
  createCard,
  createDeck,
  editCard,
  generateCardId,
  generateDeckId,
}) => {
  const preferences = usePreferences();
  const navigate = useNavigate();
  const cards = useCards();
  const cardReadState = useCardReadState();
  const decks = useDecks();
  const synchronized = cardReadState.status === "ready" && cardReadState.syncStatus === "synced";
  const deckImport = useDeckImport({
    cards,
    createCard: createCard ?? unavailableMutation,
    createDeck: createDeck ?? unavailableMutation,
    decks,
    editCard: editCard ?? unavailableMutation,
    generateCardId: generateCardId ?? unavailableId,
    generateDeckId: generateDeckId ?? unavailableId,
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
        dark={preferences.appearance.darkMode}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
